import express from 'express';
import {
  DEMO_GRAPH_SCENARIOS,
  DEMO_OPPORTUNITY_SAMPLES,
  DEMO_RECRUITER_SAMPLES,
} from '../config/demoDataset';
import { seedDemoData } from '../config/demoSeed';
import { dbStore } from '../config/store';
import { rateLimit, requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { hashPassword, issueSessionToken, sanitizeUser, verifyPassword } from '../services/auth/authService';
import { buildGraphFromScan, verifyTrustEntities } from '../services/intelligence/trustEngine';

const router = express.Router();

// Publicly viewable sanitized community reports (masks personal contact info)
function sanitizePublicReport(rep: ReturnType<typeof dbStore.getReportById>) {
  if (!rep) return null;
  const maskSensitive = (text: string) =>
    text
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[redacted-email]')
      .replace(/\b(?:\+91[-\s]?)?[6-9]\d{9}\b/g, '[redacted-phone]');

  return {
    ...rep,
    reporterId: 'community-member',
    recruiterInfo: rep.recruiterInfo ? maskSensitive(rep.recruiterInfo) : '',
    description: maskSensitive(rep.description),
    additionalNotes: rep.additionalNotes ? maskSensitive(rep.additionalNotes) : '',
  };
}

router.post('/demo/reset', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser?.isDemo) {
    res.status(403).json({ error: 'Demo reset is only available when signed into a Demo account.' });
    return;
  }
  const activeUserId = req.authUser.id;
  seedDemoData(true);
  const reloadedUser = dbStore.findUserById(activeUserId);
  if (!reloadedUser) {
    res.status(500).json({ error: 'Failed to restore demo account after reset.' });
    return;
  }
  const token = issueSessionToken(reloadedUser, false);
  dbStore.addAuditLog({
    actorId: reloadedUser.id,
    actorEmail: reloadedUser.email,
    actorRole: reloadedUser.role,
    isDemo: true,
    action: 'DEMO_DATA_RESET',
    targetType: 'Sandbox',
    targetId: reloadedUser.id,
    metadata: { role: reloadedUser.role },
  });
  res.json({
    reset: true,
    user: sanitizeUser(reloadedUser),
    token,
  });
});

// ---------- REPORTS ----------
router.get('/reports/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const scan = dbStore.getScanById(req.params.id);
  if (!scan || Boolean(scan.isDemo) !== Boolean(req.authUser!.isDemo)) {
    res.status(404).json({ error: 'Security report not found.' });
    return;
  }
  if (scan.userId !== req.authUser!.id && req.authUser!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }
  res.json({ report: scan });
});

router.post('/reports/:id/save', requireAuth, (req: AuthenticatedRequest, res) => {
  const saved = req.body?.saved !== false;
  const updated = dbStore.toggleSaveScan(req.params.id, req.authUser!.id, saved);
  if (!updated) {
    res.status(404).json({ error: 'Report not found or access denied.' });
    return;
  }
  res.json({ report: updated });
});

