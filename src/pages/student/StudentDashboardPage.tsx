import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Bookmark,
  FileText,
  Globe,
  Image,
  Mail,
  Network,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { ResilientImage, RiskStatusLabel } from '../../components/common/RiskDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../services/api';
import type { CommunityReport, NotificationRecord, ScanRecord } from '../../types/jobshield';

const QUICK_ACTIONS = [
  {
    title: 'Scan Offer Letter',
    desc: 'Inspect PDF or image offer letters for domain & fee red flags.',
    to: '/student/scanner?type=offer_letter',
    icon: FileText,
    cardCls: 'bg-[#FBEAE3] border-[#C65D45]/30 hover:border-[#C65D45]',
    iconCls: 'bg-[#C65D45] text-[#F7F0E5]',
  },
  {
    title: 'Check Email',
    desc: 'Analyse sender domains, Reply-To mismatches, and headers.',
    to: '/student/scanner?type=email',
    icon: Mail,
    cardCls: 'bg-[#E7F2F0] border-[#175E60]/25 hover:border-[#175E60]',
    iconCls: 'bg-[#175E60] text-[#F7F0E5]',
  },
  {
    title: 'Scan Website',
    desc: 'Check URLs via DNS, RDAP, TLS, and threat intelligence.',
    to: '/student/scanner?type=url',
    icon: Globe,
    cardCls: 'bg-[#EFEAF2] border-[#46304F]/25 hover:border-[#46304F]',
    iconCls: 'bg-[#46304F] text-[#F7F0E5]',
  },
  {
    title: 'Analyse Job Description',
    desc: 'Detect unrealistic salary, MLM, or registration fee traps.',
    to: '/student/scanner?type=job_description',
    icon: Sparkles,
    cardCls: 'bg-[#FBF3DF] border-[#C69B36]/35 hover:border-[#C69B36]',
    iconCls: 'bg-[#C69B36] text-[#29272B]',
  },
  {
    title: 'Analyse Screenshot',
    desc: 'Extract text from WhatsApp or Telegram messages via OCR.',
    to: '/student/scanner?type=screenshot',
    icon: Image,
    cardCls: 'bg-[#FBEAE3] border-[#E27D70]/35 hover:border-[#C65D45]',
    iconCls: 'bg-[#E27D70] text-[#29272B]',
  },
  {
    title: 'Report Suspicious Activity',
    desc: 'Submit fraudulent offers to Community Threat Intelligence.',
    to: '/student/community?new=1',
    icon: ShieldAlert,
    cardCls: 'bg-[#F0DFBD]/75 border-[#A96B45]/30 hover:border-[#A96B45]',
    iconCls: 'bg-[#A96B45] text-[#F7F0E5]',
  },
];

