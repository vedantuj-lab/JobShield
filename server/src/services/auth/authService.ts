import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getApp as getAdminApp, getApps as getAdminApps, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { OAuth2Client } from 'google-auth-library';
import { dbStore, generateId, type StoredUser } from '../../config/store';
import type { AuthUser, UserRole } from '../../../../src/types/jobshield';

interface FirebaseProjectConfig {
  projectId: string;
  apiKey: string;
  oAuthClientId?: string;
}

export function getFirebaseAuthConfig(): FirebaseProjectConfig | null {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Partial<FirebaseProjectConfig>;
    if (!raw.projectId || !raw.apiKey || raw.projectId === 'remixed-project-id') {
      return null;
    }
    return {
      projectId: raw.projectId,
      apiKey: raw.apiKey,
      oAuthClientId: raw.oAuthClientId,
    };
  } catch {
    return null;
  }
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(getFirebaseAuthConfig() || process.env.GOOGLE_CLIENT_ID?.trim());
}

const TOKEN_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REMEMBER_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export function hashOpaqueToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function sanitizeUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    authProvider: user.authProvider,
    emailVerified: user.emailVerified,
    isDemo: Boolean(user.isDemo),
    college: user.college,
    notificationPrefs: user.notificationPrefs,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

interface TokenPayload {
  sub: string;
  role: UserRole;
  jti: string;
  exp: number;
}

export function issueSessionToken(user: StoredUser, rememberMe = false): string {
  const jti = generateId('ses');
  const ttl = rememberMe ? REMEMBER_TTL_MS : TOKEN_TTL_MS;
  const exp = Date.now() + ttl;
  dbStore.createSession(jti, user.id, new Date(exp).toISOString());

  const payload: TokenPayload = {
    sub: user.id,
    role: user.role,
    jti,
    exp,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token: string): { user: StoredUser; jti: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadB64).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as TokenPayload;
    if (!payload.sub || !payload.jti || !payload.exp || Date.now() > payload.exp) {
      return null;
    }

    if (!dbStore.isSessionActive(payload.jti)) {
      return null;
    }

    const user = dbStore.findUserById(payload.sub);
    if (!user || user.accountStatus !== 'ACTIVE') {
      return null;
    }

    return { user, jti: payload.jti };
  } catch {
    return null;
  }
}

export async function verifyGoogleIdToken(credential: string): Promise<{
  email: string;
  name: string;
  emailVerified: boolean;
}> {
  const firebaseCfg = getFirebaseAuthConfig();
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();

  if (!firebaseCfg && !googleClientId) {
    throw new Error('GOOGLE_OAUTH_NOT_CONFIGURED');
  }

  // Primary verification path: Firebase Authentication ID token (no IAM required for verifyIdToken)
  if (firebaseCfg) {
    try {
      const adminApp = getAdminApps().length
        ? getAdminApp()
        : initializeAdminApp({ projectId: firebaseCfg.projectId });
      const decoded = await getAdminAuth(adminApp).verifyIdToken(credential);
      if (decoded.email && decoded.email_verified) {
        const displayName =
          typeof decoded.name === 'string' && decoded.name.trim()
            ? decoded.name.trim()
            : decoded.email.split('@')[0];
        return {
          email: decoded.email.toLowerCase(),
          name: displayName,
          emailVerified: true,
        };
      }
    } catch {
      if (!googleClientId) {
        throw new Error('GOOGLE_TOKEN_INVALID');
      }
    }
  }

  // Fallback verification path: direct Google Identity Services ID token
  if (googleClientId) {
    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.email_verified) {
      throw new Error('GOOGLE_TOKEN_INVALID');
    }
    return {
      email: payload.email.toLowerCase(),
      name: payload.name || payload.email.split('@')[0],
      emailVerified: Boolean(payload.email_verified),
    };
  }

  throw new Error('GOOGLE_TOKEN_INVALID');
}
