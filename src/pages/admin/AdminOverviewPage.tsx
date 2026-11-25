import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ResilientImage } from '../../components/common/RiskDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../services/api';

interface AdminOverviewData {
  metrics: {
    totalUsers: number;
    totalStudents: number;
    totalScans: number;
    highRiskFindings: number;
    suspiciousFindings: number;
    lowerRiskFindings?: number;
    totalCommunityReports?: number;
    pendingCommunityReports: number;
    confirmedThreatReports?: number;
    confirmedThreatIndicators: number;
  };
  userRegistrationTrend: Array<{ date: string; count: number }>;
  scanActivityTrend: Array<{ date: string; count: number }>;
  riskDistribution: Array<{ name: string; value: number }>;
  scannerUsage: Array<{ name: string; count: number }>;
  reportStatusDistribution: Array<{ name: string; value: number }>;
  pendingModerationQueue?: Array<{
    id: string;
    category: string;
    companyName: string;
    createdAt: string;
    moneyRequested: boolean;
  }>;
  recentAuditLogs?: Array<{
    id: string;
    actorEmail?: string;
    actorId: string;
    action: string;
    targetType: string;
    targetId: string;
    timestamp: string;
  }>;
  systemHealthSummary?: {
    backend: string;
    database: string;
    gemini: string;
    webRisk: string;
    googleOAuth: string;
  };
}

const RISK_COLORS: Record<string, string> = {
  'Lower Risk': '#16765B',
  Suspicious: '#C69B36',
  'High Risk': '#842D48',
  'Insufficient Evidence': '#563653',
};

const REPORT_STATUS_COLORS: Record<string, string> = {
  'Under Review': '#A96B45',
  Corroborated: '#C69B36',
  Confirmed: '#842D48',
  Rejected: '#29272B',
};

