import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Network,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { ResilientImage } from '../../components/common/RiskDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiRequest } from '../../services/api';
import type {
  CompanyRecord,
  DomainIndicator,
  EvidenceRecord,
  GraphEdgeData,
  GraphNodeData,
  ScanRecord,
  TrustIntelligenceResult,
} from '../../types/jobshield';

interface IntelligenceDirectoryResponse {
  isDemo: boolean;
  companies: CompanyRecord[];
  domains: DomainIndicator[];
  recruiterSamples: Array<{
    id: string;
    recruiterName: string;
    recruiterEmail: string;
    companyName: string;
    officialWebsite: string;
    applicationUrl: string;
    status: string;
  }>;
  opportunitySamples: Array<{
    id: string;
    title: string;
    companyName: string;
    officialWebsite: string;
    recruiterName: string;
    recruiterEmail: string;
    applicationUrl: string;
    paymentRequested: boolean;
    offerSummary: string;
    jobDescriptionSummary: string;
    riskTag: string;
  }>;
  evidence: EvidenceRecord[];
  graphScenarios?: Array<{
    id: string;
    title: string;
    subtitle: string;
    result: TrustIntelligenceResult;
  }>;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  Confirmed: '#16765B',
  Supported: '#175E60',
  Suspicious: '#C69B36',
  Contradictory: '#C65D45',
  Unverified: '#8C8196',
  'Missing Evidence': '#B9A5C9',
};

const STAGE_POSITIONS: Record<string, { x: number; y: number }> = {
  company: { x: 30, y: 40 },
  domain: { x: 290, y: 40 },
  recruiter: { x: 550, y: 40 },
  email: { x: 810, y: 40 },
  offer_letter: { x: 1070, y: 40 },
  job_description: { x: 1070, y: 205 },
  application_url: { x: 1330, y: 40 },
  payment_request: { x: 1330, y: 205 },
  evidence: { x: 290, y: 205 },
  missing_evidence: { x: 30, y: 205 },
};

function FitViewButton() {
  const { fitView } = useReactFlow();
  return (
    <button
      type="button"
      onClick={() => fitView({ padding: 0.2, duration: 250 })}
      className="rounded-lg border border-[#B9A5C9]/40 bg-[#F0DFBD] px-3 py-1.5 text-xs font-semibold text-[#29272B] hover:bg-[#F7F0E5]"
    >
      Fit View
    </button>
  );
}

