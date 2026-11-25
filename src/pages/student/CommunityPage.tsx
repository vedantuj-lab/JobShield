import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, ShieldAlert } from 'lucide-react';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { ResilientImage } from '../../components/common/RiskDisplay';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiRequest } from '../../services/api';
import type { CommunityReport } from '../../types/jobshield';

const CATEGORIES = [
  'Fake Job Offers',
  'Fake Internships',
  'Fake Placement Drives',
  'Recruiter Impersonation',
  'Fake Recruitment Websites',
  'Registration Fee Scams',
  'Telegram Task Scams',
  'Work-from-Home Scams',
  'Suspicious Emails',
  'Other Recruitment Fraud',
];

export function CommunityPage() {
  const [params, setParams] = useSearchParams();
  const { user, demoResetVersion } = useAuth();
  const { showToast } = useToast();

  const paramTab = params.get('tab');
  const initialTab: 'all' | 'confirmed' | 'review' | 'mine' =
    paramTab === 'confirmed' || paramTab === 'review' || paramTab === 'mine' ? paramTab : 'all';

  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [myReports, setMyReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState<'all' | 'confirmed' | 'review' | 'mine'>(initialTab);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(params.get('new') === '1');
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [companyName, setCompanyName] = useState(params.get('company') || '');
  const [url, setUrl] = useState(params.get('url') || '');
  const [recruiterInfo, setRecruiterInfo] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [evidenceSummary, setEvidenceSummary] = useState('');
  const [moneyRequested, setMoneyRequested] = useState(false);
  const [moneyPaid, setMoneyPaid] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [allRes, mineRes] = await Promise.all([
        apiRequest<{ reports: CommunityReport[] }>('/api/community/reports'),
        apiRequest<{ reports: CommunityReport[] }>('/api/community/my-reports'),
      ]);
      setReports(allRes.reports);
      setMyReports(mineRes.reports);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load community reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [demoResetVersion]);

  useEffect(() => {
    const t = params.get('tab');
    if (t === 'all' || t === 'confirmed' || t === 'review' || t === 'mine') {
      setTab(t);
    }
    if (params.get('new') === '1') {
      setModalOpen(true);
    }
  }, [params]);

  useEffect(() => {
    const rid = params.get('reportId');
    if (!rid) return;
    const match = [...myReports, ...reports].find((r) => r.id === rid);
    if (match) {
      setSelectedReport(match);
    }
  }, [params, reports, myReports]);

  const handleTabChange = (next: 'all' | 'confirmed' | 'review' | 'mine') => {
    setTab(next);
    const nextParams = new URLSearchParams(params);
    nextParams.set('tab', next);
    nextParams.delete('reportId');
    setParams(nextParams);
  };

  const displayedReports = useMemo(() => {
    const source =
      tab === 'mine'
        ? myReports
        : tab === 'confirmed'
        ? reports.filter(
            (r) => r.moderationStatus === 'CONFIRMED' || r.moderationStatus === 'CORROBORATED'
          )
        : tab === 'review'
        ? reports.filter((r) => r.moderationStatus === 'UNDER_REVIEW')
        : reports;

    return source.filter((r) => {
      const matchCat = catFilter === 'ALL' || r.category === catFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.category.toLowerCase().includes(q) ||
        (r.companyName || '').toLowerCase().includes(q) ||
        (r.url || '').toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [reports, myReports, tab, catFilter, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest<{ report: CommunityReport }>('/api/community/reports', {
        method: 'POST',
        body: JSON.stringify({
          category,
          companyName,
          url,
          recruiterInfo,
          description,
          incidentDate,
          evidenceSummary,
          moneyRequested,
          moneyPaid,
          additionalNotes,
        }),
      });
      showToast(
        res.report.duplicateOfId
          ? 'Report submitted (linked as a possible duplicate for moderator review).'
          : 'Community report submitted with Under Review status.',
        'success'
      );
      setModalOpen(false);
      setDescription('');
      setEvidenceSummary('');
      await loadReports();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatStatusMeta = (status: CommunityReport['moderationStatus']) => {
    switch (status) {
      case 'CONFIRMED':
        return {
          text: 'Confirmed Threat',
          cls: 'text-[#651F35]',
          cardSurface: 'bg-[#FBEAE3] border-[#842D48]/35',
        };
      case 'CORROBORATED':
        return {
          text: 'Corroborated',
          cls: 'text-[#8C6414]',
          cardSurface: 'bg-[#FBF3DF] border-[#C69B36]/35',
        };
      case 'REJECTED':
        return {
          text: 'Rejected',
          cls: 'text-[#4F3B42]',
          cardSurface: 'bg-[#E9D9C4]/75 border-[#A96B45]/25',
        };
      default:
        return {
          text: 'Under Review (Unverified)',
          cls: 'text-[#B85C32]',
          cardSurface: 'bg-[#F7F0E5] border-[#A96B45]/30',
        };
    }
  };

  return (
    <StudentLayout title="Community Threat Intelligence">
      <div className="space-y-6">
        {/* Copper & Burnt Orange Visual Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[#A96B45]/35 bg-[#6B3B20] text-[#F7F0E5] shadow-sm">
          <ResilientImage
            src="/src/assets/images/community_collab_team_1795588753753.jpg"
            alt="Students and job seekers collaborating to report suspicious recruitment leads"
            fallbackTitle="Community Threat Intelligence"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#5A2D14]/95 via-[#A96B45]/88 to-[#B85C32]/65" />
          <div className="relative z-10 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F0DFBD]">
                Module 03 · Moderated Scam Intelligence
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F7F0E5]">
                Recruitment Scam Reporting &amp; Threat Feed
              </h2>
              <p className="text-xs sm:text-sm text-[#E9D9C4] leading-relaxed">
                Reports begin as Under Review and are moderated by administrators before becoming
                confirmed threat intelligence. Personal contact numbers and emails are masked.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#F0DFBD] px-4 py-2.5 text-sm font-bold text-[#29272B] hover:bg-[#F7F0E5] whitespace-nowrap shrink-0 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Submit a Report</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 rounded-xl bg-[#F0DFBD]/75 border border-[#A96B45]/25 p-1">
            {[
              { id: 'all' as const, label: 'All Recent' },
              { id: 'confirmed' as const, label: 'Confirmed / Corroborated' },
              { id: 'review' as const, label: 'Under Review' },
              { id: 'mine' as const, label: `My Reports (${myReports.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTabChange(t.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === t.id
                    ? 'bg-[#B85C32] text-[#F7F0E5]'
                    : 'text-[#4F3B42] hover:text-[#29272B] hover:bg-[#F7F0E5]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[#A96B45] absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company, URL, details..."
                className="rounded-lg border border-[#A96B45]/30 bg-[#FFFDF8] pl-8 pr-3 py-1.5 text-xs text-[#29272B] focus:border-[#B85C32] focus:outline-none"
              />
            </div>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              aria-label="Filter by threat category"
              className="rounded-lg border border-[#A96B45]/30 bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#29272B] focus:border-[#B85C32] focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="rounded-2xl border border-[#A96B45]/25 bg-[#F7F0E5] p-10 text-center text-sm text-[#4F3B42]">
            Loading community reports...
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-[#842D48]/30 bg-[#FBEAE3] p-8 text-center space-y-3">
            <p className="text-sm font-medium text-[#651F35]">{loadError}</p>
            <button
              type="button"
              onClick={loadReports}
              className="rounded-lg bg-[#651F35] px-4 py-2 text-xs font-semibold text-[#F7F0E5] hover:bg-[#842D48]"
            >
              Retry
            </button>
          </div>
        ) : displayedReports.length === 0 ? (
          <div className="rounded-2xl border border-[#A96B45]/25 bg-gradient-to-br from-[#F0DFBD]/70 to-[#F7F0E5] p-10 text-center space-y-3">
            <ShieldAlert className="h-8 w-8 text-[#B85C32] mx-auto" />
            <h3 className="font-display text-base font-bold text-[#651F35]">
              No Community Reports Found
            </h3>
            <p className="text-xs text-[#4F3B42] max-w-md mx-auto">
              There are currently no reports matching this view. Submit a report if you have
              encountered a suspicious job offer, placement drive, or fee demand.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedReports.map((rep) => {
              const st = formatStatusMeta(rep.moderationStatus);
              return (
                <div
                  key={rep.id}
                  className={`rounded-xl border p-5 flex flex-col justify-between gap-4 shadow-xs ${st.cardSurface}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#8C3F23]">{rep.category}</span>
                      <div className="flex items-center gap-2">
                        {(rep.isDemo || user?.isDemo) && (
                          <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#563653]">
                            DEMO DATA
                          </span>
                        )}
                        <span className={`font-semibold ${st.cls}`}>{st.text}</span>
                      </div>
                    </div>
                    <h3 className="font-display text-base font-bold text-[#29272B]">
                      {rep.companyName || rep.url || 'Unidentified Entity'}
                    </h3>
                    <p className="text-sm text-[#4F3B42] line-clamp-3 leading-relaxed">
                      {rep.description}
                    </p>
                    {rep.url && (
                      <p className="font-mono-tabular text-xs text-[#563653] truncate">
                        URL: {rep.url}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-[#A96B45]/20 pt-3 text-xs text-[#4F3B42]">
                    <span>
                      Incident: {rep.incidentDate} · Money requested:{' '}
                      {rep.moneyRequested ? 'Yes' : 'No'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedReport(rep)}
                      className="font-semibold text-[#B85C32] hover:underline"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit Report Modal */}
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Submit Suspicious Recruitment Report"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-[#651F35] rounded-lg bg-[#FBEAE3] border border-[#A96B45]/30 p-3">
              Do not include your own Aadhaar, PAN, bank account numbers, or private identity
              documents in this report.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#29272B] mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-[#A96B45]/35 px-3 py-2 text-sm bg-[#FFFDF8] text-[#29272B]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#29272B] mb-1">
                  Incident Date *
                </label>
                <input
                  type="date"
                  required
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full rounded-lg border border-[#A96B45]/35 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#29272B] mb-1">
                  Claimed Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-[#A96B45]/35 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#29272B] mb-1">
                  Suspicious Website or Application URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-[#A96B45]/35 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Recruiter / Sender Domain or Handle
              </label>
              <input
                type="text"
                value={recruiterInfo}
                onChange={(e) => setRecruiterInfo(e.target.value)}
                placeholder="e.g. Sender domain or Telegram channel name"
                className="w-full rounded-lg border border-[#A96B45]/35 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Description * <span className="text-[#563653]">(Min. 20 characters)</span>
              </label>
              <textarea
                rows={4}
                required
                minLength={20}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain how the scam operated and what indicators appeared..."
                className="w-full rounded-lg border border-[#A96B45]/35 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Evidence Summary / Reference
              </label>
              <input
                type="text"
                value={evidenceSummary}
                onChange={(e) => setEvidenceSummary(e.target.value)}
                placeholder="e.g. Requested Rs. 1,500 UPI registration fee on offer PDF"
                className="w-full rounded-lg border border-[#A96B45]/35 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
              />
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={moneyRequested}
                  onChange={(e) => setMoneyRequested(e.target.checked)}
                />
                <span>Was money requested?</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={moneyPaid}
                  onChange={(e) => setMoneyPaid(e.target.checked)}
                />
                <span>Was money paid?</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Additional Notes
              </label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full rounded-lg border border-[#A96B45]/35 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-[#A96B45]/35 bg-[#F7F0E5] px-4 py-2 text-sm font-medium text-[#29272B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#B85C32] px-5 py-2 text-sm font-semibold text-[#F7F0E5] hover:bg-[#A96B45] disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Report Details Modal */}
        <Modal
          open={Boolean(selectedReport)}
          onClose={() => setSelectedReport(null)}
          title="Community Report Details"
        >
          {selectedReport && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#B85C32]">{selectedReport.category}</span>
                <span className={formatStatusMeta(selectedReport.moderationStatus).cls}>
                  {formatStatusMeta(selectedReport.moderationStatus).text}
                </span>
              </div>
              {selectedReport.duplicateOfId && (
                <div className="rounded-lg border border-[#C69B36]/40 bg-[#FBF3DF] p-2.5 text-xs text-[#6B521B]">
                  Flagged as a possible duplicate of report {selectedReport.duplicateOfId}.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[#563653]">Company / Entity</p>
                  <p className="font-semibold text-[#29272B]">
                    {selectedReport.companyName || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#563653]">Recruiter / Contact Info</p>
                  <p className="font-medium text-[#29272B]">
                    {selectedReport.recruiterInfo || 'Not specified'}
                  </p>
                </div>
              </div>
              {selectedReport.url && (
                <div>
                  <p className="text-xs text-[#563653]">Reported URL</p>
                  <p className="font-mono-tabular text-xs break-all text-[#29272B]">
                    {selectedReport.url}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-[#563653]">Description</p>
                <p className="text-[#4F3B42] leading-relaxed">{selectedReport.description}</p>
              </div>
              {selectedReport.evidenceSummary && (
                <div>
                  <p className="text-xs text-[#563653]">Evidence Summary</p>
                  <p className="text-xs text-[#29272B] bg-[#EFEAF2] rounded-lg p-2.5">
                    {selectedReport.evidenceSummary}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-[#4F3B42]">
                <span>Money Requested: <strong>{selectedReport.moneyRequested ? 'Yes' : 'No'}</strong></span>
                <span>Money Paid: <strong>{selectedReport.moneyPaid ? 'Yes' : 'No'}</strong></span>
              </div>
              {selectedReport.additionalNotes && (
                <div className="text-xs text-[#4F3B42]">
                  <strong>Additional Notes:</strong> {selectedReport.additionalNotes}
                </div>
              )}
              {selectedReport.moderationNotes && (
                <div className="rounded-lg border border-[#A96B45]/30 bg-[#F0DFBD]/65 p-3 text-xs text-[#651F35]">
                  <strong>Moderator Note:</strong> {selectedReport.moderationNotes}
                </div>
              )}
              <div className="text-xs text-[#563653] pt-2 border-t border-[#E9D9C4]">
                Submitted: {new Date(selectedReport.createdAt).toLocaleString()} · Incident Date:{' '}
                {selectedReport.incidentDate}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </StudentLayout>
  );
}
