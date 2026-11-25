import type {
  ConfidenceLevel,
  ExtractedInformation,
  RiskCategory,
  ScanFinding,
  ScanType,
} from '../../../../src/types/jobshield';
import type { EmailInspectionResult } from '../email/emailInspector';
import type { UrlInspectionResult } from '../url/urlInspector';

export interface DeterministicSignal {
  ruleId: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  weight: number;
  description: string;
  evidence: string;
  source: string;
  confidence: ConfidenceLevel;
  recommendation: string;
}

export interface RiskAssessmentOutput {
  riskScore: number | null;
  riskCategory: RiskCategory;
  evidenceConfidence: ConfidenceLevel;
  findings: ScanFinding[];
  missingInformation: string[];
  positiveObservations: Array<{ title: string; detail: string; limitation: string }>;
  recommendations: string[];
  disclaimer: string;
}

const RULE_PATTERNS: Array<{
  ruleId: string;
  regex: RegExp;
  title: string;
  severity: 'low' | 'medium' | 'high';
  weight: number;
  description: string;
  recommendation: string;
}> = [
  {
    ruleId: 'advance_payment',
    regex:
      /\b(registration fee|processing fee|training fee|security deposit|laptop deposit|equipment deposit|refundable deposit|pay rs\.?|pay inr|upi|paytm|gpay|phonepe|razorpay link|seat booking fee|document verification fee|onboarding fee)\b/i,
    title: 'Advance Payment or Fee Request Detected',
    severity: 'high',
    weight: 35,
    description:
      'Legitimate employers in India do not charge candidates registration, training, laptop, or security deposit fees prior to employment.',
    recommendation:
      'Do not transfer any money via UPI, bank transfer, or payment links. Verify directly on the company’s official careers portal.',
  },
  {
    ruleId: 'sensitive_credentials',
    regex:
      /\b(share otp|send otp|one time password|bank password|atm pin|cvv|upi pin|netbanking|aadhaar.*pan.*bank|pan card.*cvv)\b/i,
    title: 'High-Risk Sensitive Credential / OTP Request',
    severity: 'high',
    weight: 35,
    description:
      'The content asks for OTPs, banking PINs, passwords, or premature identity documents that can enable financial fraud or identity theft.',
    recommendation:
      'Never share OTPs, passwords, or banking credentials with any recruiter. Share Aadhaar/PAN only through verified onboarding portals after confirming employment.',
  },
  {
    ruleId: 'telegram_task_scam',
    regex:
      /\b(telegram|whatsapp task|like and subscribe|rate hotel|review product|prepaid task|daily payout|earn ₹?\d{3,5}\s*(per|daily)|part[- ]?time task)\b/i,
    title: 'Task-Based / Messaging App Earning Pattern',
    severity: 'high',
    weight: 30,
    description:
      'Offers promising daily payouts for simple online tasks routed through Telegram or WhatsApp are strongly associated with prepaid task scams.',
    recommendation:
      'Disengage immediately from task-based earning groups and do not make "prepaid" or "recharge" deposits.',
  },
  {
    ruleId: 'guaranteed_selection',
    regex:
      /\b(direct joining|no interview|guaranteed placement|100% job guarantee|selected without interview|spot offer|instant selection)\b/i,
    title: 'Guaranteed Selection / No-Interview Claim',
    severity: 'medium',
    weight: 18,
    description:
      'Promises of guaranteed employment or direct selection without a structured technical or HR assessment are common recruitment scam tactics.',
    recommendation:
      'Confirm whether an official interview process exists on the employer’s verified recruitment website.',
  },
  {
    ruleId: 'urgency_pressure',
    regex:
      /\b(within 2 hours|urgent|offer expires today|last chance|pay immediately|limited seats left|today only|immediate payment)\b/i,
    title: 'Artificial Urgency / Time Pressure',
    severity: 'medium',
    weight: 12,
    description:
      'High-pressure deadlines are used to prevent applicants from verifying the recruiter or consulting family and placement cells.',
    recommendation:
      'Pause and take time to verify independently; legitimate employers allow reasonable time to review offer terms.',
  },
  {
    ruleId: 'unrealistic_salary',
    regex:
      /\b(₹\s*[1-9]\d{4,}\s*\/\s*week|earn\s*50,000\s*weekly|work 1 hour daily|no experience.*high salary|data entry.*₹?\s*[4-9]\d,000)\b/i,
    title: 'Unrealistic Compensation for Minimal Effort',
    severity: 'medium',
    weight: 16,
    description:
      'Compensation claims far above market benchmarks for entry-level or part-time data entry work indicate likely fraud.',
    recommendation:
      'Cross-check salary benchmarks for the role and confirm the employer’s identity independently.',
  },
];

