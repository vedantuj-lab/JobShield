import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AIChatDrawer } from './components/chat/AIChatDrawer';
import type { UserRole } from './types/jobshield';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import {
  AboutPage,
  ContactPage,
  FeaturesPage,
  HowItWorksPage,
  PrivacyPolicyPage,
  SafetyGuidePage,
  TermsPage,
} from './pages/public/PublicInfoPages';

// Auth Pages
import {
  AdminLoginPage,
  AdminSetupPage,
  ForgotPasswordPage,
  LoginSelectionPage,
  RegisterPage,
  ResetPasswordPage,
  StudentLoginPage,
  VerifyEmailPage,
} from './pages/auth/AuthPages';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { ScannerPage } from './pages/student/ScannerPage';
import { ReportDetailPage } from './pages/student/ReportDetailPage';
import { TrustIntelligencePage } from './pages/student/TrustIntelligencePage';
import { CommunityPage } from './pages/student/CommunityPage';
import { ProtectionCentrePage } from './pages/student/ProtectionCentrePage';
import {
  NotificationsPage,
  ProfileSettingsPage,
  SavedReportsPage,
  ScanHistoryPage,
} from './pages/student/StudentAccountPages';

// Admin Pages
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import {
  AdminModerationPage,
  AdminScansPage,
  AdminUsersPage,
} from './pages/admin/AdminOperationsPages';
import {
  AdminAuditLogsPage,
  AdminCompaniesPage,
  AdminDomainsPage,
  AdminEvidencePage,
  AdminSettingsPage,
  AdminSystemHealthPage,
} from './pages/admin/AdminRecordsAndSystemPages';

function ProtectedRoute({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F0E5] text-sm text-[#29272B]">
        Verifying session...
      </div>
    );
  }
  if (!user) {
    return <Navigate to={role === 'ADMIN' ? '/signin/admin' : '/signin/student'} replace />;
  }
  if (user.role !== role) {
    return (
      <Navigate
        to={user.role === 'ADMIN' ? '/admin/overview' : '/student/dashboard'}
        replace
      />
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Website */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/safety-guide" element={<SafetyGuidePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Multi-Role Authentication */}
            <Route path="/signin" element={<LoginSelectionPage />} />
            <Route path="/login" element={<Navigate to="/signin/student" replace />} />
            <Route path="/signin/student" element={<StudentLoginPage />} />
            <Route path="/admin-login" element={<Navigate to="/signin/admin" replace />} />
            <Route path="/signin/admin" element={<AdminLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/admin-setup" element={<AdminSetupPage />} />

            {/* Student Application (Role-Protected) */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute role="STUDENT">
                  <StudentDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/scanner"
              element={
                <ProtectedRoute role="STUDENT">
                  <ScannerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/reports/:id"
              element={
                <ProtectedRoute role="STUDENT">
                  <ReportDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/trust-intelligence"
              element={
                <ProtectedRoute role="STUDENT">
                  <TrustIntelligencePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/community"
              element={
                <ProtectedRoute role="STUDENT">
                  <CommunityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/protection"
              element={
                <ProtectedRoute role="STUDENT">
                  <ProtectionCentrePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/history"
              element={
                <ProtectedRoute role="STUDENT">
                  <ScanHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/saved"
              element={
                <ProtectedRoute role="STUDENT">
                  <SavedReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notifications"
              element={
                <ProtectedRoute role="STUDENT">
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute role="STUDENT">
                  <ProfileSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Application (Strictly Role-Protected) */}
            <Route path="/admin/dashboard" element={<Navigate to="/admin/overview" replace />} />
            <Route
              path="/admin/overview"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/scans"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminScansPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/moderation"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminModerationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/companies"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminCompaniesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/domains"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminDomainsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/evidence"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminEvidencePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminAuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/health"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminSystemHealthPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <AIChatDrawer />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
