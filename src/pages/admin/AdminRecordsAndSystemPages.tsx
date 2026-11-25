import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Modal } from '../../components/common/Modal';
import { ResilientImage } from '../../components/common/RiskDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiRequest } from '../../services/api';
import type {
  AuditLogRecord,
  CompanyRecord,
  DomainIndicator,
  EvidenceRecord,
  IntegrationState,
  SystemHealthStatus,
} from '../../types/jobshield';

const PAGE_SIZE = 10;
const DOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function isValidDomainInput(value: string): boolean {
  const cleaned = value.trim().replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '');
  return DOMAIN_REGEX.test(cleaned);
}

function normalizeDomainInput(value: string): string {
  return value.trim().replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '').toLowerCase();
}

function RecordsPaginationBar({
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

function ErrorRetryBanner({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-[#842D48]/30 bg-[#FBEAE3] p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#651F35]">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#651F35] px-3 py-1.5 text-xs font-semibold text-[#F7F0E5] hover:bg-[#842D48]"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Retry</span>
      </button>
    </div>
  );
}

export function AdminCompaniesPage() {
  const { user, demoResetVersion } = useAuth();
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'reviewed_desc' | 'name_asc' | 'status_asc'>('reviewed_desc');
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [officialDomain, setOfficialDomain] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [refs, setRefs] = useState('');
  const [status, setStatus] = useState<CompanyRecord['verificationStatus']>('VERIFIED');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiRequest<{ companies: CompanyRecord[] }>('/api/admin/companies');
      setCompanies(r.companies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load company records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [demoResetVersion]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = companies.filter((c) => {
      const matchQ =
        !q ||
        c.companyName.toLowerCase().includes(q) ||
        c.officialDomain.toLowerCase().includes(q) ||
        c.publicInformationReferences.some((ref) => ref.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'ALL' || c.verificationStatus === statusFilter;
      return matchQ && matchStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name_asc') return a.companyName.localeCompare(b.companyName);
      if (sortBy === 'status_asc') return a.verificationStatus.localeCompare(b.verificationStatus);
      return new Date(b.lastReviewedAt).getTime() - new Date(a.lastReviewedAt).getTime();
    });
  }, [companies, search, statusFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const pagedCompanies = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreateModal = () => {
    setEditingCompany(null);
    setCompanyName('');
    setOfficialDomain('');
    setIndustry('');
    setWebsite('');
    setRefs('');
    setStatus('VERIFIED');
    setNotes('');
    setOpen(true);
  };

  const openEditModal = (company: CompanyRecord) => {
    setEditingCompany(company);
    setCompanyName(company.companyName);
    setOfficialDomain(company.officialDomain);
    setIndustry(company.industry || '');
    setWebsite(company.website || `https://${company.officialDomain}`);
    setRefs(company.publicInformationReferences.join(', '));
    setStatus(company.verificationStatus);
    setNotes(company.notes || '');
    setOpen(true);
  };

  const saveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showToast('Company name is required.', 'error');
      return;
    }
    if (!isValidDomainInput(officialDomain)) {
      showToast('Enter a valid official domain name (e.g. northstar-labs.example).', 'error');
      return;
    }
    const cleanDomain = normalizeDomainInput(officialDomain);
    const parsedRefs = refs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      if (editingCompany) {
        await apiRequest(`/api/admin/companies/${encodeURIComponent(editingCompany.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({
            companyName: companyName.trim(),
            officialDomain: cleanDomain,
            industry: industry.trim(),
            website: website.trim(),
            publicInformationReferences: parsedRefs,
            verificationStatus: status,
            notes: notes.trim(),
          }),
        });
        showToast('Company record updated.', 'success');
      } else {
        await apiRequest('/api/admin/companies', {
          method: 'POST',
          body: JSON.stringify({
            companyName: companyName.trim(),
            officialDomain: cleanDomain,
            industry: industry.trim(),
            website: website.trim(),
            publicInformationReferences: parsedRefs,
            verificationStatus: status,
            notes: notes.trim(),
          }),
        });
        showToast('Company record added.', 'success');
      }
      setOpen(false);
      setEditingCompany(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save company.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Company Records">
      <div className="space-y-5">
        {/* Slate Green & Light Mint Photographic Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-[#2F4F4A]/35 bg-[#26403C] text-[#F3FAF6] shadow-sm">
          <ResilientImage
            src="/src/assets/images/trust_company_verification_1795580302513.jpg"
            alt="Administrator verifying authoritative company domain records"
            fallbackTitle="Authoritative Company Directory"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#26403C]/95 via-[#2F4F4A]/90 to-[#16765B]/75" />
          <div className="relative z-10 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#D8EDE3]">
                Trust Directory · Employer Governance{user?.isDemo ? ' · DEMO DATA' : ''}
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F3FAF6]">
                Authoritative Company &amp; Domain Records
              </h2>
              <p className="text-xs sm:text-sm text-[#E6F2EC]/90">
                Reference company domains used by automated domain-consistency and impersonation checks.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#D8EDE3] px-4 py-2.5 text-xs font-bold text-[#26403C] hover:bg-[#F3FAF6] shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Company Record</span>
            </button>
          </div>
        </section>

        {error && <ErrorRetryBanner error={error} onRetry={load} />}

        <div className="rounded-2xl border border-[#2F4F4A]/20 bg-[#E6F2EC] p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-[#2F4F4A] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies by name, domain, or reference..."
              className="w-full rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] pl-9 pr-3 py-2 text-sm text-[#29272B] focus:border-[#2F4F4A] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by verification status"
              className="rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] px-3 py-2 text-xs font-semibold text-[#29272B]"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="UNVERIFIED">Unverified</option>
              <option value="SUSPICIOUS">Suspicious</option>
              <option value="FLAGGED">Flagged</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'reviewed_desc' | 'name_asc' | 'status_asc')
              }
              aria-label="Sort companies"
              className="rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] px-3 py-2 text-xs font-semibold text-[#29272B]"
            >
              <option value="reviewed_desc">Sort: Recently Reviewed</option>
              <option value="name_asc">Sort: Name (A–Z)</option>
              <option value="status_asc">Sort: Status</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2F4F4A]/25 bg-[#F3FAF6] overflow-x-auto shadow-xs">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#26403C]/75">
              Loading company records...
            </div>
          ) : pagedCompanies.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#26403C]/75">
              {companies.length === 0
                ? 'No company records have been added yet. Add verified official domains to assist consistency checks.'
                : 'No company records match your filters.'}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#2F4F4A] text-xs font-semibold text-[#D8EDE3]">
                <tr>
                  <th className="py-3.5 px-4">Company &amp; Industry</th>
                  <th className="py-3.5 px-4">Official Domain</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">References &amp; Linked Entities</th>
                  <th className="py-3.5 px-4">Last Reviewed</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8EDE3]">
                {pagedCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-[#E6F2EC]/80">
                    <td className="py-3 px-4 font-semibold text-[#29272B]">
                      <div className="flex items-center gap-2">
                        <span>{c.companyName}</span>
                        {user?.isDemo && (
                          <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#2F4F4A]/70">
                            DEMO DATA
                          </span>
                        )}
                      </div>
                      {c.industry && (
                        <p className="text-[11px] font-normal text-[#29272B]/65">{c.industry}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#2F4F4A]">
                      <p>{c.officialDomain}</p>
                      {c.website && (
                        <p className="text-[11px] text-[#29272B]/60 truncate max-w-[180px]">
                          {c.website}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold">
                      <span
                        className={
                          c.verificationStatus === 'VERIFIED'
                            ? 'text-[#16765B]'
                            : c.verificationStatus === 'FLAGGED'
                            ? 'text-[#842D48]'
                            : c.verificationStatus === 'SUSPICIOUS'
                            ? 'text-[#A96B45]'
                            : 'text-[#29272B]/75'
                        }
                      >
                        {c.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#29272B]/80 max-w-xs">
                      <p className="truncate">{c.publicInformationReferences.join(', ') || '—'}</p>
                      {(c.relatedRecruiters?.length || c.relatedOpportunities?.length) ? (
                        <p className="text-[11px] text-[#174D3B] truncate">
                          {c.relatedRecruiters?.length
                            ? `Recruiters: ${c.relatedRecruiters.join(', ')}`
                            : ''}
                          {c.relatedRecruiters?.length && c.relatedOpportunities?.length ? ' · ' : ''}
                          {c.relatedOpportunities?.length
                            ? `Roles: ${c.relatedOpportunities.join(', ')}`
                            : ''}
                        </p>
                      ) : null}
                      {c.notes && <p className="text-[11px] text-[#29272B]/65 truncate">{c.notes}</p>}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]/70 whitespace-nowrap">
                      {new Date(c.lastReviewedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="inline-flex items-center gap-1 rounded-md border border-[#2F4F4A]/30 bg-[#E6F2EC] px-2.5 py-1 text-xs font-semibold text-[#2F4F4A] hover:bg-[#D8EDE3]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <RecordsPaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={filteredAndSorted.length}
            onPageChange={setPage}
          />
        </div>

        <Modal
          open={open}
          onClose={() => {
            if (!saving) setOpen(false);
          }}
          title={editingCompany ? 'Update Company Record' : 'Add Company Record'}
        >
          <form onSubmit={saveCompany} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-[#174D3B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Official Domain *
              </label>
              <input
                type="text"
                required
                value={officialDomain}
                onChange={(e) => setOfficialDomain(e.target.value)}
                placeholder="e.g. northstar-labs.example"
                className="w-full rounded-lg border border-[#174D3B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#29272B] mb-1">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Enterprise Software"
                  className="w-full rounded-lg border border-[#174D3B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#29272B] mb-1">Official Website</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://northstar-labs.example"
                  className="w-full rounded-lg border border-[#174D3B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Verification Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CompanyRecord['verificationStatus'])}
                className="w-full rounded-lg border border-[#174D3B]/25 px-3 py-2 text-sm bg-[#FFFDF8] text-[#29272B]"
              >
                <option value="VERIFIED">Verified</option>
                <option value="UNVERIFIED">Unverified</option>
                <option value="SUSPICIOUS">Suspicious</option>
                <option value="FLAGGED">Flagged</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Public Evidence References (comma-separated)
              </label>
              <input
                type="text"
                value={refs}
                onChange={(e) => setRefs(e.target.value)}
                placeholder="MCA CIN record, official careers portal"
                className="w-full rounded-lg border border-[#174D3B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Reviewer Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-[#174D3B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setOpen(false)}
                className="rounded-lg border border-[#29272B]/25 bg-[#F7F0E5] px-4 py-2 text-xs font-semibold text-[#29272B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#174D3B] px-4 py-2 text-xs font-semibold text-[#F7F0E5] hover:bg-[#16765B] disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingCompany ? 'Update Company' : 'Save Company'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

export function AdminDomainsPage() {
  const { user, demoResetVersion } = useAuth();
  const { showToast } = useToast();
  const [domains, setDomains] = useState<DomainIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'checked_desc' | 'domain_asc' | 'status_asc'>('checked_desc');
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainIndicator | null>(null);
  const [domainName, setDomainName] = useState('');
  const [indicatorType, setIndicatorType] = useState('Lookalike Recruitment Portal');
  const [threatStatus, setThreatStatus] =
    useState<DomainIndicator['threatStatus']>('MONITORED');
  const [severity, setSeverity] = useState<NonNullable<DomainIndicator['severity']>>('medium');
  const [source, setSource] = useState('');
  const [evidenceSummary, setEvidenceSummary] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiRequest<{ domains: DomainIndicator[] }>('/api/admin/domains');
      setDomains(r.domains);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load domain indicators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [demoResetVersion]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = domains.filter((d) => {
      const matchQ =
        !q ||
        d.domainName.toLowerCase().includes(q) ||
        d.indicatorType.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q) ||
        (d.evidenceSummary || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || d.threatStatus === statusFilter;
      return matchQ && matchStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'domain_asc') return a.domainName.localeCompare(b.domainName);
      if (sortBy === 'status_asc') return a.threatStatus.localeCompare(b.threatStatus);
      return new Date(b.lastCheckedAt).getTime() - new Date(a.lastCheckedAt).getTime();
    });
  }, [domains, search, statusFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const pagedDomains = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreateModal = () => {
    setEditingDomain(null);
    setDomainName('');
    setIndicatorType('Lookalike Recruitment Portal');
    setThreatStatus('MONITORED');
    setSeverity('medium');
    setSource('');
    setEvidenceSummary('');
    setOpen(true);
  };

  const openEditModal = (indicator: DomainIndicator) => {
    setEditingDomain(indicator);
    setDomainName(indicator.domainName);
    setIndicatorType(indicator.indicatorType);
    setThreatStatus(indicator.threatStatus);
    setSeverity(indicator.severity || 'medium');
    setSource(indicator.source);
    setEvidenceSummary(indicator.evidenceSummary || '');
    setOpen(true);
  };

  const saveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidDomainInput(domainName)) {
      showToast('Enter a valid domain name (e.g. lookalike-careers.example).', 'error');
      return;
    }
    if (!source.trim()) {
      showToast('Source is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/api/admin/domains', {
        method: 'POST',
        body: JSON.stringify({
          domainName: normalizeDomainInput(domainName),
          indicatorType: indicatorType.trim() || 'Lookalike Recruitment Portal',
          threatStatus,
          severity,
          source: source.trim(),
          evidenceSummary: evidenceSummary.trim(),
        }),
      });
      showToast(
        editingDomain ? 'Domain threat indicator updated.' : 'Domain threat indicator saved.',
        'success'
      );
      setOpen(false);
      setEditingDomain(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Domain & Threat Indicators">
      <div className="space-y-5">
        {/* Slate Green & Light Mint Photographic Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-[#2F4F4A]/35 bg-[#26403C] text-[#F3FAF6] shadow-sm">
          <ResilientImage
            src="/src/assets/images/scanner_url_domain_1795580301089.jpg"
            alt="Administrator inspecting suspicious domain and threat intelligence feeds"
            fallbackTitle="Domain & Threat Indicators"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#26403C]/95 via-[#2F4F4A]/90 to-[#16765B]/75" />
          <div className="relative z-10 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#D8EDE3]">
                Threat Feed Governance{user?.isDemo ? ' · DEMO DATA' : ''}
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F3FAF6]">
                Domain Watchlist &amp; Confirmed Threat Indicators
              </h2>
              <p className="text-xs sm:text-sm text-[#E6F2EC]/90">
                Manage monitored and confirmed threat domains. Only CONFIRMED_THREAT entries trigger
                threat matches in future scans.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#D8EDE3] px-4 py-2.5 text-xs font-bold text-[#26403C] hover:bg-[#F3FAF6] shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Indicator</span>
            </button>
          </div>
        </section>

        {error && <ErrorRetryBanner error={error} onRetry={load} />}

        <div className="rounded-2xl border border-[#2F4F4A]/20 bg-[#E6F2EC] p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-[#2F4F4A] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search domains by hostname, indicator type, or source..."
              className="w-full rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] pl-9 pr-3 py-2 text-sm text-[#29272B] focus:border-[#2F4F4A] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by threat status"
              className="rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] px-3 py-2 text-xs font-semibold text-[#29272B]"
            >
              <option value="ALL">All Threat Statuses</option>
              <option value="CONFIRMED_THREAT">Confirmed Threat</option>
              <option value="SUSPICIOUS">Suspicious</option>
              <option value="MONITORED">Monitored</option>
              <option value="CLEARED">Cleared</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'checked_desc' | 'domain_asc' | 'status_asc')
              }
              aria-label="Sort domain indicators"
              className="rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] px-3 py-2 text-xs font-semibold text-[#29272B]"
            >
              <option value="checked_desc">Sort: Last Checked</option>
              <option value="domain_asc">Sort: Domain (A–Z)</option>
              <option value="status_asc">Sort: Threat Status</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2F4F4A]/25 bg-[#F3FAF6] overflow-x-auto shadow-xs">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#26403C]/75">
              Loading domain indicators...
            </div>
          ) : pagedDomains.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#26403C]/75">
              {domains.length === 0
                ? 'No domain threat indicators recorded yet.'
                : 'No domain threat indicators match your filters.'}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#2F4F4A] text-xs font-semibold text-[#D8EDE3]">
                <tr>
                  <th className="py-3.5 px-4">Domain</th>
                  <th className="py-3.5 px-4">Indicator Type</th>
                  <th className="py-3.5 px-4">Status &amp; Severity</th>
                  <th className="py-3.5 px-4">Source &amp; Evidence</th>
                  <th className="py-3.5 px-4">Detected / Checked</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8EDE3]">
                {pagedDomains.map((d) => (
                  <tr key={d.id} className="hover:bg-[#E6F2EC]/80">
                    <td className="py-3 px-4 font-mono-tabular text-xs font-semibold text-[#29272B]">
                      <div className="flex items-center gap-2">
                        <span>{d.domainName}</span>
                        {user?.isDemo && (
                          <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#2F4F4A]/70">
                            DEMO DATA
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#29272B]/80">{d.indicatorType}</td>
                    <td className="py-3 px-4 text-xs font-semibold">
                      <span
                        className={
                          d.threatStatus === 'CONFIRMED_THREAT'
                            ? 'text-[#842D48]'
                            : d.threatStatus === 'SUSPICIOUS'
                            ? 'text-[#A96B45]'
                            : 'text-[#16765B]'
                        }
                      >
                        {d.threatStatus}
                      </span>
                      {d.severity && (
                        <p className="font-mono-tabular text-[10px] uppercase text-[#29272B]/70 mt-0.5">
                          Severity: {d.severity}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#29272B]/80 max-w-xs">
                      <p className="font-medium truncate">{d.source}</p>
                      {d.evidenceSummary && (
                        <p className="text-[11px] text-[#29272B]/65 truncate">
                          {d.evidenceSummary}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]/70 whitespace-nowrap">
                      <p>{new Date(d.lastCheckedAt).toLocaleDateString()}</p>
                      {d.firstDetectedAt && (
                        <p className="text-[10px] text-[#29272B]/55">
                          First: {new Date(d.firstDetectedAt).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(d)}
                        className="inline-flex items-center gap-1 rounded-md border border-[#2F4F4A]/30 bg-[#E6F2EC] px-2.5 py-1 text-xs font-semibold text-[#2F4F4A] hover:bg-[#D8EDE3]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <RecordsPaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={filteredAndSorted.length}
            onPageChange={setPage}
          />
        </div>

        <Modal
          open={open}
          onClose={() => {
            if (!saving) setOpen(false);
          }}
          title={editingDomain ? 'Edit Domain Indicator' : 'Add Domain Indicator'}
        >
          <form onSubmit={saveDomain} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Domain Name *
              </label>
              <input
                type="text"
                required
                readOnly={Boolean(editingDomain)}
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                placeholder="lookalike-careers.example"
                className="w-full rounded-lg border border-[#A96B45]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B] read-only:opacity-75"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Indicator Type *
              </label>
              <input
                type="text"
                required
                value={indicatorType}
                onChange={(e) => setIndicatorType(e.target.value)}
                className="w-full rounded-lg border border-[#A96B45]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#29272B] mb-1">
                  Threat Status
                </label>
                <select
                  value={threatStatus}
                  onChange={(e) =>
                    setThreatStatus(e.target.value as DomainIndicator['threatStatus'])
                  }
                  className="w-full rounded-lg border border-[#A96B45]/25 px-3 py-2 text-sm bg-[#FFFDF8] text-[#29272B]"
                >
                  <option value="MONITORED">Monitored</option>
                  <option value="SUSPICIOUS">Suspicious</option>
                  <option value="CONFIRMED_THREAT">Confirmed Threat</option>
                  <option value="CLEARED">Cleared</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#29272B] mb-1">
                  Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) =>
                    setSeverity(e.target.value as NonNullable<DomainIndicator['severity']>)
                  }
                  className="w-full rounded-lg border border-[#A96B45]/25 px-3 py-2 text-sm bg-[#FFFDF8] text-[#29272B]"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">Source *</label>
              <input
                type="text"
                required
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Moderator Investigation"
                className="w-full rounded-lg border border-[#A96B45]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Evidence Summary
              </label>
              <textarea
                rows={2}
                value={evidenceSummary}
                onChange={(e) => setEvidenceSummary(e.target.value)}
                className="w-full rounded-lg border border-[#A96B45]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setOpen(false)}
                className="rounded-lg border border-[#29272B]/25 bg-[#F7F0E5] px-4 py-2 text-xs font-semibold text-[#29272B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#174D3B] px-4 py-2 text-xs font-semibold text-[#F7F0E5] hover:bg-[#16765B] disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingDomain ? 'Update Indicator' : 'Save Indicator'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

export function AdminEvidencePage() {
  const { user, demoResetVersion } = useAuth();
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'confidence'>('newest');
  const [page, setPage] = useState(1);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiRequest<{ evidence: EvidenceRecord[] }>('/api/admin/evidence');
      setEvidence(r.evidence);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load evidence records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [demoResetVersion]);

  const entityTypes = useMemo(() => {
    return Array.from(new Set(evidence.map((ev) => ev.entityType))).sort();
  }, [evidence]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = evidence.filter((ev) => {
      const matchQ =
        !q ||
        ev.id.toLowerCase().includes(q) ||
        ev.evidenceType.toLowerCase().includes(q) ||
        ev.source.toLowerCase().includes(q) ||
        ev.finding.toLowerCase().includes(q) ||
        (ev.relatedScanId || '').toLowerCase().includes(q) ||
        (ev.relatedReportId || '').toLowerCase().includes(q);
      const matchConfidence =
        confidenceFilter === 'ALL' || ev.confidence.toLowerCase() === confidenceFilter;
      const matchEntity = entityFilter === 'ALL' || ev.entityType === entityFilter;
      return matchQ && matchConfidence && matchEntity;
    });

    const rankConfidence = (c: string) => (c === 'high' ? 3 : c === 'medium' ? 2 : 1);
    return [...filtered].sort((a, b) => {
      if (sortBy === 'confidence') return rankConfidence(b.confidence) - rankConfidence(a.confidence);
      if (sortBy === 'oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [evidence, search, confidenceFilter, entityFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, confidenceFilter, entityFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const pagedEvidence = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout title="Evidence Records">
      <div className="space-y-5">
        {/* Slate Green & Light Mint Photographic Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-[#2F4F4A]/35 bg-[#26403C] text-[#F3FAF6] shadow-sm">
          <ResilientImage
            src="/src/assets/images/scanner_offer_analysis_1795578120650.jpg"
            alt="Forensic evidence records captured by verification engines"
            fallbackTitle="Evidence Records"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#26403C]/95 via-[#2F4F4A]/90 to-[#16765B]/75" />
          <div className="relative z-10 p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#D8EDE3]">
                Verification Ledger{user?.isDemo ? ' · DEMO DATA' : ''}
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F3FAF6]">
                Structured Evidence Observations
              </h2>
              <p className="text-xs sm:text-sm text-[#E6F2EC]/90">
                Verification observations generated by automated scanners, technical domain checks,
                and moderated community reports.
              </p>
            </div>
            <div className="rounded-xl bg-[#26403C]/85 border border-[#D8EDE3]/35 px-4 py-2.5 text-right shrink-0">
              <p className="text-[11px] uppercase tracking-wide text-[#D8EDE3]">Evidence Logged</p>
              <p className="font-mono-tabular text-xl font-bold text-[#F3FAF6]">
                {filteredAndSorted.length}
              </p>
            </div>
          </div>
        </section>

        {error && <ErrorRetryBanner error={error} onRetry={load} />}

        <div className="rounded-2xl border border-[#2F4F4A]/20 bg-[#E6F2EC] p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-[#2F4F4A] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search evidence by ID, scan ref, type, source, or finding..."
              className="w-full rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] pl-9 pr-3 py-2 text-sm text-[#29272B] focus:border-[#2F4F4A] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              aria-label="Filter by confidence"
              className="rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] px-3 py-2 text-xs font-semibold text-[#29272B]"
            >
              <option value="ALL">All Confidence</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              aria-label="Filter by entity type"
              className="rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] px-3 py-2 text-xs font-semibold text-[#29272B]"
            >
              <option value="ALL">All Entity Types</option>
              {entityTypes.map((et) => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'confidence')}
              aria-label="Sort evidence records"
              className="rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] px-3 py-2 text-xs font-semibold text-[#29272B]"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="confidence">Sort: Confidence</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2F4F4A]/25 bg-[#F3FAF6] overflow-x-auto shadow-xs">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#26403C]/75">
              Loading evidence records...
            </div>
          ) : pagedEvidence.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#26403C]/75">
              {evidence.length === 0
                ? 'No evidence records logged yet. Evidence records populate automatically from scans and community reports.'
                : 'No evidence records match your filters.'}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#2F4F4A] text-xs font-semibold text-[#D8EDE3]">
                <tr>
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Related Scan / Report / Entity</th>
                  <th className="py-3.5 px-4">Evidence Type</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Confidence</th>
                  <th className="py-3.5 px-4">Finding</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8EDE3]">
                {pagedEvidence.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#E6F2EC]/80">
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]/70">
                      <div className="flex items-center gap-1.5">
                        <span>{ev.id}</span>
                        {user?.isDemo && (
                          <span className="font-mono-tabular text-[9px] font-bold uppercase text-[#2F4F4A]/70">
                            DEMO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]">
                      {ev.relatedScanId
                        ? `Scan: ${ev.relatedScanId}`
                        : ev.relatedReportId
                        ? `Report: ${ev.relatedReportId}`
                        : ev.entityType}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-[#29272B]">
                      {ev.evidenceType}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#29272B]/80">{ev.source}</td>
                    <td className="py-3 px-4 text-xs uppercase font-bold text-[#16765B]">
                      {ev.confidence}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#29272B]/80 max-w-xs truncate">
                      {ev.finding}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]/70 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedEvidence(ev)}
                        className="inline-flex items-center gap-1 rounded-md border border-[#2F4F4A]/30 bg-[#E6F2EC] px-2.5 py-1 text-xs font-semibold text-[#2F4F4A] hover:bg-[#D8EDE3]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <RecordsPaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={filteredAndSorted.length}
            onPageChange={setPage}
          />
        </div>

        <Modal
          open={Boolean(selectedEvidence)}
          onClose={() => setSelectedEvidence(null)}
          title="Evidence Finding Details"
          maxWidth="max-w-xl"
        >
          {selectedEvidence && (
            <div className="space-y-3 text-sm text-[#29272B]">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#174D3B]/20 bg-[#E7EFE8]/70 p-3.5 text-xs">
                <div>
                  <span className="text-[#29272B]/65">Record ID</span>
                  <p className="font-mono-tabular font-semibold">{selectedEvidence.id}</p>
                </div>
                <div>
                  <span className="text-[#29272B]/65">Confidence</span>
                  <p className="font-bold uppercase text-[#16765B]">
                    {selectedEvidence.confidence}
                  </p>
                </div>
                <div>
                  <span className="text-[#29272B]/65">Entity Type</span>
                  <p className="font-semibold">{selectedEvidence.entityType}</p>
                </div>
                <div>
                  <span className="text-[#29272B]/65">Evidence Type</span>
                  <p className="font-semibold">{selectedEvidence.evidenceType}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[#29272B]/65">Source</span>
                  <p className="font-semibold">{selectedEvidence.source}</p>
                </div>
                {(selectedEvidence.relatedScanId || selectedEvidence.relatedReportId) && (
                  <div className="col-span-2">
                    <span className="text-[#29272B]/65">Linked Reference</span>
                    <p className="font-mono-tabular font-semibold">
                      {selectedEvidence.relatedScanId || selectedEvidence.relatedReportId}
                    </p>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-[#29272B]/15 bg-[#FFFDF8] p-4 space-y-1">
                <p className="text-xs font-semibold uppercase text-[#174D3B]">Full Finding</p>
                <p className="text-sm text-[#29272B] whitespace-pre-wrap leading-relaxed">
                  {selectedEvidence.finding}
                </p>
              </div>
              <p className="text-xs font-mono-tabular text-[#29272B]/65">
                Logged {new Date(selectedEvidence.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

export function AdminAuditLogsPage() {
  const { user, demoResetVersion } = useAuth();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'action'>('newest');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiRequest<{ logs: AuditLogRecord[] }>('/api/admin/audit-logs');
      setLogs(r.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [demoResetVersion]);

  const actions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action))).sort();
  }, [logs]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = logs.filter((log) => {
      const matchQ =
        !q ||
        log.action.toLowerCase().includes(q) ||
        (log.actorEmail || log.actorId).toLowerCase().includes(q) ||
        `${log.targetType}:${log.targetId}`.toLowerCase().includes(q) ||
        JSON.stringify(log.metadata).toLowerCase().includes(q);
      const matchAction = actionFilter === 'ALL' || log.action === actionFilter;
      return matchQ && matchAction;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'action') return a.action.localeCompare(b.action);
      if (sortBy === 'oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [logs, search, actionFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const pagedLogs = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout title="Audit Logs">
      <div className="space-y-5">
        {/* Slate Green & Light Mint Photographic Audit Log Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-[#2F4F4A]/35 bg-[#26403C] text-[#F3FAF6] shadow-sm">
          <ResilientImage
            src="/src/assets/images/admin_audit_monitoring_1795588753666.jpg"
            alt="Administrator security audit trail and monitoring screen"
            fallbackTitle="Security Governance Trail"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#26403C]/95 via-[#2F4F4A]/90 to-[#16765B]/75" />
          <div className="relative z-10 p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#D8EDE3]">
                Security Governance Trail{user?.isDemo ? ' · DEMO DATA' : ''}
              </p>
              <h2 className="font-display text-xl font-bold text-[#F3FAF6]">
                Immutable Administrative Audit Ledger
              </h2>
              <p className="text-sm text-[#E6F2EC]/90">
                Chronological record of authentication events, moderation actions, user account updates,
                and administrative changes.
              </p>
            </div>
            <span className="font-mono-tabular text-xs font-semibold text-[#F3FAF6] bg-[#26403C]/85 border border-[#D8EDE3]/40 rounded-md px-3.5 py-1.5 shrink-0">
              {filteredAndSorted.length} Events Logged
            </span>
          </div>
        </section>

        {error && <ErrorRetryBanner error={error} onRetry={load} />}

        <div className="rounded-2xl border border-[#2F4F4A]/20 bg-[#E6F2EC] p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-[#2F4F4A] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit events by actor, action, target, or metadata..."
              className="w-full rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] pl-9 pr-3 py-2 text-sm text-[#29272B] focus:border-[#2F4F4A] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label="Filter by audit action"
              className="rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] px-3 py-2 text-xs font-semibold text-[#29272B]"
            >
              <option value="ALL">All Actions</option>
              {actions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'action')}
              aria-label="Sort audit logs"
              className="rounded-lg border border-[#2F4F4A]/25 bg-[#F3FAF6] px-3 py-2 text-xs font-semibold text-[#29272B]"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="action">Sort: Action (A–Z)</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2F4F4A]/25 bg-[#F3FAF6] overflow-x-auto shadow-xs">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#26403C]/75">Loading audit logs...</div>
          ) : pagedLogs.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#26403C]/75">
              {logs.length === 0
                ? 'No audit events recorded yet.'
                : 'No audit events match your filters.'}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#2F4F4A] text-xs font-semibold text-[#D8EDE3]">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Target</th>
                  <th className="py-3.5 px-4">Metadata</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8EDE3]">
                {pagedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#E6F2EC]/80">
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]/70 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-semibold text-[#29272B]">
                        {log.actorEmail || log.actorId}
                      </span>{' '}
                      <span className="text-[#29272B]/65">({log.actorRole || 'SYSTEM'})</span>
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs font-bold text-[#2F4F4A]">
                      {log.action}
                      {user?.isDemo && (
                        <span className="ml-2 text-[9px] font-bold uppercase text-[#563653]">
                          DEMO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]/80">
                      {log.targetType}:{log.targetId}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#29272B]/70 max-w-xs truncate">
                      {JSON.stringify(log.metadata)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 rounded-md border border-[#2F4F4A]/30 bg-[#E6F2EC] px-2.5 py-1 text-xs font-semibold text-[#2F4F4A] hover:bg-[#D8EDE3]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <RecordsPaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={filteredAndSorted.length}
            onPageChange={setPage}
          />
        </div>

        <Modal
          open={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title="Audit Event Metadata"
          maxWidth="max-w-xl"
        >
          {selectedLog && (
            <div className="space-y-3 text-sm text-[#29272B]">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#A96B45]/25 bg-[#F0DFBD]/50 p-3.5 text-xs">
                <div>
                  <span className="text-[#29272B]/65">Action</span>
                  <p className="font-mono-tabular font-bold text-[#651F35]">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-[#29272B]/65">Target</span>
                  <p className="font-mono-tabular font-semibold">
                    {selectedLog.targetType}:{selectedLog.targetId}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[#29272B]/65">Actor</span>
                  <p className="font-semibold">
                    {selectedLog.actorEmail || selectedLog.actorId} ({selectedLog.actorRole || 'SYSTEM'})
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-[#29272B]/15 bg-[#29272B] p-4 text-[#F0DFBD]">
                <p className="text-[11px] uppercase tracking-wider text-[#E3B34C] mb-1.5">
                  Structured Metadata
                </p>
                <pre className="font-mono-tabular text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
              <p className="text-xs font-mono-tabular text-[#29272B]/65">
                Timestamp: {new Date(selectedLog.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

export function AdminSystemHealthPage() {
  const { demoResetVersion } = useAuth();
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiRequest<{ health: SystemHealthStatus }>('/api/admin/system-health');
      setHealth(r.health);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to check system health.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [demoResetVersion]);

  const statusMeta = (s: IntegrationState) =>
    s === 'Connected'
      ? {
          text: 'text-[#16765B]',
          card: 'border-[#16765B]/30 bg-[#E7EFE8]',
        }
      : s === 'Not Configured'
      ? {
          text: 'text-[#A96B45]',
          card: 'border-[#C69B36]/35 bg-[#FBF3DF]',
        }
      : {
          text: 'text-[#842D48]',
          card: 'border-[#842D48]/30 bg-[#FBEAE3]',
        };

  return (
    <AdminLayout title="System Health & Integrations">
      {loading ? (
        <div className="rounded-2xl border border-[#175E60]/20 bg-[#F7F0E5] p-8 text-center text-sm text-[#29272B]/70">
          Checking service health...
        </div>
      ) : error || !health ? (
        <ErrorRetryBanner
          error={error || 'System health report unavailable.'}
          onRetry={load}
        />
      ) : (
        <div className="space-y-6">
          {/* Slate Green & Light Mint Photographic Banner */}
          <section className="relative overflow-hidden rounded-2xl border border-[#2F4F4A]/35 bg-[#26403C] text-[#F3FAF6] shadow-sm">
            <ResilientImage
              src="/src/assets/images/admin_system_health_1795588753097.jpg"
              alt="System health and integration monitoring infrastructure"
              fallbackTitle="Diagnostics & Service Readiness"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#26403C]/95 via-[#2F4F4A]/90 to-[#16765B]/75" />
            <div className="relative z-10 p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#D8EDE3]">
                  Diagnostics &amp; Service Readiness
                </p>
                <h2 className="font-display text-xl font-bold text-[#F3FAF6]">
                  Platform Pipeline &amp; Integration Status
                </h2>
              </div>
              {health.isDemoData && (
                <div className="inline-flex items-center gap-2 rounded-lg border border-[#D8EDE3]/45 bg-[#26403C]/85 px-3.5 py-2 text-xs font-semibold text-[#F3FAF6]">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#CD8B60]" />
                  <span>DEMO DATA · Simulated diagnostic metrics shown for sandbox preview</span>
                </div>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Backend Express API', data: health.backend },
              { name: `Database (${health.database.engine})`, data: health.database },
              { name: `Gemini AI (${health.gemini.model})`, data: health.gemini },
              { name: 'Google Web Risk', data: health.webRisk },
              { name: 'ICANN RDAP & DNS/TLS', data: health.rdapDns },
              { name: 'Document & OCR Pipeline', data: health.ocr },
              { name: 'Google OAuth Verification', data: health.googleOAuth },
              ...(health.notifications
                ? [{ name: 'Alert & Notification Queue', data: health.notifications }]
                : []),
            ].map((item) => {
              const meta = statusMeta(item.data.status);
              return (
                <div
                  key={item.name}
                  className={`rounded-2xl border p-5 space-y-2 shadow-xs ${meta.card}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-sm font-bold text-[#29272B]">{item.name}</h2>
                    <span className={`text-xs font-bold ${meta.text}`}>{item.data.status}</span>
                  </div>
                  <p className="text-xs text-[#29272B]/80 leading-relaxed">{item.data.detail}</p>
                </div>
              );
            })}
          </div>

          <section className="rounded-2xl border border-[#2F4F4A]/20 bg-[#F3FAF6] p-6 space-y-3 shadow-xs">
            <h2 className="font-display text-base font-bold text-[#2F4F4A]">
              Recent Service Errors
            </h2>
            {health.recentErrors.length === 0 ? (
              <p className="text-sm text-[#26403C]/75">No recent service errors logged.</p>
            ) : (
              <div className="divide-y divide-[#D8EDE3] text-xs">
                {health.recentErrors.map((err) => (
                  <div key={err.id} className="py-2.5 flex justify-between gap-4">
                    <div>
                      <span className="font-semibold text-[#842D48]">{err.service}: </span>
                      <span className="text-[#29272B]/85">{err.message}</span>
                    </div>
                    <span className="font-mono-tabular text-[#29272B]/65 shrink-0">
                      {new Date(err.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AdminLayout>
  );
}

export function AdminSettingsPage() {
  const { user, demoResetVersion } = useAuth();
  const { showToast } = useToast();
  const [requireNotice, setRequireNotice] = useState(true);
  const [allowCommunity, setAllowCommunity] = useState(true);
  const [autoPromoteDomains, setAutoPromoteDomains] = useState(true);
  const [enableOcrPipeline, setEnableOcrPipeline] = useState(true);
  const [highRiskAlertThreshold, setHighRiskAlertThreshold] = useState(70);
  const [dataRetentionDays, setDataRetentionDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiRequest<{
        settings: {
          requireEmailVerificationNotice: boolean;
          allowCommunitySubmissions: boolean;
          autoPromoteConfirmedDomains?: boolean;
          highRiskAlertThreshold?: number;
          dataRetentionDays?: number;
          enableOcrPipeline?: boolean;
        };
      }>('/api/admin/settings');
      setRequireNotice(r.settings.requireEmailVerificationNotice);
      setAllowCommunity(r.settings.allowCommunitySubmissions);
      setAutoPromoteDomains(r.settings.autoPromoteConfirmedDomains ?? true);
      setEnableOcrPipeline(r.settings.enableOcrPipeline ?? true);
      setHighRiskAlertThreshold(r.settings.highRiskAlertThreshold ?? 70);
      setDataRetentionDays(r.settings.dataRetentionDays ?? 90);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load platform settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [demoResetVersion]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          requireEmailVerificationNotice: requireNotice,
          allowCommunitySubmissions: allowCommunity,
          autoPromoteConfirmedDomains: autoPromoteDomains,
          highRiskAlertThreshold,
          dataRetentionDays,
          enableOcrPipeline,
        }),
      });
      showToast('Platform settings saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save platform settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Admin Settings">
      <div className="max-w-3xl space-y-6">
        {/* Slate Green & Light Mint Photographic Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-[#2F4F4A]/35 bg-[#26403C] text-[#F3FAF6] shadow-sm">
          <ResilientImage
            src="/src/assets/images/about_team_workspace_1795578122013.jpg"
            alt="Administrator platform controls and governance configuration"
            fallbackTitle="Platform Governance Settings"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#26403C]/95 via-[#2F4F4A]/90 to-[#16765B]/75" />
          <div className="relative z-10 p-6 sm:p-7 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D8EDE3]">
              Console Configuration{user?.isDemo ? ' · DEMO DATA' : ''}
            </p>
            <h2 className="font-display text-xl font-bold text-[#F3FAF6]">
              Platform Controls &amp; Environment Readiness
            </h2>
            <p className="text-xs sm:text-sm text-[#E6F2EC]/90">
              Manage citizen submission controls, email verification notices, risk thresholds, and review secret configuration.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#2F4F4A]/25 bg-[#E6F2EC] p-6 space-y-3 text-sm shadow-xs">
          <h2 className="font-display text-lg font-bold text-[#26403C]">
            Authorized Administrator Account
          </h2>
          <p className="text-[#29272B]/85">
            Signed in as <strong className="text-[#29272B]">{user?.name}</strong> ({user?.email}) ·
            Role: <span className="font-bold text-[#2F4F4A]">{user?.role}</span>
            {user?.isDemo ? ' · DEMO DATA Sandbox Mode' : ''}
          </p>
        </section>

        {error && <ErrorRetryBanner error={error} onRetry={load} />}

        <section className="rounded-2xl border border-[#2F4F4A]/20 bg-[#F3FAF6] p-6 space-y-4 shadow-xs">
          <h2 className="font-display text-lg font-bold text-[#26403C]">Platform Controls</h2>
          {loading ? (
            <p className="text-sm text-[#26403C]/75">Loading platform controls...</p>
          ) : (
            <form onSubmit={save} className="space-y-4 text-sm">
              <label className="flex items-center gap-2.5 cursor-pointer text-[#29272B]">
                <input
                  type="checkbox"
                  checked={requireNotice}
                  onChange={(e) => setRequireNotice(e.target.checked)}
                />
                <span>Display email verification reminder to unverified Citizen accounts</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-[#29272B]">
                <input
                  type="checkbox"
                  checked={allowCommunity}
                  onChange={(e) => setAllowCommunity(e.target.checked)}
                />
                <span>Allow Citizens to submit new Community Threat Reports</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-[#29272B]">
                <input
                  type="checkbox"
                  checked={autoPromoteDomains}
                  onChange={(e) => setAutoPromoteDomains(e.target.checked)}
                />
                <span>Auto-promote confirmed report URLs to Threat Indicators on moderation approval</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-[#29272B]">
                <input
                  type="checkbox"
                  checked={enableOcrPipeline}
                  onChange={(e) => setEnableOcrPipeline(e.target.checked)}
                />
                <span>Enable Screenshot &amp; Offer Letter OCR extraction pipeline</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#2F4F4A]/15">
                <div>
                  <label className="block text-xs font-medium text-[#26403C] mb-1">
                    High-Risk Alert Score Threshold (40–95)
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={95}
                    value={highRiskAlertThreshold}
                    onChange={(e) => setHighRiskAlertThreshold(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#2F4F4A]/25 bg-[#FFFDF8] px-3 py-2 font-mono-tabular text-sm text-[#29272B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#26403C] mb-1">
                    Scan Evidence Retention Window (30–365 days)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={365}
                    value={dataRetentionDays}
                    onChange={(e) => setDataRetentionDays(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#2F4F4A]/25 bg-[#FFFDF8] px-3 py-2 font-mono-tabular text-sm text-[#29272B]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#2F4F4A] px-5 py-2 text-xs font-semibold text-[#F3FAF6] hover:bg-[#26403C] disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Platform Settings'}
              </button>
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-[#2F4F4A]/20 bg-[#E6F2EC] p-6 space-y-2 text-xs text-[#26403C]">
          <h2 className="font-display text-base font-bold text-[#26403C]">
            Server Environment Configuration
          </h2>
          <p className="leading-relaxed">
            API keys and credentials are strictly stored in backend environment variables or
            Firebase configuration and are never exposed as raw secrets in the browser. Configure{' '}
            <code className="font-mono-tabular font-semibold">GEMINI_API_KEY</code>,{' '}
            <code className="font-mono-tabular font-semibold">MONGODB_URI</code>,{' '}
            <code className="font-mono-tabular font-semibold">WEB_RISK_API_KEY</code>,{' '}
            <code className="font-mono-tabular font-semibold">GOOGLE_CLIENT_ID</code> (optional
            direct GIS override alongside provisioned Firebase Auth), and{' '}
            <code className="font-mono-tabular font-semibold">ADMIN_BOOTSTRAP_PASSCODE</code> in
            your server environment or Secrets panel.
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}