export function TrustIntelligencePage() {
  const [params, setParams] = useSearchParams();
  const { user, demoResetVersion } = useAuth();
  const { showToast } = useToast();
  const scanId = params.get('scanId');

  const [mode, setMode] = useState<'company' | 'recruiter' | 'opportunity'>('opportunity');
  const [loading, setLoading] = useState(false);
  const [availableScans, setAvailableScans] = useState<ScanRecord[]>([]);
  const [directory, setDirectory] = useState<IntelligenceDirectoryResponse | null>(null);
  const [dirTab, setDirTab] = useState<'companies' | 'domains' | 'recruiters' | 'opportunities' | 'evidence'>('companies');
  const [selectedScanId, setSelectedScanId] = useState(scanId || '');
  const [result, setResult] = useState<TrustIntelligenceResult | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [paymentRequested, setPaymentRequested] = useState(false);
  const [offerSummary, setOfferSummary] = useState('');
  const [jobDescriptionSummary, setJobDescriptionSummary] = useState('');

  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [highlightSuspicious, setHighlightSuspicious] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeData | null>(null);

  const loadGraphForScan = async (targetScanId: string) => {
    setLoading(true);
    setSelectedScanId(targetScanId);
    try {
      const res = await apiRequest<TrustIntelligenceResult>(
        `/api/intelligence/graph/${encodeURIComponent(targetScanId)}`
      );
      setResult(res);
      setSelectedNode(res.nodes[0] || null);
      setSelectedEdge(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load scan graph.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const [scansRes, dirRes] = await Promise.all([
          apiRequest<{ scans: ScanRecord[] }>('/api/scans'),
          apiRequest<IntelligenceDirectoryResponse>('/api/intelligence/records').catch(() => null),
        ]);
        if (!active) return;
        setAvailableScans(scansRes.scans);
        if (dirRes) setDirectory(dirRes);

        if (scanId) {
          await loadGraphForScan(scanId);
          return;
        }

        if (user?.isDemo && scansRes.scans.length > 0) {
          const preferred =
            scansRes.scans.find((s) => s.id === 'scn_demo_citizen_01') ||
            scansRes.scans.find((s) => Boolean(s.extractedInformation.companyName)) ||
            scansRes.scans[0];
          if (preferred) {
            await loadGraphForScan(preferred.id);
          }
        }
      } catch {
        // Non-fatal on mount
      }
    };

    init();
    return () => {
      active = false;
    };
  }, [scanId, user?.isDemo, demoResetVersion]);

  const loadSampleInvestigation = (preset: 'suspicious' | 'verified') => {
    setMode('opportunity');
    if (preset === 'suspicious') {
      setCompanyName('Apex Cloud Tech Services');
      setOfficialWebsite('https://apex-onboarding.example');
      setRecruiterName('Rahul Sharma (Unverified HR)');
      setRecruiterEmail('hr-desk@apex-onboarding.example');
      setApplicationUrl('http://pay-onboarding-portal.example/upi-fee-verify');
      setPaymentRequested(true);
      setOfferSummary('Cloud Intern — Rs. 85,000/month with Rs. 2,500 UPI security deposit');
      setJobDescriptionSummary('Immediate joining, zero interview, laptop badge fee requested');
    } else {
      setCompanyName('Northstar Labs India');
      setOfficialWebsite('https://northstar-labs.example');
      setRecruiterName('Ananya Krishnan');
      setRecruiterEmail('campus-hiring@northstar-labs.example');
      setApplicationUrl('https://careers.northstar-labs.example/students');
      setPaymentRequested(false);
      setOfferSummary('Graduate Software Intern — Rs. 24,000/month, no fees');
      setJobDescriptionSummary('Campus assessment and two technical interviews');
    }
    showToast(
      `Populated ${preset === 'suspicious' ? 'impersonation example' : 'verified demo employer'} fields.`,
      'info'
    );
  };

  const runQuickInvestigate = async (
    targetMode: 'company' | 'recruiter' | 'opportunity',
    payload: {
      companyName: string;
      officialWebsite?: string;
      emailDomain?: string;
      recruiterName?: string;
      recruiterEmail?: string;
      applicationUrl?: string;
      paymentRequested?: boolean;
      offerSummary?: string;
      jobDescriptionSummary?: string;
    }
  ) => {
    setMode(targetMode);
    setCompanyName(payload.companyName);
    setOfficialWebsite(payload.officialWebsite || '');
    setEmailDomain(payload.emailDomain || '');
    setRecruiterName(payload.recruiterName || '');
    setRecruiterEmail(payload.recruiterEmail || '');
    setApplicationUrl(payload.applicationUrl || '');
    setPaymentRequested(Boolean(payload.paymentRequested));
    setOfferSummary(payload.offerSummary || '');
    setJobDescriptionSummary(payload.jobDescriptionSummary || '');

    setLoading(true);
    setSelectedNode(null);
    setSelectedEdge(null);
    try {
      const endpoint =
        targetMode === 'company'
          ? '/api/intelligence/company'
          : targetMode === 'recruiter'
          ? '/api/intelligence/recruiter'
          : '/api/intelligence/opportunity';

      const res = await apiRequest<TrustIntelligenceResult>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          companyName: payload.companyName,
          officialWebsite: payload.officialWebsite || '',
          emailDomain: payload.emailDomain || '',
          recruitmentUrl: payload.applicationUrl || '',
          recruiterName: payload.recruiterName || '',
          recruiterEmail: payload.recruiterEmail || '',
          applicationUrl: payload.applicationUrl || '',
          paymentRequested: Boolean(payload.paymentRequested),
          offerSummary: payload.offerSummary || '',
          jobDescriptionSummary: payload.jobDescriptionSummary || '',
          opportunityDetails: payload.jobDescriptionSummary || '',
        }),
      });
      setResult(res);
      setSelectedNode(res.nodes[0] || null);
      showToast(`Constructed verification graph for ${payload.companyName}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Investigation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSelectedNode(null);
    setSelectedEdge(null);
    try {
      const endpoint =
        mode === 'company'
          ? '/api/intelligence/company'
          : mode === 'recruiter'
          ? '/api/intelligence/recruiter'
          : '/api/intelligence/opportunity';

      const res = await apiRequest<TrustIntelligenceResult>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          companyName,
          officialWebsite,
          emailDomain,
          recruitmentUrl: applicationUrl,
          recruiterName,
          recruiterEmail,
          applicationUrl,
          paymentRequested,
          offerSummary,
          jobDescriptionSummary,
          opportunityDetails: jobDescriptionSummary,
        }),
      });
      setResult(res);
      setSelectedNode(res.nodes[0] || null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Verification check failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const flowNodes: Node[] = useMemo(() => {
    if (!result) return [];
    const filtered = result.nodes.filter(
      (n) => entityFilter === 'ALL' || n.entityType === entityFilter
    );
    const typeCounts: Record<string, number> = {};
    return filtered.map((n, idx) => {
      const seenCount = typeCounts[n.entityType] || 0;
      typeCounts[n.entityType] = seenCount + 1;
      const basePos = STAGE_POSITIONS[n.entityType] || {
        x: 30 + (idx % 4) * 260,
        y: 350,
      };
      const color = STATUS_COLOR_MAP[n.verificationStatus] || '#B9A5C9';
      const isSuspicious =
        n.verificationStatus === 'Suspicious' || n.verificationStatus === 'Contradictory';
      const dimmed = highlightSuspicious && !isSuspicious;
      return {
        id: n.id,
        position: { x: basePos.x, y: basePos.y + seenCount * 135 },
        data: {
          label: (
            <div className="text-left space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#563653]">
                {n.entityType.replace(/_/g, ' ')}
              </div>
              <div className="text-xs font-bold text-[#29272B] truncate max-w-[180px]">
                {n.entityName}
              </div>
              <div className="text-[11px] font-semibold" style={{ color }}>
                {n.verificationStatus}
              </div>
            </div>
          ),
        },
        style: {
          background: '#F7F0E5',
          border: `2px solid ${color}`,
          borderRadius: 10,
          padding: 10,
          width: 215,
          opacity: dimmed ? 0.35 : 1,
        },
      };
    });
  }, [result, entityFilter, highlightSuspicious]);

  const flowEdges: Edge[] = useMemo(() => {
    if (!result) return [];
    const visibleIds = new Set(flowNodes.map((n) => n.id));
    return result.edges
      .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
      .map((e) => {
        const color = STATUS_COLOR_MAP[e.status] || '#B9A5C9';
        const isSuspicious = e.status === 'Suspicious' || e.status === 'Contradictory';
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.status,
          animated: isSuspicious,
          labelStyle: { fill: '#29272B', fontWeight: 700, fontSize: 10 },
          labelBgStyle: { fill: '#EFEAF2', fillOpacity: 0.94 },
          labelBgPadding: [6, 3] as [number, number],
          labelBgBorderRadius: 4,
          style: {
            stroke: color,
            strokeWidth: highlightSuspicious && isSuspicious ? 3 : 2,
            opacity: highlightSuspicious && !isSuspicious ? 0.25 : 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color,
          },
        };
      });
  }, [result, flowNodes, highlightSuspicious]);

  return (
    <StudentLayout title="Recruitment Trust Intelligence">
      <div className="space-y-6">
        {/* Emerald, Forest Green & Champagne Visual Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[#16765B]/30 bg-[#174D3B] text-[#F7F0E5] shadow-sm">
          <ResilientImage
            src="/src/assets/images/trust_company_verification_1795580302513.jpg"
            alt="Researchers verifying corporate identity and domain consistency records"
            fallbackTitle="Recruitment Trust Intelligence"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#174D3B]/95 via-[#16765B]/88 to-[#175E60]/65" />
          <div className="relative z-10 p-6 sm:p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F0DFBD]">
                Module 02 · Company, Recruiter &amp; Opportunity Graph
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F7F0E5]">
                Recruitment Trust Intelligence &amp; Evidence Graph
              </h2>
              <p className="text-sm text-[#E9D9C4] leading-relaxed">
                Evaluates four independent statements and constructs an interactive React Flow graph
                without fabricating unverified corporate relationships.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => loadSampleInvestigation('suspicious')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#F0DFBD]/40 bg-[#29272B]/35 px-3.5 py-2 text-xs font-semibold text-[#F0DFBD] hover:bg-[#29272B]/55"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Load Impersonation Sample</span>
              </button>
              <button
                type="button"
                onClick={() => loadSampleInvestigation('verified')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#F0DFBD]/35 bg-[#F0DFBD] px-3.5 py-2 text-xs font-bold text-[#174D3B] hover:bg-[#F7F0E5]"
              >
                <span>Load Verified Employer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mode Switcher + Load Graph from Previous Scan */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'opportunity' as const, label: 'Opportunity Verification', icon: Network },
              { id: 'company' as const, label: 'Company Verification', icon: Building2 },
              { id: 'recruiter' as const, label: 'Recruiter Verification', icon: UserCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-colors ${
                    mode === tab.id
                      ? 'border-[#16765B] bg-[#16765B] text-[#F7F0E5]'
                      : 'border-[#16765B]/25 bg-[#F7F0E5] text-[#174D3B] hover:bg-[#E7EFE8]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {availableScans.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="scan-graph-select" className="text-xs font-semibold text-[#174D3B] whitespace-nowrap">
                Load Graph from Scan:
              </label>
              <select
                id="scan-graph-select"
                value={selectedScanId}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) {
                    setParams({ scanId: id });
                    loadGraphForScan(id);
                  }
                }}
                className="rounded-lg border border-[#16765B]/30 bg-[#FFFDF8] px-3 py-2 text-xs text-[#29272B] max-w-[240px]"
              >
                <option value="">Select a scan...</option>
                {availableScans.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.scanName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Input Form — Pale Sage & Champagne */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#16765B]/25 bg-[#E7EFE8] p-6 space-y-4 shadow-xs"
        >
          <div className="rounded-xl border border-[#16765B]/20 bg-[#F0DFBD]/75 p-4">
            <h3 className="font-display text-base font-bold text-[#174D3B]">
              {mode === 'company'
                ? 'Company Identity & Domain Consistency Check'
                : mode === 'recruiter'
                ? 'Recruiter & Corporate Email Association Check'
                : 'End-to-End Opportunity Trust Investigation'}
            </h3>
            <p className="text-xs text-[#4F3B42] mt-1">
              Enter observed recruitment details below to examine domain alignment, public records,
              and potential contradictions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#174D3B] mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Northstar Labs India"
                className="w-full rounded-lg border border-[#16765B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B] focus:border-[#16765B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#174D3B] mb-1">
                Official Website URL
              </label>
              <input
                type="text"
                value={officialWebsite}
                onChange={(e) => setOfficialWebsite(e.target.value)}
                placeholder="https://northstar-labs.example"
                className="w-full rounded-lg border border-[#16765B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B] focus:border-[#16765B] focus:outline-none"
              />
            </div>

            {mode === 'company' && (
              <div>
                <label className="block text-xs font-medium text-[#174D3B] mb-1">
                  Claimed Email Domain
                </label>
                <input
                  type="text"
                  value={emailDomain}
                  onChange={(e) => setEmailDomain(e.target.value)}
                  placeholder="e.g. northstar-labs.example"
                  className="w-full rounded-lg border border-[#16765B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B] focus:border-[#16765B] focus:outline-none"
                />
              </div>
            )}

            {(mode === 'recruiter' || mode === 'opportunity') && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#174D3B] mb-1">
                    Recruiter Name
                  </label>
                  <input
                    type="text"
                    value={recruiterName}
                    onChange={(e) => setRecruiterName(e.target.value)}
                    placeholder="e.g. Ananya Krishnan"
                    className="w-full rounded-lg border border-[#16765B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B] focus:border-[#16765B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#174D3B] mb-1">
                    Recruiter Email
                  </label>
                  <input
                    type="email"
                    value={recruiterEmail}
                    onChange={(e) => setRecruiterEmail(e.target.value)}
                    placeholder="hr@company.example"
                    className="w-full rounded-lg border border-[#16765B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B] focus:border-[#16765B] focus:outline-none"
                  />
                </div>
              </>
            )}

            {(mode === 'company' || mode === 'opportunity') && (
              <div>
                <label className="block text-xs font-medium text-[#174D3B] mb-1">
                  Application / Recruitment URL
                </label>
                <input
                  type="text"
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  placeholder="https://careers.company.example/apply"
                  className="w-full rounded-lg border border-[#16765B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B] focus:border-[#16765B] focus:outline-none"
                />
              </div>
            )}

            {mode === 'opportunity' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#174D3B] mb-1">
                    Offer Letter Summary
                  </label>
                  <input
                    type="text"
                    value={offerSummary}
                    onChange={(e) => setOfferSummary(e.target.value)}
                    placeholder="e.g. Software Intern, Rs. 25,000/month"
                    className="w-full rounded-lg border border-[#16765B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B] focus:border-[#16765B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#174D3B] mb-1">
                    Job Description Summary
                  </label>
                  <input
                    type="text"
                    value={jobDescriptionSummary}
                    onChange={(e) => setJobDescriptionSummary(e.target.value)}
                    placeholder="e.g. Remote Python role"
                    className="w-full rounded-lg border border-[#16765B]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#29272B] focus:border-[#16765B] focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {mode === 'opportunity' && (
            <label className="inline-flex items-center gap-2 text-sm text-[#29272B] cursor-pointer">
              <input
                type="checkbox"
                checked={paymentRequested}
                onChange={(e) => setPaymentRequested(e.target.checked)}
                className="rounded border-[#16765B]/35 text-[#842D48]"
              />
              <span>Opportunity involves a registration, training, or deposit payment request</span>
            </label>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#16765B] px-5 py-2.5 text-sm font-semibold text-[#F7F0E5] hover:bg-[#174D3B] disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? 'Investigating...' : 'Run Trust Investigation'}</span>
            </button>
          </div>
        </form>

        {/* 5 Sample Investigation Graph Scenarios (when available in Demo mode) */}
        {directory?.graphScenarios && directory.graphScenarios.length > 0 && (
          <section className="rounded-2xl border border-[#B9A5C9]/45 bg-[#EFEAF2] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#563653]">
                  DEMO DATA · Pre-Built Investigation Graph Scenarios
                </p>
                <p className="text-xs text-[#4F3B42]">
                  Switch instantly across five distinct recruitment verification cases to inspect node evidence and contradictions.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {directory.graphScenarios.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setResult(sc.result);
                    setSelectedNode(sc.result.nodes[0] || null);
                    setSelectedEdge(null);
                    setSelectedScanId('');
                    showToast(`Loaded graph scenario: ${sc.title}`, 'info');
                  }}
                  className="rounded-xl border border-[#563653]/25 bg-[#F7F0E5] p-3 text-left hover:border-[#46304F] hover:bg-[#FFFDF8] transition-colors"
                >
                  <p className="text-xs font-bold text-[#46304F] line-clamp-1">{sc.title}</p>
                  <p className="text-[11px] text-[#563653] mt-0.5 line-clamp-2">{sc.subtitle}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Results: 4 Independent Statements (Emerald & Champagne) + Evidence Graph (Dark Violet & Muted Lavender) */}
        {result && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: '1. Company Existence', data: result.statements.companyExistence },
                { key: '2. Official Website Identification', data: result.statements.officialWebsite },
                { key: '3. Recruiter Association', data: result.statements.recruiterAssociation },
                { key: '4. Specific Opportunity Confirmation', data: result.statements.specificOpportunity },
              ].map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-[#16765B]/25 bg-[#F0DFBD]/75 p-5 space-y-2 shadow-xs"
                >
                  <p className="text-xs font-semibold text-[#174D3B]">{item.key}</p>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-[#29272B]">
                    {item.data.status.includes('Suspicious') ||
                    item.data.status.includes('Contradictory') ? (
                      <AlertTriangle className="h-4 w-4 text-[#842D48] shrink-0" />
                    ) : item.data.status.includes('Supported') ? (
                      <CheckCircle2 className="h-4 w-4 text-[#16765B] shrink-0" />
                    ) : (
                      <HelpCircle className="h-4 w-4 text-[#563653] shrink-0" />
                    )}
                    <span>{item.data.status}</span>
                  </div>
                  <p className="text-xs text-[#4F3B42] leading-relaxed">{item.data.detail}</p>
                  <p className="text-[11px] text-[#563653] border-t border-[#16765B]/15 pt-2">
                    {item.data.limitation}
                  </p>
                </div>
              ))}
            </section>

            {/* Dark Plum (#2C1D35) & Lavender (#B9A5C9) Evidence Graph */}
            <ReactFlowProvider>
              <section className="rounded-2xl border border-[#B9A5C9]/40 bg-[#2C1D35] text-[#F7F0E5] overflow-hidden shadow-sm">
                <div className="bg-[#392645] border-b border-[#B9A5C9]/30 px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#F0DFBD]">
                      Recruitment Evidence Graph
                    </h3>
                    <p className="text-xs text-[#EFEAF2]">
                      Click any node or relationship edge to inspect verification source, confidence,
                      and explanation.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={entityFilter}
                      onChange={(e) => setEntityFilter(e.target.value)}
                      aria-label="Filter graph by entity type"
                      className="rounded-lg border border-[#B9A5C9]/40 px-3 py-1.5 text-xs bg-[#F0DFBD] text-[#29272B] font-semibold"
                    >
                      <option value="ALL">All Entities</option>
                      <option value="company">Company</option>
                      <option value="domain">Official Domain</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="email">Email</option>
                      <option value="offer_letter">Offer Letter</option>
                      <option value="job_description">Job Description</option>
                      <option value="application_url">Application URL</option>
                      <option value="payment_request">Payment Request</option>
                      <option value="evidence">Supporting Evidence</option>
                      <option value="missing_evidence">Missing Evidence</option>
                    </select>

                    <FitViewButton />

                    <label className="inline-flex items-center gap-2 text-xs font-medium text-[#F0DFBD] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={highlightSuspicious}
                        onChange={(e) => setHighlightSuspicious(e.target.checked)}
                        className="rounded border-[#B9A5C9]/50 text-[#E27D70]"
                      />
                      <span>Highlight Suspicious Relationships</span>
                    </label>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Legend (All 6 Statuses) */}
                  <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-[#B9A5C9]/25 pb-3 text-xs text-[#EFEAF2]">
                    {Object.entries(STATUS_COLOR_MAP).map(([status, color]) => (
                      <span key={status} className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-sm inline-block"
                          style={{ backgroundColor: color }}
                        />
                        <span>{status}</span>
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-8 h-[460px] rounded-xl border border-[#B9A5C9]/35 bg-[#23152B] overflow-hidden">
                      {result.nodes.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-2 text-[#B9A5C9]">
                          <HelpCircle className="h-7 w-7" />
                          <p className="text-sm font-semibold text-[#F0DFBD]">
                            Insufficient Structured Entities for Evidence Graph
                          </p>
                          <p className="text-xs max-w-md text-[#EFEAF2]/85">
                            Provide a company name, official website, recruiter email, or application URL above to construct connected evidence nodes.
                          </p>
                        </div>
                      ) : flowNodes.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-[#B9A5C9]">
                          No graph entities match the current filter.
                        </div>
                      ) : (
                        <ReactFlow
                          nodes={flowNodes}
                          edges={flowEdges}
                          fitView
                          onNodeClick={(_, node) => {
                            const found = result.nodes.find((n) => n.id === node.id) || null;
                            setSelectedNode(found);
                            setSelectedEdge(null);
                          }}
                          onEdgeClick={(_, edge) => {
                            const found = result.edges.find((e) => e.id === edge.id) || null;
                            setSelectedEdge(found);
                            setSelectedNode(null);
                          }}
                        >
                          <Controls />
                          <Background gap={20} color="#563653" />
                        </ReactFlow>
                      )}
                    </div>

                    <div className="lg:col-span-4 rounded-xl border border-[#B9A5C9]/35 bg-[#392645] p-5 space-y-4">
                      <h4 className="font-display text-sm font-bold text-[#F0DFBD]">
                        Inspector Details
                      </h4>
                      {selectedNode ? (
                        <div className="space-y-2 text-xs">
                          <p className="text-[#B9A5C9] uppercase font-semibold">
                            {selectedNode.entityType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-base font-bold text-[#F7F0E5]">
                            {selectedNode.entityName}
                          </p>
                          <p
                            className="font-semibold"
                            style={{ color: STATUS_COLOR_MAP[selectedNode.verificationStatus] || '#EFEAF2' }}
                          >
                            Status: {selectedNode.verificationStatus}
                          </p>
                          <p className="text-[#EFEAF2]">Source: {selectedNode.source}</p>
                          <p className="text-[#EFEAF2]">Confidence: {selectedNode.confidence}</p>
                          <p className="pt-2 border-t border-[#B9A5C9]/30 text-[#EFEAF2]/90 leading-relaxed">
                            {selectedNode.details}
                          </p>
                        </div>
                      ) : selectedEdge ? (
                        <div className="space-y-2 text-xs">
                          <p className="text-[#B9A5C9] uppercase font-semibold">Relationship Edge</p>
                          <p
                            className="font-semibold"
                            style={{ color: STATUS_COLOR_MAP[selectedEdge.status] || '#EFEAF2' }}
                          >
                            Status: {selectedEdge.status}
                          </p>
                          <p className="pt-2 border-t border-[#B9A5C9]/30 text-[#EFEAF2]/90 leading-relaxed">
                            {selectedEdge.explanation}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#B9A5C9]">
                          Select any node or connecting line in the graph to view its verification
                          evidence.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Checks Performed & Missing Evidence Breakdown */}
                  {(result.checksPerformed.length > 0 || result.missingEvidence.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#B9A5C9]/20">
                      <div className="rounded-xl border border-[#B9A5C9]/25 bg-[#392645] p-4 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#F0DFBD]">
                          Checks Performed ({result.checksPerformed.length})
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-[#EFEAF2]/90">
                          {result.checksPerformed.map((chk) => (
                            <li key={chk}>{chk}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-xl border border-[#B9A5C9]/25 bg-[#392645] p-4 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#E27D70]">
                          Missing Verification Evidence ({result.missingEvidence.length})
                        </p>
                        {result.missingEvidence.length === 0 ? (
                          <p className="text-xs text-[#EFEAF2]/85">
                            No critical verification gaps noted for the supplied inputs.
                          </p>
                        ) : (
                          <ul className="list-disc pl-4 space-y-1 text-xs text-[#EFEAF2]/90">
                            {result.missingEvidence.map((miss) => (
                              <li key={miss}>{miss}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </ReactFlowProvider>
          </div>
        )}

        {/* Trust Intelligence Reference Directory (Emerald & Champagne) */}
        {directory && (
          <section className="rounded-2xl border border-[#16765B]/25 bg-[#F7F0E5] overflow-hidden shadow-xs">
            <div className="bg-[#174D3B] text-[#F7F0E5] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#F0DFBD]">
                  Verified &amp; Flagged Reference Directory
                  {directory.isDemo ? ' · DEMO DATA' : ''}
                </p>
                <h3 className="font-display text-lg font-bold text-[#F7F0E5]">
                  Company Records, Threat Indicators, Recruiters &amp; Opportunities
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'companies' as const, label: `Companies (${directory.companies.length})` },
                  { id: 'domains' as const, label: `Domains (${directory.domains.length})` },
                  { id: 'recruiters' as const, label: `Recruiters (${directory.recruiterSamples.length})` },
                  { id: 'opportunities' as const, label: `Opportunities (${directory.opportunitySamples.length})` },
                  { id: 'evidence' as const, label: `Evidence (${directory.evidence.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDirTab(t.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      dirTab === t.id
                        ? 'bg-[#F0DFBD] text-[#174D3B]'
                        : 'bg-[#16765B]/45 text-[#F7F0E5] hover:bg-[#16765B]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {dirTab === 'companies' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {directory.companies.map((comp) => (
                    <div
                      key={comp.id}
                      className="rounded-xl border border-[#16765B]/25 bg-[#E7EFE8] p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-[#174D3B]">{comp.verificationStatus}</span>
                          {directory.isDemo && (
                            <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#563653]">
                              DEMO DATA
                            </span>
                          )}
                        </div>
                        <h4 className="font-display text-sm font-bold text-[#29272B]">
                          {comp.companyName}
                        </h4>
                        <p className="font-mono-tabular text-xs text-[#175E60]">
                          {comp.officialDomain}
                        </p>
                        {comp.notes && (
                          <p className="text-xs text-[#2D4F38] line-clamp-2">{comp.notes}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          runQuickInvestigate('company', {
                            companyName: comp.companyName,
                            officialWebsite: `https://${comp.officialDomain}`,
                            emailDomain: comp.officialDomain,
                          })
                        }
                        className="rounded-lg bg-[#174D3B] px-3 py-1.5 text-xs font-semibold text-[#F7F0E5] hover:bg-[#16765B] text-center"
                      >
                        Inspect Company &amp; Build Graph
                      </button>
                    </div>
                  ))}
                  {directory.companies.length === 0 && (
                    <p className="text-xs text-[#4F3B42]">No company records available yet.</p>
                  )}
                </div>
              )}

              {dirTab === 'domains' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {directory.domains.map((dom) => (
                    <div
                      key={dom.id}
                      className="rounded-xl border border-[#A96B45]/30 bg-[#F0DFBD]/55 p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-[#651F35]">{dom.threatStatus}</span>
                          {directory.isDemo && (
                            <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#563653]">
                              DEMO DATA
                            </span>
                          )}
                        </div>
                        <p className="font-mono-tabular text-sm font-bold text-[#29272B]">
                          {dom.domainName}
                        </p>
                        <p className="text-xs font-semibold text-[#8C3F23]">{dom.indicatorType}</p>
                        <p className="text-xs text-[#4F3B42]">{dom.evidenceSummary || dom.source}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          runQuickInvestigate('company', {
                            companyName: dom.domainName,
                            officialWebsite: `https://${dom.domainName}`,
                            emailDomain: dom.domainName,
                            applicationUrl: `https://${dom.domainName}`,
                          })
                        }
                        className="rounded-lg bg-[#651F35] px-3 py-1.5 text-xs font-semibold text-[#F7F0E5] hover:bg-[#842D48] text-center"
                      >
                        Trace Domain in Graph
                      </button>
                    </div>
                  ))}
                  {directory.domains.length === 0 && (
                    <p className="text-xs text-[#4F3B42]">No domain threat indicators listed.</p>
                  )}
                </div>
              )}

              {dirTab === 'recruiters' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {directory.recruiterSamples.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-xl border border-[#16765B]/25 bg-[#E7EFE8] p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-[#174D3B]">{rec.status}</span>
                          {directory.isDemo && (
                            <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#563653]">
                              DEMO DATA
                            </span>
                          )}
                        </div>
                        <h4 className="font-display text-sm font-bold text-[#29272B]">
                          {rec.recruiterName} · {rec.companyName}
                        </h4>
                        <p className="font-mono-tabular text-xs text-[#175E60]">
                          {rec.recruiterEmail}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          runQuickInvestigate('recruiter', {
                            companyName: rec.companyName,
                            officialWebsite: rec.officialWebsite,
                            recruiterName: rec.recruiterName,
                            recruiterEmail: rec.recruiterEmail,
                            applicationUrl: rec.applicationUrl,
                          })
                        }
                        className="rounded-lg bg-[#174D3B] px-3 py-1.5 text-xs font-semibold text-[#F7F0E5] hover:bg-[#16765B]"
                      >
                        Verify Recruiter &amp; Build Graph
                      </button>
                    </div>
                  ))}
                  {directory.recruiterSamples.length === 0 && (
                    <p className="text-xs text-[#4F3B42]">
                      Run an email or offer letter scan, or enter recruiter details above to populate recruiter checks.
                    </p>
                  )}
                </div>
              )}

              {dirTab === 'opportunities' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {directory.opportunitySamples.map((opp) => (
                    <div
                      key={opp.id}
                      className="rounded-xl border border-[#C69B36]/35 bg-[#FBF3DF] p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-[#651F35]">{opp.riskTag}</span>
                          {directory.isDemo && (
                            <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#563653]">
                              DEMO DATA
                            </span>
                          )}
                        </div>
                        <h4 className="font-display text-sm font-bold text-[#29272B]">
                          {opp.title}
                        </h4>
                        <p className="text-xs font-semibold text-[#174D3B]">{opp.companyName}</p>
                        <p className="text-xs text-[#4F3B42]">{opp.offerSummary}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          runQuickInvestigate('opportunity', {
                            companyName: opp.companyName,
                            officialWebsite: opp.officialWebsite,
                            recruiterName: opp.recruiterName,
                            recruiterEmail: opp.recruiterEmail,
                            applicationUrl: opp.applicationUrl,
                            paymentRequested: opp.paymentRequested,
                            offerSummary: opp.offerSummary,
                            jobDescriptionSummary: opp.jobDescriptionSummary,
                          })
                        }
                        className="rounded-lg bg-[#16765B] px-3 py-1.5 text-xs font-semibold text-[#F7F0E5] hover:bg-[#174D3B]"
                      >
                        Investigate Full Opportunity
                      </button>
                    </div>
                  ))}
                  {directory.opportunitySamples.length === 0 && (
                    <p className="text-xs text-[#4F3B42]">
                      No saved sample opportunities available for this account. Use the investigation form above to evaluate any opportunity.
                    </p>
                  )}
                </div>
              )}

              {dirTab === 'evidence' && (
                <div className="space-y-2.5">
                  {directory.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-xl border border-[#16765B]/20 bg-[#E7EFE8]/60 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-[#174D3B]">
                          {ev.evidenceType} · {ev.source}
                          {directory.isDemo && (
                            <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#563653] ml-2">
                              DEMO DATA
                            </span>
                          )}
                        </p>
                        <p className="text-[#29272B]">{ev.finding}</p>
                      </div>
                      <span className="font-mono-tabular font-bold uppercase text-[#175E60] shrink-0">
                        {ev.confidence}
                      </span>
                    </div>
                  ))}
                  {directory.evidence.length === 0 && (
                    <p className="text-xs text-[#4F3B42]">
                      Supporting evidence observations will appear here as scans and verifications complete.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </StudentLayout>
  );
}
