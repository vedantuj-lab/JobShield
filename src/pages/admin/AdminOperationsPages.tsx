import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, ChevronLeft, ChevronRight, Eye, Loader2, RefreshCw, Search } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Modal } from '../../components/common/Modal';
import { ResilientImage, RiskStatusLabel } from '../../components/common/RiskDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiRequest } from '../../services/api';
import type {
  AuthUser,
  CommunityReport,
  ReportModerationStatus,
  RiskCategory,
  ScanRecord,
  ScanType,
} from '../../types/jobshield';

interface AdminUserRow extends AuthUser {
  scanCount: number;
  communityReportCount?: number;
  lastActiveAt?: string;
}

const PAGE_SIZE = 10;

function PaginationBar({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (p: number) => void;
}) {
  if (totalItems === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[#2F4F4A]/15 bg-[#E6F2EC] text-xs text-[#26403C]">
      <span>
        Showing page <strong className="font-mono-tabular">{page}</strong> of{' '}
        <strong className="font-mono-tabular">{totalPages}</strong> ({totalItems} total)
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-md border border-[#2F4F4A]/25 bg-[#F3FAF6] px-2.5 py-1 font-semibold hover:bg-[#D8EDE3] disabled:opacity-45"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Prev</span>
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-md border border-[#2F4F4A]/25 bg-[#F3FAF6] px-2.5 py-1 font-semibold hover:bg-[#D8EDE3] disabled:opacity-45"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const { user, demoResetVersion } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'joined_desc' | 'joined_asc' | 'name_asc' | 'scans_desc'>(
    'joined_desc'
  );
  const [page, setPage] = useState(1);

  const [statusModalUser, setStatusModalUser] = useState<AdminUserRow | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ users: AdminUserRow[] }>('/api/admin/users');
      setUsers(res.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [demoResetVersion]);

  const filteredAndSorted = useMemo(() => {
    const filtered = users.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.accountStatus === statusFilter;
      return matchQ && matchRole && matchStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'scans_desc') return b.scanCount - a.scanCount;
      if (sortBy === 'joined_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [users, search, roleFilter, statusFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const pagedUsers = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openStatusModal = (user: AdminUserRow) => {
    const nextStatus = user.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setStatusModalUser(user);
    setStatusReason(`Administrator action: changed status to ${nextStatus}`);
  };

  const confirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalUser) return;
    const nextStatus = statusModalUser.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUpdatingStatus(true);
    try {
      await apiRequest(`/api/admin/users/${statusModalUser.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          reason: statusReason.trim() || `Administrator action: changed status to ${nextStatus}`,
        }),
      });
      showToast(`Account ${statusModalUser.email} set to ${nextStatus}.`, 'success');
      setStatusModalUser(null);
      setStatusReason('');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <AdminLayout title="User Management">
      <div className="space-y-5">
        {/* Slate Green & Light Mint Photographic Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-[#2F4F4A]/35 bg-[#26403C] text-[#F3FAF6] shadow-sm">
          <ResilientImage
            src="/src/assets/images/admin_users_workspace_1795588754073.jpg"
            alt="Administrator user governance and access workspace"
            fallbackTitle="Citizen & Administrator Directory"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#26403C]/95 via-[#2F4F4A]/90 to-[#16765B]/75" />
          <div className="relative z-10 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#D8EDE3]">
                Access Governance · Role Isolation{user?.isDemo ? ' · DEMO DATA' : ''}
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F3FAF6]">
                Citizen &amp; Administrator Account Directory
              </h2>
              <p className="text-xs sm:text-sm text-[#E6F2EC]/90">
                Review active citizen registrations, monitor scan counts, and suspend compromised accounts.
              </p>
            </div>
            <div className="rounded-xl bg-[#26403C]/85 border border-[#D8EDE3]/35 px-4 py-2.5 text-right shrink-0">
              <p className="text-[11px] uppercase tracking-wide text-[#D8EDE3]">Accounts Listed</p>
              <p className="font-mono-tabular text-xl font-bold text-[#F3FAF6]">
                {filteredAndSorted.length}
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-[#842D48]/30 bg-[#FBEAE3] p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#651F35]">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#651F35] px-3 py-1.5 text-xs font-semibold text-[#F7F0E5] hover:bg-[#842D48]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Light Mint Filter Bar */}
        <div className="rounded-2xl border border-[#2F4F4A]/20 bg-[#E6F2EC] p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-[#2F4F4A] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] pl-9 pr-3 py-2 text-sm text-[#29272B] focus:border-[#2F4F4A] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
              className="rounded-lg border border-[#2F4F4A]/25 px-3 py-2 text-xs bg-[#F3FAF6] text-[#29272B]"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Citizen / Student</option>
              <option value="ADMIN">Administrator</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by account status"
              className="rounded-lg border border-[#2F4F4A]/25 px-3 py-2 text-xs bg-[#F3FAF6] text-[#29272B]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as 'joined_desc' | 'joined_asc' | 'name_asc' | 'scans_desc'
                )
              }
              aria-label="Sort users"
              className="rounded-lg border border-[#2F4F4A]/25 px-3 py-2 text-xs bg-[#F3FAF6] text-[#29272B]"
            >
              <option value="joined_desc">Sort: Newest Joined</option>
              <option value="joined_asc">Sort: Oldest Joined</option>
              <option value="name_asc">Sort: Name (A–Z)</option>
              <option value="scans_desc">Sort: Most Scans</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2F4F4A]/25 bg-[#F3FAF6] overflow-x-auto shadow-xs">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#26403C]/75">Loading users...</div>
          ) : pagedUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#26403C]/75">
              No matching user accounts found.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#2F4F4A] text-xs font-semibold text-[#D8EDE3]">
                <tr>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Scans</th>
                  <th className="py-3.5 px-4">Reports</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4">Last Active</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8EDE3]">
                {pagedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#E6F2EC]/80">
                    <td className="py-3 px-4 font-semibold text-[#29272B]">
                      <div className="flex items-center gap-2">
                        <span>{u.name}</span>
                        {(u.isDemo || user?.isDemo) && (
                          <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#2F4F4A]/70">
                            DEMO DATA
                          </span>
                        )}
                      </div>
                      <p className="font-mono-tabular text-[11px] font-normal text-[#29272B]/60">
                        {u.id}{u.college ? ` · ${u.college}` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#29272B]/80">{u.email}</td>
                    <td className="py-3 px-4 text-xs font-bold text-[#2F4F4A]">
                      {u.role === 'ADMIN' ? 'Administrator' : 'Citizen / Student'}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]">
                      {u.scanCount}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]">
                      {u.communityReportCount ?? 0}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold">
                      <span
                        className={
                          u.accountStatus === 'ACTIVE' ? 'text-[#16765B]' : 'text-[#842D48]'
                        }
                      >
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]/70 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]/70 whitespace-nowrap">
                      {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => openStatusModal(u)}
                          className={`rounded-md px-3 py-1 text-xs font-semibold border ${
                            u.accountStatus === 'ACTIVE'
                              ? 'border-[#842D48]/30 bg-[#FBEAE3] text-[#842D48] hover:bg-[#F4D3CA]'
                              : 'border-[#16765B]/30 bg-[#E7EFE8] text-[#16765B] hover:bg-[#D3E8DB]'
                          }`}
                        >
                          {u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={filteredAndSorted.length}
            onPageChange={setPage}
          />
        </div>

        {/* Confirm Account Status Change Modal */}
        <Modal
          open={Boolean(statusModalUser)}
          onClose={() => {
            if (!updatingStatus) setStatusModalUser(null);
          }}
          title={
            statusModalUser?.accountStatus === 'ACTIVE'
              ? 'Suspend Citizen Account'
              : 'Reactivate Citizen Account'
          }
        >
          {statusModalUser && (
            <form onSubmit={confirmStatusChange} className="space-y-4">
              <p className="text-sm text-[#29272B]/90">
                {statusModalUser.accountStatus === 'ACTIVE'
                  ? `Suspending ${statusModalUser.email} immediately revokes all active sessions.`
                  : `Reactivating ${statusModalUser.email} restores portal access.`}
              </p>
              <div>
                <label className="block text-xs font-medium text-[#29272B] mb-1">
                  Audit Reason (Logged in Audit Logs) *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full rounded-lg border border-[#174D3B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
                  placeholder="Enter reason for status update..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => setStatusModalUser(null)}
                  className="rounded-lg border border-[#29272B]/25 bg-[#F7F0E5] px-4 py-2 text-xs font-semibold text-[#29272B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold text-[#F7F0E5] disabled:opacity-60 ${
                    statusModalUser.accountStatus === 'ACTIVE'
                      ? 'bg-[#651F35] hover:bg-[#842D48]'
                      : 'bg-[#174D3B] hover:bg-[#16765B]'
                  }`}
                >
                  {updatingStatus
                    ? 'Updating...'
                    : statusModalUser.accountStatus === 'ACTIVE'
                    ? 'Confirm Suspend'
                    : 'Confirm Reactivate'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

interface AdminScanRow {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  relatedReportId?: string | null;
  scanName: string;
  scanType: ScanType;
  riskScore: number | null;
  riskCategory: RiskCategory;
  evidenceConfidence: string;
  processingStatus: string;
  createdAt: string;
}

export function AdminScansPage() {
  const [params, setParams] = useSearchParams();
  const { user, demoResetVersion } = useAuth();
  const { showToast } = useToast();
  const [scans, setScans] = useState<AdminScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(params.get('type') || 'ALL');
  const [riskFilter, setRiskFilter] = useState(params.get('risk') || 'ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'risk_desc' | 'name_asc'>(
    'date_desc'
  );
  const [page, setPage] = useState(1);
  const [inspectingId, setInspectingId] = useState<string | null>(null);
  const [inspectedScan, setInspectedScan] = useState<ScanRecord | null>(null);

  useEffect(() => {
    const r = params.get('risk');
    const t = params.get('type');
    setRiskFilter(r || 'ALL');
    setTypeFilter(t || 'ALL');
  }, [params]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ scans: AdminScanRow[] }>('/api/admin/scans');
      setScans(res.scans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load scan monitoring records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [demoResetVersion]);

  const inspectScan = async (id: string) => {
    setInspectingId(id);
    try {
      const res = await apiRequest<{ scan: ScanRecord }>(`/api/admin/scans/${encodeURIComponent(id)}`);
      setInspectedScan(res.scan);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to inspect scan.', 'error');
    } finally {
      setInspectingId(null);
    }
  };

  const filteredAndSorted = useMemo(() => {
    const filtered = scans.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchQ =
        !q ||
        s.id.toLowerCase().includes(q) ||
        s.userId.toLowerCase().includes(q) ||
        (s.userName || '').toLowerCase().includes(q) ||
        (s.userEmail || '').toLowerCase().includes(q) ||
        (s.relatedReportId || '').toLowerCase().includes(q) ||
        s.scanName.toLowerCase().includes(q);
      const matchType = typeFilter === 'ALL' || s.scanType === typeFilter;
      const matchRisk = riskFilter === 'ALL' || s.riskCategory === riskFilter;
      return matchQ && matchType && matchRisk;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name_asc') return a.scanName.localeCompare(b.scanName);
      if (sortBy === 'risk_desc') return (b.riskScore ?? -1) - (a.riskScore ?? -1);
      if (sortBy === 'date_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [scans, search, typeFilter, riskFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, riskFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const pagedScans = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout title="Scan Monitoring">
      <div className="space-y-5">
        {/* Slate Green & Light Mint Photographic Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-[#2F4F4A]/35 bg-[#26403C] text-[#F3FAF6] shadow-sm">
          <ResilientImage
            src="/src/assets/images/scanner_url_domain_1795580301089.jpg"
            alt="Administrator monitoring recruitment scans and risk classifications"
            fallbackTitle="Scan Monitoring Console"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#26403C]/95 via-[#2F4F4A]/90 to-[#16765B]/75" />
          <div className="relative z-10 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#D8EDE3]">
                Pipeline Telemetry · Risk Triage{user?.isDemo ? ' · DEMO DATA' : ''}
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F3FAF6]">
                Cross-Platform Recruitment Scan Monitoring
              </h2>
              <p className="text-xs sm:text-sm text-[#E6F2EC]/90">
                Inspect citizen scan outputs, review automated findings, and triage high-risk submissions.
              </p>
            </div>
            <div className="rounded-xl bg-[#26403C]/85 border border-[#D8EDE3]/35 px-4 py-2.5 text-right shrink-0">
              <p className="text-[11px] uppercase tracking-wide text-[#D8EDE3]">Scans Matched</p>
              <p className="font-mono-tabular text-xl font-bold text-[#F3FAF6]">
                {filteredAndSorted.length}
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-[#842D48]/30 bg-[#FBEAE3] p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#651F35]">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#651F35] px-3 py-1.5 text-xs font-semibold text-[#F7F0E5] hover:bg-[#842D48]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Slate Green & Light Mint Filter Strip */}
        <div className="rounded-2xl border border-[#2F4F4A]/20 bg-[#E6F2EC] p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-[#2F4F4A] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Scan ID, User ID, or Scan Name..."
              className="w-full rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] pl-9 pr-3 py-2 text-sm text-[#29272B] focus:border-[#2F4F4A] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by scan type"
              className="rounded-lg border border-[#2F4F4A]/25 px-3 py-2 text-xs bg-[#F3FAF6] text-[#29272B] font-semibold"
            >
              <option value="ALL">All Scanner Types</option>
              <option value="offer_letter">Offer Letter</option>
              <option value="email">Email</option>
              <option value="url">URL</option>
              <option value="job_description">Job Description</option>
              <option value="screenshot">Screenshot</option>
            </select>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              aria-label="Filter by risk category"
              className="rounded-lg border border-[#2F4F4A]/25 px-3 py-2 text-xs bg-[#F3FAF6] text-[#29272B] font-semibold"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH_RISK">High Risk</option>
              <option value="SUSPICIOUS">Suspicious</option>
              <option value="LOWER_RISK">Lower Risk</option>
              <option value="INSUFFICIENT_EVIDENCE">Insufficient Evidence</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as 'date_desc' | 'date_asc' | 'risk_desc' | 'name_asc'
                )
              }
              aria-label="Sort scans"
              className="rounded-lg border border-[#2F4F4A]/25 px-3 py-2 text-xs bg-[#F3FAF6] text-[#29272B] font-semibold"
            >
              <option value="date_desc">Sort: Newest</option>
              <option value="date_asc">Sort: Oldest</option>
              <option value="risk_desc">Sort: Highest Risk</option>
              <option value="name_asc">Sort: Name (A–Z)</option>
            </select>
            {(search || typeFilter !== 'ALL' || riskFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('ALL');
                  setRiskFilter('ALL');
                  setParams({});
                }}
                className="rounded-lg border border-[#651F35]/30 bg-[#FBEAE3] px-3 py-2 text-xs font-semibold text-[#651F35] hover:bg-[#F4D3CA]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#2F4F4A]/25 bg-[#F3FAF6] overflow-x-auto shadow-xs">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#26403C]/75">Loading scan monitor...</div>
          ) : pagedScans.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#26403C]/75">No scan records found.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#2F4F4A] text-xs font-semibold text-[#D8EDE3]">
                <tr>
                  <th className="py-3.5 px-4">Scan ID</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Scan Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Risk Assessment</th>
                  <th className="py-3.5 px-4">Linked Report</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8EDE3]">
                {pagedScans.map((s) => (
                  <tr key={s.id} className="hover:bg-[#E6F2EC]/80">
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]/80">{s.id}</td>
                    <td className="py-3 px-4 text-xs text-[#29272B]/80">
                      <p className="font-semibold text-[#29272B]">{s.userName || s.userId}</p>
                      <p className="font-mono-tabular text-[11px] text-[#29272B]/65">
                        {s.userEmail || s.userId}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#29272B] max-w-[220px]">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{s.scanName}</span>
                        {user?.isDemo && (
                          <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#2F4F4A]/70 shrink-0">
                            DEMO DATA
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs capitalize text-[#29272B]/80">
                      {s.scanType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]/70 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <RiskStatusLabel category={s.riskCategory} score={s.riskScore} />
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#2F4F4A]">
                      {s.relatedReportId || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={inspectingId === s.id}
                        onClick={() => inspectScan(s.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-[#2F4F4A]/30 bg-[#E6F2EC] px-2.5 py-1 text-xs font-semibold text-[#2F4F4A] hover:bg-[#D8EDE3]"
                      >
                        {inspectingId === s.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={filteredAndSorted.length}
            onPageChange={setPage}
          />
        </div>

        {/* Inspect Scan Detail Modal */}
        <Modal
          open={Boolean(inspectedScan)}
          onClose={() => setInspectedScan(null)}
          title="Scan Inspection Details"
          maxWidth="max-w-2xl"
        >
          {inspectedScan && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E9D9C4] pb-3">
                <div>
                  <p className="font-mono-tabular text-xs text-[#29272B]/70">
                    {inspectedScan.id} · {inspectedScan.scanType.replace('_', ' ')}
                  </p>
                  <h3 className="font-display text-lg font-bold text-[#29272B]">
                    {inspectedScan.scanName}
                  </h3>
                </div>
                <RiskStatusLabel
                  category={inspectedScan.riskCategory}
                  score={inspectedScan.riskScore}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-[#174D3B] uppercase mb-1">
                  Findings ({inspectedScan.findings.length})
                </p>
                {inspectedScan.findings.length === 0 ? (
                  <p className="text-xs text-[#29272B]/70">No threat findings recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {inspectedScan.findings.map((f, idx) => (
                      <li
                        key={idx}
                        className="rounded-lg border border-[#174D3B]/15 bg-[#E7EFE8]/70 p-3 text-xs space-y-1"
                      >
                        <p className="font-bold text-[#29272B]">
                          {f.title} ({f.severity.toUpperCase()})
                        </p>
                        <p className="text-[#29272B]/85">{f.description}</p>
                        <p className="font-mono-tabular text-[#174D3B]">Evidence: {f.evidence}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {inspectedScan.contradictions.length > 0 && (
                <div className="rounded-lg border border-[#842D48]/25 bg-[#FBEAE3] p-3 text-xs text-[#651F35]">
                  <strong>Contradictions:</strong> {inspectedScan.contradictions.join(' · ')}
                </div>
              )}

              <div className="text-xs text-[#29272B]/70 border-t border-[#E9D9C4] pt-2">
                Submitted {new Date(inspectedScan.createdAt).toLocaleString()} · Evidence
                Confidence: {inspectedScan.evidenceConfidence}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

export function AdminModerationPage() {
  const [params] = useSearchParams();
  const { user, demoResetVersion } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(params.get('status') || 'ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status'>('newest');
  const [page, setPage] = useState(1);

  const [activeReport, setActiveReport] = useState<CommunityReport | null>(null);
  const [nextStatus, setNextStatus] = useState<ReportModerationStatus>('CORROBORATED');
  const [notes, setNotes] = useState('');
  const [promoteDomain, setPromoteDomain] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const st = params.get('status');
    if (st) setStatusFilter(st);
  }, [params]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ reports: CommunityReport[] }>('/api/admin/community/reports');
      setReports(res.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load moderation queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [demoResetVersion]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = reports.filter((r) => {
      const matchStatus = statusFilter === 'ALL' || r.moderationStatus === statusFilter;
      const matchQ =
        !q ||
        r.id.toLowerCase().includes(q) ||
        (r.companyName || '').toLowerCase().includes(q) ||
        (r.url || '').toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      return matchStatus && matchQ;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'status') return a.moderationStatus.localeCompare(b.moderationStatus);
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reports, search, statusFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const pagedReports = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const submitModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport) return;
    setSubmitting(true);
    try {
      await apiRequest(`/api/admin/community/reports/${activeReport.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, notes, promoteDomain }),
      });
      showToast(`Report updated to ${nextStatus}.`, 'success');
      setActiveReport(null);
      setNotes('');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Moderation failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getCardTone = (status: ReportModerationStatus) => {
    if (status === 'CONFIRMED') return 'bg-[#FBEAE3] border-[#842D48]/30';
    if (status === 'CORROBORATED') return 'bg-[#FBF3DF] border-[#C69B36]/35';
    if (status === 'REJECTED') return 'bg-[#E6F2EC]/75 border-[#2F4F4A]/20';
    return 'bg-[#F3FAF6] border-[#2F4F4A]/25';
  };

  return (
    <AdminLayout title="Community Moderation">
      <div className="space-y-5">
        {/* Slate Green & Light Mint Operations Photo Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[#2F4F4A]/35 bg-[#26403C] text-[#F3FAF6] shadow-sm">
          <ResilientImage
            src="/src/assets/images/admin_moderation_console_1795586899448.jpg"
            alt="Administrator moderating community threat reports in moderation workspace"
            fallbackTitle="Community Moderation Operations"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#26403C]/95 via-[#2F4F4A]/90 to-[#16765B]/75" />
          <div className="relative z-10 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#D8EDE3]">
                Security Operations · Moderation Queue{user?.isDemo ? ' · DEMO DATA' : ''}
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F3FAF6]">
                Review &amp; Moderate Community Threat Reports
              </h2>
              <p className="text-xs sm:text-sm text-[#E6F2EC]/90">
                Only Confirmed reports with verified domains inform automated threat indicators. All
                decisions are written to Audit Logs.
              </p>
            </div>
            <div className="rounded-xl bg-[#26403C]/85 border border-[#D8EDE3]/35 px-4 py-2.5 text-right shrink-0">
              <p className="text-[11px] uppercase tracking-wide text-[#D8EDE3]">Queue Size</p>
              <p className="font-mono-tabular text-xl font-bold text-[#F3FAF6]">
                {filteredAndSorted.length}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[#842D48]/30 bg-[#FBEAE3] p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#651F35]">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#651F35] px-3 py-1.5 text-xs font-semibold text-[#F7F0E5] hover:bg-[#842D48]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Slate Green & Light Mint Search, Filter & Sort Controls */}
        <div className="rounded-2xl border border-[#2F4F4A]/20 bg-[#E6F2EC] p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-[#2F4F4A] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by ID, company, URL, category, or summary..."
              className="w-full rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] pl-9 pr-3 py-2 text-sm text-[#29272B] focus:border-[#2F4F4A] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter moderation queue"
              className="rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] px-3 py-2 text-xs font-semibold text-[#29272B]"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CORROBORATED">Corroborated</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'status')}
              aria-label="Sort community reports"
              className="rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] px-3 py-2 text-xs font-semibold text-[#29272B]"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="status">Sort: Status</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-[#2F4F4A]/20 bg-[#F3FAF6] p-8 text-center text-sm text-[#26403C]/75">
              Loading moderation queue...
            </div>
          ) : pagedReports.length === 0 ? (
            <div className="rounded-2xl border border-[#2F4F4A]/20 bg-[#F3FAF6] p-8 text-center text-sm text-[#26403C]/75">
              No community reports match your filters.
            </div>
          ) : (
            pagedReports.map((rep) => (
              <div
                key={rep.id}
                className={`rounded-xl border p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs ${getCardTone(
                  rep.moderationStatus
                )}`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#29272B]/70">
                    <span className="font-mono-tabular">{rep.id}</span>
                    {(rep.isDemo || user?.isDemo) && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#2F4F4A]">
                          DEMO DATA
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#29272B]">{rep.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#842D48]">{rep.moderationStatus}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                    {rep.duplicateOfId && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#A96B45] font-semibold">
                          Possible duplicate of {rep.duplicateOfId}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="font-display text-base font-bold text-[#29272B]">
                    {rep.companyName || rep.url || 'Unidentified Entity'}
                  </h3>
                  <p className="text-sm text-[#29272B]/85">{rep.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#29272B]/75">
                    {(rep.reporterName || rep.reporterEmail) && (
                      <span>
                        Reporter: <strong>{rep.reporterName || rep.reporterId}</strong>
                        {rep.reporterEmail ? ` (${rep.reporterEmail})` : ''}
                      </span>
                    )}
                    {rep.relatedScanId && (
                      <span className="font-mono-tabular">Related Scan: {rep.relatedScanId}</span>
                    )}
                    {rep.url && <span className="font-mono-tabular">URL: {rep.url}</span>}
                    {rep.recruiterInfo && <span>Recruiter: {rep.recruiterInfo}</span>}
                    {rep.moneyRequested && (
                      <span className="font-semibold text-[#842D48]">
                        Money Requested: {rep.moneyPaid ? `Paid (${rep.moneyPaid})` : 'Yes'}
                      </span>
                    )}
                  </div>
                  {rep.evidenceSummary && (
                    <p className="text-xs text-[#29272B]/80">
                      <span className="font-semibold">Evidence Summary:</span> {rep.evidenceSummary}
                    </p>
                  )}
                  {rep.moderationNotes && (
                    <p className="text-xs font-medium text-[#2F4F4A]">
                      Last Note: {rep.moderationNotes}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveReport(rep);
                    setNextStatus(rep.moderationStatus);
                    setNotes(rep.moderationNotes || '');
                  }}
                  className="rounded-lg bg-[#2F4F4A] px-4 py-2 text-xs font-semibold text-[#F3FAF6] hover:bg-[#26403C] shrink-0"
                >
                  Moderate Report
                </button>
              </div>
            ))
          )}
        </div>

        <div className="rounded-xl overflow-hidden border border-[#2F4F4A]/20">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={filteredAndSorted.length}
            onPageChange={setPage}
          />
        </div>

        <Modal
          open={Boolean(activeReport)}
          onClose={() => {
            if (!submitting) setActiveReport(null);
          }}
          title="Moderate Community Report"
          maxWidth="max-w-xl"
        >
          {activeReport && (
            <form onSubmit={submitModeration} className="space-y-4">
              <div className="rounded-xl border border-[#651F35]/20 bg-[#F0DFBD]/55 p-3.5 text-xs space-y-1.5 text-[#29272B]">
                <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                  <span>{activeReport.companyName || activeReport.url || 'Unidentified Entity'}</span>
                  <span className="font-mono-tabular text-[#651F35]">{activeReport.id}</span>
                </div>
                <p className="text-[#29272B]/85">{activeReport.description}</p>
                {(activeReport.reporterName || activeReport.reporterEmail) && (
                  <p>
                    <strong>Submitted By:</strong> {activeReport.reporterName || activeReport.reporterId}
                    {activeReport.reporterEmail ? ` (${activeReport.reporterEmail})` : ''}
                    {activeReport.relatedScanId ? ` · Scan Ref: ${activeReport.relatedScanId}` : ''}
                  </p>
                )}
                {activeReport.recruiterInfo && (
                  <p>
                    <strong>Recruiter Contact:</strong> {activeReport.recruiterInfo}
                  </p>
                )}
                {activeReport.evidenceSummary && (
                  <p>
                    <strong>Submitted Evidence:</strong> {activeReport.evidenceSummary}
                  </p>
                )}
                {activeReport.moneyRequested && (
                  <p className="text-[#842D48] font-medium">
                    <strong>Financial Demand Reported:</strong>{' '}
                    {activeReport.moneyPaid ? `Amount: ${activeReport.moneyPaid}` : 'Amount not stated'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#29272B] mb-1">
                  Moderation Decision
                </label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as ReportModerationStatus)}
                  className="w-full rounded-lg border border-[#651F35]/25 px-3 py-2 text-sm bg-[#FFFDF8] text-[#29272B]"
                >
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="CORROBORATED">Corroborated</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#29272B] mb-1">
                  Moderation Reason (Logged in Audit Logs) *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-[#651F35]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
                  placeholder="Record verification evidence or reason for status change..."
                />
              </div>
              {nextStatus === 'CONFIRMED' && activeReport.url && (
                <label className="inline-flex items-center gap-2 text-xs text-[#29272B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoteDomain}
                    onChange={(e) => setPromoteDomain(e.target.checked)}
                  />
                  <span>Promote reported URL domain to Confirmed Threat Indicators</span>
                </label>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setActiveReport(null)}
                  className="rounded-lg border border-[#29272B]/25 bg-[#F7F0E5] px-4 py-2 text-xs font-semibold text-[#29272B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#651F35] px-4 py-2 text-xs font-semibold text-[#F7F0E5] hover:bg-[#842D48] disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Save Decision'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
