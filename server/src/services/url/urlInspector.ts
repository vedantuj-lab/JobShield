import dns from 'dns';
import net from 'net';
import tls from 'tls';
import { dbStore } from '../../config/store';
import type { IntegrationState } from '../../../../src/types/jobshield';

export interface UrlInspectionResult {
  valid: boolean;
  error?: string;
  normalizedUrl: string;
  domain: string;
  ssrfBlocked: boolean;
  httpsAvailable: boolean;
  certificate?: {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    authorized: boolean;
  } | null;
  dns: {
    resolvedIps: string[];
    hasMx: boolean;
    hasSpf: boolean;
    hasDmarc: boolean;
    error?: string;
  };
  rdap: {
    status: 'Available' | 'Redacted' | 'Unavailable';
    registrar?: string;
    registrationDate?: string;
    expirationDate?: string;
    error?: string;
  };
  redirects: {
    checked: boolean;
    hops: string[];
    finalUrl?: string;
    error?: string;
  };
  webRisk: {
    status: IntegrationState;
    threats: string[];
    detail: string;
  };
  suspiciousUrlPatterns: string[];
}

function isPrivateOrBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 cloud metadata / link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  if (net.isIPv6(ip)) {
    const norm = ip.toLowerCase();
    if (norm === '::1' || norm === '::') return true;
    if (norm.startsWith('fc') || norm.startsWith('fd')) return true; // unique local
    if (norm.startsWith('fe80')) return true; // link-local
    if (norm.startsWith('::ffff:')) {
      return isPrivateOrBlockedIp(norm.replace('::ffff:', ''));
    }
    return false;
  }
  return true;
}

export async function validateSafePublicUrl(rawUrl: string): Promise<{
  ok: boolean;
  url?: URL;
  domain?: string;
  resolvedIps?: string[];
  error?: string;
  ssrfBlocked?: boolean;
}> {
  let parsed: URL;
  try {
    const trimmed = rawUrl.trim();
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, error: 'Invalid URL format. Please provide a valid http or https web address.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Unsafe URL scheme rejected. Only http and https URLs are permitted.', ssrfBlocked: true };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'metadata.google.internal'
  ) {
    return { ok: false, error: 'Localhost and internal hostnames are blocked for security.', ssrfBlocked: true };
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrBlockedIp(hostname)) {
      return { ok: false, error: 'Private, loopback, or cloud metadata IP addresses are blocked.', ssrfBlocked: true };
    }
    return { ok: true, url: parsed, domain: hostname, resolvedIps: [hostname] };
  }

  try {
    const records = await dns.promises.lookup(hostname, { all: true, verbatim: true });
    if (!records.length) {
      return { ok: false, error: `Domain ${hostname} did not resolve to any IP address.` };
    }
    for (const rec of records) {
      if (isPrivateOrBlockedIp(rec.address)) {
        return {
          ok: false,
          error: `Domain ${hostname} resolved to a restricted private or loopback IP address and was blocked.`,
          ssrfBlocked: true,
        };
      }
    }
    return {
      ok: true,
      url: parsed,
      domain: hostname.replace(/^www\./, ''),
      resolvedIps: records.map((r) => r.address),
    };
  } catch {
    return { ok: true, url: parsed, domain: hostname.replace(/^www\./, ''), resolvedIps: [] };
  }
}

async function inspectTlsCertificate(hostname: string, resolvedIp: string): Promise<UrlInspectionResult['certificate']> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: resolvedIp,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false,
        timeout: 4000,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          if (!cert || !Object.keys(cert).length) {
            socket.destroy();
            resolve(null);
            return;
          }
          const rawSubj = cert.subject?.CN;
          const rawIssuer = cert.issuer?.O || cert.issuer?.CN;
          resolve({
            subject: Array.isArray(rawSubj) ? rawSubj[0] : rawSubj || hostname,
            issuer: Array.isArray(rawIssuer) ? rawIssuer[0] : rawIssuer || 'Unknown Issuer',
            validFrom: cert.valid_from || '',
            validTo: cert.valid_to || '',
            authorized: socket.authorized,
          });
        } catch {
          resolve(null);
        } finally {
          socket.destroy();
        }
      }
    );
    socket.on('error', () => {
      socket.destroy();
      resolve(null);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(null);
    });
  });
}

