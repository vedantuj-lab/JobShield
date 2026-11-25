import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['STUDENT', 'ADMIN'], default: 'STUDENT', required: true },
    accountStatus: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE', required: true },
    authProvider: { type: String, enum: ['LOCAL', 'GOOGLE'], default: 'LOCAL', required: true },
    emailVerified: { type: Boolean, default: false },
    college: { type: String, default: '' },
    notificationPrefs: {
      scanCompleted: { type: Boolean, default: true },
      highRiskAlerts: { type: Boolean, default: true },
      communityUpdates: { type: Boolean, default: true },
      securityEvents: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const ScanSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    scanName: { type: String, required: true },
    scanType: {
      type: String,
      enum: ['offer_letter', 'email', 'url', 'job_description', 'screenshot'],
      required: true,
    },
    inputReference: { type: String, required: true },
    extractedInformation: { type: Schema.Types.Mixed, default: {} },
    findings: { type: [Schema.Types.Mixed], default: [] },
    positiveObservations: { type: [Schema.Types.Mixed], default: [] },
    contradictions: { type: [String], default: [] },
    missingInformation: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    riskScore: { type: Number, default: null },
    riskCategory: {
      type: String,
      enum: ['LOWER_RISK', 'SUSPICIOUS', 'HIGH_RISK', 'INSUFFICIENT_EVIDENCE'],
      required: true,
    },
    evidenceConfidence: { type: String, enum: ['low', 'medium', 'high'], required: true },
    processingStatus: {
      type: String,
      enum: ['COMPLETED', 'INSUFFICIENT_EVIDENCE', 'FAILED'],
      required: true,
    },
    disclaimer: { type: String, required: true },
    aiStatus: { type: String, default: 'Not Configured' },
    saved: { type: Boolean, default: false },
    savedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
ScanSchema.index({ userId: 1, createdAt: -1 });

const CompanySchema = new Schema({
  companyName: { type: String, required: true, index: true },
  officialDomain: { type: String, required: true, index: true },
  publicInformationReferences: { type: [String], default: [] },
  verificationStatus: {
    type: String,
    enum: ['VERIFIED', 'UNVERIFIED', 'SUSPICIOUS', 'FLAGGED'],
    default: 'UNVERIFIED',
  },
  notes: { type: String, default: '' },
  lastReviewedAt: { type: Date, default: Date.now },
});

const DomainSchema = new Schema({
  domainName: { type: String, required: true, unique: true, lowercase: true, index: true },
  relatedCompanyId: { type: String, default: null },
  indicatorType: { type: String, required: true },
  threatStatus: {
    type: String,
    enum: ['MONITORED', 'SUSPICIOUS', 'CONFIRMED_THREAT', 'CLEARED'],
    default: 'MONITORED',
  },
  source: { type: String, required: true },
  evidenceSummary: { type: String, default: '' },
  relatedReportId: { type: String, default: null },
  lastCheckedAt: { type: Date, default: Date.now },
});

const ThreatReportSchema = new Schema(
  {
    reporterId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    companyName: { type: String, default: '' },
    url: { type: String, default: '' },
    recruiterInfo: { type: String, default: '' },
    description: { type: String, required: true },
    incidentDate: { type: String, required: true },
    evidenceSummary: { type: String, default: '' },
    moneyRequested: { type: Boolean, default: false },
    moneyPaid: { type: Boolean, default: false },
    additionalNotes: { type: String, default: '' },
    moderationStatus: {
      type: String,
      enum: ['UNDER_REVIEW', 'CORROBORATED', 'CONFIRMED', 'REJECTED'],
      default: 'UNDER_REVIEW',
      index: true,
    },
    moderationNotes: { type: String, default: '' },
    duplicateOfId: { type: String, default: null },
  },
  { timestamps: true }
);

const EvidenceRecordSchema = new Schema({
  relatedScanId: { type: String, default: null, index: true },
  relatedReportId: { type: String, default: null, index: true },
  entityType: { type: String, required: true },
  evidenceType: { type: String, required: true },
  source: { type: String, required: true },
  finding: { type: String, required: true },
  confidence: { type: String, enum: ['low', 'medium', 'high'], required: true },
  timestamp: { type: Date, default: Date.now },
});

const AuditLogSchema = new Schema({
  actorId: { type: String, required: true, index: true },
  actorEmail: { type: String },
  actorRole: { type: String },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true },
});

export const MongooseModels = {
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  Scan: mongoose.models.Scan || mongoose.model('Scan', ScanSchema),
  Company: mongoose.models.Company || mongoose.model('Company', CompanySchema),
  Domain: mongoose.models.Domain || mongoose.model('Domain', DomainSchema),
  ThreatReport: mongoose.models.ThreatReport || mongoose.model('ThreatReport', ThreatReportSchema),
  EvidenceRecord: mongoose.models.EvidenceRecord || mongoose.model('EvidenceRecord', EvidenceRecordSchema),
  AuditLog: mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema),
};
