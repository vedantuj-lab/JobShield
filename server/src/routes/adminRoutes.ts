import express from 'express';
import { dbStore, getDatabaseHealth } from '../config/store';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { getFirebaseAuthConfig, isGoogleAuthConfigured, sanitizeUser } from '../services/auth/authService';
import { getGeminiIntegrationStatus } from '../services/scanner/geminiAnalyzer';
import type { ReportModerationStatus, SystemHealthStatus } from '../../../src/types/jobshield';

const router = express.Router();

// Strictly enforce authentication AND ADMIN role on every admin route
router.use(requireAuth, requireRole('ADMIN'));

router.get('/overview', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const users = dbStore.listUsers(isDemo);
  const scans = dbStore.listAllScans(isDemo);
  const reports = dbStore.listReports({ isDemo });
  const domains = dbStore.listDomains(isDemo);
  const recentAuditLogs = dbStore.listAuditLogs(6, isDemo);

  const gemini = getGeminiIntegrationStatus();
  const webRiskConfigured = Boolean(process.env.WEB_RISK_API_KEY?.trim());
  const googleOAuthConfigured = isGoogleAuthConfigured();

  const metrics = {
    totalUsers: users.length,
    totalStudents: users.filter((u) => u.role === 'STUDENT').length,
    totalScans: scans.length,
    highRiskFindings: scans.filter((s) => s.riskCategory === 'HIGH_RISK').length,
    suspiciousFindings: scans.filter((s) => s.riskCategory === 'SUSPICIOUS').length,
    lowerRiskFindings: scans.filter((s) => s.riskCategory === 'LOWER_RISK').length,
    totalCommunityReports: reports.length,
    pendingCommunityReports: reports.filter((r) => r.moderationStatus === 'UNDER_REVIEW').length,
    confirmedThreatReports: reports.filter((r) => r.moderationStatus === 'CONFIRMED').length,
    confirmedThreatIndicators: domains.filter((d) => d.threatStatus === 'CONFIRMED_THREAT').length,
  };

  const byDate = <T extends { createdAt: string }>(items: T[]) => {
    const map = new Map<string, number>();
    for (const item of items) {
      const day = item.createdAt.slice(0, 10);
      map.set(day, (map.get(day) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  };

  const riskDistribution = [
    { name: 'Lower Risk', value: metrics.lowerRiskFindings },
    { name: 'Suspicious', value: metrics.suspiciousFindings },
    { name: 'High Risk', value: metrics.highRiskFindings },
    {
      name: 'Insufficient Evidence',
      value: scans.filter((s) => s.riskCategory === 'INSUFFICIENT_EVIDENCE').length,
    },
  ];

  const scannerUsage = [
    { name: 'Offer Letter', count: scans.filter((s) => s.scanType === 'offer_letter').length },
    { name: 'Email', count: scans.filter((s) => s.scanType === 'email').length },
    { name: 'URL', count: scans.filter((s) => s.scanType === 'url').length },
    { name: 'Job Description', count: scans.filter((s) => s.scanType === 'job_description').length },
    { name: 'Screenshot', count: scans.filter((s) => s.scanType === 'screenshot').length },
  ];

  const reportStatusDistribution = [
    { name: 'Under Review', value: metrics.pendingCommunityReports },
    { name: 'Corroborated', value: reports.filter((r) => r.moderationStatus === 'CORROBORATED').length },
    { name: 'Confirmed', value: metrics.confirmedThreatReports },
    { name: 'Rejected', value: reports.filter((r) => r.moderationStatus === 'REJECTED').length },
  ];

  const pendingModerationQueue = reports
    .filter((r) => r.moderationStatus === 'UNDER_REVIEW')
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      category: r.category,
      companyName: r.companyName || r.url || 'Unidentified Entity',
      createdAt: r.createdAt,
      moneyRequested: r.moneyRequested,
    }));

  const systemHealthSummary = {
    backend: 'Connected' as const,
    database: 'Connected' as const,
    gemini: gemini.status,
    webRisk: webRiskConfigured ? ('Connected' as const) : ('Not Configured' as const),
    googleOAuth: googleOAuthConfigured ? ('Connected' as const) : ('Not Configured' as const),
  };

  res.json({
    metrics,
    userRegistrationTrend: byDate(users),
    scanActivityTrend: byDate(scans),
    riskDistribution,
    scannerUsage,
    reportStatusDistribution,
    pendingModerationQueue,
    recentAuditLogs,
    systemHealthSummary,
  });
});

