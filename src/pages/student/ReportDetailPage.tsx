import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Download,
  Flag,
  Network,
  RefreshCw,
} from 'lucide-react';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { ConfidenceLabel, RiskStatusLabel } from '../../components/common/RiskDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiRequest, downloadReportFile } from '../../services/api';
import type { ScanRecord } from '../../types/jobshield';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, demoResetVersion } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [report, setReport] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiRequest<{ report: ScanRecord }>(`/api/reports/${encodeURIComponent(id)}`)
      .then((res) => {
        setReport(res.report);
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load report.'))
      .finally(() => setLoading(false));
  }, [id, demoResetVersion]);

  const toggleSave = async () => {
    if (!report) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ report: ScanRecord }>(`/api/reports/${report.id}/save`, {
        method: 'POST',
        body: JSON.stringify({ saved: !report.saved }),
      });
      setReport(res.report);
      showToast(
        res.report.saved ? 'Report saved to Saved Reports.' : 'Removed from Saved Reports.',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update saved state.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (format: 'txt' | 'json') => {
    if (!report) return;
    try {
      await downloadReportFile(report.id, format);
      showToast(`Downloaded ${format.toUpperCase()} security report.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Download failed.', 'error');
    }
  };

  return (
    <StudentLayout title="Security Assessment Report">
      {loading ? (
        <div className="rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] p-10 text-center text-sm text-[#563653]">
          Loading security report...
        </div>
      ) : error || !report ? (
        <div className="rounded-2xl border border-[#842D48]/30 bg-[#FBEAE3] p-8 space-y-4">
          <p className="text-sm font-medium text-[#651F35]">{error || 'Report not found.'}</p>
          <Link to="/student/dashboard" className="text-sm font-semibold text-[#563653] hover:underline">
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4F3B42] hover:text-[#46304F]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={toggleSave}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#563653]/25 bg-[#F7F0E5] px-3.5 py-2 text-xs font-semibold text-[#46304F] hover:bg-[#EFEAF2]"
              >
                {report.saved ? (
                  <BookmarkCheck className="h-4 w-4 text-[#563653]" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                <span>{report.saved ? 'Saved' : 'Save Report'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload('txt')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#563653]/25 bg-[#F7F0E5] px-3.5 py-2 text-xs font-semibold text-[#46304F] hover:bg-[#EFEAF2]"
              >
                <Download className="h-4 w-4" />
                <span>Download TXT</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload('json')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#563653]/25 bg-[#F7F0E5] px-3.5 py-2 text-xs font-semibold text-[#46304F] hover:bg-[#EFEAF2]"
              >
                <Download className="h-4 w-4" />
                <span>JSON</span>
              </button>

              <Link
                to={`/student/trust-intelligence?scanId=${encodeURIComponent(report.id)}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#16765B] bg-[#E7EFE8] px-3.5 py-2 text-xs font-semibold text-[#174D3B] hover:bg-[#D5E6DA]"
              >
                <Network className="h-4 w-4" />
                <span>Trust Graph</span>
              </Link>

              <button
                type="button"
                onClick={() =>
                  navigate(`/student/scanner?type=${report.scanType}`, {
                    state: { rescanFrom: report },
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#563653]/25 bg-[#F7F0E5] px-3.5 py-2 text-xs font-semibold text-[#46304F] hover:bg-[#EFEAF2]"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Rescan</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/student/community?new=1&company=${encodeURIComponent(
                      report.extractedInformation.companyName || ''
                    )}&url=${encodeURIComponent(
                      report.extractedInformation.website ||
                        report.extractedInformation.applicationUrl ||
                        ''
                    )}`
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#C65D45] px-3.5 py-2 text-xs font-semibold text-[#F7F0E5] hover:bg-[#B85C32]"
              >
                <Flag className="h-4 w-4" />
                <span>Report to Community</span>
              </button>
            </div>
          </div>

          {/* Overall Assessment */}
          <section className="rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] overflow-hidden shadow-xs">
            <div className="bg-gradient-to-r from-[#46304F] via-[#563653] to-[#651F35] text-[#F7F0E5] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#F0DFBD]">
                  <span className="font-mono-tabular font-semibold text-[#F7F0E5]">
                    {report.id}
                  </span>
                  {(report.isDemo || user?.isDemo) && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="rounded bg-[#F0DFBD] px-1.5 py-0.5 font-mono-tabular text-[10px] font-bold uppercase text-[#46304F]">
                        DEMO DATA
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{report.scanType.replace('_', ' ')} Scan</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>AI Status: {report.aiStatus}</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-[#F7F0E5]">{report.scanName}</h2>
              </div>
              <div className="flex flex-col sm:items-end gap-2">
                <RiskStatusLabel category={report.riskCategory} score={report.riskScore} />
                <div className="text-xs text-[#F0DFBD] bg-[#29272B]/35 rounded-md px-2.5 py-1">
                  Evidence Quality: <ConfidenceLabel level={report.evidenceConfidence} />
                </div>
              </div>
            </div>

            <div className="p-5 bg-[#EFEAF2] text-xs text-[#4F3B42] leading-relaxed border-t border-[#563653]/15">
              <strong className="text-[#46304F]">Assessment Boundary:</strong> {report.disclaimer}
            </div>
          </section>

          {/* Extracted Information */}
          <section className="rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] p-6 space-y-4 shadow-xs">
            <h3 className="font-display text-lg font-bold text-[#46304F]">
              Extracted Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(report.extractedInformation)
                .filter(
                  ([, val]) =>
                    val !== undefined &&
                    val !== null &&
                    String(val).trim() !== '' &&
                    !(Array.isArray(val) && val.length === 0)
                )
                .map(([key, val]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-[#563653]/15 bg-[#F0DFBD]/65 p-3.5"
                  >
                    <p className="text-xs font-medium text-[#563653] capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#29272B] break-words">
                      {Array.isArray(val) ? val.join(', ') : String(val)}
                    </p>
                  </div>
                ))}
              {Object.values(report.extractedInformation).every(
                (v) =>
                  v === undefined ||
                  v === null ||
                  String(v).trim() === '' ||
                  (Array.isArray(v) && v.length === 0)
              ) && (
                <p className="text-sm text-[#563653] col-span-full">
                  No structured recruitment entities could be extracted from the submitted input.
                </p>
              )}
            </div>
          </section>

          {/* Security Findings */}
          <section className="rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] p-6 space-y-4 shadow-xs">
            <h3 className="font-display text-lg font-bold text-[#46304F]">
              Security Findings ({report.findings.length})
            </h3>
            {report.findings.length === 0 ? (
              <p className="text-sm text-[#4F3B42]">
                No specific scam indicators were matched in the submitted content. Review Missing
                Information and verify independently before acting.
              </p>
            ) : (
              <div className="space-y-4">
                {report.findings.map((f, idx) => (
                  <div
                    key={`${f.title}_${idx}`}
                    className="rounded-xl border border-[#563653]/15 bg-[#FBEAE3]/75 p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-display text-base font-bold text-[#29272B] flex items-center gap-2">
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            f.severity === 'high'
                              ? 'text-[#842D48]'
                              : f.severity === 'medium'
                              ? 'text-[#C69B36]'
                              : 'text-[#563653]'
                          }`}
                        />
                        <span>{f.title}</span>
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[#4F3B42]">
                        <span className="font-semibold uppercase">{f.severity} severity</span>
                        <span aria-hidden="true">·</span>
                        <span>{f.source}</span>
                        <span aria-hidden="true">·</span>
                        <ConfidenceLabel level={f.confidence} />
                      </div>
                    </div>
                    <p className="text-sm text-[#4F3B42] leading-relaxed">{f.description}</p>
                    <p className="text-xs text-[#29272B] font-mono-tabular bg-[#FFFDF8] border border-[#563653]/15 rounded-lg p-2.5">
                      Evidence: {f.evidence}
                    </p>
                    <p className="text-xs font-semibold text-[#174D3B]">
                      Recommendation: {f.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Positive Observations, Contradictions, Missing Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-[#16765B]/25 bg-[#E7EFE8] p-6 space-y-3 shadow-xs">
              <h3 className="font-display text-base font-bold text-[#174D3B]">
                Positive Observations &amp; Limitations
              </h3>
              {report.positiveObservations.length === 0 ? (
                <p className="text-sm text-[#2D4F38]">No positive technical observations recorded.</p>
              ) : (
                <ul className="space-y-3">
                  {report.positiveObservations.map((p, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-[#16765B]/20 bg-[#F7F0E5] p-3.5 text-sm space-y-1"
                    >
                      <div className="font-semibold text-[#174D3B] flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-[#16765B]" />
                        <span>{p.title}</span>
                      </div>
                      <p className="text-[#4F3B42]">{p.detail}</p>
                      <p className="text-xs text-[#563653]">Limitation: {p.limitation}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-[#563653]/20 bg-[#F7F0E5] p-6 space-y-4 shadow-xs">
              <div>
                <h3 className="font-display text-base font-bold text-[#46304F] mb-2">
                  Contradictions
                </h3>
                {report.contradictions.length === 0 ? (
                  <p className="text-sm text-[#563653]">No internal contradictions detected.</p>
                ) : (
                  <ul className="list-disc pl-5 text-sm text-[#651F35] space-y-1 bg-[#FBEAE3] rounded-lg p-3">
                    {report.contradictions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-[#E9D9C4] pt-4">
                <h3 className="font-display text-base font-bold text-[#46304F] mb-2">
                  Missing Information (Could Not Be Verified)
                </h3>
                {report.missingInformation.length === 0 ? (
                  <p className="text-sm text-[#563653]">No missing evidence gaps recorded.</p>
                ) : (
                  <ul className="list-disc pl-5 text-sm text-[#4F3B42] space-y-1">
                    {report.missingInformation.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          {/* Recommended Actions */}
          <section className="rounded-2xl border border-[#563653]/20 bg-[#EFEAF2] p-6 space-y-3 shadow-xs">
            <h3 className="font-display text-lg font-bold text-[#46304F]">
              Recommended Actions
            </h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-[#29272B]">
              {report.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </StudentLayout>
  );
}
