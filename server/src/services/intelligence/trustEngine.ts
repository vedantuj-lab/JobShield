import { dbStore } from '../../config/store';
import type {
  GraphEdgeData,
  GraphNodeData,
  ScanRecord,
  TrustIntelligenceResult,
} from '../../../../src/types/jobshield';
import { inspectUrl } from '../url/urlInspector';

function getDomainFromEmailOrUrl(val?: string): string | null {
  if (!val) return null;
  const trimmed = val.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed.split('@')[1]?.replace(/^www\./, '') || null;
  }
  try {
    const u = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export async function verifyTrustEntities(input: {
  mode: 'company' | 'recruiter' | 'opportunity';
  isDemo?: boolean;
  companyName?: string;
  officialWebsite?: string;
  emailDomain?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  applicationUrl?: string;
  paymentRequested?: boolean;
  offerSummary?: string;
  jobDescriptionSummary?: string;
}): Promise<TrustIntelligenceResult> {
  const isDemo = Boolean(input.isDemo);
  const checksPerformed: string[] = [];
  const missingEvidence: string[] = [];
  const nodes: GraphNodeData[] = [];
  const edges: GraphEdgeData[] = [];

  const companyName = input.companyName?.trim();
  const websiteDomain = getDomainFromEmailOrUrl(input.officialWebsite);
  const recruiterDomain = getDomainFromEmailOrUrl(input.recruiterEmail || input.emailDomain);
  const appDomain = getDomainFromEmailOrUrl(input.applicationUrl);

  const dbCompany = dbStore.findCompanyByNameOrDomain(companyName, websiteDomain || undefined, isDemo);
  const domainCheckTarget = input.officialWebsite || (websiteDomain ? `https://${websiteDomain}` : undefined);
  const urlResult = domainCheckTarget ? await inspectUrl(domainCheckTarget) : null;
  if (urlResult) {
    checksPerformed.push(`Inspected domain ${urlResult.domain} via DNS, TLS, RDAP, and Web Risk (${urlResult.webRisk.status}).`);
  }

  const threatMatch =
    (websiteDomain && dbStore.findDomainIndicator(websiteDomain, isDemo)) ||
    (recruiterDomain && dbStore.findDomainIndicator(recruiterDomain, isDemo)) ||
    (appDomain && dbStore.findDomainIndicator(appDomain, isDemo)) ||
    null;

  if (threatMatch) {
    checksPerformed.push(`Cross-referenced domain ${threatMatch.domainName} against JOBSHIELD Threat Indicators (${threatMatch.threatStatus}).`);
  }

  // 1. Company Existence Statement
  let companyExistence: TrustIntelligenceResult['statements']['companyExistence'];
  if (!companyName) {
    companyExistence = {
      status: 'Missing Evidence',
      detail: 'No company name was provided.',
      limitation: 'Provide a registered company name to evaluate company records.',
    };
    missingEvidence.push('Company name not provided.');
  } else if (dbCompany) {
    companyExistence = {
      status: dbCompany.verificationStatus === 'VERIFIED' ? 'Supported by Platform Record' : dbCompany.verificationStatus,
      detail: `${dbCompany.companyName} matches a reviewed company record (Official domain: ${dbCompany.officialDomain}).`,
      limitation: 'Company registration or platform record presence never proves that a specific job offer is authentic.',
    };
  } else {
    companyExistence = {
      status: 'Unverified',
      detail: `No pre-verified company record found in JOBSHIELD for "${companyName}". Public MCA/corporate registries require independent lookup.`,
      limitation: 'Absence from the platform registry does not imply fraud, nor does company existence validate an individual recruiter.',
    };
    missingEvidence.push('Independent corporate registry (e.g., MCA India) verification not connected.');
  }

  // 2. Official Website Identification Statement
  let officialWebsite: TrustIntelligenceResult['statements']['officialWebsite'];
  if (!websiteDomain) {
    officialWebsite = {
      status: 'Missing Evidence',
      detail: 'No official company website was supplied.',
      limitation: 'An official website URL is required to compare recruiter and application domains.',
    };
    missingEvidence.push('Official company website URL missing.');
  } else if (threatMatch?.threatStatus === 'CONFIRMED_THREAT') {
    officialWebsite = {
      status: 'Suspicious',
      detail: `Domain ${websiteDomain} is flagged as a confirmed threat indicator (${threatMatch.evidenceSummary}).`,
      limitation: 'Verify the authentic corporate domain via independent search.',
    };
  } else if (urlResult?.valid) {
    officialWebsite = {
      status: urlResult.httpsAvailable && urlResult.dns.resolvedIps.length > 0 ? 'Supported' : 'Unverified',
      detail: `Domain ${urlResult.domain} resolved (${urlResult.dns.resolvedIps.length} IP(s)), HTTPS ${urlResult.httpsAvailable ? 'active' : 'unavailable'}, RDAP ${urlResult.rdap.status}.`,
      limitation: 'Technical DNS/TLS availability confirms the domain is live, not that it belongs to the named employer.',
    };
  } else {
    officialWebsite = {
      status: 'Contradictory',
      detail: urlResult?.error || 'Submitted website URL failed validation.',
      limitation: 'Provide a valid public https:// URL.',
    };
  }

  // 3. Recruiter Association Statement
  let recruiterAssociation: TrustIntelligenceResult['statements']['recruiterAssociation'];
  if (!input.recruiterEmail && !input.recruiterName && !input.emailDomain) {
    recruiterAssociation = {
      status: 'Missing Evidence',
      detail: 'No recruiter name or email address was provided.',
      limitation: 'Recruiter email domain comparison cannot run without recruiter contact details.',
    };
    missingEvidence.push('Recruiter name or email missing.');
  } else if (recruiterDomain && websiteDomain && recruiterDomain !== websiteDomain) {
    recruiterAssociation = {
      status: 'Contradictory',
      detail: `Recruiter email domain (${recruiterDomain}) does not match the claimed official domain (${websiteDomain}).`,
      limitation: 'Some companies use third-party ATS domains, so verify via the official careers page.',
    };
  } else if (recruiterDomain && /^(gmail|yahoo|outlook|hotmail|proton)\./i.test(recruiterDomain)) {
    recruiterAssociation = {
      status: 'Suspicious',
      detail: `Recruiter uses consumer webmail (${recruiterDomain}), which cannot verify corporate employment.`,
      limitation: 'Do not rely on a name match on public profiles alone as proof of recruiter identity.',
    };
  } else if (recruiterDomain && websiteDomain && recruiterDomain === websiteDomain) {
    recruiterAssociation = {
      status: 'Supported',
      detail: `Recruiter email domain (${recruiterDomain}) aligns with ${websiteDomain}.`,
      limitation: 'Email display headers can be spoofed unless SPF/DKIM/DMARC are verified; matching domain does not verify the individual.',
    };
  } else {
    recruiterAssociation = {
      status: 'Unverified',
      detail: `Recruiter details (${input.recruiterName || input.recruiterEmail || input.emailDomain}) could not be independently linked to an official corporate directory.`,
      limitation: 'Matching a public name does not confirm recruiter authorization.',
    };
  }

  // 4. Specific Opportunity Confirmation Statement
  let specificOpportunity: TrustIntelligenceResult['statements']['specificOpportunity'];
  if (input.paymentRequested) {
    specificOpportunity = {
      status: 'Suspicious',
      detail: 'Opportunity involves an advance payment or deposit request, which strongly indicates recruitment fraud.',
      limitation: 'Do not pay registration, onboarding, or equipment fees.',
    };
  } else if (appDomain && websiteDomain && appDomain !== websiteDomain) {
    specificOpportunity = {
      status: 'Contradictory',
      detail: `Application URL domain (${appDomain}) differs from the official company domain (${websiteDomain}).`,
      limitation: 'Confirm if the application portal is an authorized ATS listed on the company’s official careers page.',
    };
  } else {
    specificOpportunity = {
      status: 'Unverified',
      detail: 'Specific job offer or drive authenticity cannot be confirmed automatically without official employer portal confirmation.',
      limitation: 'Always confirm open requisitions directly on the employer’s official careers page or via campus placement cell.',
    };
  }

  // Build Evidence Graph nodes strictly from provided/observed entities
  if (companyName) {
    nodes.push({
      id: 'company',
      entityType: 'company',
      entityName: companyName,
      verificationStatus: dbCompany?.verificationStatus === 'VERIFIED' ? 'Confirmed' : 'Unverified',
      source: dbCompany ? 'JOBSHIELD Company Records' : 'User Input',
      confidence: dbCompany ? 'medium' : 'low',
      details: companyExistence.detail,
    });
  }

  if (websiteDomain) {
    nodes.push({
      id: 'domain',
      entityType: 'domain',
      entityName: websiteDomain,
      verificationStatus:
        threatMatch?.threatStatus === 'CONFIRMED_THREAT'
          ? 'Suspicious'
          : urlResult?.httpsAvailable
          ? 'Supported'
          : 'Unverified',
      source: 'DNS / TLS / RDAP Inspection',
      confidence: urlResult?.valid ? 'medium' : 'low',
      details: officialWebsite.detail,
    });
    if (companyName) {
      edges.push({
        id: 'e-comp-dom',
        source: 'company',
        target: 'domain',
        status: dbCompany && dbCompany.officialDomain === websiteDomain ? 'Confirmed' : 'Unverified',
        explanation:
          dbCompany && dbCompany.officialDomain === websiteDomain
            ? 'Company record links to this official domain.'
            : 'Domain ownership by the named company is claimed but requires independent verification.',
      });
    }
  }

  if (input.recruiterName || input.recruiterEmail) {
    nodes.push({
      id: 'recruiter',
      entityType: 'recruiter',
      entityName: input.recruiterName || input.recruiterEmail || 'Recruiter',
      verificationStatus:
        recruiterAssociation.status === 'Contradictory'
          ? 'Contradictory'
          : recruiterAssociation.status === 'Suspicious'
          ? 'Suspicious'
          : recruiterAssociation.status === 'Supported'
          ? 'Supported'
          : 'Unverified',
      source: 'Recruiter Consistency Check',
      confidence: 'medium',
      details: recruiterAssociation.detail,
    });
    const parentId = websiteDomain ? 'domain' : companyName ? 'company' : null;
    if (parentId) {
      edges.push({
        id: `e-${parentId}-rec`,
        source: parentId,
        target: 'recruiter',
        status:
          recruiterAssociation.status === 'Contradictory'
            ? 'Contradictory'
            : recruiterAssociation.status === 'Suspicious'
            ? 'Suspicious'
            : recruiterAssociation.status === 'Supported'
            ? 'Supported'
            : 'Unverified',
        explanation: recruiterAssociation.detail,
      });
    }
  }

  if (input.recruiterEmail) {
    nodes.push({
      id: 'email',
      entityType: 'email',
      entityName: input.recruiterEmail,
      verificationStatus: recruiterAssociation.status === 'Supported' ? 'Supported' : 'Unverified',
      source: 'Email Domain Analysis',
      confidence: 'medium',
      details: `Email domain: ${recruiterDomain || 'unknown'}`,
    });
    if (input.recruiterName || input.recruiterEmail) {
      edges.push({
        id: 'e-rec-email',
        source: 'recruiter',
        target: 'email',
        status: 'Supported',
        explanation: 'Email address supplied for recruiter communication.',
      });
    }
  }

  if (input.offerSummary) {
    nodes.push({
      id: 'offer',
      entityType: 'offer_letter',
      entityName: 'Offer Letter',
      verificationStatus: input.paymentRequested ? 'Suspicious' : 'Unverified',
      source: 'Submitted Opportunity Claim',
      confidence: 'low',
      details: input.offerSummary,
    });
    const offerAnchor = nodes.some((n) => n.id === 'email')
      ? 'email'
      : nodes.some((n) => n.id === 'recruiter')
      ? 'recruiter'
      : nodes.some((n) => n.id === 'domain')
      ? 'domain'
      : nodes.some((n) => n.id === 'company')
      ? 'company'
      : null;
    if (offerAnchor) {
      edges.push({
        id: `e-${offerAnchor}-offer`,
        source: offerAnchor,
        target: 'offer',
        status: input.paymentRequested ? 'Suspicious' : 'Unverified',
        explanation: input.paymentRequested
          ? 'Offer terms contain payment or fee indicators requiring caution.'
          : 'Offer terms referenced alongside claimed employer or recruiter.',
      });
    }
  }

  if (input.jobDescriptionSummary) {
    nodes.push({
      id: 'jd',
      entityType: 'job_description',
      entityName: 'Job Description',
      verificationStatus: input.paymentRequested ? 'Suspicious' : 'Unverified',
      source: 'Submitted Job Description',
      confidence: 'low',
      details: input.jobDescriptionSummary,
    });
    const jdAnchor = nodes.some((n) => n.id === 'email')
      ? 'email'
      : nodes.some((n) => n.id === 'recruiter')
      ? 'recruiter'
      : nodes.some((n) => n.id === 'domain')
      ? 'domain'
      : nodes.some((n) => n.id === 'company')
      ? 'company'
      : null;
    if (jdAnchor) {
      edges.push({
        id: `e-${jdAnchor}-jd`,
        source: jdAnchor,
        target: 'jd',
        status: input.paymentRequested ? 'Suspicious' : 'Unverified',
        explanation: 'Job description associated with the submitted employer or recruiter claim.',
      });
    }
  }

  if (input.applicationUrl) {
    const mismatch = Boolean(appDomain && websiteDomain && appDomain !== websiteDomain);
    nodes.push({
      id: 'app_url',
      entityType: 'application_url',
      entityName: appDomain || input.applicationUrl,
      verificationStatus: mismatch ? 'Contradictory' : 'Unverified',
      source: 'Application URL Check',
      confidence: 'medium',
      details: mismatch
        ? `Application URL domain (${appDomain}) differs from official domain (${websiteDomain}).`
        : `Application URL submitted: ${input.applicationUrl}`,
    });
    const anchor = nodes.some((n) => n.id === 'jd')
      ? 'jd'
      : nodes.some((n) => n.id === 'offer')
      ? 'offer'
      : nodes.some((n) => n.id === 'domain')
      ? 'domain'
      : nodes.some((n) => n.id === 'company')
      ? 'company'
      : null;
    if (anchor) {
      edges.push({
        id: `e-${anchor}-app`,
        source: anchor,
        target: 'app_url',
        status: mismatch ? 'Contradictory' : 'Unverified',
        explanation: mismatch
          ? 'Application link redirects to an unrelated domain.'
          : 'Application link associated with this opportunity.',
      });
    }
  }

  if (input.paymentRequested) {
    nodes.push({
      id: 'payment',
      entityType: 'payment_request',
      entityName: 'Advance Fee / Deposit Request',
      verificationStatus: 'Suspicious',
      source: 'Payment Indicator Rule',
      confidence: 'high',
      details: 'Candidate reported or content indicates a payment/deposit request.',
    });
    const targetSource = nodes.some((n) => n.id === 'offer')
      ? 'offer'
      : nodes.some((n) => n.id === 'jd')
      ? 'jd'
      : nodes.some((n) => n.id === 'recruiter')
      ? 'recruiter'
      : nodes.some((n) => n.id === 'email')
      ? 'email'
      : nodes.some((n) => n.id === 'domain')
      ? 'domain'
      : nodes.some((n) => n.id === 'company')
      ? 'company'
      : null;
    if (targetSource) {
      edges.push({
        id: 'e-pay',
        source: targetSource,
        target: 'payment',
        status: 'Suspicious',
        explanation: 'Advance fee requests are a primary indicator of recruitment fraud.',
      });
    }
  }

  if (checksPerformed.length > 0) {
    nodes.push({
      id: 'evidence',
      entityType: 'evidence',
      entityName: 'Supporting Technical Checks',
      verificationStatus: threatMatch?.threatStatus === 'CONFIRMED_THREAT' ? 'Suspicious' : 'Supported',
      source: 'JOBSHIELD Verification Services',
      confidence: 'medium',
      details: checksPerformed.join(' '),
    });
    const evAnchor = nodes.some((n) => n.id === 'domain')
      ? 'domain'
      : nodes.some((n) => n.id === 'app_url')
      ? 'app_url'
      : nodes.some((n) => n.id === 'company')
      ? 'company'
      : null;
    if (evAnchor) {
      edges.push({
        id: `e-${evAnchor}-ev`,
        source: evAnchor,
        target: 'evidence',
        status: threatMatch?.threatStatus === 'CONFIRMED_THREAT' ? 'Suspicious' : 'Supported',
        explanation: checksPerformed.join(' '),
      });
    }
  }

  if (missingEvidence.length > 0 && nodes.length > 0) {
    nodes.push({
      id: 'missing_evidence',
      entityType: 'missing_evidence',
      entityName: 'Missing Verification Evidence',
      verificationStatus: 'Missing Evidence',
      source: 'Evidence Completeness Boundary',
      confidence: 'low',
      details: missingEvidence.join(' '),
    });
    const missAnchor = nodes.some((n) => n.id === 'company')
      ? 'company'
      : nodes.some((n) => n.id === 'domain')
      ? 'domain'
      : nodes[0].id;
    if (missAnchor && missAnchor !== 'missing_evidence') {
      edges.push({
        id: `e-${missAnchor}-missing`,
        source: missAnchor,
        target: 'missing_evidence',
        status: 'Missing Evidence',
        explanation: missingEvidence.join(' '),
      });
    }
  }

  return {
    statements: {
      companyExistence,
      officialWebsite,
      recruiterAssociation,
      specificOpportunity,
    },
    nodes,
    edges,
    checksPerformed,
    missingEvidence,
  };
}

export async function buildGraphFromScan(scan: ScanRecord): Promise<TrustIntelligenceResult> {
  const ext = scan.extractedInformation;
  const isJd = scan.scanType === 'job_description';
  const summaryLabel = ext.jobTitle
    ? `${ext.jobTitle} (${ext.salary || 'Compensation unspecified'})`
    : scan.scanName;

  return verifyTrustEntities({
    mode: 'opportunity',
    isDemo: Boolean(scan.isDemo),
    companyName: ext.companyName,
    officialWebsite: ext.website,
    recruiterName: ext.recruiterName,
    recruiterEmail: ext.recruiterEmail,
    applicationUrl: ext.applicationUrl,
    paymentRequested: Boolean(ext.paymentInstructions && ext.paymentInstructions.length > 0),
    offerSummary: !isJd ? summaryLabel : undefined,
    jobDescriptionSummary: isJd ? summaryLabel : undefined,
  });
}
