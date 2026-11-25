export type UserRole = 'STUDENT' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';
export type AuthProvider = 'LOCAL' | 'GOOGLE';

export type ScanType =
  | 'offer_letter'
  | 'email'
  | 'url'
  | 'job_description'
  | 'screenshot';

export type RiskCategory =
  | 'LOWER_RISK'
  | 'SUSPICIOUS'
  | 'HIGH_RISK'
  | 'INSUFFICIENT_EVIDENCE';

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type FindingSeverity = 'low' | 'medium' | 'high';

export type ProcessingStatus = 'COMPLETED' | 'INSUFFICIENT_EVIDENCE' | 'FAILED';

export type ReportModerationStatus =
  | 'UNDER_REVIEW'
  | 'CORROBORATED'
  | 'CONFIRMED'
  | 'REJECTED';

export type VerificationStatus =
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'SUSPICIOUS'
  | 'FLAGGED';

export type IntegrationState =
  | 'Connected'
  | 'Not Configured'
  | 'Unavailable'
  | 'Error';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  authProvider: AuthProvider;
  emailVerified: boolean;
  isDemo?: boolean;
  college?: string;
  notificationPrefs: {
    scanCompleted: boolean;
    highRiskAlerts: boolean;
    communityUpdates: boolean;
    securityEvents: boolean;
  };
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;
}

export interface ScanFinding {
  title: string;
  severity: FindingSeverity;
  description: string;
  evidence: string;
  source: string;
  confidence: ConfidenceLevel;
  recommendation: string;
  scoreImpact?: number;
}

export interface ExtractedInformation {
  companyName?: string;
  candidateName?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  jobTitle?: string;
  employmentType?: string;
  salary?: string;
  joiningDate?: string;
  workLocation?: string;
  reportingManager?: string;
  website?: string;
  applicationUrl?: string;
  contactDetails?: string;
  paymentInstructions?: string[];
  rawSummary?: string;
  [key: string]: unknown;
}

export interface ScanRecord {
  id: string;
  userId: string;
  isDemo?: boolean;
  scanName: string;
  scanType: ScanType;
  inputReference: string;
  extractedInformation: ExtractedInformation;
  findings: ScanFinding[];
  positiveObservations: Array<{
    title: string;
    detail: string;
    limitation: string;
  }>;
  contradictions: string[];
  missingInformation: string[];
  recommendations: string[];
  riskScore: number | null;
  riskCategory: RiskCategory;
  evidenceConfidence: ConfidenceLevel;
  processingStatus: ProcessingStatus;
  disclaimer: string;
  aiStatus: IntegrationState;
  saved: boolean;
  savedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  reporterEmail?: string;
  relatedScanId?: string | null;
  isDemo?: boolean;
  category: string;
  companyName?: string;
  url?: string;
  recruiterInfo?: string;
  description: string;
  incidentDate: string;
  evidenceSummary?: string;
  moneyRequested: boolean;
  moneyPaid: boolean;
  additionalNotes?: string;
  moderationStatus: ReportModerationStatus;
  moderationNotes?: string;
  duplicateOfId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyRecord {
  id: string;
  isDemo?: boolean;
  companyName: string;
  officialDomain: string;
  industry?: string;
  website?: string;
  relatedRecruiters?: string[];
  relatedOpportunities?: string[];
  publicInformationReferences: string[];
  verificationStatus: VerificationStatus;
  notes?: string;
  lastReviewedAt: string;
}

export interface DomainIndicator {
  id: string;
  isDemo?: boolean;
  domainName: string;
  relatedCompanyId?: string | null;
  indicatorType: string;
  threatStatus: 'MONITORED' | 'SUSPICIOUS' | 'CONFIRMED_THREAT' | 'CLEARED';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  firstDetectedAt?: string;
  source: string;
  evidenceSummary: string;
  relatedReportId?: string | null;
  lastCheckedAt: string;
}

export interface EvidenceRecord {
  id: string;
  isDemo?: boolean;
  relatedScanId?: string | null;
  relatedReportId?: string | null;
  entityType: string;
  evidenceType: string;
  source: string;
  finding: string;
  confidence: ConfidenceLevel;
  timestamp: string;
}

export interface AuditLogRecord {
  id: string;
  isDemo?: boolean;
  actorId: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: 'scan_completed' | 'high_risk' | 'community_update' | 'security_event';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface GraphNodeData {
  id: string;
  entityType:
    | 'company'
    | 'domain'
    | 'recruiter'
    | 'email'
    | 'offer_letter'
    | 'job_description'
    | 'application_url'
    | 'payment_request'
    | 'evidence'
    | 'missing_evidence';
  entityName: string;
  verificationStatus:
    | 'Confirmed'
    | 'Supported'
    | 'Unverified'
    | 'Contradictory'
    | 'Suspicious'
    | 'Missing Evidence';
  source: string;
  confidence: ConfidenceLevel;
  details: string;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  status:
    | 'Confirmed'
    | 'Supported'
    | 'Unverified'
    | 'Contradictory'
    | 'Suspicious'
    | 'Missing Evidence';
  explanation: string;
}

export interface TrustIntelligenceResult {
  statements: {
    companyExistence: { status: string; detail: string; limitation: string };
    officialWebsite: { status: string; detail: string; limitation: string };
    recruiterAssociation: { status: string; detail: string; limitation: string };
    specificOpportunity: { status: string; detail: string; limitation: string };
  };
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  checksPerformed: string[];
  missingEvidence: string[];
}

export interface SystemHealthStatus {
  isDemoData?: boolean;
  backend: { status: IntegrationState; detail: string };
  database: { status: IntegrationState; engine: string; detail: string };
  gemini: { status: IntegrationState; model: string; detail: string };
  webRisk: { status: IntegrationState; detail: string };
  rdapDns: { status: IntegrationState; detail: string };
  ocr: { status: IntegrationState; detail: string };
  googleOAuth: { status: IntegrationState; detail: string };
  notifications?: { status: IntegrationState; detail: string };
  recentErrors: Array<{ id: string; service: string; message: string; timestamp: string }>;
}
