import crypto from 'crypto';
import express from 'express';
import { DEMO_ADMIN_ID, DEMO_CITIZEN_ID, seedDemoData } from '../config/demoSeed';
import { dbStore } from '../config/store';
import { rateLimit, requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import {
  getFirebaseAuthConfig,
  hashOpaqueToken,
  hashPassword,
  isGoogleAuthConfigured,
  issueSessionToken,
  sanitizeUser,
  verifyGoogleIdToken,
  verifyPassword,
} from '../services/auth/authService';

const router = express.Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.get('/config', (_req, res) => {
  const firebaseCfg = getFirebaseAuthConfig();
  res.json({
    googleClientIdConfigured: isGoogleAuthConfigured(),
    googleAuthProvider: firebaseCfg ? 'firebase' : process.env.GOOGLE_CLIENT_ID?.trim() ? 'gis' : null,
    googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || firebaseCfg?.oAuthClientId || null,
    adminCount: dbStore.countAdmins(),
    adminPasscodeConfigured: Boolean(process.env.ADMIN_BOOTSTRAP_PASSCODE?.trim()),
  });
});

router.post('/register', rateLimit(15, 60_000, 'register'), (req, res) => {
  const { name, email, password, college, acceptedTerms } = req.body as Record<string, unknown>;

  if (typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    return;
  }
  if (typeof email !== 'string' || !isValidEmail(email.trim())) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }
  if (acceptedTerms !== true) {
    res.status(400).json({ error: 'You must accept the Terms and Conditions and Privacy Policy.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = dbStore.findUserByEmail(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  const user = dbStore.createUser({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: 'STUDENT', // Public registration strictly assigns STUDENT only
    authProvider: 'LOCAL',
    emailVerified: false,
    college: typeof college === 'string' ? college.trim() : '',
  });

  const verificationToken = crypto.randomBytes(24).toString('hex');
  dbStore.createEmailVerification(
    user.id,
    hashOpaqueToken(verificationToken),
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  );

  dbStore.addNotification({
    userId: user.id,
    type: 'security_event',
    title: 'Welcome to JOBSHIELD',
    message: 'Your Student account was created. Please verify your email address to complete account security setup.',
    link: '/student/profile',
  });

  dbStore.addAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'USER_REGISTERED',
    targetType: 'User',
    targetId: user.id,
    metadata: { provider: 'LOCAL' },
  });

  const sessionToken = issueSessionToken(user, false);

  res.status(201).json({
    user: sanitizeUser(user),
    token: sessionToken,
    emailVerificationRequired: true,
    // In preview without SMTP configured, return the verification token cleanly so the user can test verification flow directly
    previewVerificationToken: verificationToken,
    message: 'Account created. Complete email verification to confirm your address.',
  });
});

router.post('/verify-email', (req, res) => {
  const { token } = req.body as Record<string, unknown>;
  if (typeof token !== 'string' || !token.trim()) {
    res.status(400).json({ error: 'Verification token is required.' });
    return;
  }
  const userId = dbStore.consumeEmailVerification(hashOpaqueToken(token.trim()));
  if (!userId) {
    res.status(400).json({ error: 'Verification link is invalid or has expired.' });
    return;
  }
  const updated = dbStore.updateUserProfile(userId, { emailVerified: true });
  if (!updated) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }
  dbStore.addAuditLog({
    actorId: updated.id,
    actorEmail: updated.email,
    actorRole: updated.role,
    action: 'EMAIL_VERIFIED',
    targetType: 'User',
    targetId: updated.id,
    metadata: {},
  });
  res.json({ verified: true, user: sanitizeUser(updated) });
});

router.post('/demo-login', rateLimit(30, 60_000, 'demo_login'), (req, res) => {
  const { role } = req.body as Record<string, unknown>;
  if (role !== 'STUDENT' && role !== 'ADMIN') {
    res.status(400).json({ error: 'Invalid demo login role. Choose Citizen / Student or Administrator.' });
    return;
  }

  seedDemoData(false);
  const demoUserId = role === 'ADMIN' ? DEMO_ADMIN_ID : DEMO_CITIZEN_ID;
  const user = dbStore.findUserById(demoUserId);
  if (!user || !user.isDemo || user.accountStatus !== 'ACTIVE') {
    res.status(500).json({ error: 'Demo account is currently unavailable.' });
    return;
  }

  const token = issueSessionToken(user, false);
  dbStore.addAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    isDemo: true,
    action: 'DEMO_LOGIN',
    targetType: 'User',
    targetId: user.id,
    metadata: { role: user.role, demoSandbox: true },
  });

  res.json({
    user: sanitizeUser(user),
    token,
  });
});