export function StudentDashboardPage() {
  const { user, demoResetVersion } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [myReports, setMyReports] = useState<CommunityReport[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      apiRequest<{ scans: ScanRecord[] }>('/api/scans'),
      apiRequest<{ reports: CommunityReport[] }>('/api/community/my-reports'),
      apiRequest<{ notifications: NotificationRecord[] }>('/api/users/notifications'),
    ])
      .then(([scanRes, repRes, notifRes]) => {
        if (active) {
          setScans(scanRes.scans);
          setMyReports(repRes.reports);
          setNotifications(notifRes.notifications);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load dashboard data.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [demoResetVersion, reloadKey]);

  const stats = useMemo(() => {
    return {
      total: scans.length,
      highRisk: scans.filter((s) => s.riskCategory === 'HIGH_RISK').length,
      suspicious: scans.filter((s) => s.riskCategory === 'SUSPICIOUS').length,
      lowerRisk: scans.filter((s) => s.riskCategory === 'LOWER_RISK').length,
      savedCount: scans.filter((s) => s.saved).length,
      reports: myReports.length,
    };
  }, [scans, myReports]);

  const latestScan = scans[0] || null;
  const savedReports = useMemo(() => scans.filter((s) => s.saved).slice(0, 3), [scans]);
  const recentAlerts = useMemo(() => notifications.slice(0, 3), [notifications]);

  const chartData = useMemo(
    () => [
      {
        name: 'Lower Risk',
        riskKey: 'LOWER_RISK',
        count: scans.filter((s) => s.riskCategory === 'LOWER_RISK').length,
        color: '#16765B',
      },
      {
        name: 'Suspicious',
        riskKey: 'SUSPICIOUS',
        count: scans.filter((s) => s.riskCategory === 'SUSPICIOUS').length,
        color: '#C69B36',
      },
      {
        name: 'High Risk',
        riskKey: 'HIGH_RISK',
        count: scans.filter((s) => s.riskCategory === 'HIGH_RISK').length,
        color: '#842D48',
      },
      {
        name: 'Insufficient',
        riskKey: 'INSUFFICIENT_EVIDENCE',
        count: scans.filter((s) => s.riskCategory === 'INSUFFICIENT_EVIDENCE').length,
        color: '#563653',
      },
    ],
    [scans]
  );

  const filteredScans = useMemo(() => {
    return scans
      .filter((s) => {
        const matchSearch =
          !search.trim() ||
          s.scanName.toLowerCase().includes(search.toLowerCase()) ||
          s.scanType.toLowerCase().includes(search.toLowerCase());
        const matchRisk = riskFilter === 'ALL' || s.riskCategory === riskFilter;
        return matchSearch && matchRisk;
      })
      .slice(0, 8);
  }, [scans, search, riskFilter]);

  return (
    <StudentLayout title="Dashboard">
      <div className="space-y-8">
        {/* Plum + Champagne + Coral Photographic Welcome Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-[#563653]/30 bg-[#46304F] text-[#F7F0E5] shadow-sm">
          <ResilientImage
            src="/src/assets/images/citizen_dashboard_banner_1795586898124.jpg"
            alt="Citizen reviewing verified job offers and security metrics"
            fallbackTitle="Citizen Protection Overview"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#46304F]/95 via-[#563653]/88 to-[#651F35]/65" />
          <div className="relative z-10 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F0DFBD]">
                Citizen / Student Protection Overview
              </p>
              <h2 className="font-display text-2xl font-bold text-[#F7F0E5]">
                Welcome back, {user?.name}
              </h2>
              <p className="text-sm text-[#E9D9C4] leading-relaxed">
                Verify offer letters, recruitment emails, URLs, and messages before transferring
                money or sharing identity documents.
              </p>
            </div>
            <Link
              to="/student/scanner"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E27D70] px-5 py-2.5 text-sm font-bold text-[#29272B] hover:bg-[#C65D45] hover:text-[#F7F0E5] transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Start New Scan</span>
            </Link>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-[#842D48]/35 bg-[#FBEAE3] p-4 flex items-center justify-between gap-3 text-sm text-[#651F35]">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-lg border border-[#651F35]/30 bg-[#FFFDF8] px-3 py-1.5 text-xs font-semibold text-[#651F35] hover:bg-[#F0DFBD]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Computed KPI Strip (Clickable Navigation Cards) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              label: 'Total Scans',
              value: stats.total,
              to: '/student/history',
              tone: 'text-[#46304F]',
              cardCls: 'bg-[#F0DFBD]/75 border-[#563653]/20 hover:border-[#563653]',
            },
            {
              label: 'High-Risk Results',
              value: stats.highRisk,
              to: '/student/history?risk=HIGH_RISK',
              tone: 'text-[#651F35]',
              cardCls: 'bg-[#FBEAE3] border-[#842D48]/30 hover:border-[#842D48]',
            },
            {
              label: 'Suspicious Results',
              value: stats.suspicious,
              to: '/student/history?risk=SUSPICIOUS',
              tone: 'text-[#8C6414]',
              cardCls: 'bg-[#FBF3DF] border-[#C69B36]/35 hover:border-[#C69B36]',
            },
            {
              label: 'Lower-Risk Results',
              value: stats.lowerRisk,
              to: '/student/history?risk=LOWER_RISK',
              tone: 'text-[#174D3B]',
              cardCls: 'bg-[#E7EFE8] border-[#16765B]/25 hover:border-[#16765B]',
            },
            {
              label: 'Community Reports',
              value: stats.reports,
              to: '/student/community?tab=mine',
              tone: 'text-[#563653]',
              cardCls: 'bg-[#EFEAF2] border-[#B9A5C9]/55 hover:border-[#563653]',
            },
          ].map((kpi) => (
            <Link
              key={kpi.label}
              to={kpi.to}
              className={`rounded-xl border p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm block ${kpi.cardCls}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#4F3B42]">{kpi.label}</p>
                {user?.isDemo && (
                  <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#563653]/80">
                    DEMO DATA
                  </span>
                )}
              </div>
              <p className={`mt-2 font-mono-tabular text-2xl font-bold ${kpi.tone}`}>
                {loading ? '—' : kpi.value}
              </p>
            </Link>
          ))}
        </section>

        {/* Latest Scan Summary + Security Alerts + Saved Reports */}
        {!loading && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Latest Scan Summary */}
            <div className="lg:col-span-5 rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] p-5 flex flex-col justify-between gap-4 shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#563653]">
                    Latest Scan Summary
                  </p>
                  {latestScan && (
                    <RiskStatusLabel category={latestScan.riskCategory} score={latestScan.riskScore} />
                  )}
                </div>
                {latestScan ? (
                  <>
                    <h3 className="font-display text-base font-bold text-[#29272B]">
                      {latestScan.scanName}
                    </h3>
                    <p className="text-xs text-[#4F3B42] line-clamp-2">{latestScan.disclaimer}</p>
                  </>
                ) : (
                  <p className="text-xs text-[#4F3B42]">
                    No security scans recorded yet. Run your first scan to see a detailed risk breakdown.
                  </p>
                )}
              </div>
              {latestScan ? (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E9D9C4] text-xs">
                  <span className="font-mono-tabular text-[#563653]">
                    {latestScan.findings.length} finding(s) ·{' '}
                    {new Date(latestScan.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/student/trust-intelligence?scanId=${encodeURIComponent(latestScan.id)}`}
                      className="font-semibold text-[#174D3B] hover:underline"
                    >
                      Trust Graph
                    </Link>
                    <Link
                      to={`/student/reports/${latestScan.id}`}
                      className="font-semibold text-[#651F35] hover:underline"
                    >
                      Open Report
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  to="/student/scanner"
                  className="text-xs font-semibold text-[#651F35] hover:underline"
                >
                  Launch Unified Scanner →
                </Link>
              )}
            </div>

            {/* Recent Security Alerts */}
            <div className="lg:col-span-4 rounded-2xl border border-[#842D48]/25 bg-[#FBEAE3] p-5 flex flex-col justify-between gap-3 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#651F35] flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5" />
                  <span>Recent Security Alerts</span>
                </p>
                <Link to="/student/notifications" className="text-xs font-semibold text-[#651F35] hover:underline">
                  View All
                </Link>
              </div>
              {recentAlerts.length === 0 ? (
                <p className="text-xs text-[#4F3B42]">No recent security notifications.</p>
              ) : (
                <div className="space-y-2.5">
                  {recentAlerts.map((n) => (
                    <Link
                      key={n.id}
                      to={n.link || '/student/notifications'}
                      className="block rounded-lg border border-[#842D48]/15 bg-[#FFFDF8] p-2.5 text-xs hover:border-[#842D48]/50 transition-colors"
                    >
                      <p className="font-semibold text-[#29272B] line-clamp-1">{n.title}</p>
                      <p className="text-[#4F3B42] line-clamp-1 mt-0.5">{n.message}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Reports Quick Access */}
            <div className="lg:col-span-3 rounded-2xl border border-[#16765B]/25 bg-[#E7EFE8] p-5 flex flex-col justify-between gap-3 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#174D3B] flex items-center gap-1.5">
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Saved ({stats.savedCount})</span>
                </p>
                <Link to="/student/saved" className="text-xs font-semibold text-[#174D3B] hover:underline">
                  Manage
                </Link>
              </div>
              {savedReports.length === 0 ? (
                <p className="text-xs text-[#2D4F38]">
                  Bookmark important scan reports from your report view for fast recall.
                </p>
              ) : (
                <div className="space-y-2">
                  {savedReports.map((rep) => (
                    <Link
                      key={rep.id}
                      to={`/student/reports/${rep.id}`}
                      className="block rounded-lg border border-[#16765B]/20 bg-[#F7F0E5] px-3 py-2 text-xs font-semibold text-[#29272B] hover:border-[#16765B] truncate"
                    >
                      {rep.scanName}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Empty State or Activity + Chart */}
        {!loading && scans.length === 0 ? (
          <section className="rounded-2xl border border-[#563653]/20 bg-gradient-to-br from-[#F0DFBD]/65 via-[#F7F0E5] to-[#FBEAE3] p-10 text-center space-y-4">
            <h3 className="font-display text-lg font-bold text-[#46304F]">
              You haven&apos;t performed any security scans yet.
            </h3>
            <p className="text-sm text-[#4F3B42] max-w-md mx-auto">
              Start by checking a recruitment opportunity—upload an offer letter, inspect an email,
              verify a website URL, or analyse a WhatsApp/Telegram screenshot.
            </p>
            <button
              type="button"
              onClick={() => navigate('/student/scanner')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C65D45] px-5 py-2.5 text-sm font-semibold text-[#F7F0E5] hover:bg-[#B85C32]"
            >
              Start Your First Scan
            </button>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Risk Distribution Chart */}
            <section className="lg:col-span-5 rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] overflow-hidden shadow-xs">
              <div className="bg-[#F0DFBD]/75 border-b border-[#563653]/15 px-6 py-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold text-[#46304F]">
                    Risk Distribution
                  </h3>
                  <p className="text-xs text-[#563653]">
                    Click a bar to filter Recent Scan Activity
                  </p>
                </div>
                {riskFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setRiskFilter('ALL')}
                    className="text-xs font-semibold text-[#651F35] hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="p-6">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E9D9C4" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#29272B' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#29272B' }} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        radius={[6, 6, 0, 0]}
                        className="cursor-pointer"
                        onClick={(barData) => {
                          const rk = (barData as unknown as { riskKey?: string })?.riskKey;
                          if (rk) {
                            setRiskFilter((prev) => (prev === rk ? 'ALL' : rk));
                          }
                        }}
                      >
                        {chartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                            fillOpacity={
                              riskFilter === 'ALL' || riskFilter === entry.riskKey ? 1 : 0.35
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Recent Activity Table */}
            <section className="lg:col-span-7 rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] overflow-hidden shadow-xs">
              <div className="bg-[#EFEAF2] border-b border-[#B9A5C9]/45 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-display text-base font-bold text-[#46304F]">
                  Recent Scan Activity
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-[#563653] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search scans..."
                      className="rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] pl-8 pr-3 py-1.5 text-xs text-[#29272B] focus:border-[#563653] focus:outline-none"
                    />
                  </div>
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    aria-label="Filter by risk category"
                    className="rounded-lg border border-[#B9A5C9]/60 px-2.5 py-1.5 text-xs bg-[#FFFDF8] text-[#29272B] focus:border-[#563653] focus:outline-none"
                  >
                    <option value="ALL">All Risks</option>
                    <option value="HIGH_RISK">High Risk</option>
                    <option value="SUSPICIOUS">Suspicious</option>
                    <option value="LOWER_RISK">Lower Risk</option>
                    <option value="INSUFFICIENT_EVIDENCE">Insufficient Evidence</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto p-4 sm:p-5">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#E9D9C4] text-xs font-semibold text-[#563653]">
                    <tr>
                      <th className="py-2.5 pr-3">Scan Name</th>
                      <th className="py-2.5 pr-3">Type</th>
                      <th className="py-2.5 pr-3">Date</th>
                      <th className="py-2.5 pr-3">Risk</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9D9C4]">
                    {filteredScans.map((scan) => (
                      <tr key={scan.id} className="hover:bg-[#F0DFBD]/40">
                        <td className="py-3 pr-3 font-medium text-[#29272B] max-w-[180px] truncate">
                          {scan.scanName}
                        </td>
                        <td className="py-3 pr-3 text-xs text-[#4F3B42] capitalize">
                          {scan.scanType.replace('_', ' ')}
                        </td>
                        <td className="py-3 pr-3 font-mono-tabular text-xs text-[#563653] whitespace-nowrap">
                          {new Date(scan.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-3">
                          <RiskStatusLabel category={scan.riskCategory} score={scan.riskScore} />
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <Link
                            to={`/student/reports/${scan.id}`}
                            className="text-xs font-semibold text-[#651F35] hover:underline"
                          >
                            View Report
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {filteredScans.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-xs text-[#563653]">
                          No scans match your current filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* Recent Submitted Reports Summary */}
        <section className="rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] overflow-hidden shadow-xs">
          <div className="bg-[#F0DFBD]/75 border-b border-[#563653]/15 px-6 py-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-[#46304F]">
                Recent Community Reports
              </h3>
              <p className="text-xs text-[#563653]">
                Track moderation progress on suspicious recruitment leads you submitted.
              </p>
            </div>
            <Link
              to="/student/community"
              className="rounded-lg border border-[#563653]/25 bg-[#F7F0E5] px-3.5 py-1.5 text-xs font-semibold text-[#46304F] hover:bg-[#EFEAF2]"
            >
              Open Community Feed
            </Link>
          </div>
          {myReports.length === 0 ? (
            <div className="p-6 text-xs text-[#4F3B42]">
              You have not submitted any community reports yet. Use{' '}
              <Link to="/student/community?new=1" className="font-semibold text-[#651F35] underline">
                Submit a Report
              </Link>{' '}
              if you encounter an advance-fee request or lookalike employer.
            </div>
          ) : (
            <div className="divide-y divide-[#E9D9C4]">
              {myReports.slice(0, 3).map((rep) => (
                <Link
                  key={rep.id}
                  to={`/student/community?tab=mine&reportId=${encodeURIComponent(rep.id)}`}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F0DFBD]/35 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#29272B]">
                      {rep.companyName || rep.url || rep.category}
                    </p>
                    <p className="text-xs text-[#4F3B42] line-clamp-1">{rep.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    {rep.isDemo && (
                      <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#563653]">
                        DEMO DATA
                      </span>
                    )}
                    <span className="font-mono-tabular text-[#563653]">{rep.incidentDate}</span>
                    <span className="font-semibold text-[#651F35]">
                      {rep.moderationStatus.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="space-y-4">
          <h3 className="font-display text-base font-bold text-[#46304F]">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ...QUICK_ACTIONS,
              {
                title: 'Trust Intelligence Graph',
                desc: 'Verify company records, recruiter domains, and evidence relationships.',
                to: '/student/trust-intelligence',
                icon: Network,
                cardCls: 'bg-[#E7EFE8] border-[#16765B]/25 hover:border-[#16765B]',
                iconCls: 'bg-[#16765B] text-[#F7F0E5]',
              },
              {
                title: 'User Protection Centre',
                desc: 'Review scam awareness library, checklists, and emergency reporting steps.',
                to: '/student/protection',
                icon: ShieldCheck,
                cardCls: 'bg-[#EFEAF2] border-[#563653]/25 hover:border-[#563653]',
                iconCls: 'bg-[#563653] text-[#F7F0E5]',
              },
            ].map((act) => {
              const Icon = act.icon;
              return (
                <Link
                  key={act.title}
                  to={act.to}
                  className={`rounded-xl border p-5 transition-all hover:shadow-sm flex items-start gap-4 ${act.cardCls}`}
                >
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${act.iconCls}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display text-sm font-bold text-[#29272B]">{act.title}</h4>
                    <p className="text-xs text-[#4F3B42] leading-relaxed">{act.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </StudentLayout>
  );
}
