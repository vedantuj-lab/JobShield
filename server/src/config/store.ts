import Database from 'better-sqlite3';
import crypto from 'crypto';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import type {
  AccountStatus,
  AuditLogRecord,
  AuthProvider,
  AuthUser,
  CommunityReport,
  CompanyRecord,
  DomainIndicator,
  EvidenceRecord,
  IntegrationState,
  NotificationRecord,
  ReportModerationStatus,
  ScanRecord,
  UserRole,
} from '../../../src/types/jobshield';

const DATA_DIR = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'jobshield.db');
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL CHECK(role IN ('STUDENT', 'ADMIN')),
    account_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(account_status IN ('ACTIVE', 'SUSPENDED')),
    auth_provider TEXT NOT NULL DEFAULT 'LOCAL' CHECK(auth_provider IN ('LOCAL', 'GOOGLE')),
    email_verified INTEGER NOT NULL DEFAULT 0,
    is_demo INTEGER NOT NULL DEFAULT 0,
    college TEXT DEFAULT '',
    notification_prefs TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  CREATE TABLE IF NOT EXISTS sessions (
    jti TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS email_verifications (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 0,
    scan_name TEXT NOT NULL,
    scan_type TEXT NOT NULL,
    input_reference TEXT NOT NULL,
    extracted_information TEXT NOT NULL,
    findings TEXT NOT NULL,
    positive_observations TEXT NOT NULL,
    contradictions TEXT NOT NULL,
    missing_information TEXT NOT NULL,
    recommendations TEXT NOT NULL,
    risk_score INTEGER,
    risk_category TEXT NOT NULL,
    evidence_confidence TEXT NOT NULL,
    processing_status TEXT NOT NULL,
    disclaimer TEXT NOT NULL,
    ai_status TEXT NOT NULL,
    saved INTEGER NOT NULL DEFAULT 0,
    saved_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_scans_owner_date ON scans(user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    is_demo INTEGER NOT NULL DEFAULT 0,
    company_name TEXT NOT NULL,
    official_domain TEXT NOT NULL,
    public_information_references TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    notes TEXT DEFAULT '',
    last_reviewed_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name);

  CREATE TABLE IF NOT EXISTS domains (
    id TEXT PRIMARY KEY,
    is_demo INTEGER NOT NULL DEFAULT 0,
    domain_name TEXT NOT NULL UNIQUE,
    related_company_id TEXT,
    indicator_type TEXT NOT NULL,
    threat_status TEXT NOT NULL,
    source TEXT NOT NULL,
    evidence_summary TEXT NOT NULL,
    related_report_id TEXT,
    last_checked_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(domain_name);

  CREATE TABLE IF NOT EXISTS threat_reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    company_name TEXT DEFAULT '',
    url TEXT DEFAULT '',
    recruiter_info TEXT DEFAULT '',
    description TEXT NOT NULL,
    incident_date TEXT NOT NULL,
    evidence_summary TEXT DEFAULT '',
    money_requested INTEGER NOT NULL DEFAULT 0,
    money_paid INTEGER NOT NULL DEFAULT 0,
    additional_notes TEXT DEFAULT '',
    moderation_status TEXT NOT NULL DEFAULT 'UNDER_REVIEW',
    moderation_notes TEXT DEFAULT '',
    duplicate_of_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(reporter_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_reports_status ON threat_reports(moderation_status, created_at DESC);

  CREATE TABLE IF NOT EXISTS evidence_records (
    id TEXT PRIMARY KEY,
    is_demo INTEGER NOT NULL DEFAULT 0,
    related_scan_id TEXT,
    related_report_id TEXT,
    entity_type TEXT NOT NULL,
    evidence_type TEXT NOT NULL,
    source TEXT NOT NULL,
    finding TEXT NOT NULL,
    confidence TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_evidence_scan ON evidence_records(related_scan_id);
  CREATE INDEX IF NOT EXISTS idx_evidence_report ON evidence_records(related_report_id);

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    is_demo INTEGER NOT NULL DEFAULT 0,
    actor_id TEXT NOT NULL,
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    metadata TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS checklist_progress (
    user_id TEXT PRIMARY KEY,
    completed_items TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS system_errors (
    id TEXT PRIMARY KEY,
    service TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

function ensureColumn(table: string, column: string, definition: string): void {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

for (const tbl of [
  'users',
  'scans',
  'companies',
  'domains',
  'threat_reports',
  'evidence_records',
  'audit_logs',
]) {
  ensureColumn(tbl, 'is_demo', 'INTEGER NOT NULL DEFAULT 0');
}

ensureColumn('companies', 'industry', "TEXT DEFAULT ''");
ensureColumn('companies', 'website', "TEXT DEFAULT ''");
ensureColumn('companies', 'related_recruiters', "TEXT DEFAULT '[]'");
ensureColumn('companies', 'related_opportunities', "TEXT DEFAULT '[]'");
ensureColumn('domains', 'severity', "TEXT DEFAULT 'medium'");
ensureColumn('domains', 'first_detected_at', "TEXT DEFAULT ''");
ensureColumn('threat_reports', 'related_scan_id', "TEXT DEFAULT ''");

let mongoState: { status: IntegrationState; detail: string } = {
  status: process.env.MONGODB_URI ? 'Unavailable' : 'Not Configured',
  detail: process.env.MONGODB_URI
    ? 'MONGODB_URI provided; attempting connection.'
    : 'MONGODB_URI is not set. Using local persistent SQLite database (.data/jobshield.db).',
};

export async function initDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    mongoState = {
      status: 'Not Configured',
      detail: 'MONGODB_URI is not configured. Operating with local persistent SQLite storage.',
    };
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    mongoState = {
      status: 'Connected',
      detail: 'Connected to configured MongoDB cluster.',
    };
  } catch (err) {
    mongoState = {
      status: 'Error',
      detail: `MongoDB connection failed (${err instanceof Error ? err.message : 'Unknown error'}). Using local persistent SQLite fallback.`,
    };
  }
}

export function getDatabaseHealth() {
  return {
    status: mongoState.status,
    engine: mongoState.status === 'Connected' ? 'MongoDB + SQLite Local Cache' : 'SQLite (.data/jobshield.db)',
    detail: mongoState.detail,
  };
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

export interface StoredUser extends AuthUser {
  passwordHash?: string | null;
}

function mapUserRow(row: Record<string, unknown>): StoredUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    passwordHash: row.password_hash ? String(row.password_hash) : null,
    role: row.role as UserRole,
    accountStatus: row.account_status as AccountStatus,
    authProvider: row.auth_provider as AuthProvider,
    emailVerified: Boolean(row.email_verified),
    isDemo: Boolean(row.is_demo),
    college: row.college ? String(row.college) : '',
    notificationPrefs: JSON.parse(String(row.notification_prefs)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapScanRow(row: Record<string, unknown>): ScanRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    isDemo: Boolean(row.is_demo),
    scanName: String(row.scan_name),
    scanType: row.scan_type as ScanRecord['scanType'],
    inputReference: String(row.input_reference),
    extractedInformation: JSON.parse(String(row.extracted_information)),
    findings: JSON.parse(String(row.findings)),
    positiveObservations: JSON.parse(String(row.positive_observations)),
    contradictions: JSON.parse(String(row.contradictions)),
    missingInformation: JSON.parse(String(row.missing_information)),
    recommendations: JSON.parse(String(row.recommendations)),
    riskScore: row.risk_score === null || row.risk_score === undefined ? null : Number(row.risk_score),
    riskCategory: row.risk_category as ScanRecord['riskCategory'],
    evidenceConfidence: row.evidence_confidence as ScanRecord['evidenceConfidence'],
    processingStatus: row.processing_status as ScanRecord['processingStatus'],
    disclaimer: String(row.disclaimer),
    aiStatus: row.ai_status as IntegrationState,
    saved: Boolean(row.saved),
    savedAt: row.saved_at ? String(row.saved_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapReportRow(row: Record<string, unknown>): CommunityReport {
  return {
    id: String(row.id),
    reporterId: String(row.reporter_id),
    relatedScanId: row.related_scan_id ? String(row.related_scan_id) : null,
    isDemo: Boolean(row.is_demo),
    category: String(row.category),
    companyName: row.company_name ? String(row.company_name) : '',
    url: row.url ? String(row.url) : '',
    recruiterInfo: row.recruiter_info ? String(row.recruiter_info) : '',
    description: String(row.description),
    incidentDate: String(row.incident_date),
    evidenceSummary: row.evidence_summary ? String(row.evidence_summary) : '',
    moneyRequested: Boolean(row.money_requested),
    moneyPaid: Boolean(row.money_paid),
    additionalNotes: row.additional_notes ? String(row.additional_notes) : '',
    moderationStatus: row.moderation_status as ReportModerationStatus,
    moderationNotes: row.moderation_notes ? String(row.moderation_notes) : '',
    duplicateOfId: row.duplicate_of_id ? String(row.duplicate_of_id) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function safeJsonParseArray(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export const dbStore = {
  runInTransaction<T>(fn: () => T): T {
    const tx = sqlite.transaction(fn);
    return tx();
  },
  // Users
  countAdmins(): number {
    // Only count real provisioned admins, never the isolated demo admin
    const row = sqlite
      .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'ADMIN' AND is_demo = 0")
      .get() as { cnt: number };
    return row.cnt;
  },

  findUserByEmail(email: string): StoredUser | null {
    const row = sqlite.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as
      | Record<string, unknown>
      | undefined;
    return row ? mapUserRow(row) : null;
  },

  findUserById(id: string): StoredUser | null {
    const row = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? mapUserRow(row) : null;
  },

  createUser(input: {
    id?: string;
    name: string;
    email: string;
    passwordHash?: string | null;
    role: UserRole;
    authProvider: AuthProvider;
    emailVerified: boolean;
    isDemo?: boolean;
    accountStatus?: AccountStatus;
    college?: string;
    createdAt?: string;
  }): StoredUser {
    const now = input.createdAt || new Date().toISOString();
    const id = input.id || generateId('usr');
    const prefs = JSON.stringify({
      scanCompleted: true,
      highRiskAlerts: true,
      communityUpdates: true,
      securityEvents: true,
    });
    sqlite
      .prepare(
        `INSERT INTO users (id, name, email, password_hash, role, account_status, auth_provider, email_verified, is_demo, college, notification_prefs, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.name.trim(),
        input.email.toLowerCase().trim(),
        input.passwordHash ?? null,
        input.role,
        input.accountStatus ?? 'ACTIVE',
        input.authProvider,
        input.emailVerified ? 1 : 0,
        input.isDemo ? 1 : 0,
        input.college?.trim() || '',
        prefs,
        now,
        now
      );
    return this.findUserById(id)!;
  },

  updateUserProfile(
    userId: string,
    updates: {
      name?: string;
      college?: string;
      notificationPrefs?: AuthUser['notificationPrefs'];
      passwordHash?: string;
      emailVerified?: boolean;
      accountStatus?: AccountStatus;
    }
  ): StoredUser | null {
    const existing = this.findUserById(userId);
    if (!existing) return null;
    const now = new Date().toISOString();
    sqlite
      .prepare(
        `UPDATE users SET name = ?, college = ?, notification_prefs = ?, password_hash = ?, email_verified = ?, account_status = ?, updated_at = ? WHERE id = ?`
      )
      .run(
        updates.name !== undefined ? updates.name.trim() : existing.name,
        updates.college !== undefined ? updates.college.trim() : existing.college || '',
        updates.notificationPrefs ? JSON.stringify(updates.notificationPrefs) : JSON.stringify(existing.notificationPrefs),
        updates.passwordHash !== undefined ? updates.passwordHash : existing.passwordHash ?? null,
        updates.emailVerified !== undefined ? (updates.emailVerified ? 1 : 0) : existing.emailVerified ? 1 : 0,
        updates.accountStatus ?? existing.accountStatus,
        now,
        userId
      );
    return this.findUserById(userId);
  },

  deleteUser(userId: string): void {
    sqlite.prepare('DELETE FROM users WHERE id = ?').run(userId);
  },

  listUsers(isDemo = false): StoredUser[] {
    const rows = sqlite
      .prepare('SELECT * FROM users WHERE is_demo = ? ORDER BY created_at DESC')
      .all(isDemo ? 1 : 0) as Record<string, unknown>[];
    return rows.map(mapUserRow);
  },

  getUserActivityStats(isDemo = false): Map<
    string,
    { scanCount: number; reportCount: number; lastActiveAt: string | null }
  > {
    const map = new Map<string, { scanCount: number; reportCount: number; lastActiveAt: string | null }>();
    const scanStats = sqlite
      .prepare('SELECT user_id, COUNT(*) as cnt, MAX(created_at) as last_ts FROM scans WHERE is_demo = ? GROUP BY user_id')
      .all(isDemo ? 1 : 0) as Array<{ user_id: string; cnt: number; last_ts: string | null }>;
    for (const row of scanStats) {
      map.set(row.user_id, {
        scanCount: row.cnt,
        reportCount: 0,
        lastActiveAt: row.last_ts,
      });
    }
    const repStats = sqlite
      .prepare('SELECT reporter_id, COUNT(*) as cnt, MAX(created_at) as last_ts FROM threat_reports WHERE is_demo = ? GROUP BY reporter_id')
      .all(isDemo ? 1 : 0) as Array<{ reporter_id: string; cnt: number; last_ts: string | null }>;
    for (const row of repStats) {
      const prev = map.get(row.reporter_id) || { scanCount: 0, reportCount: 0, lastActiveAt: null };
      const latest =
        prev.lastActiveAt && row.last_ts
          ? prev.lastActiveAt > row.last_ts
            ? prev.lastActiveAt
            : row.last_ts
          : prev.lastActiveAt || row.last_ts;
      map.set(row.reporter_id, {
        scanCount: prev.scanCount,
        reportCount: row.cnt,
        lastActiveAt: latest,
      });
    }
    return map;
  },

  // Sessions
  createSession(jti: string, userId: string, expiresAt: string): void {
    sqlite
      .prepare('INSERT INTO sessions (jti, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
      .run(jti, userId, expiresAt, new Date().toISOString());
  },

  isSessionActive(jti: string): boolean {
    const row = sqlite.prepare('SELECT expires_at FROM sessions WHERE jti = ?').get(jti) as
      | { expires_at: string }
      | undefined;
    if (!row) return false;
    if (new Date(row.expires_at).getTime() < Date.now()) {
      sqlite.prepare('DELETE FROM sessions WHERE jti = ?').run(jti);
      return false;
    }
    return true;
  },

  revokeSession(jti: string): void {
    sqlite.prepare('DELETE FROM sessions WHERE jti = ?').run(jti);
  },

  revokeAllUserSessions(userId: string): void {
    sqlite.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  },

  // Email verification & password resets
  createEmailVerification(userId: string, tokenHash: string, expiresAt: string): void {
    sqlite.prepare('DELETE FROM email_verifications WHERE user_id = ?').run(userId);
    sqlite
      .prepare('INSERT INTO email_verifications (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
      .run(tokenHash, userId, expiresAt, new Date().toISOString());
  },

  consumeEmailVerification(tokenHash: string): string | null {
    const row = sqlite
      .prepare('SELECT user_id, expires_at FROM email_verifications WHERE token_hash = ?')
      .get(tokenHash) as { user_id: string; expires_at: string } | undefined;
    if (!row) return null;
    sqlite.prepare('DELETE FROM email_verifications WHERE token_hash = ?').run(tokenHash);
    if (new Date(row.expires_at).getTime() < Date.now()) return null;
    return row.user_id;
  },

  createPasswordReset(userId: string, tokenHash: string, expiresAt: string): void {
    sqlite
      .prepare('INSERT INTO password_resets (token_hash, user_id, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)')
      .run(tokenHash, userId, expiresAt, new Date().toISOString());
  },

  consumePasswordReset(tokenHash: string): string | null {
    const row = sqlite
      .prepare('SELECT user_id, expires_at, used FROM password_resets WHERE token_hash = ?')
      .get(tokenHash) as { user_id: string; expires_at: string; used: number } | undefined;
    if (!row || row.used) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) return null;
    sqlite.prepare('UPDATE password_resets SET used = 1 WHERE token_hash = ?').run(tokenHash);
    return row.user_id;
  },

  // Scans
  createScan(
    scan: Omit<ScanRecord, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
      createdAt?: string;
    }
  ): ScanRecord {
    const id = scan.id || generateId('scn');
    const now = scan.createdAt || new Date().toISOString();
    sqlite
      .prepare(
        `INSERT INTO scans (
          id, user_id, is_demo, scan_name, scan_type, input_reference,
          extracted_information, findings, positive_observations, contradictions,
          missing_information, recommendations, risk_score, risk_category,
          evidence_confidence, processing_status, disclaimer, ai_status,
          saved, saved_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        scan.userId,
        scan.isDemo ? 1 : 0,
        scan.scanName,
        scan.scanType,
        scan.inputReference,
        JSON.stringify(scan.extractedInformation),
        JSON.stringify(scan.findings),
        JSON.stringify(scan.positiveObservations),
        JSON.stringify(scan.contradictions),
        JSON.stringify(scan.missingInformation),
        JSON.stringify(scan.recommendations),
        scan.riskScore,
        scan.riskCategory,
        scan.evidenceConfidence,
        scan.processingStatus,
        scan.disclaimer,
        scan.aiStatus,
        scan.saved ? 1 : 0,
        scan.savedAt ?? null,
        now,
        now
      );
    return this.getScanById(id)!;
  },

  getScanById(id: string): ScanRecord | null {
    const row = sqlite.prepare('SELECT * FROM scans WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? mapScanRow(row) : null;
  },

  listScansByUser(userId: string): ScanRecord[] {
    const rows = sqlite
      .prepare('SELECT * FROM scans WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as Record<string, unknown>[];
    return rows.map(mapScanRow);
  },

  listAllScans(isDemo = false): ScanRecord[] {
    const rows = sqlite
      .prepare('SELECT * FROM scans WHERE is_demo = ? ORDER BY created_at DESC')
      .all(isDemo ? 1 : 0) as Record<string, unknown>[];
    return rows.map(mapScanRow);
  },

  toggleSaveScan(id: string, userId: string, saved: boolean): ScanRecord | null {
    const scan = this.getScanById(id);
    if (!scan || scan.userId !== userId) return null;
    const now = new Date().toISOString();
    sqlite
      .prepare('UPDATE scans SET saved = ?, saved_at = ?, updated_at = ? WHERE id = ?')
      .run(saved ? 1 : 0, saved ? now : null, now, id);
    return this.getScanById(id);
  },

  deleteScan(id: string, userId: string): boolean {
    const res = sqlite.prepare('DELETE FROM scans WHERE id = ? AND user_id = ?').run(id, userId);
    return res.changes > 0;
  },

  // Companies
  listCompanies(isDemo = false): CompanyRecord[] {
    const rows = sqlite
      .prepare('SELECT * FROM companies WHERE is_demo = ? ORDER BY last_reviewed_at DESC')
      .all(isDemo ? 1 : 0) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id),
      isDemo: Boolean(r.is_demo),
      companyName: String(r.company_name),
      officialDomain: String(r.official_domain),
      industry: r.industry ? String(r.industry) : '',
      website: r.website ? String(r.website) : '',
      relatedRecruiters: safeJsonParseArray(r.related_recruiters),
      relatedOpportunities: safeJsonParseArray(r.related_opportunities),
      publicInformationReferences: JSON.parse(String(r.public_information_references)),
      verificationStatus: r.verification_status as CompanyRecord['verificationStatus'],
      notes: r.notes ? String(r.notes) : '',
      lastReviewedAt: String(r.last_reviewed_at),
    }));
  },

  findCompanyByNameOrDomain(companyName?: string, domain?: string, isDemo = false): CompanyRecord | null {
    const companies = this.listCompanies(isDemo);
    const normName = companyName?.trim().toLowerCase();
    const normDomain = domain?.trim().toLowerCase().replace(/^www\./, '');
    return (
      companies.find(
        (c) =>
          (normDomain && c.officialDomain.toLowerCase().replace(/^www\./, '') === normDomain) ||
          (normName && c.companyName.toLowerCase() === normName)
      ) ?? null
    );
  },

  createCompany(
    input: Omit<CompanyRecord, 'id' | 'lastReviewedAt'> & {
      id?: string;
      isDemo?: boolean;
      lastReviewedAt?: string;
    }
  ): CompanyRecord {
    const id = input.id || generateId('cmp');
    const now = input.lastReviewedAt || new Date().toISOString();
    const isDemo = Boolean(input.isDemo);
    sqlite
      .prepare(
        `INSERT INTO companies (id, is_demo, company_name, official_domain, industry, website, related_recruiters, related_opportunities, public_information_references, verification_status, notes, last_reviewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        isDemo ? 1 : 0,
        input.companyName.trim(),
        input.officialDomain.trim().toLowerCase(),
        input.industry?.trim() || '',
        input.website?.trim() || `https://${input.officialDomain.trim().toLowerCase()}`,
        JSON.stringify(input.relatedRecruiters || []),
        JSON.stringify(input.relatedOpportunities || []),
        JSON.stringify(input.publicInformationReferences || []),
        input.verificationStatus,
        input.notes || '',
        now
      );
    return this.listCompanies(isDemo).find((c) => c.id === id)!;
  },

  updateCompany(
    id: string,
    updates: Partial<Omit<CompanyRecord, 'id'>>,
    isDemo = false
  ): CompanyRecord | null {
    const existing = this.listCompanies(isDemo).find((c) => c.id === id);
    if (!existing) return null;
    const now = new Date().toISOString();
    sqlite
      .prepare(
        `UPDATE companies SET company_name = ?, official_domain = ?, industry = ?, website = ?, related_recruiters = ?, related_opportunities = ?, public_information_references = ?, verification_status = ?, notes = ?, last_reviewed_at = ? WHERE id = ? AND is_demo = ?`
      )
      .run(
        updates.companyName ?? existing.companyName,
        (updates.officialDomain ?? existing.officialDomain).toLowerCase(),
        updates.industry ?? existing.industry ?? '',
        updates.website ?? existing.website ?? '',
        JSON.stringify(updates.relatedRecruiters ?? existing.relatedRecruiters ?? []),
        JSON.stringify(updates.relatedOpportunities ?? existing.relatedOpportunities ?? []),
        JSON.stringify(updates.publicInformationReferences ?? existing.publicInformationReferences),
        updates.verificationStatus ?? existing.verificationStatus,
        updates.notes ?? existing.notes ?? '',
        now,
        id,
        isDemo ? 1 : 0
      );
    return this.listCompanies(isDemo).find((c) => c.id === id)!;
  },

  // Domains & Threat Indicators
  listDomains(isDemo = false): DomainIndicator[] {
    const rows = sqlite
      .prepare('SELECT * FROM domains WHERE is_demo = ? ORDER BY last_checked_at DESC')
      .all(isDemo ? 1 : 0) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id),
      isDemo: Boolean(r.is_demo),
      domainName: String(r.domain_name),
      relatedCompanyId: r.related_company_id ? String(r.related_company_id) : null,
      indicatorType: String(r.indicator_type),
      threatStatus: r.threat_status as DomainIndicator['threatStatus'],
      severity: (r.severity ? String(r.severity) : 'medium') as DomainIndicator['severity'],
      firstDetectedAt: r.first_detected_at ? String(r.first_detected_at) : String(r.last_checked_at),
      source: String(r.source),
      evidenceSummary: String(r.evidence_summary),
      relatedReportId: r.related_report_id ? String(r.related_report_id) : null,
      lastCheckedAt: String(r.last_checked_at),
    }));
  },

  findDomainIndicator(domain: string, isDemo = false): DomainIndicator | null {
    const clean = domain.toLowerCase().trim().replace(/^www\./, '');
    const row = sqlite
      .prepare('SELECT * FROM domains WHERE is_demo = ? AND (domain_name = ? OR domain_name = ?)')
      .get(isDemo ? 1 : 0, clean, `www.${clean}`) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      isDemo: Boolean(row.is_demo),
      domainName: String(row.domain_name),
      relatedCompanyId: row.related_company_id ? String(row.related_company_id) : null,
      indicatorType: String(row.indicator_type),
      threatStatus: row.threat_status as DomainIndicator['threatStatus'],
      severity: (row.severity ? String(row.severity) : 'medium') as DomainIndicator['severity'],
      firstDetectedAt: row.first_detected_at ? String(row.first_detected_at) : String(row.last_checked_at),
      source: String(row.source),
      evidenceSummary: String(row.evidence_summary),
      relatedReportId: row.related_report_id ? String(row.related_report_id) : null,
      lastCheckedAt: String(row.last_checked_at),
    };
  },

  upsertDomainIndicator(
    input: Omit<DomainIndicator, 'id' | 'lastCheckedAt'> & {
      id?: string;
      isDemo?: boolean;
      lastCheckedAt?: string;
    }
  ): DomainIndicator {
    const clean = input.domainName.toLowerCase().trim().replace(/^www\./, '');
    const isDemo = Boolean(input.isDemo);
    const existing = this.findDomainIndicator(clean, isDemo);
    const now = input.lastCheckedAt || new Date().toISOString();
    const inferredSeverity =
      input.severity ||
      (input.threatStatus === 'CONFIRMED_THREAT'
        ? 'high'
        : input.threatStatus === 'SUSPICIOUS'
        ? 'medium'
        : 'low');
    if (existing) {
      sqlite
        .prepare(
          `UPDATE domains SET indicator_type = ?, threat_status = ?, severity = ?, first_detected_at = ?, source = ?, evidence_summary = ?, related_report_id = ?, last_checked_at = ? WHERE id = ?`
        )
        .run(
          input.indicatorType,
          input.threatStatus,
          inferredSeverity,
          input.firstDetectedAt || existing.firstDetectedAt || now,
          input.source,
          input.evidenceSummary,
          input.relatedReportId ?? existing.relatedReportId ?? null,
          now,
          existing.id
        );
      return this.findDomainIndicator(clean, isDemo)!;
    }
    const id = input.id || generateId('dom');
    sqlite
      .prepare(
        `INSERT INTO domains (id, is_demo, domain_name, related_company_id, indicator_type, threat_status, severity, first_detected_at, source, evidence_summary, related_report_id, last_checked_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        isDemo ? 1 : 0,
        clean,
        input.relatedCompanyId ?? null,
        input.indicatorType,
        input.threatStatus,
        inferredSeverity,
        input.firstDetectedAt || now,
        input.source,
        input.evidenceSummary,
        input.relatedReportId ?? null,
        now
      );
    return this.findDomainIndicator(clean, isDemo)!;
  },

  // Community Threat Reports
  createReport(
    input: Omit<
      CommunityReport,
      'id' | 'moderationStatus' | 'moderationNotes' | 'duplicateOfId' | 'createdAt' | 'updatedAt'
    > & {
      id?: string;
      moderationStatus?: ReportModerationStatus;
      moderationNotes?: string;
      duplicateOfId?: string | null;
      skipDuplicateLookup?: boolean;
      createdAt?: string;
    }
  ): CommunityReport {
    const id = input.id || generateId('rep');
    const now = input.createdAt || new Date().toISOString();
    const isDemo = Boolean(input.isDemo);

    let duplicateId: string | null = input.duplicateOfId ?? null;
    if (!input.skipDuplicateLookup && !duplicateId) {
      const existing = this.listReports({ isDemo });
      const normUrl = input.url?.trim().toLowerCase();
      const normComp = input.companyName?.trim().toLowerCase();
      const duplicate = existing.find(
        (r) =>
          r.category === input.category &&
          ((normUrl && r.url && r.url.trim().toLowerCase() === normUrl) ||
            (normComp && r.companyName && r.companyName.trim().toLowerCase() === normComp))
      );
      duplicateId = duplicate ? duplicate.id : null;
    }

    sqlite
      .prepare(
        `INSERT INTO threat_reports (
          id, reporter_id, related_scan_id, is_demo, category, company_name, url, recruiter_info,
          description, incident_date, evidence_summary, money_requested,
          money_paid, additional_notes, moderation_status, moderation_notes,
          duplicate_of_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.reporterId,
        input.relatedScanId || '',
        isDemo ? 1 : 0,
        input.category,
        input.companyName || '',
        input.url || '',
        input.recruiterInfo || '',
        input.description,
        input.incidentDate,
        input.evidenceSummary || '',
        input.moneyRequested ? 1 : 0,
        input.moneyPaid ? 1 : 0,
        input.additionalNotes || '',
        input.moderationStatus || 'UNDER_REVIEW',
        input.moderationNotes || '',
        duplicateId,
        now,
        now
      );
    return this.getReportById(id)!;
  },

  getReportById(id: string): CommunityReport | null {
    const row = sqlite.prepare('SELECT * FROM threat_reports WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? mapReportRow(row) : null;
  },

  listReports(filter?: {
    reporterId?: string;
    status?: ReportModerationStatus;
    isDemo?: boolean;
  }): CommunityReport[] {
    let query = 'SELECT * FROM threat_reports';
    const clauses: string[] = [];
    const params: (string | number)[] = [];
    clauses.push('is_demo = ?');
    params.push(filter?.isDemo ? 1 : 0);

    if (filter?.reporterId) {
      clauses.push('reporter_id = ?');
      params.push(filter.reporterId);
    }
    if (filter?.status) {
      clauses.push('moderation_status = ?');
      params.push(filter.status);
    }
    if (clauses.length) {
      query += ' WHERE ' + clauses.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';
    const rows = sqlite.prepare(query).all(...params) as Record<string, unknown>[];
    return rows.map(mapReportRow);
  },

  moderateReport(
    id: string,
    status: ReportModerationStatus,
    notes: string,
    isDemo = false
  ): CommunityReport | null {
    const existing = this.getReportById(id);
    if (!existing || Boolean(existing.isDemo) !== isDemo) return null;
    const now = new Date().toISOString();
    sqlite
      .prepare('UPDATE threat_reports SET moderation_status = ?, moderation_notes = ?, updated_at = ? WHERE id = ?')
      .run(status, notes, now, id);
    return this.getReportById(id);
  },

  // Evidence Records
  addEvidenceRecord(
    input: Omit<EvidenceRecord, 'id' | 'timestamp'> & { timestamp?: string; isDemo?: boolean }
  ): EvidenceRecord {
    const id = generateId('evd');
    const now = input.timestamp || new Date().toISOString();
    sqlite
      .prepare(
        `INSERT INTO evidence_records (id, is_demo, related_scan_id, related_report_id, entity_type, evidence_type, source, finding, confidence, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.isDemo ? 1 : 0,
        input.relatedScanId ?? null,
        input.relatedReportId ?? null,
        input.entityType,
        input.evidenceType,
        input.source,
        input.finding,
        input.confidence,
        now
      );
    return { ...input, id, timestamp: now };
  },

  listEvidenceRecords(isDemo = false): EvidenceRecord[] {
    const rows = sqlite
      .prepare('SELECT * FROM evidence_records WHERE is_demo = ? ORDER BY timestamp DESC LIMIT 500')
      .all(isDemo ? 1 : 0) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id),
      isDemo: Boolean(r.is_demo),
      relatedScanId: r.related_scan_id ? String(r.related_scan_id) : null,
      relatedReportId: r.related_report_id ? String(r.related_report_id) : null,
      entityType: String(r.entity_type),
      evidenceType: String(r.evidence_type),
      source: String(r.source),
      finding: String(r.finding),
      confidence: r.confidence as EvidenceRecord['confidence'],
      timestamp: String(r.timestamp),
    }));
  },

  // Audit Logs
  addAuditLog(input: Omit<AuditLogRecord, 'id' | 'timestamp'> & { timestamp?: string; isDemo?: boolean }): void {
    sqlite
      .prepare(
        `INSERT INTO audit_logs (id, is_demo, actor_id, actor_email, actor_role, action, target_type, target_id, metadata, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        generateId('aud'),
        input.isDemo ? 1 : 0,
        input.actorId,
        input.actorEmail ?? null,
        input.actorRole ?? null,
        input.action,
        input.targetType,
        input.targetId,
        JSON.stringify(input.metadata || {}),
        input.timestamp || new Date().toISOString()
      );
  },

  listAuditLogs(limit = 200, isDemo = false): AuditLogRecord[] {
    const rows = sqlite
      .prepare('SELECT * FROM audit_logs WHERE is_demo = ? ORDER BY timestamp DESC LIMIT ?')
      .all(isDemo ? 1 : 0, limit) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id),
      isDemo: Boolean(r.is_demo),
      actorId: String(r.actor_id),
      actorEmail: r.actor_email ? String(r.actor_email) : undefined,
      actorRole: r.actor_role ? String(r.actor_role) : undefined,
      action: String(r.action),
      targetType: String(r.target_type),
      targetId: String(r.target_id),
      metadata: JSON.parse(String(r.metadata)),
      timestamp: String(r.timestamp),
    }));
  },

  // Notifications
  addNotification(
    input: Omit<NotificationRecord, 'id' | 'read' | 'createdAt'> & {
      read?: boolean;
      createdAt?: string;
    }
  ): NotificationRecord {
    const id = generateId('ntf');
    const now = input.createdAt || new Date().toISOString();
    const read = Boolean(input.read);
    sqlite
      .prepare(
        `INSERT INTO notifications (id, user_id, type, title, message, link, read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.userId, input.type, input.title, input.message, input.link ?? null, read ? 1 : 0, now);
    return { ...input, id, read, createdAt: now };
  },

  listNotifications(userId: string): NotificationRecord[] {
    const rows = sqlite
      .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100')
      .all(userId) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      type: r.type as NotificationRecord['type'],
      title: String(r.title),
      message: String(r.message),
      link: r.link ? String(r.link) : undefined,
      read: Boolean(r.read),
      createdAt: String(r.created_at),
    }));
  },

  markNotificationRead(id: string, userId: string): void {
    sqlite.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
  },

  markAllNotificationsRead(userId: string): void {
    sqlite.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
  },

  // Checklist Progress
  getChecklist(userId: string): string[] {
    const row = sqlite
      .prepare('SELECT completed_items FROM checklist_progress WHERE user_id = ?')
      .get(userId) as { completed_items: string } | undefined;
    return row ? JSON.parse(row.completed_items) : [];
  },

  saveChecklist(userId: string, items: string[]): string[] {
    const now = new Date().toISOString();
    sqlite
      .prepare(
        `INSERT INTO checklist_progress (user_id, completed_items, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET completed_items = excluded.completed_items, updated_at = excluded.updated_at`
      )
      .run(userId, JSON.stringify(items), now);
    return items;
  },

  // Demo Sandbox Cleanup (never deletes real is_demo = 0 rows)
  clearDemoData(): void {
    sqlite.exec(`
      DELETE FROM audit_logs WHERE is_demo = 1;
      DELETE FROM evidence_records WHERE is_demo = 1;
      DELETE FROM threat_reports WHERE is_demo = 1;
      DELETE FROM domains WHERE is_demo = 1;
      DELETE FROM companies WHERE is_demo = 1;
      DELETE FROM scans WHERE is_demo = 1;
      DELETE FROM users WHERE is_demo = 1;
      DELETE FROM platform_settings WHERE key LIKE 'demo:%';
    `);
  },

  // System Errors & Settings
  logSystemError(service: string, message: string): void {
    sqlite
      .prepare('INSERT INTO system_errors (id, service, message, timestamp) VALUES (?, ?, ?, ?)')
      .run(generateId('err'), service, message.slice(0, 400), new Date().toISOString());
  },

  listSystemErrors(): Array<{ id: string; service: string; message: string; timestamp: string }> {
    const rows = sqlite
      .prepare('SELECT * FROM system_errors ORDER BY timestamp DESC LIMIT 25')
      .all() as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id),
      service: String(r.service),
      message: String(r.message),
      timestamp: String(r.timestamp),
    }));
  },

  getSetting(key: string): string | null {
    const row = sqlite.prepare('SELECT value FROM platform_settings WHERE key = ?').get(key) as
      | { value: string }
      | undefined;
    return row ? row.value : null;
  },

  setSetting(key: string, value: string): void {
    sqlite
      .prepare(
        `INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      )
      .run(key, value, new Date().toISOString());
  },
};