router.post('/login', rateLimit(20, 60_000, 'login'), (req, res) => {
  const { email, password, rememberMe, expectedRole } = req.body as Record<string, unknown>;
  if (typeof email !== 'string' || !isValidEmail(email.trim()) || typeof password !== 'string' || !password) {
    res.status(400).json({ error: 'Please enter a valid email address and password.' });
    return;
  }

  const user = dbStore.findUserByEmail(email.trim().toLowerCase());
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (user.isDemo) {
    res.status(403).json({
      error: 'Demo accounts are sandboxed and must be accessed via the "Login with Demo" button.',
    });
    return;
  }

  if (expectedRole === 'ADMIN' && user.role !== 'ADMIN') {
    res.status(403).json({
      error: 'This account does not have Administrator privileges. Please sign in through the Citizen / Student Login portal.',
    });
    return;
  }

  if (expectedRole === 'STUDENT' && user.role !== 'STUDENT') {
    res.status(403).json({
      error: 'Administrator accounts must sign in through the Administrator Access portal.',
    });
    return;
  }

  if (user.accountStatus === 'SUSPENDED') {
    res.status(403).json({ error: 'This account has been suspended by an administrator.' });
    return;
  }

  const token = issueSessionToken(user, rememberMe === true);
  dbStore.addAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'USER_LOGIN',
    targetType: 'User',
    targetId: user.id,
    metadata: { role: user.role, portal: typeof expectedRole === 'string' ? expectedRole : 'UNSPECIFIED' },
  });

  res.json({
    user: sanitizeUser(user),
    token,
  });
});

router.post('/google', rateLimit(15, 60_000, 'google_auth'), async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const expectedRole = body.expectedRole === 'ADMIN' ? 'ADMIN' : 'STUDENT';
  const rawToken =
    typeof body.idToken === 'string' && body.idToken.trim()
      ? body.idToken.trim()
      : typeof body.credential === 'string' && body.credential.trim()
      ? body.credential.trim()
      : '';

  if (!rawToken) {
    res.status(400).json({ error: 'Google ID token is required.' });
    return;
  }

  try {
    const profile = await verifyGoogleIdToken(rawToken);
    let user = dbStore.findUserByEmail(profile.email);

    if (user?.isDemo) {
      res.status(403).json({ error: 'Demo accounts cannot be accessed via Google Sign-In.' });
      return;
    }

    if (expectedRole === 'ADMIN') {
      if (!user || user.role !== 'ADMIN') {
        res.status(403).json({
          error:
            user?.role === 'STUDENT'
              ? 'This Google account is registered as Citizen / Student and does not have Administrator privileges.'
              : 'This Google account is not a provisioned Administrator account. Public Google sign-ups only create Citizen / Student accounts.',
        });
        return;
      }
      if (user.accountStatus === 'SUSPENDED') {
        res.status(403).json({ error: 'This administrator account has been suspended.' });
        return;
      }
      const token = issueSessionToken(user, true);
      dbStore.addAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'ADMIN_GOOGLE_LOGIN',
        targetType: 'User',
        targetId: user.id,
        metadata: { role: user.role, provider: 'GOOGLE' },
      });
      res.json({ user: sanitizeUser(user), token });
      return;
    }

    // Citizen / Student Google Auth Flow
    if (user && user.role !== 'STUDENT') {
      res.status(403).json({
        error: 'Administrator accounts must sign in through the Administrator Login portal.',
      });
      return;
    }
    if (user && user.authProvider !== 'GOOGLE') {
      res.status(409).json({
        error:
          'An account with this email already exists using email/password sign-in. Sign in with your password instead.',
      });
      return;
    }

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = dbStore.createUser({
        name: profile.name,
        email: profile.email,
        role: 'STUDENT', // Public Google registration strictly creates Citizen / Student only
        authProvider: 'GOOGLE',
        emailVerified: true,
        isDemo: false,
      });
      dbStore.addNotification({
        userId: user.id,
        type: 'security_event',
        title: 'Welcome to JOBSHIELD',
        message: 'Your Citizen / Student account was created via Google Sign-In.',
        link: '/student/profile',
      });
      dbStore.addAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'USER_REGISTERED',
        targetType: 'User',
        targetId: user.id,
        metadata: { provider: 'GOOGLE' },
      });
    }

    if (user.accountStatus === 'SUSPENDED') {
      res.status(403).json({ error: 'This account has been suspended.' });
      return;
    }

    const token = issueSessionToken(user, true);
    if (!isNewUser) {
      dbStore.addAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'USER_LOGIN',
        targetType: 'User',
        targetId: user.id,
        metadata: { role: user.role, provider: 'GOOGLE' },
      });
    }
    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    if (err instanceof Error && err.message === 'GOOGLE_OAUTH_NOT_CONFIGURED') {
      res.status(503).json({
        error: 'Google Sign-In is not configured on this server. Configure Google OAuth credentials or use Login with Demo / email sign-in.',
      });
      return;
    }
    res.status(401).json({ error: 'Google authentication failed or token could not be verified.' });
  }
});

