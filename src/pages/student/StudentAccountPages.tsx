import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  CheckCheck,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { Modal } from '../../components/common/Modal';
import { RiskStatusLabel } from '../../components/common/RiskDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiRequest, downloadReportFile } from '../../services/api';
import type { NotificationRecord, ScanRecord } from '../../types/jobshield';

export function ScanHistoryPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, demoResetVersion } = useAuth();
  const { showToast } = useToast();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ScanRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(params.get('type') || 'ALL');
  const [riskFilter, setRiskFilter] = useState(params.get('risk') || 'ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'risk_desc' | 'name_asc'>('newest');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const r = params.get('risk');
    const t = params.get('type');
    setRiskFilter(r || 'ALL');
    setTypeFilter(t || 'ALL');
    setPage(1);
  }, [params]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest<{ scans: ScanRecord[] }>('/api/scans');
      setScans(res.scans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load scan history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [demoResetVersion]);

  const filtered = useMemo(() => {
    const matched = scans.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchQ =
        !q ||
        s.scanName.toLowerCase().includes(q) ||
        s.inputReference.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q);
      const matchType = typeFilter === 'ALL' || s.scanType === typeFilter;
      const matchRisk = riskFilter === 'ALL' || s.riskCategory === riskFilter;
      const matchDate = !dateFilter || s.createdAt.startsWith(dateFilter);
      return matchQ && matchType && matchRisk && matchDate;
    });
    return [...matched].sort((a, b) => {
      if (sortBy === 'name_asc') return a.scanName.localeCompare(b.scanName);
      if (sortBy === 'risk_desc') return (b.riskScore ?? -1) - (a.riskScore ?? -1);
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [scans, search, typeFilter, riskFilter, dateFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/api/scans/${deleteTarget.id}`, { method: 'DELETE' });
      setScans((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast('Scan record deleted.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to delete scan.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <StudentLayout title="Scan History">
      <div className="space-y-5">
        <div className="rounded-2xl border border-[#563653]/20 bg-[#EFEAF2] p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-[#563653] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search scan name or input reference..."
              className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] pl-9 pr-3 py-2 text-sm text-[#29272B] focus:border-[#563653] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#B9A5C9]/60 px-3 py-2 text-xs bg-[#FFFDF8] text-[#29272B]"
            >
              <option value="ALL">All Types</option>
              <option value="offer_letter">Offer Letter</option>
              <option value="email">Email</option>
              <option value="url">URL</option>
              <option value="job_description">Job Description</option>
              <option value="screenshot">Screenshot</option>
            </select>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#B9A5C9]/60 px-3 py-2 text-xs bg-[#FFFDF8] text-[#29272B]"
            >
              <option value="ALL">All Risk Categories</option>
              <option value="HIGH_RISK">High Risk</option>
              <option value="SUSPICIOUS">Suspicious</option>
              <option value="LOWER_RISK">Lower Risk</option>
              <option value="INSUFFICIENT_EVIDENCE">Insufficient Evidence</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] px-3 py-2 text-xs text-[#29272B]"
            />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'newest' | 'oldest' | 'risk_desc' | 'name_asc');
                setPage(1);
              }}
              aria-label="Sort scan history"
              className="rounded-lg border border-[#B9A5C9]/60 px-3 py-2 text-xs bg-[#FFFDF8] text-[#29272B]"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="risk_desc">Sort: Highest Risk</option>
              <option value="name_asc">Sort: Name (A–Z)</option>
            </select>
            {(search || typeFilter !== 'ALL' || riskFilter !== 'ALL' || dateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('ALL');
                  setRiskFilter('ALL');
                  setDateFilter('');
                  setParams({});
                  setPage(1);
                }}
                className="rounded-lg border border-[#651F35]/30 bg-[#FBEAE3] px-3 py-2 text-xs font-semibold text-[#651F35] hover:bg-[#F4D3CA]"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-10 text-center text-sm text-[#563653]">Loading scan history...</div>
          ) : error ? (
            <div className="p-10 text-center space-y-3 bg-[#FBEAE3]">
              <p className="text-sm text-[#651F35]">{error}</p>
              <button
                type="button"
                onClick={load}
                className="rounded-lg bg-[#651F35] px-4 py-2 text-xs font-semibold text-[#F7F0E5]"
              >
                Retry
              </button>
            </div>
          ) : paged.length === 0 ? (
            <div className="p-10 text-center space-y-3 bg-[#F0DFBD]/45">
              <p className="text-sm text-[#4F3B42]">No scans found matching your criteria.</p>
              <Link
                to="/student/scanner"
                className="inline-block rounded-lg bg-[#563653] px-4 py-2 text-xs font-semibold text-[#F7F0E5] hover:bg-[#46304F]"
              >
                Run a New Scan
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#B9A5C9]/45 bg-[#F0DFBD]/75 text-xs font-semibold text-[#46304F]">
                  <tr>
                    <th className="py-3 px-4">Scan Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Risk Assessment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9D9C4]">
                  {paged.map((scan) => (
                    <tr key={scan.id} className="hover:bg-[#EFEAF2]/65">
                      <td className="py-3 px-4 font-medium text-[#29272B] max-w-[240px]">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{scan.scanName}</span>
                          {(scan.isDemo || user?.isDemo) && (
                            <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#563653] shrink-0">
                              DEMO DATA
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#4F3B42] capitalize">
                        {scan.scanType.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-mono-tabular text-xs text-[#563653] whitespace-nowrap">
                        {new Date(scan.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <RiskStatusLabel category={scan.riskCategory} score={scan.riskScore} />
                      </td>
                      <td className="py-3 px-4 text-xs text-[#4F3B42]">
                        {scan.processingStatus.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2.5">
                        <Link
                          to={`/student/reports/${scan.id}`}
                          className="text-xs font-semibold text-[#651F35] hover:underline"
                        >
                          View Report
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await downloadReportFile(scan.id, 'txt');
                              showToast('Downloaded TXT report.', 'success');
                            } catch (err) {
                              showToast(err instanceof Error ? err.message : 'Download failed.', 'error');
                            }
                          }}
                          title="Download TXT Report"
                          aria-label="Download TXT report"
                          className="text-[#46304F] hover:text-[#651F35] align-middle"
                        >
                          <Download className="h-3.5 w-3.5 inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/student/scanner?type=${scan.scanType}`, {
                              state: { rescanFrom: scan },
                            })
                          }
                          title="Rescan with pre-filled inputs"
                          aria-label="Rescan"
                          className="text-[#174D3B] hover:text-[#16765B] align-middle"
                        >
                          <RefreshCw className="h-3.5 w-3.5 inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(scan)}
                          aria-label="Delete scan"
                          className="text-[#563653] hover:text-[#842D48] align-middle"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-[#4F3B42]">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-[#563653]/25 bg-[#F7F0E5] px-3 py-1.5 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-[#563653]/25 bg-[#F7F0E5] px-3 py-1.5 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        <Modal
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Delete Scan Record"
        >
          {deleteTarget && (
            <div className="space-y-4 text-sm">
              <p className="text-[#4F3B42]">
                Are you sure you want to permanently remove <strong>{deleteTarget.scanName}</strong> from your scan history?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-lg border border-[#563653]/25 bg-[#F7F0E5] px-4 py-2 text-xs font-semibold text-[#29272B]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={confirmDelete}
                  className="rounded-lg bg-[#842D48] px-4 py-2 text-xs font-semibold text-[#F7F0E5] hover:bg-[#651F35] disabled:opacity-60"
                >
                  {deleting ? 'Deleting...' : 'Delete Scan'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </StudentLayout>
  );
}

export function SavedReportsPage() {
  const { user, demoResetVersion } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const loadSaved = () => {
    setLoading(true);
    setError('');
    apiRequest<{ scans: ScanRecord[] }>('/api/scans')
      .then((res) => setReports(res.scans.filter((s) => s.saved)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load saved reports.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSaved();
  }, [demoResetVersion]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((rep) => {
      const matchQ =
        !q ||
        rep.scanName.toLowerCase().includes(q) ||
        rep.inputReference.toLowerCase().includes(q) ||
        rep.id.toLowerCase().includes(q);
      const matchType = typeFilter === 'ALL' || rep.scanType === typeFilter;
      const matchRisk = riskFilter === 'ALL' || rep.riskCategory === riskFilter;
      return matchQ && matchType && matchRisk;
    });
  }, [reports, search, typeFilter, riskFilter]);

  const removeFromSaved = async (id: string) => {
    try {
      await apiRequest(`/api/reports/${id}/save`, {
        method: 'POST',
        body: JSON.stringify({ saved: false }),
      });
      setReports((prev) => prev.filter((r) => r.id !== id));
      showToast('Removed from Saved Reports.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update.', 'error');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await downloadReportFile(id, 'txt');
      showToast('Report downloaded.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Download failed.', 'error');
    }
  };

  return (
    <StudentLayout title="Saved Reports">
      {loading ? (
        <div className="rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] p-10 text-center text-sm text-[#563653]">
          Loading saved reports...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[#842D48]/30 bg-[#FBEAE3] p-10 text-center space-y-3">
          <p className="text-sm text-[#651F35]">{error}</p>
          <button
            type="button"
            onClick={loadSaved}
            className="rounded-lg bg-[#651F35] px-4 py-2 text-xs font-semibold text-[#F7F0E5]"
          >
            Retry
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-[#563653]/20 bg-gradient-to-br from-[#F0DFBD]/65 to-[#F7F0E5] p-10 text-center space-y-3">
          <Bookmark className="h-8 w-8 text-[#563653] mx-auto" />
          <h2 className="font-display text-lg font-bold text-[#46304F]">No Saved Reports</h2>
          <p className="text-xs text-[#4F3B42]">
            Save any security report from Scan History or after completing a scan for quick reference.
          </p>
          <Link
            to="/student/history"
            className="inline-block rounded-lg bg-[#563653] px-4 py-2 text-xs font-semibold text-[#F7F0E5] hover:bg-[#46304F]"
          >
            Browse Scan History
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#563653]/20 bg-[#EFEAF2] p-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-[#563653] absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search saved reports by name, ID, or reference..."
                className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] pl-9 pr-3 py-2 text-sm text-[#29272B] focus:border-[#563653] focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter saved reports by scanner type"
                className="rounded-lg border border-[#B9A5C9]/60 px-3 py-2 text-xs bg-[#FFFDF8] text-[#29272B]"
              >
                <option value="ALL">All Types ({reports.length})</option>
                <option value="offer_letter">Offer Letter</option>
                <option value="email">Email</option>
                <option value="url">URL</option>
                <option value="job_description">Job Description</option>
                <option value="screenshot">Screenshot</option>
              </select>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                aria-label="Filter saved reports by risk level"
                className="rounded-lg border border-[#B9A5C9]/60 px-3 py-2 text-xs bg-[#FFFDF8] text-[#29272B]"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH_RISK">High Risk</option>
                <option value="SUSPICIOUS">Suspicious</option>
                <option value="LOWER_RISK">Lower Risk</option>
              </select>
              {(search || typeFilter !== 'ALL' || riskFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setTypeFilter('ALL');
                    setRiskFilter('ALL');
                  }}
                  className="rounded-lg border border-[#651F35]/30 bg-[#FBEAE3] px-3 py-2 text-xs font-semibold text-[#651F35]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] p-8 text-center text-sm text-[#4F3B42]">
              No saved reports match your current filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] overflow-hidden shadow-xs"
                >
                  <div className="bg-[#EFEAF2] border-b border-[#B9A5C9]/45 px-5 py-3.5 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#563653] capitalize">
                        {(rep.isDemo || user?.isDemo) && (
                          <span className="font-mono-tabular text-[10px] font-bold uppercase mr-1.5">
                            DEMO DATA ·
                          </span>
                        )}
                        {rep.scanType.replace('_', ' ')} · Saved{' '}
                        {rep.savedAt ? new Date(rep.savedAt).toLocaleDateString() : ''}
                      </p>
                      <h3 className="font-display text-base font-bold text-[#46304F] mt-0.5">
                        {rep.scanName}
                      </h3>
                    </div>
                    <RiskStatusLabel category={rep.riskCategory} score={rep.riskScore} />
                  </div>

                  <div className="px-5 py-3.5 flex flex-wrap items-center gap-3 text-xs">
                    <Link
                      to={`/student/reports/${rep.id}`}
                      className="font-semibold text-[#651F35] hover:underline"
                    >
                      View Report
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDownload(rep.id)}
                      className="inline-flex items-center gap-1 font-medium text-[#29272B] hover:text-[#651F35]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromSaved(rep.id)}
                      className="ml-auto text-[#563653] hover:text-[#842D48]"
                    >
                      Remove from Saved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </StudentLayout>
  );
}

export function NotificationsPage() {
  const { user, demoResetVersion } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest<{ notifications: NotificationRecord[] }>(
        '/api/users/notifications'
      );
      setItems(res.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [demoResetVersion]);

  const markRead = async (id: string) => {
    try {
      await apiRequest(`/api/users/notifications/${id}/read`, { method: 'PATCH' });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update notification.', 'error');
    }
  };

  const markAllRead = async () => {
    try {
      await apiRequest('/api/users/notifications/read-all', { method: 'POST' });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update notifications.', 'error');
    }
  };

  return (
    <StudentLayout title="Notifications">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-[#4F3B42]">
            {user?.isDemo && (
              <span className="font-mono-tabular text-[11px] font-bold uppercase text-[#563653] mr-2">
                DEMO DATA ·
              </span>
            )}
            Security alerts, scan completions, and community report status updates.
          </p>
          {items.some((n) => !n.read) && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#16765B]/30 bg-[#E7EFE8] px-3 py-1.5 text-xs font-semibold text-[#174D3B] hover:bg-[#D5E6DA]"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] divide-y divide-[#E9D9C4] overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#563653]">Loading notifications...</div>
          ) : error ? (
            <div className="p-8 text-center space-y-3 bg-[#FBEAE3]">
              <p className="text-sm text-[#651F35]">{error}</p>
              <button
                type="button"
                onClick={load}
                className="rounded-lg bg-[#651F35] px-4 py-2 text-xs font-semibold text-[#F7F0E5]"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center space-y-2 bg-[#F0DFBD]/45">
              <Bell className="h-7 w-7 text-[#563653] mx-auto" />
              <p className="text-sm text-[#4F3B42]">No notifications recorded yet.</p>
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  n.read ? 'bg-[#F7F0E5]' : 'bg-[#EFEAF2]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#563653]">
                    <span className={`font-semibold ${n.read ? 'text-[#563653]' : 'text-[#651F35]'}`}>
                      {n.read ? 'Read' : 'Unread'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-[#29272B]">{n.title}</h3>
                  <p className="text-sm text-[#4F3B42]">{n.message}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  {n.link && (
                    <Link to={n.link} className="font-semibold text-[#651F35] hover:underline">
                      Open
                    </Link>
                  )}
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="text-[#4F3B42] hover:text-[#29272B] font-medium"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

export function ProfileSettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.college || '');
  const [prefs, setPrefs] = useState(
    user?.notificationPrefs || {
      scanCompleted: true,
      highRiskAlerts: true,
      communityUpdates: true,
      securityEvents: true,
    }
  );
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name, college, notificationPrefs: prefs }),
      });
      await refreshUser();
      showToast('Profile and notification preferences updated.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPw(true);
    try {
      await apiRequest('/api/users/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      showToast('Password updated successfully.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Password update failed.', 'error');
    } finally {
      setChangingPw(false);
    }
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      await apiRequest('/api/users/account', { method: 'DELETE' });
      await logout();
      showToast('Your account and associated scan records have been deleted.', 'info');
      navigate('/');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Account deletion failed.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <StudentLayout title="Profile & Settings">
      <div className="max-w-3xl space-y-6">
        {/* Account Overview */}
        <section className="rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] overflow-hidden shadow-xs">
          <div className="bg-[#EFEAF2] border-b border-[#B9A5C9]/45 p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#46304F]">Account Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-[#563653]">Email Address</p>
                <p className="font-semibold text-[#29272B] break-all">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-[#563653]">Authentication Provider</p>
                <p className="font-semibold text-[#29272B]">
                  {user?.authProvider} · Email {user?.emailVerified ? 'Verified' : 'Unverified'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#563653]">Member Since</p>
                <p className="font-mono-tabular text-xs font-semibold text-[#4F3B42] mt-0.5">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={saveProfile} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#46304F] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B] focus:border-[#563653] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#46304F] mb-1">
                  College / Institution
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full rounded-lg border border-[#B9A5C9]/60 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B] focus:border-[#563653] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-[#46304F]">Notification Preferences</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#4F3B42]">
                {[
                  { key: 'scanCompleted' as const, label: 'Scan completed alerts' },
                  { key: 'highRiskAlerts' as const, label: 'High-risk findings alerts' },
                  { key: 'communityUpdates' as const, label: 'Community report status updates' },
                  { key: 'securityEvents' as const, label: 'Account security events' },
                ].map((item) => (
                  <label key={item.key} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs[item.key]}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, [item.key]: e.target.checked }))
                      }
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg bg-[#563653] px-5 py-2 text-sm font-semibold text-[#F7F0E5] hover:bg-[#46304F]"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Change Password */}
        {user?.authProvider === 'LOCAL' && !user?.isDemo && (
          <section className="rounded-2xl border border-[#16765B]/25 bg-[#E7EFE8] p-6 space-y-4 shadow-xs">
            <h2 className="font-display text-lg font-bold text-[#174D3B]">Security &amp; Password</h2>
            <form onSubmit={changePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium text-[#174D3B] mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#16765B]/25 bg-[#FFFDF8] px-3 py-2 pr-10 text-sm text-[#29272B] focus:border-[#16765B] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    className="absolute right-2.5 top-2 p-1 text-[#174D3B]"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#174D3B] mb-1">
                  New Password (Min. 8 characters)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#16765B]/25 bg-[#FFFDF8] px-3 py-2 pr-10 text-sm text-[#29272B] focus:border-[#16765B] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    className="absolute right-2.5 top-2 p-1 text-[#174D3B]"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={changingPw}
                className="rounded-lg bg-[#16765B] px-4 py-2 text-sm font-semibold text-[#F7F0E5] hover:bg-[#174D3B]"
              >
                {changingPw ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>
        )}

        {/* Account Deletion */}
        <section className="rounded-2xl border border-[#842D48]/30 bg-[#FBEAE3] p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#651F35]">Delete Account</h2>
          {user?.isDemo ? (
            <p className="text-sm text-[#4F3B42]">
              Demo sandbox accounts cannot be permanently deleted. Use the{' '}
              <strong>Reset Demo Data</strong> control in the banner above to restore the clean
              demo baseline at any time.
            </p>
          ) : (
            <>
              <p className="text-sm text-[#4F3B42]">
                Permanently remove your citizen profile, scan history, saved reports, and
                notifications. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="rounded-lg border border-[#842D48] bg-[#FFFDF8] px-4 py-2 text-xs font-semibold text-[#651F35] hover:bg-[#F0DFBD]/55"
              >
                Request Account Deletion
              </button>
            </>
          )}
        </section>

        <Modal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Confirm Permanent Account Deletion"
        >
          <div className="space-y-4 text-sm">
            <p className="text-[#4F3B42]">
              Are you sure you want to permanently delete your JOBSHIELD account ({user?.email}) and
              all stored scan reports?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-lg border border-[#563653]/25 bg-[#F7F0E5] px-4 py-2 text-xs font-semibold text-[#29272B]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteAccount}
                className="rounded-lg bg-[#842D48] px-4 py-2 text-xs font-semibold text-[#F7F0E5] hover:bg-[#651F35]"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </StudentLayout>
  );
}