async function checkGoogleWebRisk(targetUrl: string): Promise<UrlInspectionResult['webRisk']> {
  const apiKey = process.env.WEB_RISK_API_KEY?.trim();
  if (!apiKey) {
    return {
      status: 'Not Configured',
      threats: [],
      detail: 'Google Web Risk API key (WEB_RISK_API_KEY) is not configured. External threat lookup was skipped.',
    };
  }
  try {
    const params = new URLSearchParams({ uri: targetUrl, key: apiKey });
    params.append('threatTypes', 'MALWARE');
    params.append('threatTypes', 'SOCIAL_ENGINEERING');
    params.append('threatTypes', 'UNWANTED_SOFTWARE');

    const resp = await fetch(`https://webrisk.googleapis.com/v1/uris:search?${params.toString()}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) {
      dbStore.logSystemError('Google Web Risk', `HTTP ${resp.status}`);
      return {
        status: 'Error',
        threats: [],
        detail: `Google Web Risk returned HTTP ${resp.status}.`,
      };
    }
    const data = (await resp.json()) as { threat?: { threatTypes?: string[] } };
    const threats = data.threat?.threatTypes || [];
    return {
      status: 'Connected',
      threats,
      detail: threats.length
        ? `Web Risk matched threat categories: ${threats.join(', ')}.`
        : 'Checked via Google Web Risk: no listed malware or social engineering threat found at time of query.',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Request failed';
    dbStore.logSystemError('Google Web Risk', msg);
    return {
      status: 'Unavailable',
      threats: [],
      detail: `Google Web Risk could not be reached (${msg}).`,
    };
  }
}

export async function inspectUrl(rawUrl: string): Promise<UrlInspectionResult> {
  const check = await validateSafePublicUrl(rawUrl);
  if (!check.ok || !check.url || !check.domain) {
    return {
      valid: false,
      error: check.error || 'Invalid URL.',
      normalizedUrl: rawUrl,
      domain: '',
      ssrfBlocked: Boolean(check.ssrfBlocked),
      httpsAvailable: false,
      certificate: null,
      dns: { resolvedIps: [], hasMx: false, hasSpf: false, hasDmarc: false },
      rdap: { status: 'Unavailable' },
      redirects: { checked: false, hops: [] },
      webRisk: {
        status: process.env.WEB_RISK_API_KEY ? 'Unavailable' : 'Not Configured',
        threats: [],
        detail: 'URL validation did not pass.',
      },
      suspiciousUrlPatterns: [],
    };
  }

  const normalizedUrl = check.url.toString();
  const hostname = check.url.hostname;
  const domain = check.domain;
  const resolvedIps = check.resolvedIps || [];

  // Suspicious URL patterns
  const suspiciousUrlPatterns: string[] = [];
  if (check.url.protocol !== 'https:') {
    suspiciousUrlPatterns.push('URL uses unencrypted HTTP instead of HTTPS.');
  }
  if (check.url.username || check.url.password) {
    suspiciousUrlPatterns.push('URL contains embedded credentials (@), a common phishing obfuscation pattern.');
  }
  if (hostname.split('.').length >= 4) {
    suspiciousUrlPatterns.push('Deeply nested subdomain structure detected.');
  }
  if (/(bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy|is\.gd)$/i.test(domain)) {
    suspiciousUrlPatterns.push('URL shortener hides the final recruitment destination.');
  }
  if (/-(careers|hr|hiring|jobs|verify|onboarding|offer)\./i.test(hostname) || /(careers|offer)-/i.test(domain)) {
    suspiciousUrlPatterns.push('Domain combines brand-like recruitment keywords with hyphens, often seen in lookalike portals.');
  }
  if (/\.(xyz|top|click|gq|tk|ml|cf|work|buzz)$/i.test(domain)) {
    suspiciousUrlPatterns.push('Domain uses a top-level domain frequently abused in disposable phishing campaigns.');
  }

  // DNS checks
  let hasMx = false;
  let hasSpf = false;
  let hasDmarc = false;
  let dnsError: string | undefined;
  try {
    const mx = await dns.promises.resolveMx(domain).catch(() => []);
    hasMx = mx.length > 0;
    const txt = await dns.promises.resolveTxt(domain).catch(() => []);
    hasSpf = txt.some((parts) => parts.join('').toLowerCase().includes('v=spf1'));
    const dmarcTxt = await dns.promises.resolveTxt(`_dmarc.${domain}`).catch(() => []);
    hasDmarc = dmarcTxt.some((parts) => parts.join('').toLowerCase().includes('v=dmarc1'));
  } catch (err) {
    dnsError = err instanceof Error ? err.message : 'DNS query unavailable';
  }

  // TLS Inspection
  let certificate: UrlInspectionResult['certificate'] = null;
  let httpsAvailable = false;
  if (resolvedIps.length > 0) {
    certificate = await inspectTlsCertificate(hostname, resolvedIps[0]);
    httpsAvailable = Boolean(certificate);
  }

  // RDAP Inspection
  let rdap: UrlInspectionResult['rdap'] = { status: 'Unavailable' };
  try {
    const rdapResp = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: 'application/rdap+json' },
      signal: AbortSignal.timeout(4500),
    });
    if (rdapResp.ok) {
      const rdapData = (await rdapResp.json()) as {
        events?: Array<{ eventAction?: string; eventDate?: string }>;
        entities?: Array<{ vcardArray?: unknown[] }>;
      };
      const regEvent = rdapData.events?.find((e) => e.eventAction === 'registration');
      const expEvent = rdapData.events?.find((e) => e.eventAction === 'expiration');
      rdap = {
        status: regEvent ? 'Available' : 'Redacted',
        registrationDate: regEvent?.eventDate,
        expirationDate: expEvent?.eventDate,
      };
    } else {
      rdap = { status: 'Unavailable', error: `RDAP registry returned status ${rdapResp.status}` };
    }
  } catch (err) {
    rdap = {
      status: 'Unavailable',
      error: err instanceof Error ? err.message : 'RDAP lookup timed out',
    };
  }

  // Controlled Redirect Inspection (manual, max 3 hops, SSRF re-checked every hop)
  const hops: string[] = [normalizedUrl];
  let redirectErr: string | undefined;
  let currentUrl = normalizedUrl;
  let redirectChecked = false;
  if (resolvedIps.length > 0) {
    try {
      for (let i = 0; i < 3; i++) {
        const hopResp = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(3500),
        });
        redirectChecked = true;
        if (hopResp.status >= 300 && hopResp.status < 400) {
          const location = hopResp.headers.get('location');
          if (!location) break;
          const nextAbs = new URL(location, currentUrl).toString();
          const hopCheck = await validateSafePublicUrl(nextAbs);
          if (!hopCheck.ok) {
            redirectErr = `Redirect to restricted destination blocked: ${hopCheck.error}`;
            break;
          }
          hops.push(nextAbs);
          currentUrl = nextAbs;
        } else {
          break;
        }
      }
    } catch (err) {
      redirectErr = err instanceof Error ? err.message : 'Redirect check did not complete';
    }
  }

  // Web Risk
  const webRisk = await checkGoogleWebRisk(normalizedUrl);

  return {
    valid: true,
    normalizedUrl,
    domain,
    ssrfBlocked: false,
    httpsAvailable,
    certificate,
    dns: {
      resolvedIps,
      hasMx,
      hasSpf,
      hasDmarc,
      error: dnsError,
    },
    rdap,
    redirects: {
      checked: redirectChecked,
      hops,
      finalUrl: hops[hops.length - 1],
      error: redirectErr,
    },
    webRisk,
    suspiciousUrlPatterns,
  };
}
