import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Play,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { BrandLogo, ResilientImage } from '../../components/common/RiskDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { isFirebaseGoogleConfigured, signInWithGooglePopup } from '../../lib/firebase';
import { apiRequest } from '../../services/api';
import type { AuthUser } from '../../types/jobshield';

interface AuthConfigResponse {
  googleClientIdConfigured: boolean;
  googleAuthProvider: 'firebase' | 'gis' | null;
  googleClientId: string | null;
  adminCount: number;
  adminPasscodeConfigured: boolean;
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

function getGoogleErrorMessage(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google sign-in was cancelled before completion.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google OAuth provider is not enabled in the Firebase console.';
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Unable to complete Google sign-in.';
}

function AuthShell({
  title,
  subtitle,
  dark = false,
  children,
}: {
  title: string;
  subtitle: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 ${
        dark
          ? 'bg-gradient-to-br from-[#174D3B] via-[#123D2F] to-[#29272B] text-[#F7F0E5]'
          : 'bg-gradient-to-br from-[#FBEAE3] via-[#F7F0E5] to-[#E9D9C4] text-[#29272B]'
      }`}
    >
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Link to="/">
            <BrandLogo variant={dark ? 'forest' : 'light'} />
          </Link>
        </div>
        <div
          className={`rounded-xl border p-6 sm:p-8 shadow-sm space-y-6 ${
            dark
              ? 'border-[#C69B36]/40 bg-[#174D3B] text-[#F7F0E5]'
              : 'border-[#563653]/20 bg-[#F7F0E5] text-[#29272B]'
          }`}
        >
          <div className="space-y-1.5">
            <h1 className={`font-display text-2xl font-bold ${dark ? 'text-[#F7F0E5]' : 'text-[#563653]'}`}>
              {title}
            </h1>
            <p className={`text-sm ${dark ? 'text-[#E9D9C4]' : 'text-[#4F3B42]'}`}>{subtitle}</p>
          </div>
          {children}
        </div>
        <div className={`text-center text-xs space-x-3 ${dark ? 'text-[#A7BEA8]' : 'text-[#563653]'}`}>
          <Link to="/signin" className={dark ? 'hover:text-white' : 'hover:text-[#651F35]'}>
            Login Selection
          </Link>
          <span aria-hidden="true">·</span>
          <Link to="/privacy" className={dark ? 'hover:text-white' : 'hover:text-[#651F35]'}>
            Privacy Policy
          </Link>
          <span aria-hidden="true">·</span>
          <Link to="/terms" className={dark ? 'hover:text-white' : 'hover:text-[#651F35]'}>
            Terms and Conditions
          </Link>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 1. LOGIN SELECTION PAGE (Plum, Emerald, Warm Beige)
// Strictly TWO login cards: Citizen / Student Login + Administrator Login
// =====================================================================
export function LoginSelectionPage() {
  const { loginDemo, loginWithToken } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [authConfig, setAuthConfig] = useState<AuthConfigResponse | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [citizenError, setCitizenError] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    apiRequest<AuthConfigResponse>('/api/auth/config')
      .then(setAuthConfig)
      .catch(() => {});
  }, []);

  const googleConfigured = isFirebaseGoogleConfigured && authConfig?.googleClientIdConfigured !== false;

  const handleCitizenDemo = async () => {
    setCitizenError('');
    setAdminError('');
    setBusyAction('citizen-demo');
    try {
      const u = await loginDemo('STUDENT');
      showToast(`Signed in to Citizen / Student Demo (${u.name}).`, 'success');
      navigate('/student/dashboard');
    } catch (err) {
      setCitizenError(err instanceof Error ? err.message : 'Unable to start Citizen demo.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleAdminDemo = async () => {
    setCitizenError('');
    setAdminError('');
    setBusyAction('admin-demo');
    try {
      const u = await loginDemo('ADMIN');
      showToast(`Signed in to Administrator Demo (${u.name}).`, 'success');
      navigate('/admin/overview');
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to start Administrator demo.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleGooglePortal = async (expectedRole: 'STUDENT' | 'ADMIN') => {
    setCitizenError('');
    setAdminError('');
    if (!googleConfigured) {
      const msg =
        'Google OAuth is not configured on this server. Configure Google credentials or use Login with Demo / email login.';
      if (expectedRole === 'ADMIN') setAdminError(msg);
      else setCitizenError(msg);
      return;
    }

    setBusyAction(expectedRole === 'ADMIN' ? 'admin-google' : 'citizen-google');
    try {
      const idToken = await signInWithGooglePopup();
      const res = await apiRequest<{ user: AuthUser; token: string }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken, expectedRole }),
      });
      loginWithToken(res.user, res.token);
      showToast(`Signed in with Google as ${res.user.name}.`, 'success');
      navigate(res.user.role === 'ADMIN' ? '/admin/overview' : '/student/dashboard');
    } catch (err) {
      const msg = getGoogleErrorMessage(err);
      if (expectedRole === 'ADMIN') setAdminError(msg);
      else setCitizenError(msg);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#E9D9C4] text-[#29272B] flex flex-col">
      <header className="border-b border-[#842D48]/35 bg-[#651F35] text-[#F0DFBD]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <Link to="/">
            <BrandLogo variant="burgundy" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#F0DFBD] hover:text-[#F7F0E5] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Photographic Intro Strip */}
      <section className="relative overflow-hidden border-b border-[#563653]/25 bg-[#563653] text-[#F7F0E5]">
        <ResilientImage
          src="/src/assets/images/login_portal_selection_1795586897601.jpg"
          alt="Dedicated career verification and security access workspace"
          fallbackTitle="JOBSHIELD Workspace Selection"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#563653]/95 via-[#651F35]/85 to-[#174D3B]/85" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 text-center space-y-2.5">
          <h1
            className="font-display text-3xl sm:text-4xl font-bold text-[#F7F0E5] tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Choose Your JOBSHIELD Workspace
          </h1>
          <p className="text-sm sm:text-base text-[#F0DFBD] max-w-2xl mx-auto leading-relaxed">
            Select the account type that matches your role.
          </p>
        </div>
      </section>

      <main className="flex-1 flex items-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-stretch">
            {/* CARD 1: CITIZEN / STUDENT LOGIN (Plum, Muted Lavender, Coral, Soft Peach) */}
            <div className="rounded-2xl border border-[#563653]/25 bg-[#FBEAE3] text-[#29272B] overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="relative h-48 overflow-hidden bg-[#563653]">
                  <ResilientImage
                    src="/src/assets/images/awareness_phishing_email_1795578122206.jpg"
                    alt="Citizen and student checking recruitment correspondence safely"
                    fallbackTitle="Citizen / Student Workspace"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#46304F]/95 via-[#563653]/55 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5 flex items-center gap-3 text-[#F7F0E5]">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#E27D70] border border-[#F0DFBD]/35 text-[#29272B]">
                      <GraduationCap className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-[#B9A5C9]">Public &amp; Campus Applicants</p>
                      <h2 className="font-display text-xl font-bold">Citizen / Student Login</h2>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-sm text-[#4F3B42] leading-relaxed">
                    Designed for college students, fresh graduates, internship seekers, and job
                    applicants verifying recruitment material safely.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-[#46304F]">
                    {[
                      'Recruitment Scanner',
                      'Trust Intelligence',
                      'Community Threats',
                      'Protection Centre',
                      'Scan History',
                    ].map((feat) => (
                      <div
                        key={feat}
                        className="flex items-center gap-1.5 rounded-lg border border-[#B9A5C9]/45 bg-[#F7F0E5] px-3 py-2"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#C65D45] shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>

                  {citizenError && (
                    <div className="rounded-lg border border-[#842D48]/35 bg-[#FADED8] p-3 text-xs text-[#651F35] flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{citizenError}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 space-y-2.5">
                <Link
                  to="/signin/student"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#563653] px-5 py-3 text-sm font-semibold text-[#F7F0E5] hover:bg-[#46304F] transition-colors"
                >
                  <span>Continue as Citizen</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={handleCitizenDemo}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#E27D70] px-4 py-2.5 text-xs font-bold text-[#29272B] hover:bg-[#C65D45] hover:text-[#F7F0E5] disabled:opacity-60 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>{busyAction === 'citizen-demo' ? 'Opening...' : 'Login with Demo'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => handleGooglePortal('STUDENT')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#563653]/30 bg-[#F7F0E5] px-4 py-2.5 text-xs font-semibold text-[#46304F] hover:bg-[#E9E2F2] disabled:opacity-60 transition-colors"
                  >
                    <GoogleIcon />
                    <span>
                      {busyAction === 'citizen-google'
                        ? 'Connecting...'
                        : googleConfigured
                        ? 'Continue with Google'
                        : 'Google (Not Configured)'}
                    </span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#563653]/15 flex flex-wrap items-center justify-between gap-2 text-xs text-[#563653]">
                  <Link to="/register" className="font-semibold text-[#C65D45] hover:underline">
                    Create Citizen Account
                  </Link>
                  <span className="text-[11px] text-[#4F3B42]">
                    Citizen / Student access only
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: ADMINISTRATOR LOGIN (Forest Green, Emerald, Charcoal, Antique Gold) */}
            <div className="rounded-2xl border border-[#C69B36]/45 bg-[#174D3B] text-[#F7F0E5] overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="relative h-48 overflow-hidden bg-[#29272B]">
                  <ResilientImage
                    src="/src/assets/images/admin_security_operations_1795580300367.jpg"
                    alt="Security operations administrator reviewing platform alerts and moderation queue"
                    fallbackTitle="Administrator Security Operations"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#174D3B] via-[#174D3B]/60 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5 flex items-center gap-3 text-[#F7F0E5]">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#C69B36] border border-[#F0DFBD]/30 text-[#29272B]">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-[#A7BEA8]">Security Governance Portal</p>
                      <h2 className="font-display text-xl font-bold">Administrator Login</h2>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-sm text-[#E9D9C4] leading-relaxed">
                    Restricted governance portal for authorized security administrators managing
                    users, moderation queues, threat records, and platform telemetry.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-[#F0DFBD]">
                    {[
                      'Admin Dashboard',
                      'User Management',
                      'Scan Monitoring',
                      'Community Moderation',
                      'Threat Records',
                      'Audit Logs',
                    ].map((feat) => (
                      <div
                        key={feat}
                        className="flex items-center gap-1.5 rounded-lg border border-[#16765B] bg-[#123D2F] px-3 py-2"
                      >
                        <Shield className="h-3.5 w-3.5 text-[#E3B34C] shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>

                  {adminError && (
                    <div className="rounded-lg border border-[#E27D70]/50 bg-[#29272B]/80 p-3 text-xs text-[#FADED8] flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#E27D70]" />
                      <span>{adminError}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 space-y-2.5">
                <Link
                  to="/signin/admin"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#16765B] border border-[#C69B36]/45 px-5 py-3 text-sm font-semibold text-[#F7F0E5] hover:bg-[#14654E] transition-colors"
                >
                  <span>Continue as Administrator</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={handleAdminDemo}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C69B36] px-4 py-2.5 text-xs font-bold text-[#29272B] hover:bg-[#E3B34C] disabled:opacity-60 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>{busyAction === 'admin-demo' ? 'Opening...' : 'Login with Demo'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => handleGooglePortal('ADMIN')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#C69B36]/40 bg-[#29272B] px-4 py-2.5 text-xs font-semibold text-[#F0DFBD] hover:bg-[#123D2F] disabled:opacity-60 transition-colors"
                  >
                    <GoogleIcon />
                    <span>
                      {busyAction === 'admin-google'
                        ? 'Verifying...'
                        : googleConfigured
                        ? 'Continue with Google'
                        : 'Google (Not Configured)'}
                    </span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#E9D9C4]/15 flex flex-wrap items-center justify-between gap-2 text-xs text-[#A7BEA8]">
                  <Link to="/admin-setup" className="font-semibold text-[#E3B34C] hover:underline">
                    Admin Provisioning
                  </Link>
                  <span className="text-[11px] text-[#E9D9C4]/80">
                    Backend-verified Admin role
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// =====================================================================
// 2. CITIZEN / STUDENT LOGIN PAGE (Lavender, Plum, Coral)
// =====================================================================
export function StudentLoginPage() {
  const { loginWithToken, loginDemo } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [authConfig, setAuthConfig] = useState<AuthConfigResponse | null>(null);

  useEffect(() => {
    apiRequest<AuthConfigResponse>('/api/auth/config')
      .then(setAuthConfig)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await apiRequest<{ user: AuthUser; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe, expectedRole: 'STUDENT' }),
      });
      loginWithToken(res.user, res.token);
      showToast(`Signed in as ${res.user.name}.`, 'success');
      navigate('/student/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setDemoLoading(true);
    try {
      const u = await loginDemo('STUDENT');
      showToast(`Signed in to Citizen / Student Demo (${u.name}).`, 'success');
      navigate('/student/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to launch Citizen demo.');
    } finally {
      setDemoLoading(false);
    }
  };

  const googleAvailable = isFirebaseGoogleConfigured && authConfig?.googleClientIdConfigured !== false;

  const handleGoogleSignIn = async () => {
    setError('');
    if (!googleAvailable) {
      setError('Google Sign-In is not configured for this environment. Please use Login with Demo or email and password.');
      return;
    }
    setGoogleLoading(true);
    try {
      const idToken = await signInWithGooglePopup();
      const res = await apiRequest<{ user: AuthUser; token: string }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken, expectedRole: 'STUDENT' }),
      });
      loginWithToken(res.user, res.token);
      showToast(`Signed in with Google as ${res.user.name}.`, 'success');
      navigate('/student/dashboard');
    } catch (err) {
      setError(getGoogleErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#E9D9C4] text-[#29272B]">
      {/* Left Image Column (Dark Plum & Coral) */}
      <div className="relative hidden lg:flex lg:col-span-6 flex-col justify-between p-10 bg-[#46304F] text-[#F7F0E5] overflow-hidden">
        <ResilientImage
          src="/src/assets/images/hero_career_shield_1795578121127.jpg"
          alt="Student reviewing a job offer letter with a laptop in a modern study room"
          fallbackTitle="Citizen / Student Protection"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#46304F]/95 via-[#563653]/80 to-[#C65D45]/40" />

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/">
            <BrandLogo variant="plum" />
          </Link>
          <span className="text-xs font-semibold text-[#F0DFBD]">Citizen / Student Portal</span>
        </div>

        <div className="relative z-10 space-y-4 max-w-lg">
          <h2 className="font-display text-3xl font-bold leading-tight text-[#F7F0E5]">
            Verify Every Offer Before You Commit.
          </h2>
          <p className="text-sm text-[#F0DFBD]/95 leading-relaxed">
            Inspect PDF offer letters, check HR email authenticity, investigate company domains, and
            protect your career from advance-fee scams.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs text-[#E27D70] border-t border-[#F0DFBD]/20">
            <span>5 Security Scanners</span>
            <span aria-hidden="true">·</span>
            <span>Interactive Trust Graph</span>
            <span aria-hidden="true">·</span>
            <span>Protection Centre</span>
          </div>
        </div>
      </div>

      {/* Right Login Column (Plum, Lavender, Coral) */}
      <div className="lg:col-span-6 flex flex-col justify-center py-10 px-4 sm:px-8 bg-gradient-to-br from-[#EFEAF2] via-[#F7F0E5] to-[#FBEAE3]">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <Link
              to="/signin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#563653] hover:text-[#C65D45]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Login Selection</span>
            </Link>
            <Link to="/" className="lg:hidden">
              <BrandLogo />
            </Link>
          </div>

          <div className="rounded-2xl border border-[#B9A5C9]/65 bg-[#FFFDF8] p-6 sm:p-8 shadow-sm space-y-5">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#C65D45]">Citizen / Student Workspace</p>
              <h1 className="font-display text-2xl font-bold text-[#46304F]">
                Welcome Back, Job Seeker
              </h1>
              <p className="text-sm text-[#563653]">
                Sign in to protect your recruitment journey.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-[#842D48]/35 bg-[#FADED8] p-3.5 text-sm text-[#651F35] flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={demoLoading || submitting || googleLoading}
                onClick={handleDemo}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E27D70] px-4 py-2.5 text-xs font-bold text-[#29272B] hover:bg-[#C65D45] hover:text-[#F7F0E5] disabled:opacity-60 transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                <span>{demoLoading ? 'Loading Demo...' : 'Login with Demo'}</span>
              </button>
              <button
                type="button"
                disabled={googleLoading || submitting || demoLoading}
                onClick={handleGoogleSignIn}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#B9A5C9] bg-[#EFEAF2] px-4 py-2.5 text-xs font-semibold text-[#46304F] hover:bg-[#E2D8EA] disabled:opacity-60 transition-colors"
              >
                <GoogleIcon />
                <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#563653]/15" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#F7F0E5] px-2 text-[#563653]">Or Sign In With Email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="student-email" className="block text-sm font-medium text-[#46304F] mb-1">
                  Email Address
                </label>
                <input
                  id="student-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#B9A5C9] bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#563653] focus:outline-none"
                  placeholder="you@college.edu"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="student-password" className="text-sm font-medium text-[#46304F]">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-medium text-[#C65D45] hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="student-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#B9A5C9] bg-[#FFFDF8] px-3.5 py-2.5 pr-10 text-sm text-[#29272B] focus:border-[#563653] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-2.5 p-1 text-[#563653] hover:text-[#29272B]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-[#4F3B42] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#B9A5C9] text-[#563653]"
                />
                <span>Remember this session</span>
              </label>

              <button
                type="submit"
                disabled={submitting || googleLoading || demoLoading}
                className="w-full rounded-lg bg-[#563653] py-2.5 text-sm font-semibold text-[#F7F0E5] hover:bg-[#46304F] disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-[#563653]">
              New to JOBSHIELD?{' '}
              <Link to="/register" className="font-semibold text-[#C65D45] hover:underline">
                Create Citizen Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 3. ADMINISTRATOR LOGIN PAGE (Forest Green, Emerald, Antique Gold)
// =====================================================================
export function AdminLoginPage() {
  const { loginWithToken, loginDemo } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [authConfig, setAuthConfig] = useState<AuthConfigResponse | null>(null);

  useEffect(() => {
    apiRequest<AuthConfigResponse>('/api/auth/config')
      .then(setAuthConfig)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await apiRequest<{ user: AuthUser; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, expectedRole: 'ADMIN' }),
      });
      loginWithToken(res.user, res.token);
      showToast(`Administrator signed in (${res.user.email}).`, 'success');
      navigate('/admin/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminDemo = async () => {
    setError('');
    setDemoLoading(true);
    try {
      const u = await loginDemo('ADMIN');
      showToast(`Signed in to Administrator Demo (${u.name}).`, 'success');
      navigate('/admin/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start Administrator demo.');
    } finally {
      setDemoLoading(false);
    }
  };

  const googleAvailable = isFirebaseGoogleConfigured && authConfig?.googleClientIdConfigured !== false;

  const handleAdminGoogle = async () => {
    setError('');
    if (!googleAvailable) {
      setError('Google OAuth is not configured on this server. Use Login with Demo or provisioned credentials.');
      return;
    }
    setGoogleLoading(true);
    try {
      const idToken = await signInWithGooglePopup();
      const res = await apiRequest<{ user: AuthUser; token: string }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken, expectedRole: 'ADMIN' }),
      });
      loginWithToken(res.user, res.token);
      showToast(`Administrator signed in with Google (${res.user.email}).`, 'success');
      navigate('/admin/overview');
    } catch (err) {
      setError(getGoogleErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#174D3B] text-[#F7F0E5]">
      {/* Left Security Operations Image Column */}
      <div className="relative hidden lg:flex lg:col-span-6 flex-col justify-between p-10 bg-[#29272B] overflow-hidden">
        <ResilientImage
          src="/src/assets/images/admin_security_operations_1795580300367.jpg"
          alt="Cybersecurity operations analyst monitoring JOBSHIELD security dashboards"
          fallbackTitle="JOBSHIELD Security Operations"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#174D3B] via-[#29272B]/75 to-[#16765B]/55" />

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/">
            <BrandLogo variant="forest" />
          </Link>
          <span className="text-xs font-semibold text-[#E3B34C]">Security Operations</span>
        </div>

        <div className="relative z-10 space-y-4 max-w-lg">
          <h2 className="font-display text-3xl font-bold leading-tight text-[#F7F0E5]">
            Platform Governance &amp; Threat Moderation.
          </h2>
          <p className="text-sm text-[#E9D9C4] leading-relaxed">
            Access restricted platform controls for community report moderation, company verification
            records, domain threat indicators, audit logs, and system integration health.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs text-[#E3B34C] border-t border-[#F0DFBD]/15">
            <span>Server-Verified Admin Role</span>
            <span aria-hidden="true">·</span>
            <span>Immutable Audit Logging</span>
            <span aria-hidden="true">·</span>
            <span>Threat Indicator Governance</span>
          </div>
        </div>
      </div>

      {/* Right Forest Green / Emerald / Charcoal / Antique Gold Login Panel */}
      <div className="lg:col-span-6 flex flex-col justify-center py-10 px-4 sm:px-8 bg-gradient-to-br from-[#174D3B] via-[#123D2F] to-[#29272B]">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <Link
              to="/signin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A7BEA8] hover:text-[#F7F0E5]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Login Selection</span>
            </Link>
            <Link to="/" className="lg:hidden">
              <BrandLogo variant="forest" />
            </Link>
          </div>

          <div className="rounded-2xl border border-[#C69B36]/45 bg-[#29272B]/95 p-6 sm:p-8 shadow-xl space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#C69B36]">
                <Lock className="h-3.5 w-3.5" />
                <span>Restricted Administrative Portal</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-[#F7F0E5]">Administrator Access</h1>
              <p className="text-sm text-[#E9D9C4]">
                Securely manage and monitor the JOBSHIELD platform.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-[#E27D70]/50 bg-[#651F35]/80 p-3.5 text-sm text-[#FADED8] flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#E27D70]" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={demoLoading || submitting || googleLoading}
                onClick={handleAdminDemo}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C69B36] px-4 py-2.5 text-xs font-bold text-[#29272B] hover:bg-[#E3B34C] disabled:opacity-60 transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                <span>{demoLoading ? 'Loading Demo...' : 'Login with Demo'}</span>
              </button>
              <button
                type="button"
                disabled={googleLoading || submitting || demoLoading}
                onClick={handleAdminGoogle}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#16765B] bg-[#174D3B] px-4 py-2.5 text-xs font-semibold text-[#F7F0E5] hover:bg-[#16765B] disabled:opacity-60 transition-colors"
              >
                <GoogleIcon />
                <span>{googleLoading ? 'Verifying...' : 'Continue with Google'}</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E9D9C4]/15" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#29272B] px-2 text-[#A7BEA8]">Provisioned Email Login</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-[#E9D9C4] mb-1">
                  Administrator Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#16765B] bg-[#174D3B]/65 px-3.5 py-2.5 text-sm text-[#F7F0E5] placeholder:text-[#A7BEA8]/50 focus:border-[#C69B36] focus:outline-none"
                  placeholder="admin@jobshield.org"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="admin-password" className="text-sm font-medium text-[#E9D9C4]">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-medium text-[#E3B34C] hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#16765B] bg-[#174D3B]/65 px-3.5 py-2.5 pr-10 text-sm text-[#F7F0E5] focus:border-[#C69B36] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-2.5 p-1 text-[#A7BEA8] hover:text-[#F7F0E5]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || demoLoading || googleLoading}
                className="w-full rounded-lg bg-[#16765B] py-2.5 text-sm font-semibold text-[#F7F0E5] hover:bg-[#13604B] disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Verifying Administrator...' : 'Secure Sign In'}
              </button>
            </form>

            <div className="rounded-lg border border-[#16765B]/60 bg-[#174D3B]/55 p-3.5 text-xs text-[#E9D9C4] leading-relaxed">
              Administrator verification is enforced on the backend server. Public Citizen accounts
              cannot obtain Administrator access.
            </div>

            {authConfig && authConfig.adminCount === 0 && (
              <div className="border-t border-[#E9D9C4]/15 pt-4 text-center text-xs text-[#E3B34C]">
                No production administrator exists yet on this database.{' '}
                <Link to="/admin-setup" className="font-semibold underline hover:text-[#F7F0E5]">
                  Complete Initial Provisioning
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { loginWithToken } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setError('');
    if (!isFirebaseGoogleConfigured) {
      setError('Google Sign-In is not configured for this environment.');
      return;
    }
    setGoogleLoading(true);
    try {
      const idToken = await signInWithGooglePopup();
      const res = await apiRequest<{ user: AuthUser; token: string }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken, expectedRole: 'STUDENT' }),
      });
      loginWithToken(res.user, res.token);
      showToast(`Signed in with Google as ${res.user.name}.`, 'success');
      navigate('/student/dashboard');
    } catch (err) {
      setError(getGoogleErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms and Conditions and Privacy Policy.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest<{
        user: AuthUser;
        token: string;
        previewVerificationToken?: string;
      }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, college, acceptedTerms }),
      });
      loginWithToken(res.user, res.token);
      showToast('Citizen / Student account created.', 'success');
      if (res.previewVerificationToken) {
        navigate(`/verify-email?token=${encodeURIComponent(res.previewVerificationToken)}`);
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create Citizen / Student Account"
      subtitle="Verify offer letters, recruitment emails, URLs, and messages safely. All public registrations create a Citizen / Student account."
    >
      {error && (
        <div className="rounded-lg border border-[#651F35]/30 bg-[#FBEAE3] p-3.5 text-sm text-[#651F35] flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#46304F] mb-1">Full Name</label>
          <input
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#563653] focus:outline-none"
            placeholder="e.g. Aarav Sharma"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#46304F] mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#563653] focus:outline-none"
            placeholder="aarav@university.edu.in"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#46304F] mb-1">
            College / Organization <span className="text-[#563653]/75 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#563653] focus:outline-none"
            placeholder="e.g. Pune Institute of Computer Technology"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#46304F] mb-1">
            Password <span className="text-[#563653]/75 font-normal">(Min. 8 characters)</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] px-3.5 py-2.5 pr-10 text-sm text-[#29272B] focus:border-[#563653] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-2.5 p-1 text-[#563653] hover:text-[#46304F]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#46304F] mb-1">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] px-3.5 py-2.5 pr-10 text-sm text-[#29272B] focus:border-[#563653] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute right-2.5 top-2.5 p-1 text-[#563653] hover:text-[#46304F]"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-start gap-2.5 text-xs text-[#4F3B42] cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 rounded border-[#B9A5C9] text-[#563653]"
          />
          <span>
            I accept the{' '}
            <Link to="/terms" className="text-[#651F35] underline font-medium">
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-[#651F35] underline font-medium">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting || googleLoading}
          className="w-full rounded-lg bg-[#563653] py-2.5 text-sm font-semibold text-[#F7F0E5] hover:bg-[#46304F] disabled:opacity-60 transition-colors"
        >
          {submitting ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {isFirebaseGoogleConfigured && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#B9A5C9]/40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#F7F0E5] px-2 text-[#563653]">Or</span>
            </div>
          </div>

          <button
            type="button"
            disabled={googleLoading || submitting}
            onClick={handleGoogleSignUp}
            className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] py-2.5 px-4 text-sm font-medium text-[#46304F] hover:bg-[#EFEAF2] disabled:opacity-60 transition-colors flex items-center justify-center gap-2.5"
          >
            <GoogleIcon />
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>
        </>
      )}

      <p className="text-center text-sm text-[#4F3B42]">
        Already have an account?{' '}
        <Link to="/signin/student" className="font-semibold text-[#651F35] hover:underline">
          Citizen / Student Sign In
        </Link>
      </p>
    </AuthShell>
  );
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState(params.get('token') || '');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleVerify = async (tok: string) => {
    setStatus('verifying');
    try {
      await apiRequest('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: tok }),
      });
      await refreshUser();
      setStatus('done');
      setMessage('Your email address has been verified.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Verification failed.');
    }
  };

  return (
    <AuthShell
      title="Verify Your Email"
      subtitle="Confirm your email address to complete your Citizen / Student account setup."
    >
      {status === 'done' ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#16765B]/30 bg-[#E7EFE8] p-4 text-sm text-[#174D3B] flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{message}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            className="w-full rounded-lg bg-[#563653] py-2.5 text-sm font-semibold text-[#F7F0E5] hover:bg-[#46304F]"
          >
            Continue to Citizen Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {status === 'error' && (
            <div className="rounded-lg border border-[#651F35]/30 bg-[#FBEAE3] p-3.5 text-sm text-[#651F35]">
              {message}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#46304F] mb-1">
              Verification Token
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] px-3.5 py-2.5 font-mono-tabular text-xs text-[#29272B]"
            />
          </div>
          <button
            type="button"
            disabled={!token.trim() || status === 'verifying'}
            onClick={() => handleVerify(token)}
            className="w-full rounded-lg bg-[#563653] py-2.5 text-sm font-semibold text-[#F7F0E5] hover:bg-[#46304F] disabled:opacity-60"
          >
            {status === 'verifying' ? 'Verifying...' : 'Verify Email Address'}
          </button>
          <Link
            to="/student/dashboard"
            className="block text-center text-xs text-[#563653] hover:text-[#651F35]"
          >
            Skip for now and go to Dashboard
          </Link>
        </div>
      )}
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState('');
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await apiRequest<{ message: string; previewResetToken?: string }>(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        }
      );
      setSubmittedMsg(res.message);
      setPreviewToken(res.previewResetToken || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request password reset.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter your registered email address to request a time-limited reset link."
    >
      {submittedMsg ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#563653]/25 bg-[#EFEAF2] p-4 text-sm text-[#46304F]">
            {submittedMsg}
          </div>
          {previewToken && (
            <div className="rounded-lg border border-[#B9A5C9]/60 bg-[#F0DFBD]/65 p-3.5 text-xs space-y-2">
              <p className="font-medium text-[#46304F]">
                Preview Reset Link (SMTP not configured in dev preview):
              </p>
              <Link
                to={`/reset-password?token=${encodeURIComponent(previewToken)}`}
                className="block font-semibold text-[#651F35] underline break-all"
              >
                Open Reset Password Form
              </Link>
            </div>
          )}
          <Link to="/signin" className="block text-center text-sm font-medium text-[#563653]">
            Back to Login Selection
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-[#651F35]/30 bg-[#FBEAE3] p-3.5 text-sm text-[#651F35] flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#46304F] mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#563653] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#563653] py-2.5 text-sm font-semibold text-[#F7F0E5] hover:bg-[#46304F] disabled:opacity-60"
          >
            {submitting ? 'Processing...' : 'Request Password Reset'}
          </button>
          <Link to="/signin" className="block text-center text-sm text-[#563653] hover:text-[#651F35]">
            Back to Login Selection
          </Link>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [token, setToken] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      showToast('Password updated. Please sign in.', 'success');
      navigate('/signin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Choose a new password (minimum 8 characters)."
    >
      {error && (
        <div className="rounded-lg border border-[#651F35]/30 bg-[#FBEAE3] p-3.5 text-sm text-[#651F35]">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#46304F] mb-1">Reset Token</label>
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] px-3.5 py-2.5 font-mono-tabular text-xs text-[#29272B]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#46304F] mb-1">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] px-3.5 py-2.5 pr-10 text-sm text-[#29272B]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-2.5 p-1 text-[#563653] hover:text-[#46304F]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#46304F] mb-1">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] px-3.5 py-2.5 pr-10 text-sm text-[#29272B]"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute right-2.5 top-2.5 p-1 text-[#563653] hover:text-[#46304F]"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[#563653] py-2.5 text-sm font-semibold text-[#F7F0E5] hover:bg-[#46304F]"
        >
          {submitting ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </AuthShell>
  );
}

export function AdminSetupPage() {
  const { loginWithToken } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [config, setConfig] = useState<AuthConfigResponse | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiRequest<AuthConfigResponse>('/api/auth/config')
      .then(setConfig)
      .catch(() => {});
  }, []);

  const locked = Boolean(config && config.adminCount > 0 && !config.adminPasscodeConfigured);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await apiRequest<{ user: AuthUser; token: string }>('/api/auth/admin-bootstrap', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, passcode }),
      });
      loginWithToken(res.user, res.token);
      showToast('Administrator account provisioned.', 'success');
      navigate('/admin/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin setup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      dark
      title="Administrator Provisioning"
      subtitle="Protected initial setup for JOBSHIELD Security Operations. Public registration never grants Admin access."
    >
      {locked ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#C69B36]/40 bg-[#123D2F] p-4 text-sm text-[#F7F0E5] flex items-start gap-2.5">
            <Lock className="h-4 w-4 text-[#E3B34C] shrink-0 mt-0.5" />
            <span>
              An administrator account has already been claimed and initial setup is locked. Please
              sign in via Administrator Access or configure ADMIN_BOOTSTRAP_PASSCODE on the server.
            </span>
          </div>
          <Link
            to="/signin/admin"
            className="block w-full rounded-lg bg-[#16765B] py-2.5 text-center text-sm font-semibold text-[#F7F0E5] hover:bg-[#125F49]"
          >
            Go to Administrator Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-[#E27D70]/50 bg-[#651F35]/60 p-3.5 text-sm text-[#FBEAE3]">
              {error}
            </div>
          )}
          <div className="rounded-lg border border-[#C69B36]/45 bg-[#123D2F] p-3.5 text-xs text-[#F0DFBD] flex items-start gap-2">
            <Shield className="h-4 w-4 text-[#E3B34C] shrink-0 mt-0.5" />
            <span>
              {config?.adminPasscodeConfigured
                ? 'Enter the server ADMIN_BOOTSTRAP_PASSCODE to authorize a new administrator.'
                : 'No production administrator exists yet. Complete this one-time form to claim the initial Administrator account.'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F0DFBD] mb-1">Admin Name</label>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#A7BEA8]/35 bg-[#123D2F] px-3.5 py-2.5 text-sm text-[#F7F0E5] focus:border-[#E3B34C] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F0DFBD] mb-1">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#A7BEA8]/35 bg-[#123D2F] px-3.5 py-2.5 text-sm text-[#F7F0E5] focus:border-[#E3B34C] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F0DFBD] mb-1">
              Password (Min. 10 characters)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#A7BEA8]/35 bg-[#123D2F] px-3.5 py-2.5 pr-10 text-sm text-[#F7F0E5] focus:border-[#E3B34C] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-2.5 p-1 text-[#A7BEA8] hover:text-[#F7F0E5]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {config?.adminPasscodeConfigured && (
            <div>
              <label className="block text-sm font-medium text-[#F0DFBD] mb-1">
                Server Bootstrap Passcode
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full rounded-lg border border-[#A7BEA8]/35 bg-[#123D2F] px-3.5 py-2.5 pr-10 text-sm text-[#F7F0E5] focus:border-[#E3B34C] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode((v) => !v)}
                  aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  className="absolute right-2.5 top-2.5 p-1 text-[#A7BEA8] hover:text-[#F7F0E5]"
                >
                  {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#C69B36] py-2.5 text-sm font-bold text-[#29272B] hover:bg-[#E3B34C] transition-colors"
          >
            {submitting ? 'Provisioning...' : 'Provision Administrator'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export { LoginSelectionPage as SignInPage };
