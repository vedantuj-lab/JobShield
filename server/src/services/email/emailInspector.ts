export interface EmailInspectionResult {
  senderAddress: string | null;
  senderDomain: string | null;
  replyToAddress: string | null;
  replyToDomain: string | null;
  subject: string | null;
  headersProvided: boolean;
  spfStatus: 'PASS' | 'FAIL' | 'SOFTFAIL' | 'UNAVAILABLE';
  dkimStatus: 'PASS' | 'FAIL' | 'UNAVAILABLE';
  dmarcStatus: 'PASS' | 'FAIL' | 'UNAVAILABLE';
  isFreeWebmail: boolean;
  replyToMismatch: boolean;
  extractedUrls: string[];
  observations: string[];
}

const FREE_WEBMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'rediffmail.com',
  'proton.me',
  'protonmail.com',
  'icloud.com',
  'aol.com',
  'zoho.com',
]);

function extractEmailAddress(line: string): string | null {
  const match = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
}

export function inspectEmailContent(input: {
  senderEmail?: string;
  subject?: string;
  body: string;
  rawHeaders?: string;
}): EmailInspectionResult {
  const headersText = input.rawHeaders?.trim() || '';
  const headersProvided = headersText.length > 20;

  let senderAddress = input.senderEmail?.trim().toLowerCase() || null;
  let replyToAddress: string | null = null;
  let subject = input.subject?.trim() || null;

  let spfStatus: EmailInspectionResult['spfStatus'] = 'UNAVAILABLE';
  let dkimStatus: EmailInspectionResult['dkimStatus'] = 'UNAVAILABLE';
  let dmarcStatus: EmailInspectionResult['dmarcStatus'] = 'UNAVAILABLE';

  if (headersProvided) {
    const fromMatch = headersText.match(/^From:\s*(.+)$/im);
    if (fromMatch && !senderAddress) {
      senderAddress = extractEmailAddress(fromMatch[1]);
    }
    const replyMatch = headersText.match(/^Reply-To:\s*(.+)$/im);
    if (replyMatch) {
      replyToAddress = extractEmailAddress(replyMatch[1]);
    }
    const subjMatch = headersText.match(/^Subject:\s*(.+)$/im);
    if (subjMatch && !subject) {
      subject = subjMatch[1].trim();
    }

    const authLower = headersText.toLowerCase();
    if (/spf=pass/.test(authLower) || /received-spf:\s*pass/.test(authLower)) spfStatus = 'PASS';
    else if (/spf=fail/.test(authLower)) spfStatus = 'FAIL';
    else if (/spf=softfail/.test(authLower)) spfStatus = 'SOFTFAIL';

    if (/dkim=pass/.test(authLower)) dkimStatus = 'PASS';
    else if (/dkim=fail/.test(authLower)) dkimStatus = 'FAIL';

    if (/dmarc=pass/.test(authLower)) dmarcStatus = 'PASS';
    else if (/dmarc=fail/.test(authLower)) dmarcStatus = 'FAIL';
  }

  if (!senderAddress) {
    senderAddress = extractEmailAddress(input.body);
  }

  const senderDomain = senderAddress ? senderAddress.split('@')[1] || null : null;
  const replyToDomain = replyToAddress ? replyToAddress.split('@')[1] || null : null;
  const isFreeWebmail = senderDomain ? FREE_WEBMAIL_DOMAINS.has(senderDomain) : false;
  const replyToMismatch = Boolean(senderDomain && replyToDomain && senderDomain !== replyToDomain);

  const urlRegex = /https?:\/\/[^\s<>"')]+/gi;
  const extractedUrls = Array.from(new Set(input.body.match(urlRegex) || [])).slice(0, 10);

  const observations: string[] = [];
  if (isFreeWebmail) {
    observations.push(`Sender uses a free webmail provider (${senderDomain}) rather than a corporate recruitment domain.`);
  }
  if (replyToMismatch) {
    observations.push(`Reply-To domain (${replyToDomain}) differs from sender domain (${senderDomain}).`);
  }
  if (!headersProvided) {
    observations.push('Original email headers were not supplied; SPF, DKIM, and DMARC could not be verified.');
  }
  if (spfStatus === 'FAIL' || dkimStatus === 'FAIL' || dmarcStatus === 'FAIL') {
    observations.push('One or more email authentication checks (SPF/DKIM/DMARC) failed in supplied headers.');
  }

  return {
    senderAddress,
    senderDomain,
    replyToAddress,
    replyToDomain,
    subject,
    headersProvided,
    spfStatus,
    dkimStatus,
    dmarcStatus,
    isFreeWebmail,
    replyToMismatch,
    extractedUrls,
    observations,
  };
}