router.post('/forgot-password', rateLimit(10, 60_000, 'forgot_pw'), (req, res) => {
  const { email } = req.body as Record<string, unknown>;
  if (typeof email !== 'string' || !isValidEmail(email.trim())) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }

  const user = dbStore.findUserByEmail(email.trim().toLowerCase());
  let previewResetToken: string | undefined;

  if (user && user.authProvider === 'LOCAL') {
    const rawToken = crypto.randomBytes(24).toString('hex');
    dbStore.createPasswordReset(
      user.id,
      hashOpaqueToken(rawToken),
      new Date(Date.now() + 15 * 60 * 1000).toISOString()
    );
    previewResetToken = rawToken;
    dbStore.addAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PASSWORD_RESET_REQUESTED',
      targetType: 'User',
      targetId: user.id,
      metadata: {},
    });
  }

  // Never reveal whether an arbitrary email exists in the system
  res.json({
    message:
      'If an eligible account matches that email address, a time-limited password reset link has been generated.',
    ...(process.env.NODE_ENV !== 'production' && previewResetToken ? { previewResetToken } : {}),
  });
});

router.post('/reset-password', rateLimit(10, 60_000, 'reset_pw'), (req, res) => {
  const { token, password } = req.body as Record<string, unknown>;
  if (typeof token !== 'string' || !token.trim()) {
    res.status(400).json({ error: 'Reset token is required.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  const userId = dbStore.consumePasswordReset(hashOpaqueToken(token.trim()));
  if (!userId) {
    res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    return;
  }

  const updated = dbStore.updateUserProfile(userId, {
    passwordHash: hashPassword(password),
  });
  if (!updated) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }

  dbStore.revokeAllUserSessions(userId);
  dbStore.addNotification({
    userId,
    type: 'security_event',
    title: 'Password Updated',
    message: 'Your account password was reset and previous active sessions were revoked.',
    link: '/student/profile',
  });
  dbStore.addAuditLog({
    actorId: updated.id,
    actorEmail: updated.email,
    actorRole: updated.role,
    action: 'PASSWORD_RESET_COMPLETED',
    targetType: 'User',
    targetId: updated.id,
    metadata: {},
  });

  res.json({ message: 'Password updated successfully. Please sign in with your new password.' });
});

// One-time Admin setup/claim route (locked once an admin exists unless ADMIN_BOOTSTRAP_PASSCODE matches)
router.post('/admin-bootstrap', rateLimit(10, 60_000, 'admin_bootstrap'), (req, res) => {
  const { name, email, password, passcode } = req.body as Record<string, unknown>;
  const adminCount = dbStore.countAdmins();
  const envPasscode = process.env.ADMIN_BOOTSTRAP_PASSCODE?.trim();

  if (envPasscode) {
    if (typeof passcode !== 'string' || passcode.length !== envPasscode.length) {
      res.status(403).json({ error: 'Invalid administrator authorization passcode.' });
      return;
    }
    const ok = crypto.timingSafeEqual(Buffer.from(passcode), Buffer.from(envPasscode));
    if (!ok) {
      res.status(403).json({ error: 'Invalid administrator authorization passcode.' });
      return;
    }
  } else if (adminCount > 0) {
    res.status(403).json({
      error: 'Initial administrator setup is already complete and locked. Contact an existing administrator.',
    });
    return;
  }

  if (typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: 'Administrator name is required.' });
    return;
  }
  if (typeof email !== 'string' || !isValidEmail(email.trim())) {
    res.status(400).json({ error: 'Valid administrator email is required.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 10) {
    res.status(400).json({ error: 'Administrator password must be at least 10 characters.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (dbStore.findUserByEmail(normalizedEmail)) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const admin = dbStore.createUser({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: 'ADMIN',
    authProvider: 'LOCAL',
    emailVerified: true,
    college: 'JOBSHIELD Security Operations',
  });

  dbStore.addAuditLog({
    actorId: admin.id,
    actorEmail: admin.email,
    actorRole: 'ADMIN',
    action: 'ADMIN_ACCOUNT_PROVISIONED',
    targetType: 'User',
    targetId: admin.id,
    metadata: { via: envPasscode ? 'ENV_PASSCODE' : 'FIRST_RUN_CLAIM' },
  });

  const token = issueSessionToken(admin, false);
  res.status(201).json({ user: sanitizeUser(admin), token });
});

router.post('/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.authJti) {
    dbStore.revokeSession(req.authJti);
  }
  if (req.authUser) {
    dbStore.addAuditLog({
      actorId: req.authUser.id,
      actorEmail: req.authUser.email,
      actorRole: req.authUser.role,
      action: 'USER_LOGOUT',
      targetType: 'User',
      targetId: req.authUser.id,
      metadata: {},
    });
  }
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user: sanitizeUser(req.authUser) });
});

export default router;