export function evaluateRisk(input: {
  scanType: ScanType;
  rawText: string;
  extracted: ExtractedInformation;
  emailInspection?: EmailInspectionResult | null;
  urlInspection?: UrlInspectionResult | null;
  confirmedThreatMatch?: string | null;
  companyMismatch?: string | null;
  aiFindings: ScanFinding[];
  aiInsufficientEvidence: boolean;
  aiMissing: string[];
  aiPositives: Array<{ title: string; detail: string; limitation: string }>;
  aiRecommendations: string[];
  aiContradictions: string[];
}): RiskAssessmentOutput {
  const signalMap = new Map<string, DeterministicSignal>();

  const addSignal = (sig: DeterministicSignal) => {
    if (!signalMap.has(sig.ruleId)) {
      signalMap.set(sig.ruleId, sig);
    }
  };

  // 1. Deterministic text pattern rules
  for (const rule of RULE_PATTERNS) {
    const match = input.rawText.match(rule.regex);
    if (match) {
      addSignal({
        ruleId: rule.ruleId,
        title: rule.title,
        severity: rule.severity,
        weight: rule.weight,
        description: rule.description,
        evidence: `Matched phrase: "${match[0]}"`,
        source: 'JOBSHIELD Rule Engine',
        confidence: 'high',
        recommendation: rule.recommendation,
      });
    }
  }

  // 2. Confirmed Threat Indicator match (only CONFIRMED_THREAT from moderated records)
  if (input.confirmedThreatMatch) {
    addSignal({
      ruleId: 'confirmed_threat_db',
      title: 'Matched Confirmed Threat Indicator',
      severity: 'high',
      weight: 45,
      description: input.confirmedThreatMatch,
      evidence: input.confirmedThreatMatch,
      source: 'JOBSHIELD Moderated Threat Intelligence',
      confidence: 'high',
      recommendation: 'Avoid interacting with this domain or sender and preserve evidence.',
    });
  }

  // 3. Company-Domain Mismatch
  if (input.companyMismatch) {
    addSignal({
      ruleId: 'domain_mismatch',
      title: 'Company & Domain Consistency Mismatch',
      severity: 'high',
      weight: 22,
      description: input.companyMismatch,
      evidence: input.companyMismatch,
      source: 'Company & Domain Consistency Check',
      confidence: 'high',
      recommendation: 'Verify the recruiter’s email and application link against the company’s official domain.',
    });
  }

  // 4. Email checks
  if (input.emailInspection) {
    if (input.emailInspection.isFreeWebmail) {
      addSignal({
        ruleId: 'free_webmail_sender',
        title: 'Free Webmail Provider Used for Recruitment',
        severity: 'medium',
        weight: 18,
        description: `The sender uses a free consumer email domain (${input.emailInspection.senderDomain}) rather than an official corporate domain.`,
        evidence: `Sender: ${input.emailInspection.senderAddress}`,
        source: 'Email Header & Domain Inspector',
        confidence: 'high',
        recommendation: 'Request communication from an official corporate domain and verify via the company’s careers portal.',
      });
    }
    if (input.emailInspection.replyToMismatch) {
      addSignal({
        ruleId: 'reply_to_mismatch',
        title: 'Reply-To Address Differs from Sender Domain',
        severity: 'high',
        weight: 22,
        description: `Replies are routed to ${input.emailInspection.replyToAddress}, which belongs to a different domain than the sender.`,
        evidence: `From: ${input.emailInspection.senderAddress} vs Reply-To: ${input.emailInspection.replyToAddress}`,
        source: 'Email Header Inspector',
        confidence: 'high',
        recommendation: 'Treat mismatched Reply-To addresses as a strong impersonation indicator.',
      });
    }
    if (
      input.emailInspection.spfStatus === 'FAIL' ||
      input.emailInspection.dkimStatus === 'FAIL' ||
      input.emailInspection.dmarcStatus === 'FAIL'
    ) {
      addSignal({
        ruleId: 'email_auth_fail',
        title: 'Email Authentication Failure in Headers',
        severity: 'high',
        weight: 25,
        description: 'Supplied email headers indicate SPF, DKIM, or DMARC authentication failure, suggesting possible spoofing.',
        evidence: `SPF=${input.emailInspection.spfStatus}, DKIM=${input.emailInspection.dkimStatus}, DMARC=${input.emailInspection.dmarcStatus}`,
        source: 'Email Authentication Parser',
        confidence: 'high',
        recommendation: 'Do not trust this email without out-of-band confirmation from the employer.',
      });
    }
  } else if (
    input.extracted.recruiterEmail &&
    /@(gmail\.com|yahoo\.com|yahoo\.in|outlook\.com|hotmail\.com|proton\.me|protonmail\.com|rediffmail\.com)$/i.test(
      input.extracted.recruiterEmail.trim()
    )
  ) {
    const emailDomain = input.extracted.recruiterEmail.trim().split('@')[1]?.toLowerCase() || 'webmail';
    addSignal({
      ruleId: 'free_webmail_sender',
      title: 'Free Webmail Contact Used for Recruitment',
      severity: 'medium',
      weight: 18,
      description: `The extracted recruiter contact (${input.extracted.recruiterEmail}) uses a free consumer email provider (${emailDomain}) instead of a corporate domain.`,
      evidence: `Contact email: ${input.extracted.recruiterEmail}`,
      source: 'JOBSHIELD Rule Engine',
      confidence: 'high',
      recommendation: 'Verify the recruiter using an official corporate email domain listed on the employer’s careers portal.',
    });
  }

  // 5. URL inspection checks
  if (input.urlInspection && input.urlInspection.valid) {
    if (input.urlInspection.webRisk.threats.length > 0) {
      addSignal({
        ruleId: 'webrisk_hit',
        title: 'Google Web Risk Threat Match',
        severity: 'high',
        weight: 45,
        description: input.urlInspection.webRisk.detail,
        evidence: input.urlInspection.webRisk.threats.join(', '),
        source: 'Google Web Risk API',
        confidence: 'high',
        recommendation: 'Do not visit this URL or enter any personal or financial details.',
      });
    }
    if (!input.urlInspection.httpsAvailable) {
      addSignal({
        ruleId: 'no_https',
        title: 'HTTPS / TLS Certificate Unavailable',
        severity: 'medium',
        weight: 14,
        description: 'The inspected domain did not present a valid HTTPS/TLS handshake.',
        evidence: `Domain: ${input.urlInspection.domain}`,
        source: 'TLS Certificate Inspector',
        confidence: 'medium',
        recommendation: 'Avoid submitting resumes or personal data on sites lacking HTTPS.',
      });
    }
    if (input.urlInspection.suspiciousUrlPatterns.length > 0) {
      addSignal({
        ruleId: 'suspicious_url_pattern',
        title: 'Suspicious URL or Domain Pattern',
        severity: 'medium',
        weight: 15,
        description: input.urlInspection.suspiciousUrlPatterns.join(' '),
        evidence: input.urlInspection.normalizedUrl,
        source: 'URL Structure Inspector',
        confidence: 'medium',
        recommendation: 'Verify the exact spelling of the official company domain before proceeding.',
      });
    }
  }

  // 6. Incorporate non-duplicate AI findings (capped contribution so AI never overwhelms evidence rules)
  const mergedFindings: ScanFinding[] = Array.from(signalMap.values()).map((s) => ({
    title: s.title,
    severity: s.severity,
    description: s.description,
    evidence: s.evidence,
    source: s.source,
    confidence: s.confidence,
    recommendation: s.recommendation,
    scoreImpact: s.weight,
  }));

  let aiScoreAddition = 0;
  for (const af of input.aiFindings) {
    const alreadyCovered = mergedFindings.some(
      (mf) =>
        mf.title.toLowerCase().includes(af.title.toLowerCase().slice(0, 12)) ||
        af.title.toLowerCase().includes(mf.title.toLowerCase().slice(0, 12))
    );
    if (!alreadyCovered) {
      const impact = af.severity === 'high' ? 18 : af.severity === 'medium' ? 10 : 4;
      aiScoreAddition = Math.min(35, aiScoreAddition + impact);
      mergedFindings.push({ ...af, scoreImpact: impact });
    }
  }

  // Compute score
  const ruleScore = Array.from(signalMap.values()).reduce((sum, s) => sum + s.weight, 0);
  const rawScore = Math.min(100, ruleScore + aiScoreAddition);

  // Determine missing information & evidence confidence
  const missingInformation = [...input.aiMissing];
  if (!input.extracted.companyName && input.scanType !== 'url') {
    missingInformation.push('Claimed employer/company name could not be conclusively extracted.');
  }
  if (!input.extracted.recruiterEmail && input.scanType !== 'url' && input.scanType !== 'job_description') {
    missingInformation.push('Official corporate recruiter email address is missing.');
  }
  if (input.urlInspection && input.urlInspection.webRisk.status !== 'Connected') {
    missingInformation.push(`URL threat intelligence (${input.urlInspection.webRisk.status}): ${input.urlInspection.webRisk.detail}`);
  }
  if (input.emailInspection && !input.emailInspection.headersProvided) {
    missingInformation.push('Original email headers (SPF/DKIM/DMARC) were not provided.');
  }

  const hasTextSubstance = input.rawText.trim().length >= 50 || Boolean(input.urlInspection?.valid);
  const hasHighRiskSignals = rawScore >= 30;
  const insufficientEvidence =
    !hasTextSubstance ||
    (input.aiInsufficientEvidence && !hasHighRiskSignals && !input.urlInspection?.valid);

  // Calculate evidence confidence separately from risk score
  let evidencePoints = 0;
  if (input.rawText.trim().length >= 150) evidencePoints += 2;
  if (input.extracted.companyName) evidencePoints += 1;
  if (input.urlInspection?.valid && input.urlInspection.dns.resolvedIps.length > 0) evidencePoints += 2;
  if (input.urlInspection?.webRisk.status === 'Connected') evidencePoints += 1;
  if (input.emailInspection?.headersProvided) evidencePoints += 1;
  if (mergedFindings.some((f) => f.source.includes('Gemini'))) evidencePoints += 1;

  const evidenceConfidence: ConfidenceLevel =
    insufficientEvidence || evidencePoints <= 1
      ? 'low'
      : evidencePoints >= 5
      ? 'high'
      : 'medium';

  let riskCategory: RiskCategory;
  let riskScore: number | null;
  if (insufficientEvidence) {
    riskCategory = 'INSUFFICIENT_EVIDENCE';
    riskScore = null;
  } else if (rawScore >= 60) {
    riskCategory = 'HIGH_RISK';
    riskScore = rawScore;
  } else if (rawScore >= 30) {
    riskCategory = 'SUSPICIOUS';
    riskScore = rawScore;
  } else {
    riskCategory = 'LOWER_RISK';
    riskScore = rawScore;
  }

  // Positive observations with mandatory limitations
  const positiveObservations = [...input.aiPositives];
  if (input.urlInspection?.valid && input.urlInspection.httpsAvailable) {
    positiveObservations.push({
      title: 'Valid HTTPS Transport Observed',
      detail: `Domain ${input.urlInspection.domain} responded over TLS (${input.urlInspection.certificate?.issuer || 'Certificate present'}).`,
      limitation: 'HTTPS encryption only secures transport; fraudulent websites can still obtain valid TLS certificates.',
    });
  }
  if (input.emailInspection?.spfStatus === 'PASS' && input.emailInspection?.dkimStatus === 'PASS') {
    positiveObservations.push({
      title: 'SPF & DKIM Passed in Supplied Headers',
      detail: 'Email headers indicate passing SPF and DKIM checks for the sending domain.',
      limitation: 'Passing email authentication proves who sent the message from that domain, not that a job offer is genuine.',
    });
  }

  const recommendations = Array.from(
    new Set([
      ...mergedFindings.map((f) => f.recommendation),
      ...input.aiRecommendations,
      'Independently visit the employer’s official website and verify the role and recruiter before sharing documents or paying any fee.',
    ])
  ).slice(0, 7);

  const disclaimer =
    riskCategory === 'INSUFFICIENT_EVIDENCE'
      ? 'Insufficient reliable evidence was available to classify this opportunity safely. Provide additional context (official URL, full email headers, or clearer document text) before acting.'
      : riskCategory === 'LOWER_RISK'
      ? 'A Lower Risk score indicates fewer known scam indicators were identified in the submitted material. It is NOT a guarantee that the recruitment opportunity is genuine.'
      : 'This assessment is evidence-based guidance combining deterministic checks, technical observations, and AI-assisted analysis. Always confirm directly through official employer channels.';

  return {
    riskScore,
    riskCategory,
    evidenceConfidence,
    findings: mergedFindings,
    missingInformation: Array.from(new Set(missingInformation)),
    positiveObservations,
    recommendations,
    disclaimer,
  };
}
