import { dbStore } from '../../config/store';
import type { ExtractedInformation, ScanRecord, ScanType } from '../../../../src/types/jobshield';
import { inspectEmailContent, type EmailInspectionResult } from '../email/emailInspector';
import { evaluateRisk } from '../risk/riskEngine';
import { inspectUrl, type UrlInspectionResult } from '../url/urlInspector';
import { analyzeRecruitmentWithGemini } from './geminiAnalyzer';

function extractDomainFromString(val?: string): string | null {
  if (!val) return null;
  if (val.includes('@')) {
    return val.split('@')[1]?.toLowerCase().trim().replace(/^www\./, '') || null;
  }
  try {
    const u = new URL(/^https?:\/\//i.test(val) ? val : `https://${val}`);
    return u.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

export async function runScanPipeline(input: {
  userId: string;
  isDemo?: boolean;
  scanType: ScanType;
  scanName: string;
  rawText: string;
  inputReference: string;
  url?: string;
  claimedCompany?: string;
  jobTitle?: string;
  senderEmail?: string;
  subject?: string;
  rawHeaders?: string;
  imageBuffer?: Buffer;
  imageMime?: string;
}): Promise<ScanRecord> {
  const isDemo = Boolean(input.isDemo);
  let emailInspection: EmailInspectionResult | null = null;
  let urlInspection: UrlInspectionResult | null = null;

  if (input.scanType === 'email') {
    emailInspection = inspectEmailContent({
      senderEmail: input.senderEmail,
      subject: input.subject,
      body: input.rawText,
      rawHeaders: input.rawHeaders,
    });
  }

  // Determine target URL to inspect
  const candidateUrl =
    input.url?.trim() ||
    emailInspection?.extractedUrls[0] ||
    (input.rawText.match(/https?:\/\/[^\s<>"')]+/i)?.[0] ?? undefined);

  if (candidateUrl) {
    urlInspection = await inspectUrl(candidateUrl);
    if (!urlInspection.valid && input.scanType === 'url') {
      return dbStore.createScan({
        userId: input.userId,
        isDemo,
        scanName: input.scanName,
        scanType: input.scanType,
        inputReference: input.inputReference,
        extractedInformation: { website: candidateUrl },
        findings: [
          {
            title: urlInspection.ssrfBlocked ? 'Unsafe URL Blocked by SSRF Policy' : 'Invalid URL Submitted',
            severity: urlInspection.ssrfBlocked ? 'high' : 'low',
            description: urlInspection.error || 'The URL could not be inspected.',
            evidence: candidateUrl,
            source: 'URL Security Validator',
            confidence: 'high',
            recommendation: 'Submit a valid public https:// recruitment website URL.',
          },
        ],
        positiveObservations: [],
        contradictions: [],
        missingInformation: ['Public URL inspection could not run due to invalid or restricted URL.'],
        recommendations: ['Verify the exact public URL and try again.'],
        riskScore: null,
        riskCategory: 'INSUFFICIENT_EVIDENCE',
        evidenceConfidence: 'low',
        processingStatus: 'INSUFFICIENT_EVIDENCE',
        disclaimer: urlInspection.error || 'URL validation failed.',
        aiStatus: 'Not Configured',
        saved: false,
      });
    }
  }

  // Check confirmed threat indicators in DB (only CONFIRMED_THREAT)
  const inspectedDomain =
    urlInspection?.domain ||
    emailInspection?.senderDomain ||
    extractDomainFromString(candidateUrl);

  let confirmedThreatMatch: string | null = null;
  if (inspectedDomain) {
    const indicator = dbStore.findDomainIndicator(inspectedDomain, isDemo);
    if (indicator && indicator.threatStatus === 'CONFIRMED_THREAT') {
      confirmedThreatMatch = `Domain ${inspectedDomain} is listed as a confirmed threat indicator (${indicator.source}: ${indicator.evidenceSummary}).`;
    }
  }

  // Gemini AI analysis
  const aiResult = await analyzeRecruitmentWithGemini({
    scanType: input.scanType,
    content: input.rawText || `URL Inspection Target: ${candidateUrl || ''}`,
    technicalContext: {
      emailInspection,
      urlInspection,
      confirmedThreatMatch,
    },
    imageBuffer: input.imageBuffer,
    imageMime: input.imageMime,
  });

  // Deterministic fallback entity extraction when Gemini is unconfigured or omits fields
  const regexEmail = input.rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
  const regexCompanyLine = input.rawText.match(/(?:Claimed Company|Company Name|Employer)\s*:\s*([^\n\r]+)/i)?.[1]?.trim();
  const regexPaymentMatch = input.rawText.match(
    /(?:registration fee|processing fee|training fee|security deposit|laptop deposit|equipment deposit|refundable deposit|seat booking fee|onboarding fee|pay\s+(?:rs\.?|inr|₹)\s*[\d,]+|upi\s*(?:id)?\s*[:\-]?\s*[^\s,\n]+)/i
  )?.[0];

  // Merge extracted info with deterministic technical extraction
  const extracted: ExtractedInformation = {
    ...aiResult.extractedInformation,
    companyName:
      aiResult.extractedInformation.companyName ||
      input.claimedCompany ||
      regexCompanyLine ||
      undefined,
    jobTitle: aiResult.extractedInformation.jobTitle || input.jobTitle || undefined,
    recruiterEmail:
      aiResult.extractedInformation.recruiterEmail ||
      emailInspection?.senderAddress ||
      regexEmail ||
      undefined,
    website: aiResult.extractedInformation.website || urlInspection?.normalizedUrl || undefined,
    applicationUrl:
      aiResult.extractedInformation.applicationUrl ||
      (candidateUrl && candidateUrl !== urlInspection?.normalizedUrl ? candidateUrl : urlInspection?.normalizedUrl) ||
      undefined,
    paymentInstructions:
      aiResult.extractedInformation.paymentInstructions?.length
        ? aiResult.extractedInformation.paymentInstructions
        : regexPaymentMatch
        ? [regexPaymentMatch]
        : undefined,
  };

  // Company-domain consistency check against admin company records
  let companyMismatch: string | null = null;
  if (extracted.companyName) {
    const knownCompany = dbStore.findCompanyByNameOrDomain(extracted.companyName, undefined, isDemo);
    const domainToCheck =
      extractDomainFromString(extracted.recruiterEmail) ||
      extractDomainFromString(extracted.applicationUrl) ||
      urlInspection?.domain;
    if (
      knownCompany &&
      domainToCheck &&
      knownCompany.officialDomain.toLowerCase().replace(/^www\./, '') !== domainToCheck
    ) {
      companyMismatch = `Claimed company "${knownCompany.companyName}" has recorded official domain "${knownCompany.officialDomain}", which differs from observed domain "${domainToCheck}".`;
    }
  }

  const assessment = evaluateRisk({
    scanType: input.scanType,
    rawText: input.rawText,
    extracted,
    emailInspection,
    urlInspection,
    confirmedThreatMatch,
    companyMismatch,
    aiFindings: aiResult.findings,
    aiInsufficientEvidence: aiResult.insufficientEvidence,
    aiMissing: aiResult.missingInformation,
    aiPositives: aiResult.positiveObservations,
    aiRecommendations: aiResult.recommendations,
    aiContradictions: aiResult.contradictions,
  });

  const savedScan = dbStore.createScan({
    userId: input.userId,
    isDemo,
    scanName: input.scanName,
    scanType: input.scanType,
    inputReference: input.inputReference,
    extractedInformation: extracted,
    findings: assessment.findings,
    positiveObservations: assessment.positiveObservations,
    contradictions: aiResult.contradictions,
    missingInformation: assessment.missingInformation,
    recommendations: assessment.recommendations,
    riskScore: assessment.riskScore,
    riskCategory: assessment.riskCategory,
    evidenceConfidence: assessment.evidenceConfidence,
    processingStatus:
      assessment.riskCategory === 'INSUFFICIENT_EVIDENCE' ? 'INSUFFICIENT_EVIDENCE' : 'COMPLETED',
    disclaimer: assessment.disclaimer,
    aiStatus: aiResult.status,
    saved: false,
  });

  // Persist Evidence Records for high-confidence findings
  for (const f of assessment.findings.slice(0, 8)) {
    dbStore.addEvidenceRecord({
      isDemo,
      relatedScanId: savedScan.id,
      entityType: input.scanType,
      evidenceType: f.title,
      source: f.source,
      finding: `${f.description} (${f.evidence})`,
      confidence: f.confidence,
    });
  }

  // Create notification based on user preferences
  const user = dbStore.findUserById(input.userId);
  if (user) {
    if (savedScan.riskCategory === 'HIGH_RISK' && user.notificationPrefs.highRiskAlerts) {
      dbStore.addNotification({
        userId: user.id,
        type: 'high_risk',
        title: `High-Risk Alert: ${savedScan.scanName}`,
        message: `Risk score ${savedScan.riskScore}/100 detected with ${savedScan.findings.length} security findings. Review recommendations before proceeding.`,
        link: `/student/reports/${savedScan.id}`,
      });
    } else if (user.notificationPrefs.scanCompleted) {
      dbStore.addNotification({
        userId: user.id,
        type: 'scan_completed',
        title: `Scan Completed: ${savedScan.scanName}`,
        message: `Classification: ${savedScan.riskCategory.replace('_', ' ')} (${savedScan.evidenceConfidence} evidence confidence).`,
        link: `/student/reports/${savedScan.id}`,
      });
    }
  }

  return savedScan;
}