router.get('/users', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const activityStats = dbStore.getUserActivityStats(isDemo);
  const users = dbStore.listUsers(isDemo).map((u) => {
    const st = activityStats.get(u.id);
    return {
      ...sanitizeUser(u),
      scanCount: st?.scanCount ?? 0,
      communityReportCount: st?.reportCount ?? 0,
      lastActiveAt: st?.lastActiveAt || u.updatedAt,
    };
  });
  res.json({ users });
});

router.patch('/users/:id/status', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const { status, reason } = req.body as Record<string, unknown>;
  if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
    res.status(400).json({ error: 'Invalid status. Use ACTIVE or SUSPENDED.' });
    return;
  }
  if (req.params.id === req.authUser!.id && status === 'SUSPENDED') {
    res.status(400).json({ error: 'Administrators cannot suspend their own account.' });
    return;
  }
  const existing = dbStore.findUserById(req.params.id);
  if (!existing || Boolean(existing.isDemo) !== isDemo) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  const updated = dbStore.updateUserProfile(req.params.id, { accountStatus: status });
  if (!updated) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  if (status === 'SUSPENDED') {
    dbStore.revokeAllUserSessions(updated.id);
  }
  dbStore.addAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    actorRole: 'ADMIN',
    isDemo,
    action: `USER_${status}`,
    targetType: 'User',
    targetId: updated.id,
    metadata: { reason: typeof reason === 'string' ? reason : '' },
  });
  res.json({ user: sanitizeUser(updated) });
});

router.get('/scans', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const userMap = new Map(dbStore.listUsers(isDemo).map((u) => [u.id, u]));
  const reportByScan = new Map<string, string>();
  for (const rep of dbStore.listReports({ isDemo })) {
    if (rep.relatedScanId && !reportByScan.has(rep.relatedScanId)) {
      reportByScan.set(rep.relatedScanId, rep.id);
    }
  }
  const scans = dbStore.listAllScans(isDemo).map((s) => {
    const owner = userMap.get(s.userId);
    return {
      id: s.id,
      userId: s.userId,
      userName: owner?.name || s.userId,
      userEmail: owner?.email || '',
      relatedReportId: reportByScan.get(s.id) || null,
      scanName: s.scanName,
      scanType: s.scanType,
      riskScore: s.riskScore,
      riskCategory: s.riskCategory,
      evidenceConfidence: s.evidenceConfidence,
      processingStatus: s.processingStatus,
      createdAt: s.createdAt,
    };
  });
  res.json({ scans });
});

router.get('/scans/:id', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const scan = dbStore.getScanById(req.params.id);
  if (!scan || Boolean(scan.isDemo) !== isDemo) {
    res.status(404).json({ error: 'Scan record not found.' });
    return;
  }
  res.json({ scan });
});

router.get('/community/reports', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const userMap = new Map(dbStore.listUsers(isDemo).map((u) => [u.id, u]));
  const reports = dbStore.listReports({ isDemo }).map((r) => {
    const reporter = userMap.get(r.reporterId);
    return {
      ...r,
      reporterName: reporter?.name || r.reporterId,
      reporterEmail: reporter?.email || '',
    };
  });
  res.json({ reports });
});

