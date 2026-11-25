import { dbStore } from './store';
import { hashPassword } from '../services/auth/authService';
import {
  buildCitizenDemoScans,
  buildDemoCommunityReports,
  buildSecondaryDemoScans,
  buildSecondaryDemoStudents,
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_ID,
  DEMO_CITIZEN_EMAIL,
  DEMO_CITIZEN_ID,
  DEMO_COMPANIES,
  DEMO_DOMAINS,
  daysAgo,
} from './demoDataset';

export { DEMO_ADMIN_EMAIL, DEMO_ADMIN_ID, DEMO_CITIZEN_EMAIL, DEMO_CITIZEN_ID };

export function seedDemoData(forceReset = false): void {
  const existingCitizen = dbStore.findUserById(DEMO_CITIZEN_ID);
  const existingAdmin = dbStore.findUserById(DEMO_ADMIN_ID);

  if (
    !forceReset &&
    existingCitizen?.email === DEMO_CITIZEN_EMAIL &&
    existingAdmin?.email === DEMO_ADMIN_EMAIL &&
    dbStore.listScansByUser(DEMO_CITIZEN_ID).length === 24 &&
    dbStore.listUsers(true).length >= 120 &&
    dbStore.listAllScans(true).length >= 460 &&
    dbStore.listReports({ isDemo: true }).length >= 38
  ) {
    return;
  }

  dbStore.runInTransaction(() => {
    dbStore.clearDemoData();

    const citizenPasswordHash = hashPassword('DemoCitizen#2026');
    const adminPasswordHash = hashPassword('DemoAdmin#2026!');
    const studentSampleHash = hashPassword('DemoSample#2026');

    // 1. Primary Demo Citizen & Demo Administrator + 118 Demo Students = 120 Demo Users
    const citizenDemo = dbStore.createUser({
      id: DEMO_CITIZEN_ID,
      name: 'Aarav Kulkarni',
      email: DEMO_CITIZEN_EMAIL,
      passwordHash: citizenPasswordHash,
      role: 'STUDENT',
      authProvider: 'LOCAL',
      emailVerified: true,
      isDemo: true,
      college: 'Pune Institute of Engineering & Technology',
      createdAt: daysAgo(13, 9, 10),
    });

    const adminDemo = dbStore.createUser({
      id: DEMO_ADMIN_ID,
      name: 'JobShield Administrator',
      email: DEMO_ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      authProvider: 'LOCAL',
      emailVerified: true,
      isDemo: true,
      college: 'JOBSHIELD Security Operations',
      createdAt: daysAgo(14, 8, 0),
    });

    const secondaryStudents = buildSecondaryDemoStudents();
    for (const s of secondaryStudents) {
      dbStore.createUser({
        id: s.id,
        name: s.name,
        email: s.email,
        passwordHash: s.authProvider === 'LOCAL' ? studentSampleHash : null,
        role: 'STUDENT',
        authProvider: s.authProvider,
        emailVerified: s.emailVerified,
        accountStatus: s.accountStatus,
        isDemo: true,
        college: s.college,
        createdAt: s.createdAt,
      });
    }

    // 2. 12 Demo Company Records
    for (const cmp of DEMO_COMPANIES) {
      dbStore.createCompany({
        id: cmp.id,
        isDemo: true,
        companyName: cmp.companyName,
        officialDomain: cmp.officialDomain,
        industry: cmp.industry,
        website: cmp.website,
        relatedRecruiters: cmp.relatedRecruiters,
        relatedOpportunities: cmp.relatedOpportunities,
        publicInformationReferences: cmp.publicInformationReferences,
        verificationStatus: cmp.verificationStatus,
        notes: cmp.notes,
        lastReviewedAt: daysAgo(cmp.daysAgoReviewed, 11, 20),
      });
    }

    // 3. 38 Community Reports (12 UNDER_REVIEW, 18 CONFIRMED, 4 CORROBORATED, 4 REJECTED; 5 by Citizen Demo)
    const reportSeeds = buildDemoCommunityReports();
    const seenDuplicates = new Map<string, string>();
    for (const rep of reportSeeds) {
      const dedupKey = `${rep.category}::${rep.url.toLowerCase()}`;
      const existingDup = seenDuplicates.get(dedupKey) || null;
      dbStore.createReport({
        id: rep.id,
        reporterId: rep.reporterId,
        relatedScanId: rep.relatedScanId,
        isDemo: true,
        category: rep.category,
        companyName: rep.companyName,
        url: rep.url,
        recruiterInfo: rep.recruiterInfo,
        description: rep.description,
        incidentDate: daysAgo(rep.daysAgoCreated).slice(0, 10),
        evidenceSummary: rep.evidenceSummary,
        moneyRequested: rep.moneyRequested,
        moneyPaid: rep.moneyPaid,
        additionalNotes: 'DEMO DATA: Interconnected community report for presentation sandbox.',
        moderationStatus: rep.moderationStatus,
        moderationNotes: rep.moderationNotes,
        duplicateOfId: existingDup,
        skipDuplicateLookup: true,
        createdAt: daysAgo(rep.daysAgoCreated, 13, 30),
      });
      if (!existingDup) {
        seenDuplicates.set(dedupKey, rep.id);
      }
    }

    // 4. 16 Domain Threat Indicators
    for (const dom of DEMO_DOMAINS) {
      dbStore.upsertDomainIndicator({
        id: dom.id,
        isDemo: true,
        domainName: dom.domainName,
        relatedCompanyId: dom.relatedCompanyId,
        indicatorType: dom.indicatorType,
        threatStatus: dom.threatStatus,
        severity: dom.severity,
        firstDetectedAt: daysAgo(dom.daysAgoDetected, 9, 0),
        source: dom.source,
        evidenceSummary: dom.evidenceSummary,
        relatedReportId: dom.relatedReportId,
        lastCheckedAt: daysAgo(dom.daysAgoChecked, 15, 0),
      });
    }

    // 5. 460 Total Scans (24 Citizen Demo + 436 across 118 Demo Students)
    const citizenScans = buildCitizenDemoScans();
    const secondaryScans = buildSecondaryDemoScans(secondaryStudents);
    for (const scn of [...citizenScans, ...secondaryScans]) {
      const ts = daysAgo(scn.daysAgo, scn.hours, 20);
      dbStore.createScan({
        id: scn.id,
        userId: scn.userId,
        isDemo: true,
        scanName: scn.scanName,
        scanType: scn.scanType,
        inputReference: scn.inputReference,
        extractedInformation: scn.extractedInformation,
        findings: scn.findings,
        positiveObservations: scn.positiveObservations,
        contradictions: scn.contradictions,
        missingInformation: scn.missingInformation,
        recommendations: scn.recommendations,
        riskScore: scn.riskScore,
        riskCategory: scn.riskCategory,
        evidenceConfidence: scn.evidenceConfidence,
        processingStatus: 'COMPLETED',
        disclaimer:
          scn.riskCategory === 'LOWER_RISK'
            ? 'DEMO DATA: Lower Risk reflects fewer detected red flags, not a guarantee of authenticity.'
            : 'DEMO DATA: Risk assessment generated inside the isolated JOBSHIELD demo sandbox.',
        aiStatus: 'Connected',
        saved: scn.saved,
        savedAt: scn.saved ? ts : null,
        createdAt: ts,
      });
    }

    // 6. 24 Evidence Records
    const evidenceSeeds = [
      { relatedScanId: 'scn_demo_citizen_01', entityType: 'offer_letter', evidenceType: 'Advance Fee Demand', source: 'Payment Red-Flag Rule Engine', finding: 'DEMO DATA: Offer letter requests Rs. 2,499 UPI onboarding deposit.', confidence: 'high' as const, days: 1 },
      { relatedScanId: 'scn_demo_citizen_01', entityType: 'domain', evidenceType: 'Company Domain Mismatch', source: 'Company Consistency Engine', finding: 'DEMO DATA: apex-careers-onboarding.example conflicts with official apex-finserve.example.', confidence: 'high' as const, days: 1 },
      { relatedScanId: 'scn_demo_citizen_02', entityType: 'offer_letter', evidenceType: 'Lookalike Offer Portal', source: 'Threat Intelligence Feed', finding: 'DEMO DATA: apex-onboarding.example flagged for issuing zero-interview offers.', confidence: 'high' as const, days: 3 },
      { relatedScanId: 'scn_demo_citizen_03', entityType: 'email', evidenceType: 'Consumer Webmail Mismatch', source: 'Header & Sender Validator', finding: 'DEMO DATA: Priya Nair communicated via @gmail.com instead of cloudpeak-analytics.example.', confidence: 'medium' as const, days: 4 },
      { relatedScanId: 'scn_demo_citizen_04', entityType: 'offer_letter', evidenceType: 'Official Domain Alignment', source: 'JOBSHIELD Company Directory', finding: 'DEMO DATA: campus-hiring@veridian-systems.example matches verified campus partner.', confidence: 'high' as const, days: 6 },
      { relatedScanId: 'scn_demo_citizen_06', entityType: 'email', evidenceType: 'SPF/DKIM Failure', source: 'Email Authentication Parser', finding: 'DEMO DATA: spf=fail dmarc=fail detected on secure-careers-verify.example.', confidence: 'high' as const, days: 2 },
      { relatedScanId: 'scn_demo_citizen_07', entityType: 'email', evidenceType: 'Mandatory Slot Fee', source: 'Phishing Content Inspector', finding: 'DEMO DATA: Demands Rs. 1,450 verification slot fee within 4 hours.', confidence: 'high' as const, days: 4 },
      { relatedScanId: 'scn_demo_citizen_08', entityType: 'email', evidenceType: 'Paid Training Claim', source: 'Recruiter Domain Validator', finding: 'DEMO DATA: Outlook sender linked to TechSprint paid certification kit.', confidence: 'medium' as const, days: 5 },
      { relatedScanId: 'scn_demo_citizen_09', entityType: 'email', evidenceType: 'Premature KYC Form', source: 'Privacy Boundary Rule', finding: 'DEMO DATA: Google Form requests Aadhaar and PAN copies before interview.', confidence: 'medium' as const, days: 7 },
      { relatedScanId: 'scn_demo_citizen_10', entityType: 'email', evidenceType: 'DKIM Pass Verification', source: 'Email Header Inspector', finding: 'DEMO DATA: Validated SPF/DKIM alignment for northstar-labs.example.', confidence: 'high' as const, days: 8 },
      { relatedScanId: 'scn_demo_citizen_11', entityType: 'url', evidenceType: 'Unencrypted UPI Checkout', source: 'URL Security Pipeline', finding: 'DEMO DATA: HTTP-only URL pay-onboarding-portal.example matches confirmed threat dom_demo_4.', confidence: 'high' as const, days: 2 },
      { relatedScanId: 'scn_demo_citizen_12', entityType: 'url', evidenceType: 'KYC Harvesting Portal', source: 'Community Threat Correlation', finding: 'DEMO DATA: globalhire-urgent-offer.example flagged for upfront Aadhaar and bank cheque form.', confidence: 'medium' as const, days: 3 },
      { relatedScanId: 'scn_demo_citizen_13', entityType: 'url', evidenceType: 'Credential Phishing Prompt', source: 'URL Phishing Heuristics', finding: 'DEMO DATA: campus-hr-shortlist.example requests personal email login without company identity.', confidence: 'medium' as const, days: 5 },
      { relatedScanId: 'scn_demo_citizen_16', entityType: 'job_description', evidenceType: 'Prepaid Task Escalation', source: 'Scam Pattern Analyzer', finding: 'DEMO DATA: QuickEarn post demands Rs. 5,000 merchant recharge to unlock withdrawals.', confidence: 'high' as const, days: 2 },
      { relatedScanId: 'scn_demo_citizen_18', entityType: 'job_description', evidenceType: 'Contract Penalty Clause', source: 'Job Scam Pattern Engine', finding: 'DEMO DATA: DailyType PDF typing post embeds Rs. 1,800 fee and accuracy fines.', confidence: 'medium' as const, days: 6 },
      { relatedScanId: 'scn_demo_citizen_21', entityType: 'screenshot', evidenceType: 'Telegram Chat OCR', source: 'OCR & Chat Fraud Detector', finding: 'DEMO DATA: Extracted text confirms Rs. 1,500 VIP task activation deposit.', confidence: 'high' as const, days: 1 },
      { relatedScanId: 'scn_demo_citizen_22', entityType: 'screenshot', evidenceType: 'WhatsApp Fee Guarantee', source: 'OCR & Scam Content Analyzer', finding: 'DEMO DATA: Chat promises guaranteed internship upon paying Rs. 1,450 kit fee.', confidence: 'medium' as const, days: 3 },
      { relatedScanId: 'scn_demo_citizen_23', entityType: 'screenshot', evidenceType: 'Mega Drive Pass Poster', source: 'OCR & Drive Verification Check', finding: 'DEMO DATA: Poster collects Rs. 799 priority pass fee via personal UPI QR.', confidence: 'medium' as const, days: 7 },
      { relatedReportId: 'rep_demo_1', entityType: 'community_report', evidenceType: 'Registration Fee Scams', source: 'Demo Moderator Review', finding: 'DEMO DATA: Confirmed lookalike Apex FinServe deposit scam report.', confidence: 'high' as const, days: 5 },
      { relatedReportId: 'rep_demo_2', entityType: 'community_report', evidenceType: 'Telegram Task Scams', source: 'Demo Moderator Review', finding: 'DEMO DATA: Confirmed QuickEarn prepaid Telegram merchant recharge trap.', confidence: 'high' as const, days: 4 },
      { relatedReportId: 'rep_demo_3', entityType: 'community_report', evidenceType: 'Fake Recruitment Websites', source: 'Demo Moderator Review', finding: 'DEMO DATA: Corroborated KYC harvesting portal globalhire-urgent-offer.example.', confidence: 'medium' as const, days: 3 },
      { relatedReportId: 'rep_demo_7', entityType: 'community_report', evidenceType: 'Fake Job Offers', source: 'Demo Moderator Review', finding: 'DEMO DATA: Confirmed unsolicited offer letter campaign on apex-onboarding.example.', confidence: 'high' as const, days: 2 },
      { relatedReportId: 'rep_demo_11', entityType: 'community_report', evidenceType: 'Fake Placement Drives', source: 'Demo Moderator Review', finding: 'DEMO DATA: Confirmed fake off-campus drive pass fee scheme megadrive-2026-pass.example.', confidence: 'high' as const, days: 2 },
      { relatedReportId: 'rep_demo_12', entityType: 'community_report', evidenceType: 'Other Recruitment Fraud', source: 'Demo Moderator Review', finding: 'DEMO DATA: Corroborated intimidation penalty notice linked to fasttrack-intern-kit.example.', confidence: 'medium' as const, days: 1 },
    ];
    for (const ev of evidenceSeeds) {
      dbStore.addEvidenceRecord({
        isDemo: true,
        relatedScanId: ev.relatedScanId,
        relatedReportId: ev.relatedReportId,
        entityType: ev.entityType,
        evidenceType: ev.evidenceType,
        source: ev.source,
        finding: ev.finding,
        confidence: ev.confidence,
        timestamp: daysAgo(ev.days, 12, 0),
      });
    }

    // 7. 34 Demo Audit Logs across user governance, moderation, records, settings, and logins
    const auditSeeds: Array<{
      actorId: string;
      actorEmail: string;
      actorRole: string;
      action: string;
      targetType: string;
      targetId: string;
      metadata: Record<string, unknown>;
      days: number;
      hours: number;
    }> = [
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'DEMO_SANDBOX_INITIALIZED', targetType: 'System', targetId: 'demo_sandbox', metadata: { seededUsers: 120, seededScans: 460, seededReports: 38, seededCompanies: 12, seededDomains: 16 }, days: 0, hours: 8 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'ADMIN_LOGIN_DEMO', targetType: 'Session', targetId: adminDemo.id, metadata: { role: 'ADMIN' }, days: 0, hours: 9 },
      { actorId: citizenDemo.id, actorEmail: citizenDemo.email, actorRole: 'STUDENT', action: 'CITIZEN_LOGIN_DEMO', targetType: 'Session', targetId: citizenDemo.id, metadata: { role: 'STUDENT' }, days: 0, hours: 10 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'REPORT_CONFIRMED', targetType: 'ThreatReport', targetId: 'rep_demo_1', metadata: { promotedDomain: 'apex-careers-onboarding.example' }, days: 1, hours: 11 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'REPORT_CONFIRMED', targetType: 'ThreatReport', targetId: 'rep_demo_2', metadata: { promotedDomain: 'quickearn-tasks.example' }, days: 1, hours: 13 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'REPORT_CONFIRMED', targetType: 'ThreatReport', targetId: 'rep_demo_7', metadata: { promotedDomain: 'apex-onboarding.example' }, days: 2, hours: 10 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'REPORT_CONFIRMED', targetType: 'ThreatReport', targetId: 'rep_demo_9', metadata: { promotedDomain: 'pay-onboarding-portal.example' }, days: 2, hours: 14 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'REPORT_CONFIRMED', targetType: 'ThreatReport', targetId: 'rep_demo_10', metadata: { promotedDomain: 'secure-careers-verify.example' }, days: 2, hours: 16 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'REPORT_CONFIRMED', targetType: 'ThreatReport', targetId: 'rep_demo_11', metadata: { promotedDomain: 'megadrive-2026-pass.example' }, days: 3, hours: 9 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'REPORT_CORROBORATED', targetType: 'ThreatReport', targetId: 'rep_demo_3', metadata: { domain: 'globalhire-urgent-offer.example' }, days: 3, hours: 12 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'REPORT_CORROBORATED', targetType: 'ThreatReport', targetId: 'rep_demo_8', metadata: { domain: 'dailytype-remote.example' }, days: 3, hours: 15 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'REPORT_CORROBORATED', targetType: 'ThreatReport', targetId: 'rep_demo_12', metadata: { domain: 'fasttrack-intern-kit.example' }, days: 4, hours: 10 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'REPORT_REJECTED', targetType: 'ThreatReport', targetId: 'rep_demo_6', metadata: { reason: 'Verified official Veridian campus schedule' }, days: 4, hours: 14 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'REPORT_REJECTED', targetType: 'ThreatReport', targetId: 'rep_demo_19', metadata: { reason: 'Confirmed official Northstar Labs careers portal' }, days: 5, hours: 11 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'USER_SUSPENDED', targetType: 'User', targetId: 'usr_demo_student_004', metadata: { reason: 'DEMO DATA: Repeated fabricated spam submissions' }, days: 5, hours: 15 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'USER_SUSPENDED', targetType: 'User', targetId: 'usr_demo_student_029', metadata: { reason: 'DEMO DATA: Automated scraping anomalies detected' }, days: 6, hours: 12 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'USER_SUSPENDED', targetType: 'User', targetId: 'usr_demo_student_053', metadata: { reason: 'DEMO DATA: Abusive community report payload' }, days: 6, hours: 16 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'USER_ACTIVE', targetType: 'User', targetId: 'usr_demo_student_018', metadata: { reason: 'DEMO DATA: Verification completed after password reset' }, days: 7, hours: 10 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'COMPANY_RECORD_CREATED', targetType: 'Company', targetId: 'cmp_demo_veridian', metadata: { officialDomain: 'veridian-systems.example' }, days: 7, hours: 14 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'COMPANY_RECORD_CREATED', targetType: 'Company', targetId: 'cmp_demo_apex', metadata: { officialDomain: 'apex-finserve.example' }, days: 8, hours: 11 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'COMPANY_RECORD_UPDATED', targetType: 'Company', targetId: 'cmp_demo_techsprint', metadata: { verificationStatus: 'SUSPICIOUS' }, days: 8, hours: 15 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'COMPANY_RECORD_UPDATED', targetType: 'Company', targetId: 'cmp_demo_quickearn', metadata: { verificationStatus: 'FLAGGED' }, days: 9, hours: 10 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'DOMAIN_INDICATOR_SAVED', targetType: 'Domain', targetId: 'dom_demo_1', metadata: { domainName: 'apex-careers-onboarding.example', threatStatus: 'CONFIRMED_THREAT' }, days: 9, hours: 13 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'DOMAIN_INDICATOR_SAVED', targetType: 'Domain', targetId: 'dom_demo_2', metadata: { domainName: 'quickearn-tasks.example', threatStatus: 'CONFIRMED_THREAT' }, days: 10, hours: 9 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'DOMAIN_INDICATOR_SAVED', targetType: 'Domain', targetId: 'dom_demo_4', metadata: { domainName: 'pay-onboarding-portal.example', threatStatus: 'CONFIRMED_THREAT' }, days: 10, hours: 14 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'DOMAIN_INDICATOR_SAVED', targetType: 'Domain', targetId: 'dom_demo_7', metadata: { domainName: 'globalhire-urgent-offer.example', threatStatus: 'SUSPICIOUS' }, days: 11, hours: 11 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'ADMIN_SETTINGS_UPDATED', targetType: 'PlatformSettings', targetId: 'demo', metadata: { allowCommunitySubmissions: true, autoPromoteConfirmedDomains: true }, days: 11, hours: 16 },
      { actorId: citizenDemo.id, actorEmail: citizenDemo.email, actorRole: 'STUDENT', action: 'COMMUNITY_REPORT_SUBMITTED', targetType: 'ThreatReport', targetId: 'rep_demo_1', metadata: { category: 'Registration Fee Scams' }, days: 12, hours: 10 },
      { actorId: citizenDemo.id, actorEmail: citizenDemo.email, actorRole: 'STUDENT', action: 'COMMUNITY_REPORT_SUBMITTED', targetType: 'ThreatReport', targetId: 'rep_demo_4', metadata: { category: 'Fake Internships' }, days: 12, hours: 13 },
      { actorId: citizenDemo.id, actorEmail: citizenDemo.email, actorRole: 'STUDENT', action: 'COMMUNITY_REPORT_SUBMITTED', targetType: 'ThreatReport', targetId: 'rep_demo_7', metadata: { category: 'Fake Job Offers' }, days: 12, hours: 17 },
      { actorId: citizenDemo.id, actorEmail: citizenDemo.email, actorRole: 'STUDENT', action: 'COMMUNITY_REPORT_SUBMITTED', targetType: 'ThreatReport', targetId: 'rep_demo_12', metadata: { category: 'Other Recruitment Fraud' }, days: 13, hours: 11 },
      { actorId: citizenDemo.id, actorEmail: citizenDemo.email, actorRole: 'STUDENT', action: 'COMMUNITY_REPORT_SUBMITTED', targetType: 'ThreatReport', targetId: 'rep_demo_19', metadata: { category: 'Suspicious Emails' }, days: 13, hours: 14 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'REPORT_CONFIRMED', targetType: 'ThreatReport', targetId: 'rep_demo_13', metadata: { category: 'Registration Fee Scams' }, days: 13, hours: 16 },
      { actorId: adminDemo.id, actorEmail: adminDemo.email, actorRole: 'ADMIN', action: 'REPORT_CONFIRMED', targetType: 'ThreatReport', targetId: 'rep_demo_14', metadata: { category: 'Telegram Task Scams' }, days: 14, hours: 10 },
    ];
    for (const log of auditSeeds) {
      dbStore.addAuditLog({
        actorId: log.actorId,
        actorEmail: log.actorEmail,
        actorRole: log.actorRole,
        isDemo: true,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        metadata: log.metadata,
        timestamp: daysAgo(log.days, log.hours, 15),
      });
    }

    // 8. 12 Citizen Notifications
    const citizenNotifications: Array<{
      type: 'high_risk' | 'community_update' | 'scan_completed' | 'security_event';
      title: string;
      message: string;
      link: string;
      read: boolean;
      days: number;
      hours: number;
    }> = [
      {
        type: 'high_risk',
        title: 'High-Risk Alert: Apex FinServe Analyst Offer Letter (Demo)',
        message: 'DEMO DATA: Risk score 86/100 — Rs. 2,499 UPI deposit demand and lookalike domain detected.',
        link: '/student/reports/scn_demo_citizen_01',
        read: false,
        days: 0,
        hours: 11,
      },
      {
        type: 'high_risk',
        title: 'High-Risk Alert: Telegram VIP Task Activation Deposit (Demo)',
        message: 'DEMO DATA: OCR extracted prepaid recharge request (Rs. 1,500) matching confirmed Telegram scam.',
        link: '/student/reports/scn_demo_citizen_21',
        read: false,
        days: 0,
        hours: 9,
      },
      {
        type: 'community_update',
        title: 'Community Report Confirmed: apex-careers-onboarding.example',
        message: 'DEMO DATA: Your report rep_demo_1 was confirmed by moderation and promoted to Threat Indicators.',
        link: '/student/community?tab=mine&reportId=rep_demo_1',
        read: false,
        days: 1,
        hours: 15,
      },
      {
        type: 'high_risk',
        title: 'Suspicious URL Flagged: pay-onboarding-portal.example',
        message: 'DEMO DATA: Unencrypted HTTP UPI payment link detected in URL Scanner (84/100 High Risk).',
        link: '/student/reports/scn_demo_citizen_11',
        read: false,
        days: 2,
        hours: 16,
      },
      {
        type: 'community_update',
        title: 'Community Report Confirmed: Fake Offer Portal (rep_demo_7)',
        message: 'DEMO DATA: Moderation confirmed apex-onboarding.example lookalike offer distribution.',
        link: '/student/community?tab=mine&reportId=rep_demo_7',
        read: false,
        days: 2,
        hours: 12,
      },
      {
        type: 'scan_completed',
        title: 'Scan Completed: JD Part-Time App Rating (Demo)',
        message: 'DEMO DATA: Classified High Risk (89/100) — Prepaid merchant recharge escalation detected.',
        link: '/student/reports/scn_demo_citizen_16',
        read: true,
        days: 3,
        hours: 14,
      },
      {
        type: 'community_update',
        title: 'Community Report Corroborated: Penalty Data Entry (rep_demo_12)',
        message: 'DEMO DATA: Your report matches independent student submissions and is corroborated for blocking.',
        link: '/student/community?tab=mine&reportId=rep_demo_12',
        read: true,
        days: 4,
        hours: 11,
      },
      {
        type: 'scan_completed',
        title: 'Saved Report Reminder: Review Unverified CloudPeak Subdomain',
        message: 'DEMO DATA: You saved 9 security reports across all 5 scanners for quick placement verification.',
        link: '/student/saved',
        read: true,
        days: 5,
        hours: 10,
      },
      {
        type: 'scan_completed',
        title: 'Email Scan Lower Risk: Northstar Labs Technical Round',
        message: 'DEMO DATA: SPF/DKIM aligned with official northstar-labs.example domain (14/100 Lower Risk).',
        link: '/student/reports/scn_demo_citizen_10',
        read: true,
        days: 6,
        hours: 13,
      },
      {
        type: 'security_event',
        title: 'Safety Reminder: Never Share Aadhaar/PAN Before Verification',
        message: 'DEMO DATA: Review the Document Sharing Risks & India 1930 helpline guide in User Protection Centre.',
        link: '/student/protection',
        read: true,
        days: 7,
        hours: 9,
      },
      {
        type: 'community_update',
        title: 'Report Under Review: TechSprint Certification Kit (rep_demo_4)',
        message: 'DEMO DATA: Moderation is verifying the Rs. 1,450 paid internship kit checkout link.',
        link: '/student/community?tab=mine&reportId=rep_demo_4',
        read: true,
        days: 8,
        hours: 16,
      },
      {
        type: 'security_event',
        title: 'Citizen Demo Workspace Ready',
        message: 'DEMO DATA: Exploring Aarav Kulkarni isolated sandbox with 24 scans, 9 saved reports, and 5 community reports.',
        link: '/student/dashboard',
        read: true,
        days: 10,
        hours: 8,
      },
    ];

    for (const n of citizenNotifications) {
      dbStore.addNotification({
        userId: citizenDemo.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        read: n.read,
        createdAt: daysAgo(n.days, n.hours, 10),
      });
    }

    // 9. Citizen Checklist Progress (4 pre-checked items)
    dbStore.saveChecklist(citizenDemo.id, [
      'verify_website',
      'compare_email_domain',
      'watch_unusual_fees',
      'avoid_unnecessary_pii',
    ]);

    // 10. Isolated Demo Sandbox Platform Settings
    dbStore.setSetting('demo:requireEmailVerificationNotice', 'true');
    dbStore.setSetting('demo:allowCommunitySubmissions', 'true');
    dbStore.setSetting('demo:autoPromoteConfirmedDomains', 'true');
    dbStore.setSetting('demo:highRiskAlertThreshold', '70');
    dbStore.setSetting('demo:dataRetentionDays', '90');
    dbStore.setSetting('demo:enableOcrPipeline', 'true');
  });
}