router.get('/reports/:id/download', requireAuth, (req: AuthenticatedRequest, res) => {
  const scan = dbStore.getScanById(req.params.id);
  if (!scan || Boolean(scan.isDemo) !== Boolean(req.authUser!.isDemo)) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }
  if (scan.userId !== req.authUser!.id && req.authUser!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  const format = String(req.query.format || 'txt').toLowerCase();
  const safeSlug = scan.scanName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="JOBSHIELD_${safeSlug}_${scan.id}.json"`);
    res.send(JSON.stringify(scan, null, 2));
    return;
  }

  const lines = [
    '====================================================================',
    'JOBSHIELD — RECRUITMENT SECURITY ASSESSMENT REPORT',
    'Protecting Careers Before Scammers Destroy Them.',
    '====================================================================',
    `Report ID:            ${scan.id}`,
    `Scan Name:            ${scan.scanName}`,
    `Scan Type:            ${scan.scanType}`,
    `Date:                 ${scan.createdAt}`,
    `Risk Score:           ${scan.riskScore === null ? 'N/A (Insufficient Evidence)' : `${scan.riskScore}/100`}`,
    `Risk Classification:  ${scan.riskCategory}`,
    `Evidence Confidence:  ${scan.evidenceConfidence.toUpperCase()}`,
    `AI Service Status:    ${scan.aiStatus}`,
    '',
    `DISCLAIMER: ${scan.disclaimer}`,
    '',
    '--- EXTRACTED INFORMATION ---',
    ...Object.entries(scan.extractedInformation)
      .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('; ') : String(v)}`),
    '',
    '--- SECURITY FINDINGS ---',
    ...(scan.findings.length
      ? scan.findings.map(
          (f, idx) =>
            `${idx + 1}. [${f.severity.toUpperCase()}] ${f.title}\n   Source: ${f.source} | Confidence: ${f.confidence}\n   Explanation: ${f.description}\n   Evidence: ${f.evidence}\n   Recommendation: ${f.recommendation}`
        )
      : ['No specific fraud indicators were triggered in the submitted material.']),
    '',
    '--- POSITIVE OBSERVATIONS & LIMITATIONS ---',
    ...(scan.positiveObservations.length
      ? scan.positiveObservations.map(
          (p) => `- ${p.title}: ${p.detail} (Limitation: ${p.limitation})`
        )
      : ['None recorded.']),
    '',
    '--- CONTRADICTIONS ---',
    ...(scan.contradictions.length ? scan.contradictions.map((c) => `- ${c}`) : ['None identified.']),
    '',
    '--- MISSING INFORMATION ---',
    ...(scan.missingInformation.length ? scan.missingInformation.map((m) => `- ${m}`) : ['None recorded.']),
    '',
    '--- RECOMMENDED ACTIONS ---',
    ...scan.recommendations.map((r, i) => `${i + 1}. ${r}`),
    '',
    'If money has already been paid in India: Call 1930 and report at https://cybercrime.gov.in',
  ];

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="JOBSHIELD_${safeSlug}_${scan.id}.txt"`);
  res.send(lines.join('\n'));
});

// ---------- USER PROFILE, NOTIFICATIONS, CHECKLIST ----------
router.get('/users/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: sanitizeUser(req.authUser!) });
});

router.patch('/users/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const { name, college, notificationPrefs } = req.body as Record<string, unknown>;
  const updates: Parameters<typeof dbStore.updateUserProfile>[1] = {};
  if (typeof name === 'string') {
    if (name.trim().length < 2) {
      res.status(400).json({ error: 'Name must be at least 2 characters.' });
      return;
    }
    updates.name = name.trim();
  }
  if (typeof college === 'string') {
    updates.college = college.trim();
  }
  if (notificationPrefs && typeof notificationPrefs === 'object') {
    const np = notificationPrefs as Record<string, unknown>;
    updates.notificationPrefs = {
      scanCompleted: Boolean(np.scanCompleted),
      highRiskAlerts: Boolean(np.highRiskAlerts),
      communityUpdates: Boolean(np.communityUpdates),
      securityEvents: Boolean(np.securityEvents),
    };
  }
  const updated = dbStore.updateUserProfile(req.authUser!.id, updates);
  if (!updated) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.json({ user: sanitizeUser(updated) });
});

router.patch('/users/password', requireAuth, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body as Record<string, unknown>;
  const user = req.authUser!;
  if (user.authProvider !== 'LOCAL' || !user.passwordHash) {
    res.status(400).json({ error: 'Password changes apply only to email/password accounts.' });
    return;
  }
  if (typeof currentPassword !== 'string' || !verifyPassword(currentPassword, user.passwordHash)) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters.' });
    return;
  }
  dbStore.updateUserProfile(user.id, { passwordHash: hashPassword(newPassword) });
  dbStore.addNotification({
    userId: user.id,
    type: 'security_event',
    title: 'Password Changed',
    message: 'Your account password was updated successfully.',
  });
  dbStore.addAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    isDemo: Boolean(user.isDemo),
    action: 'PASSWORD_CHANGED',
    targetType: 'User',
    targetId: user.id,
    metadata: {},
  });
  res.json({ ok: true });
});

router.delete('/users/account', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  if (user.isDemo) {
    res.status(403).json({
      error: 'Demo sandbox accounts cannot be permanently deleted. Use Reset Demo Data to restore sample records.',
    });
    return;
  }
  dbStore.addAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ACCOUNT_DELETED_BY_USER',
    targetType: 'User',
    targetId: user.id,
    metadata: {},
  });
  dbStore.deleteUser(user.id);
  res.json({ deleted: true });
});

router.get('/users/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const notifications = dbStore.listNotifications(req.authUser!.id);
  res.json({ notifications });
});

router.patch('/users/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  dbStore.markNotificationRead(req.params.id, req.authUser!.id);
  res.json({ ok: true });
});

router.post('/users/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
  dbStore.markAllNotificationsRead(req.authUser!.id);
  res.json({ ok: true });
});

router.get('/users/checklist', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ completedItems: dbStore.getChecklist(req.authUser!.id) });
});

router.put('/users/checklist', requireAuth, (req: AuthenticatedRequest, res) => {
  const items = Array.isArray(req.body?.completedItems)
    ? req.body.completedItems.map(String).slice(0, 50)
    : [];
  const saved = dbStore.saveChecklist(req.authUser!.id, items);
  res.json({ completedItems: saved });
});

// ---------- TRUST INTELLIGENCE ----------
router.get('/intelligence/records', requireAuth, (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const companies = dbStore.listCompanies(isDemo);
  const domains = dbStore.listDomains(isDemo);
  const evidence = dbStore.listEvidenceRecords(isDemo).slice(0, 24);
  const userScans = dbStore.listScansByUser(req.authUser!.id);

  const scanRecruiters = userScans
    .filter((s) => s.extractedInformation.recruiterName || s.extractedInformation.recruiterEmail)
    .slice(0, 6)
    .map((s) => ({
      id: s.id,
      recruiterName: s.extractedInformation.recruiterName || 'Unnamed Contact',
      recruiterEmail: s.extractedInformation.recruiterEmail || 'Not provided',
      companyName: s.extractedInformation.companyName || s.scanName,
      officialWebsite: s.extractedInformation.website || '',
      applicationUrl: s.extractedInformation.applicationUrl || '',
      status:
        s.riskCategory === 'HIGH_RISK'
          ? 'Contradictory'
          : s.riskCategory === 'SUSPICIOUS'
          ? 'Suspicious'
          : 'Supported',
      isDemo,
    }));

  const scanOpportunities = userScans
    .filter((s) => Boolean(s.extractedInformation.companyName))
    .slice(0, 6)
    .map((s) => ({
      id: s.id,
      title: s.extractedInformation.jobTitle || s.scanName,
      companyName: s.extractedInformation.companyName || 'Unidentified',
      officialWebsite: s.extractedInformation.website || '',
      recruiterName: s.extractedInformation.recruiterName || '',
      recruiterEmail: s.extractedInformation.recruiterEmail || '',
      applicationUrl: s.extractedInformation.applicationUrl || '',
      paymentRequested: Boolean(
        s.extractedInformation.paymentInstructions && s.extractedInformation.paymentInstructions.length > 0
      ),
      offerSummary: s.extractedInformation.salary || s.extractedInformation.rawSummary || s.scanName,
      jobDescriptionSummary: s.extractedInformation.rawSummary || '',
      riskTag: s.riskCategory.replace('_', ' '),
      isDemo,
    }));

  const recruiterSamples = isDemo
    ? DEMO_RECRUITER_SAMPLES
    : scanRecruiters;

  const opportunitySamples = isDemo
    ? DEMO_OPPORTUNITY_SAMPLES
    : scanOpportunities;

  res.json({
    isDemo,
    companies,
    domains,
    recruiterSamples,
    opportunitySamples,
    evidence,
    graphScenarios: isDemo ? DEMO_GRAPH_SCENARIOS : [],
  });
});

router.post('/intelligence/company', requireAuth, rateLimit(20, 60_000, 'intel_cmp'), async (req: AuthenticatedRequest, res) => {
  const { companyName, officialWebsite, emailDomain, recruitmentUrl } = req.body as Record<string, unknown>;
  if (typeof companyName !== 'string' || !companyName.trim()) {
    res.status(400).json({ error: 'Company name is required.' });
    return;
  }
  const result = await verifyTrustEntities({
    mode: 'company',
    isDemo: Boolean(req.authUser!.isDemo),
    companyName: companyName.trim(),
    officialWebsite: typeof officialWebsite === 'string' ? officialWebsite : undefined,
    emailDomain: typeof emailDomain === 'string' ? emailDomain : undefined,
    applicationUrl: typeof recruitmentUrl === 'string' ? recruitmentUrl : undefined,
  });
  res.json(result);
});

router.post('/intelligence/recruiter', requireAuth, rateLimit(20, 60_000, 'intel_rec'), async (req: AuthenticatedRequest, res) => {
  const { recruiterName, recruiterEmail, companyName, officialWebsite, opportunityDetails } = req.body as Record<
    string,
    unknown
  >;
  if (typeof companyName !== 'string' || !companyName.trim()) {
    res.status(400).json({ error: 'Claimed company name is required.' });
    return;
  }
  const result = await verifyTrustEntities({
    mode: 'recruiter',
    isDemo: Boolean(req.authUser!.isDemo),
    companyName: companyName.trim(),
    officialWebsite: typeof officialWebsite === 'string' ? officialWebsite : undefined,
    recruiterName: typeof recruiterName === 'string' ? recruiterName : undefined,
    recruiterEmail: typeof recruiterEmail === 'string' ? recruiterEmail : undefined,
    jobDescriptionSummary: typeof opportunityDetails === 'string' ? opportunityDetails : undefined,
  });
  res.json(result);
});

router.post('/intelligence/opportunity', requireAuth, rateLimit(20, 60_000, 'intel_opp'), async (req: AuthenticatedRequest, res) => {
  const {
    companyName,
    officialWebsite,
    recruiterName,
    recruiterEmail,
    applicationUrl,
    paymentRequested,
    offerSummary,
    jobDescriptionSummary,
  } = req.body as Record<string, unknown>;

  if (typeof companyName !== 'string' || !companyName.trim()) {
    res.status(400).json({ error: 'Company name is required to verify an opportunity.' });
    return;
  }

  const result = await verifyTrustEntities({
    mode: 'opportunity',
    isDemo: Boolean(req.authUser!.isDemo),
    companyName: companyName.trim(),
    officialWebsite: typeof officialWebsite === 'string' ? officialWebsite : undefined,
    recruiterName: typeof recruiterName === 'string' ? recruiterName : undefined,
    recruiterEmail: typeof recruiterEmail === 'string' ? recruiterEmail : undefined,
    applicationUrl: typeof applicationUrl === 'string' ? applicationUrl : undefined,
    paymentRequested: paymentRequested === true,
    offerSummary: typeof offerSummary === 'string' ? offerSummary : undefined,
    jobDescriptionSummary: typeof jobDescriptionSummary === 'string' ? jobDescriptionSummary : undefined,
  });
  res.json(result);
});

router.get('/intelligence/graph/:scanId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const scan = dbStore.getScanById(req.params.scanId);
  if (!scan || Boolean(scan.isDemo) !== Boolean(req.authUser!.isDemo)) {
    res.status(404).json({ error: 'Scan not found.' });
    return;
  }
  if (scan.userId !== req.authUser!.id && req.authUser!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }
  const result = await buildGraphFromScan(scan);
  res.json(result);
});

// ---------- COMMUNITY THREAT INTELLIGENCE ----------
router.post('/community/reports', requireAuth, rateLimit(10, 60_000, 'comm_submit'), (req: AuthenticatedRequest, res) => {
  const {
    category,
    companyName,
    url,
    recruiterInfo,
    description,
    incidentDate,
    evidenceSummary,
    moneyRequested,
    moneyPaid,
    additionalNotes,
  } = req.body as Record<string, unknown>;

  if (typeof category !== 'string' || !category.trim()) {
    res.status(400).json({ error: 'Report category is required.' });
    return;
  }
  if (typeof description !== 'string' || description.trim().length < 20) {
    res.status(400).json({ error: 'Description must be at least 20 characters explaining what happened.' });
    return;
  }
  if (typeof incidentDate !== 'string' || !incidentDate.trim()) {
    res.status(400).json({ error: 'Incident date is required.' });
    return;
  }

  const isDemo = Boolean(req.authUser!.isDemo);
  const allowCommunityKey = isDemo ? 'demo:allowCommunitySubmissions' : 'allowCommunitySubmissions';
  if (dbStore.getSetting(allowCommunityKey) === 'false') {
    res.status(403).json({
      error: 'New community threat submissions are currently paused by platform administration.',
    });
    return;
  }
  const report = dbStore.createReport({
    reporterId: req.authUser!.id,
    isDemo,
    category: category.trim(),
    companyName: typeof companyName === 'string' ? companyName.trim() : '',
    url: typeof url === 'string' ? url.trim() : '',
    recruiterInfo: typeof recruiterInfo === 'string' ? recruiterInfo.trim() : '',
    description: description.trim(),
    incidentDate: incidentDate.trim(),
    evidenceSummary: typeof evidenceSummary === 'string' ? evidenceSummary.trim() : '',
    moneyRequested: moneyRequested === true,
    moneyPaid: moneyPaid === true,
    additionalNotes: typeof additionalNotes === 'string' ? additionalNotes.trim() : '',
  });

  dbStore.addEvidenceRecord({
    isDemo,
    relatedReportId: report.id,
    entityType: 'community_report',
    evidenceType: report.category,
    source: isDemo ? 'DEMO DATA — Citizen Submission' : 'Citizen / Student Submission (Unverified)',
    finding: report.description.slice(0, 200),
    confidence: 'low',
  });

  dbStore.addAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    actorRole: req.authUser!.role,
    isDemo,
    action: 'COMMUNITY_REPORT_SUBMITTED',
    targetType: 'ThreatReport',
    targetId: report.id,
    metadata: { category: report.category, duplicateOfId: report.duplicateOfId },
  });

  res.status(201).json({ report });
});

router.get('/community/reports', requireAuth, (req: AuthenticatedRequest, res) => {
  const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined;
  const isDemo = Boolean(req.authUser!.isDemo);
  const all = dbStore.listReports({ isDemo }).filter((r) => r.moderationStatus !== 'REJECTED');
  const filtered = statusFilter ? all.filter((r) => r.moderationStatus === statusFilter) : all;
  res.json({ reports: filtered.map((r) => sanitizePublicReport(r)) });
});

router.get('/community/my-reports', requireAuth, (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const reports = dbStore.listReports({ reporterId: req.authUser!.id, isDemo });
  res.json({ reports });
});

router.get('/community/reports/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const report = dbStore.getReportById(req.params.id);
  if (!report || Boolean(report.isDemo) !== Boolean(req.authUser!.isDemo)) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }
  if (report.reporterId === req.authUser!.id || req.authUser!.role === 'ADMIN') {
    res.json({ report });
    return;
  }
  if (report.moderationStatus === 'REJECTED') {
    res.status(404).json({ error: 'Report not available.' });
    return;
  }
  res.json({ report: sanitizePublicReport(report) });
});

export default router;