router.patch('/community/reports/:id/status', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const { status, notes, promoteDomain } = req.body as Record<string, unknown>;
  const validStatuses: ReportModerationStatus[] = [
    'UNDER_REVIEW',
    'CORROBORATED',
    'CONFIRMED',
    'REJECTED',
  ];
  if (typeof status !== 'string' || !validStatuses.includes(status as ReportModerationStatus)) {
    res.status(400).json({ error: 'Invalid moderation status.' });
    return;
  }
  if (typeof notes !== 'string' || notes.trim().length < 5) {
    res.status(400).json({ error: 'Please record a moderation reason (minimum 5 characters).' });
    return;
  }

  const updated = dbStore.moderateReport(req.params.id, status as ReportModerationStatus, notes.trim(), isDemo);
  if (!updated) {
    res.status(404).json({ error: 'Community report not found.' });
    return;
  }

  // Only CONFIRMED moderated reports with explicit promotion or URL become threat indicators
  if (status === 'CONFIRMED' && updated.url && promoteDomain !== false) {
    try {
      const parsed = new URL(/^https?:\/\//i.test(updated.url) ? updated.url : `https://${updated.url}`);
      const domainName = parsed.hostname.toLowerCase().replace(/^www\./, '');
      dbStore.upsertDomainIndicator({
        domainName,
        isDemo,
        indicatorType: updated.category,
        threatStatus: 'CONFIRMED_THREAT',
        source: `Community Moderation (${updated.id})`,
        evidenceSummary: notes.trim(),
        relatedReportId: updated.id,
      });
    } catch {
      // Ignore malformed URL during automatic domain extraction
    }
  }

  // Notify reporter within same sandbox
  const reporter = dbStore.findUserById(updated.reporterId);
  if (reporter && Boolean(reporter.isDemo) === isDemo && reporter.notificationPrefs.communityUpdates) {
    dbStore.addNotification({
      userId: reporter.id,
      type: 'community_update',
      title: `Community Report ${status.replace('_', ' ')}`,
      message: `Your report (${updated.category}) was updated to ${status.replace('_', ' ')}. Note: ${notes.trim()}`,
      link: '/student/community',
    });
  }

  dbStore.addAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    actorRole: 'ADMIN',
    isDemo,
    action: `REPORT_${status}`,
    targetType: 'ThreatReport',
    targetId: updated.id,
    metadata: { notes: notes.trim() },
  });

  res.json({ report: updated });
});

router.get('/companies', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  res.json({ companies: dbStore.listCompanies(isDemo) });
});

router.post('/companies', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const {
    companyName,
    officialDomain,
    industry,
    website,
    publicInformationReferences,
    verificationStatus,
    notes,
  } = req.body as Record<string, unknown>;
  if (typeof companyName !== 'string' || !companyName.trim() || typeof officialDomain !== 'string' || !officialDomain.trim()) {
    res.status(400).json({ error: 'Company name and official domain are required.' });
    return;
  }
  const refs = Array.isArray(publicInformationReferences)
    ? publicInformationReferences.map(String)
    : typeof publicInformationReferences === 'string'
    ? publicInformationReferences.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const created = dbStore.createCompany({
    companyName: companyName.trim(),
    officialDomain: officialDomain.trim().toLowerCase(),
    industry: typeof industry === 'string' ? industry.trim() : '',
    website: typeof website === 'string' ? website.trim() : '',
    isDemo,
    publicInformationReferences: refs,
    verificationStatus:
      verificationStatus === 'VERIFIED' ||
      verificationStatus === 'SUSPICIOUS' ||
      verificationStatus === 'FLAGGED'
        ? verificationStatus
        : 'UNVERIFIED',
    notes: typeof notes === 'string' ? notes.trim() : '',
  });

  dbStore.addAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    actorRole: 'ADMIN',
    isDemo,
    action: 'COMPANY_RECORD_CREATED',
    targetType: 'Company',
    targetId: created.id,
    metadata: { companyName: created.companyName, officialDomain: created.officialDomain },
  });

  res.status(201).json({ company: created });
});

router.patch('/companies/:id', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const updated = dbStore.updateCompany(req.params.id, req.body, isDemo);
  if (!updated) {
    res.status(404).json({ error: 'Company record not found.' });
    return;
  }
  dbStore.addAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    actorRole: 'ADMIN',
    isDemo,
    action: 'COMPANY_RECORD_UPDATED',
    targetType: 'Company',
    targetId: updated.id,
    metadata: { verificationStatus: updated.verificationStatus },
  });
  res.json({ company: updated });
});

router.get('/domains', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  res.json({ domains: dbStore.listDomains(isDemo) });
});

router.post('/domains', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const { domainName, indicatorType, threatStatus, severity, source, evidenceSummary } = req.body as Record<
    string,
    unknown
  >;
  if (typeof domainName !== 'string' || !domainName.trim() || typeof source !== 'string' || !source.trim()) {
    res.status(400).json({ error: 'Domain name and source are required.' });
    return;
  }
  const created = dbStore.upsertDomainIndicator({
    domainName: domainName.trim(),
    isDemo,
    indicatorType: typeof indicatorType === 'string' && indicatorType.trim() ? indicatorType.trim() : 'Phishing / Impersonation',
    threatStatus:
      threatStatus === 'CONFIRMED_THREAT' || threatStatus === 'SUSPICIOUS' || threatStatus === 'CLEARED'
        ? threatStatus
        : 'MONITORED',
    severity:
      severity === 'critical' || severity === 'high' || severity === 'medium' || severity === 'low'
        ? severity
        : undefined,
    source: source.trim(),
    evidenceSummary: typeof evidenceSummary === 'string' ? evidenceSummary.trim() : '',
  });

  dbStore.addAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    actorRole: 'ADMIN',
    isDemo,
    action: 'DOMAIN_INDICATOR_SAVED',
    targetType: 'Domain',
    targetId: created.id,
    metadata: { domainName: created.domainName, threatStatus: created.threatStatus },
  });

  res.status(201).json({ domain: created });
});