export function AdminOverviewPage() {
  const { user, demoResetVersion } = useAuth();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');
    apiRequest<AdminOverviewData>('/api/admin/overview')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load platform metrics.'))
      .finally(() => setLoading(false));
  }, [demoResetVersion, reloadKey]);

  return (
    <AdminLayout title="Administrator Overview">
      {loading ? (
        <div className="rounded-2xl border border-[#174D3B]/20 bg-[#F7F0E5] p-10 text-center text-sm text-[#29272B]/75">
          Loading platform metrics...
        </div>
      ) : error || !data ? (
        <div className="rounded-2xl border border-[#842D48]/30 bg-[#FBEAE3] p-10 text-center space-y-3">
          <AlertTriangle className="h-7 w-7 text-[#842D48] mx-auto" />
          <p className="text-sm font-medium text-[#651F35]">
            {error || 'Unable to load administrator overview metrics.'}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-lg bg-[#651F35] px-4 py-2 text-xs font-semibold text-[#F7F0E5] hover:bg-[#842D48]"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Emerald, Charcoal & Bronze Photographic Banner */}
          <section className="relative overflow-hidden rounded-2xl border border-[#CD8B60]/40 bg-[#29272B] text-[#F7F0E5] shadow-sm">
            <ResilientImage
              src="/src/assets/images/admin_security_operations_1795580300367.jpg"
              alt="Administrator security operations telemetry center"
              fallbackTitle="Security Operations Center"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#29272B]/95 via-[#16765B]/88 to-[#A96B45]/72" />
            <div className="relative z-10 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F0DFBD] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#CD8B60]" />
                  <span>
                    JOBSHIELD Security Operations Center{user?.isDemo ? ' · DEMO DATA SANDBOX' : ''}
                  </span>
                </p>
                <h2 className="font-display text-2xl font-bold text-[#F7F0E5]">
                  Platform Telemetry &amp; Moderation Overview
                </h2>
                <p className="text-sm text-[#F0DFBD]/90">
                  Live backend metrics across registered citizen accounts, scan pipelines, threat
                  indicators, and community moderation queues.
                </p>
              </div>
              <div className="rounded-xl bg-[#29272B]/90 border border-[#CD8B60]/55 px-5 py-3 text-right shrink-0">
                <p className="text-[11px] uppercase tracking-wide text-[#CD8B60]">
                  Citizen Accounts{user?.isDemo ? ' · DEMO DATA' : ''}
                </p>
                <p className="font-mono-tabular text-2xl font-bold text-[#F7F0E5]">
                  {data.metrics.totalStudents}
                </p>
              </div>
            </div>
          </section>

          {/* Action-Oriented Operations Queue */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Moderation Queue',
                stat: `${data.metrics.pendingCommunityReports} Under Review`,
                desc: 'Review pending citizen scam reports and promote verified threat domains.',
                to: '/admin/moderation?status=UNDER_REVIEW',
                tone: 'border-[#A96B45]/35 bg-[#FBF3DF] text-[#8C4D27]',
              },
              {
                title: 'High-Risk Scan Queue',
                stat: `${data.metrics.highRiskFindings} High Risk · ${data.metrics.suspiciousFindings} Suspicious`,
                desc: 'Inspect flagged offer letters, URLs, emails, and job descriptions.',
                to: '/admin/scans?risk=HIGH_RISK',
                tone: 'border-[#842D48]/30 bg-[#FBEAE3] text-[#651F35]',
              },
              {
                title: 'Threat Indicators',
                stat: `${data.metrics.confirmedThreatIndicators} Confirmed Domains`,
                desc: 'Manage confirmed malicious domains and suspicious recruitment URLs.',
                to: '/admin/domains',
                tone: 'border-[#16765B]/30 bg-[#E6F2EC] text-[#16765B]',
              },
              {
                title: 'Governance & Audit Logs',
                stat: `${data.metrics.totalUsers} Accounts Tracked`,
                desc: 'Inspect account governance, company records, and security audit trails.',
                to: '/admin/audit-logs',
                tone: 'border-[#29272B]/25 bg-[#F0DFBD]/75 text-[#29272B]',
              },
            ].map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className={`rounded-xl border p-4 flex flex-col justify-between gap-3 hover:shadow-sm transition-all hover:-translate-y-0.5 ${item.tone}`}
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wide">{item.title}</p>
                  <p className="font-mono-tabular text-sm font-bold text-[#29272B]">{item.stat}</p>
                  <p className="text-xs text-[#4F3B42] leading-relaxed">{item.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold">
                  <span>Open Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </section>

          {/* High-Contrast Clickable KPI Grid */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {[
              {
                label: 'Total Users',
                value: data.metrics.totalUsers,
                to: '/admin/users',
                cls: 'text-[#29272B]',
                cardCls: 'bg-[#F7F0E5] border-[#29272B]/25 hover:border-[#29272B]',
              },
              {
                label: 'Total Scans',
                value: data.metrics.totalScans,
                to: '/admin/scans',
                cls: 'text-[#16765B]',
                cardCls: 'bg-[#E6F2EC] border-[#16765B]/30 hover:border-[#16765B]',
              },
              {
                label: 'High-Risk Findings',
                value: data.metrics.highRiskFindings,
                to: '/admin/scans?risk=HIGH_RISK',
                cls: 'text-[#842D48]',
                cardCls: 'bg-[#FBEAE3] border-[#842D48]/30 hover:border-[#842D48]',
              },
              {
                label: 'Suspicious Findings',
                value: data.metrics.suspiciousFindings,
                to: '/admin/scans?risk=SUSPICIOUS',
                cls: 'text-[#A96B45]',
                cardCls: 'bg-[#FBF3DF] border-[#CD8B60]/40 hover:border-[#A96B45]',
              },
              {
                label: 'Lower-Risk Findings',
                value: data.metrics.lowerRiskFindings ?? 0,
                to: '/admin/scans?risk=LOWER_RISK',
                cls: 'text-[#16765B]',
                cardCls: 'bg-[#E6F2EC] border-[#16765B]/30 hover:border-[#16765B]',
              },
              {
                label: 'Community Reports',
                value: data.metrics.totalCommunityReports ?? 0,
                to: '/admin/moderation',
                cls: 'text-[#29272B]',
                cardCls: 'bg-[#F7F0E5] border-[#29272B]/25 hover:border-[#29272B]',
              },
              {
                label: 'Pending Reports',
                value: data.metrics.pendingCommunityReports,
                to: '/admin/moderation?status=UNDER_REVIEW',
                cls: 'text-[#8C4D27]',
                cardCls: 'bg-[#F0DFBD] border-[#A96B45]/35 hover:border-[#A96B45]',
              },
              {
                label: 'Confirmed Reports',
                value: data.metrics.confirmedThreatReports ?? 0,
                to: '/admin/moderation?status=CONFIRMED',
                cls: 'text-[#842D48]',
                cardCls: 'bg-[#FBEAE3] border-[#842D48]/30 hover:border-[#842D48]',
              },
              {
                label: 'Confirmed Threats',
                value: data.metrics.confirmedThreatIndicators,
                to: '/admin/domains',
                cls: 'text-[#16765B]',
                cardCls: 'bg-[#D8EDE3] border-[#16765B]/35 hover:border-[#16765B]',
              },
            ].map((kpi) => (
              <Link
                key={kpi.label}
                to={kpi.to}
                className={`rounded-xl border p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm block ${kpi.cardCls}`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <p className="text-xs font-semibold text-[#29272B]/85">{kpi.label}</p>
                  {user?.isDemo && (
                    <span className="font-mono-tabular text-[9px] font-bold uppercase text-[#29272B]/65">
                      DEMO DATA
                    </span>
                  )}
                </div>
                <p className={`mt-2 font-mono-tabular text-2xl font-bold ${kpi.cls}`}>
                  {kpi.value}
                </p>
              </Link>
            ))}
          </section>

          {/* Charts Grid (All 5 Required Charts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. User Registration Trend */}
            <section className="rounded-2xl border border-[#16765B]/25 bg-[#F7F0E5] overflow-hidden shadow-xs">
              <div className="bg-[#16765B] border-b border-[#16765B]/25 px-6 py-3.5 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#F7F0E5]">
                  User Registration Trend
                </h3>
                {user?.isDemo && (
                  <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#F0DFBD]">
                    DEMO DATA
                  </span>
                )}
              </div>
              <div className="p-6">
                {data.userRegistrationTrend.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-xs text-[#29272B]/70 bg-[#E9D9C4]/50 rounded-xl">
                    No user registrations recorded yet.
                  </div>
                ) : (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.userRegistrationTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E9D9C4" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#29272B' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#29272B' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#16765B" strokeWidth={2.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            {/* 2. Scan Activity */}
            <section className="rounded-2xl border border-[#A96B45]/30 bg-[#F7F0E5] overflow-hidden shadow-xs">
              <div className="bg-[#A96B45] border-b border-[#8C4D27]/25 px-6 py-3.5 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#F7F0E5]">
                  Scan Activity Trend
                </h3>
                {user?.isDemo && (
                  <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#F0DFBD]">
                    DEMO DATA
                  </span>
                )}
              </div>
              <div className="p-6">
                {data.scanActivityTrend.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-xs text-[#29272B]/70 bg-[#E9D9C4]/50 rounded-xl">
                    No scan activity recorded yet.
                  </div>
                ) : (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.scanActivityTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E9D9C4" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#29272B' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#29272B' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#A96B45" strokeWidth={2.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            {/* 3. Risk Distribution */}
            <section className="rounded-2xl border border-[#29272B]/25 bg-[#F7F0E5] overflow-hidden shadow-xs">
              <div className="bg-[#29272B] text-[#F7F0E5] px-6 py-3.5 flex items-center justify-between">
                <h3 className="font-display text-base font-bold">Risk Distribution</h3>
                {user?.isDemo && (
                  <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#CD8B60]">
                    DEMO DATA
                  </span>
                )}
              </div>
              <div className="p-6">
                {data.metrics.totalScans === 0 ? (
                  <div className="h-56 flex items-center justify-center text-xs text-[#29272B]/70 bg-[#E9D9C4]/50 rounded-xl">
                    Risk distribution will populate once scans are completed.
                  </div>
                ) : (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.riskDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E9D9C4" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#29272B' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#29272B' }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {data.riskDistribution.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={RISK_COLORS[entry.name] || '#16765B'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            {/* 4. Scanner Usage */}
            <section className="rounded-2xl border border-[#16765B]/25 bg-[#F7F0E5] overflow-hidden shadow-xs">
              <div className="bg-[#E6F2EC] border-b border-[#16765B]/25 px-6 py-3.5 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#16765B]">
                  Scanner Usage by Module
                </h3>
                {user?.isDemo && (
                  <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#29272B]/70">
                    DEMO DATA
                  </span>
                )}
              </div>
              <div className="p-6">
                {data.metrics.totalScans === 0 ? (
                  <div className="h-56 flex items-center justify-center text-xs text-[#29272B]/70 bg-[#E9D9C4]/50 rounded-xl">
                    No scanner usage recorded yet.
                  </div>
                ) : (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.scannerUsage}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E9D9C4" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#29272B' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#29272B' }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#16765B" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* 5. Community Report Status Chart & Breakdown */}
          <section className="rounded-2xl border border-[#29272B]/25 bg-[#F7F0E5] overflow-hidden shadow-xs">
            <div className="bg-[#29272B] text-[#F7F0E5] px-6 py-3.5 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Community Report Status</h3>
              <span className="text-xs font-semibold text-[#CD8B60]">
                Moderation Breakdown{user?.isDemo ? ' · DEMO DATA' : ''}
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 h-52">
                {data.reportStatusDistribution.every((d) => d.value === 0) ? (
                  <div className="h-full flex items-center justify-center text-xs text-[#29272B]/70 bg-[#E9D9C4]/50 rounded-xl">
                    No community reports submitted yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.reportStatusDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E9D9C4" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#29272B' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#29272B' }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.reportStatusDistribution.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={REPORT_STATUS_COLORS[entry.name] || '#16765B'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                {data.reportStatusDistribution.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-xl border border-[#29272B]/15 bg-[#E9D9C4]/55 p-4"
                  >
                    <p className="text-xs font-semibold text-[#29272B]/80">{item.name}</p>
                    <p
                      className="mt-1 font-mono-tabular text-2xl font-bold"
                      style={{ color: REPORT_STATUS_COLORS[item.name] || '#29272B' }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pending Moderation Queue & Recent Administrative Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-[#A96B45]/30 bg-[#F7F0E5] overflow-hidden shadow-xs">
              <div className="bg-[#A96B45] px-6 py-3.5 flex items-center justify-between text-[#F7F0E5]">
                <h3 className="font-display text-base font-bold">
                  Pending Moderation Queue ({data.metrics.pendingCommunityReports})
                </h3>
                <Link
                  to="/admin/moderation?status=UNDER_REVIEW"
                  className="text-xs font-semibold text-[#F0DFBD] hover:underline"
                >
                  Open Queue →
                </Link>
              </div>
              <div className="p-5 space-y-2.5">
                {!data.pendingModerationQueue || data.pendingModerationQueue.length === 0 ? (
                  <p className="text-xs text-[#4F3B42]">No pending community reports awaiting triage.</p>
                ) : (
                  data.pendingModerationQueue.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#A96B45]/20 bg-[#FBF3DF] px-4 py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#29272B] truncate">{item.companyName}</p>
                        <p className="text-[#8C4D27]">
                          {item.category} · <span className="font-mono-tabular">{item.id}</span>
                          {item.moneyRequested ? ' · Fee Demanded' : ''}
                        </p>
                      </div>
                      <span className="font-mono-tabular text-[11px] text-[#4F3B42] shrink-0">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#2F4F4A]/25 bg-[#F7F0E5] overflow-hidden shadow-xs">
              <div className="bg-[#2F4F4A] px-6 py-3.5 flex items-center justify-between text-[#F3FAF6]">
                <h3 className="font-display text-base font-bold">Recent Administrative Actions</h3>
                <Link to="/admin/audit-logs" className="text-xs font-semibold text-[#D8EDE3] hover:underline">
                  Full Audit Trail →
                </Link>
              </div>
              <div className="p-5 space-y-2.5">
                {!data.recentAuditLogs || data.recentAuditLogs.length === 0 ? (
                  <p className="text-xs text-[#4F3B42]">No audit log events recorded yet.</p>
                ) : (
                  data.recentAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-[#2F4F4A]/15 bg-[#E6F2EC] px-4 py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-mono-tabular font-bold text-[#26403C] truncate">
                          {log.action}
                        </p>
                        <p className="text-[#29272B]/80 truncate">
                          {log.actorEmail || log.actorId} · {log.targetType}:{log.targetId}
                        </p>
                      </div>
                      <span className="font-mono-tabular text-[11px] text-[#29272B]/70 shrink-0">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* System Health Overview Strip */}
          {data.systemHealthSummary && (
            <section className="rounded-2xl border border-[#16765B]/25 bg-[#E6F2EC] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#174D3B]">
                  System Health Overview{user?.isDemo ? ' · DEMO DATA' : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {[
                    { label: 'API Backend', status: data.systemHealthSummary.backend },
                    { label: 'SQLite Database', status: data.systemHealthSummary.database },
                    { label: 'Gemini AI', status: data.systemHealthSummary.gemini },
                    { label: 'Google Web Risk', status: data.systemHealthSummary.webRisk },
                    { label: 'Google OAuth', status: data.systemHealthSummary.googleOAuth },
                  ].map((svc) => (
                    <span
                      key={svc.label}
                      className="rounded-lg border border-[#16765B]/25 bg-[#F3FAF6] px-3 py-1.5 font-semibold text-[#29272B]"
                    >
                      {svc.label}:{' '}
                      <span
                        className={
                          svc.status === 'Connected' ? 'text-[#16765B]' : 'text-[#A96B45]'
                        }
                      >
                        {svc.status}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              <Link
                to="/admin/system-health"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#174D3B] px-4 py-2 text-xs font-semibold text-[#F7F0E5] hover:bg-[#16765B] shrink-0"
              >
                <span>Open System Health</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