router.get('/evidence', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  res.json({ evidence: dbStore.listEvidenceRecords(isDemo) });
});

router.get('/audit-logs', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  res.json({ logs: dbStore.listAuditLogs(250, isDemo) });
});

router.get('/system-health', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const gemini = getGeminiIntegrationStatus();
  const dbHealth = getDatabaseHealth();
  const webRiskConfigured = Boolean(process.env.WEB_RISK_API_KEY?.trim());
  const firebaseCfg = getFirebaseAuthConfig();
  const googleOAuthConfigured = isGoogleAuthConfigured();

  if (isDemo) {
    const demoHealth: SystemHealthStatus = {
      isDemoData: true,
      backend: {
        status: 'Connected',
        detail: 'DEMO DATA: Express REST API & security pipeline active in sandbox preview mode.',
      },
      database: {
        status: 'Connected',
        engine: dbHealth.engine,
        detail: `DEMO DATA: Isolated SQLite demo sandbox active alongside ${dbHealth.engine}.`,
      },
      gemini: {
        status: gemini.status,
        model: gemini.model,
        detail:
          gemini.status === 'Connected'
            ? 'DEMO DATA + Live API: Gemini analyzer connected; preloaded demo scans illustrate sample outputs.'
            : 'DEMO DATA: Preloaded Gemini analysis samples displayed (configure GEMINI_API_KEY for live inference).',
      },
      webRisk: {
        status: webRiskConfigured ? 'Connected' : 'Not Configured',
        detail: webRiskConfigured
          ? 'DEMO DATA: Web Risk inspection available alongside sandbox domain indicators.'
          : 'DEMO DATA: WEB_RISK_API_KEY not configured; sandbox demonstrates DNS, RDAP, TLS & local indicator checks.',
      },
      rdapDns: {
        status: 'Connected',
        detail: 'DEMO DATA: SSRF-hardened DNS, TLS & RDAP inspection service operational.',
      },
      ocr: {
        status: gemini.status,
        detail:
          gemini.status === 'Connected'
            ? 'DEMO DATA: PDF text parser & Gemini Vision OCR active.'
            : 'DEMO DATA: Sample screenshot OCR records shown; PDF parser active.',
      },
      googleOAuth: {
        status: googleOAuthConfigured ? 'Connected' : 'Not Configured',
        detail: firebaseCfg
          ? `DEMO DATA: Google OAuth active via Firebase Auth (${firebaseCfg.projectId}).`
          : 'DEMO DATA: Configure Google OAuth credentials for live Google Sign-In.',
      },
      notifications: {
        status: 'Connected',
        detail: 'DEMO DATA: In-app alert dispatcher active (12 sample alerts loaded in Citizen Demo).',
      },
      recentErrors: [
        {
          id: 'err_demo_1',
          service: 'WebRiskLookup (DEMO DATA)',
          message: 'Sample fallback notice: WEB_RISK_API_KEY optional variable unset; URL scanner fell back cleanly to local indicators + RDAP.',
          timestamp: new Date(Date.now() - 3600_000).toISOString(),
        },
        {
          id: 'err_demo_2',
          service: 'RdapLookup (DEMO DATA)',
          message: 'Sample notice: .example IANA-reserved test hostnames have no public registrar RDAP record.',
          timestamp: new Date(Date.now() - 7200_000).toISOString(),
        },
      ],
    };
    res.json({ health: demoHealth });
    return;
  }

  const health: SystemHealthStatus = {
    isDemoData: false,
    backend: {
      status: 'Connected',
      detail: 'Express REST API & security pipeline operational.',
    },
    database: dbHealth,
    gemini,
    webRisk: {
      status: webRiskConfigured ? 'Connected' : 'Not Configured',
      detail: webRiskConfigured
        ? 'Google Web Risk API key configured on server.'
        : 'WEB_RISK_API_KEY not configured. URL scans still run DNS, RDAP, TLS, and local threat-indicator checks.',
    },
    rdapDns: {
      status: 'Connected',
      detail: 'Node DNS resolver and ICANN RDAP lookup service active with SSRF protections.',
    },
    ocr: {
      status: gemini.status,
      detail:
        gemini.status === 'Connected'
          ? 'Gemini Vision OCR & PDF text extraction active.'
          : 'PDF text extraction active; image OCR requires GEMINI_API_KEY.',
    },
    googleOAuth: {
      status: googleOAuthConfigured ? 'Connected' : 'Not Configured',
      detail: firebaseCfg
        ? `Firebase Google Authentication active (project: ${firebaseCfg.projectId}).`
        : googleOAuthConfigured
        ? 'GOOGLE_CLIENT_ID configured for backend token verification.'
        : 'Google Sign-In not configured. Email/password authentication is active.',
    },
    notifications: {
      status: 'Connected',
      detail: 'In-app security notification stream active.',
    },
    recentErrors: dbStore.listSystemErrors(),
  };

  res.json({ health });
});

function settingKey(key: string, isDemo: boolean): string {
  return isDemo ? `demo:${key}` : key;
}

router.get('/settings', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  res.json({
    settings: {
      requireEmailVerificationNotice:
        dbStore.getSetting(settingKey('requireEmailVerificationNotice', isDemo)) !== 'false',
      maxUploadSizeMb: 5,
      allowCommunitySubmissions:
        dbStore.getSetting(settingKey('allowCommunitySubmissions', isDemo)) !== 'false',
      autoPromoteConfirmedDomains:
        dbStore.getSetting(settingKey('autoPromoteConfirmedDomains', isDemo)) !== 'false',
      highRiskAlertThreshold: Number(
        dbStore.getSetting(settingKey('highRiskAlertThreshold', isDemo)) || '70'
      ),
      dataRetentionDays: Number(
        dbStore.getSetting(settingKey('dataRetentionDays', isDemo)) || '90'
      ),
      enableOcrPipeline: dbStore.getSetting(settingKey('enableOcrPipeline', isDemo)) !== 'false',
    },
  });
});

router.patch('/settings', (req: AuthenticatedRequest, res) => {
  const isDemo = Boolean(req.authUser!.isDemo);
  const {
    requireEmailVerificationNotice,
    allowCommunitySubmissions,
    autoPromoteConfirmedDomains,
    highRiskAlertThreshold,
    dataRetentionDays,
    enableOcrPipeline,
  } = req.body as Record<string, unknown>;

  if (typeof requireEmailVerificationNotice === 'boolean') {
    dbStore.setSetting(
      settingKey('requireEmailVerificationNotice', isDemo),
      String(requireEmailVerificationNotice)
    );
  }
  if (typeof allowCommunitySubmissions === 'boolean') {
    dbStore.setSetting(
      settingKey('allowCommunitySubmissions', isDemo),
      String(allowCommunitySubmissions)
    );
  }
  if (typeof autoPromoteConfirmedDomains === 'boolean') {
    dbStore.setSetting(
      settingKey('autoPromoteConfirmedDomains', isDemo),
      String(autoPromoteConfirmedDomains)
    );
  }
  if (typeof highRiskAlertThreshold === 'number' && highRiskAlertThreshold >= 40 && highRiskAlertThreshold <= 95) {
    dbStore.setSetting(settingKey('highRiskAlertThreshold', isDemo), String(highRiskAlertThreshold));
  }
  if (typeof dataRetentionDays === 'number' && dataRetentionDays >= 30 && dataRetentionDays <= 365) {
    dbStore.setSetting(settingKey('dataRetentionDays', isDemo), String(dataRetentionDays));
  }
  if (typeof enableOcrPipeline === 'boolean') {
    dbStore.setSetting(settingKey('enableOcrPipeline', isDemo), String(enableOcrPipeline));
  }

  dbStore.addAuditLog({
    actorId: req.authUser!.id,
    actorEmail: req.authUser!.email,
    actorRole: 'ADMIN',
    isDemo,
    action: 'ADMIN_SETTINGS_UPDATED',
    targetType: 'PlatformSettings',
    targetId: isDemo ? 'demo' : 'global',
    metadata: {
      requireEmailVerificationNotice,
      allowCommunitySubmissions,
      autoPromoteConfirmedDomains,
      highRiskAlertThreshold,
      dataRetentionDays,
      enableOcrPipeline,
    },
  });
  res.json({ ok: true });
});

export default router;
