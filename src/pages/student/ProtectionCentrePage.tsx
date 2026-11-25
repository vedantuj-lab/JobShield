import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckSquare,
  PhoneCall,
  ShieldAlert,
  Square,
} from 'lucide-react';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { ResilientImage } from '../../components/common/RiskDisplay';
import {
  AWARENESS_ARTICLES,
  BEFORE_YOU_APPLY_CHECKLIST,
  DOCUMENT_SHARING_RISKS,
  INDIA_EMERGENCY_STEPS,
  PAYMENT_WARNINGS,
} from '../../data/protectionData';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiRequest } from '../../services/api';

type ProtectionTab = 'checklist' | 'payments' | 'documents' | 'suspect' | 'paid' | 'library';
const PROTECTION_TABS: ProtectionTab[] = [
  'checklist',
  'payments',
  'documents',
  'suspect',
  'paid',
  'library',
];

export function ProtectionCentrePage() {
  const [params, setParams] = useSearchParams();
  const { user, demoResetVersion } = useAuth();
  const { showToast } = useToast();
  const [completed, setCompleted] = useState<string[]>([]);
  const tabParam = params.get('tab') as ProtectionTab | null;
  const [activeTab, setActiveTab] = useState<ProtectionTab>(
    tabParam && PROTECTION_TABS.includes(tabParam) ? tabParam : 'checklist'
  );
  const [selectedSlug, setSelectedSlug] = useState(AWARENESS_ARTICLES[0].slug);

  useEffect(() => {
    const q = params.get('tab') as ProtectionTab | null;
    if (q && PROTECTION_TABS.includes(q)) {
      setActiveTab(q);
    }
  }, [params]);

  const handleTabSelect = (next: ProtectionTab) => {
    setActiveTab(next);
    setParams({ tab: next });
  };

  useEffect(() => {
    apiRequest<{ completedItems: string[] }>('/api/users/checklist')
      .then((res) => setCompleted(res.completedItems))
      .catch(() => {});
  }, [demoResetVersion]);

  const toggleItem = async (id: string) => {
    const next = completed.includes(id)
      ? completed.filter((i) => i !== id)
      : [...completed, id];
    setCompleted(next);
    try {
      await apiRequest('/api/users/checklist', {
        method: 'PUT',
        body: JSON.stringify({ completedItems: next }),
      });
    } catch {
      showToast('Could not save checklist state.', 'error');
    }
  };

  const currentArticle =
    AWARENESS_ARTICLES.find((a) => a.slug === selectedSlug) || AWARENESS_ARTICLES[0];

  return (
    <StudentLayout title="User Protection Centre">
      <div className="space-y-6">
        {/* Forest Green & Sage Visual Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[#174D3B]/30 bg-[#174D3B] text-[#F7F0E5] shadow-sm">
          <ResilientImage
            src="/src/assets/images/protection_safety_study_1795586899841.jpg"
            alt="Student reviewing recruitment safety checklists and cybercrime helpline guidelines"
            fallbackTitle="User Protection Centre"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#123D2F]/95 via-[#174D3B]/88 to-[#16765B]/65" />
          <div className="relative z-10 p-6 sm:p-7 max-w-2xl space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F0DFBD]">
              Module 04 · Practical Safety &amp; Cybercrime Action Guide
              {user?.isDemo ? ' · DEMO DATA' : ''}
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F7F0E5]">
              Citizen Recruitment Protection Centre
            </h2>
            <p className="text-sm text-[#E9D9C4] leading-relaxed">
              Use interactive checklists before applying, learn never-pay rules, and access India
              helpline 1930 escalation guidance.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'checklist' as const, label: 'Before You Apply' },
            { id: 'payments' as const, label: 'Before You Pay' },
            { id: 'documents' as const, label: 'Before Sharing Documents' },
            { id: 'suspect' as const, label: 'If You Suspect a Scam' },
            { id: 'paid' as const, label: 'If You Have Already Paid' },
            { id: 'library' as const, label: 'Awareness Library' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabSelect(t.id)}
              className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === t.id
                  ? 'border-[#174D3B] bg-[#174D3B] text-[#F7F0E5]'
                  : 'border-[#16765B]/25 bg-[#E7EFE8] text-[#174D3B] hover:bg-[#D5E6DA]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'checklist' && (
          <div className="rounded-2xl border border-[#16765B]/25 bg-[#E7EFE8] p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-[#174D3B]">
                  Before You Apply Verification Checklist
                </h3>
                <p className="text-xs text-[#2D4F38] mt-0.5">
                  Mark off each verification step before submitting resumes or accepting an offer.
                </p>
              </div>
              <span className="font-mono-tabular text-xs font-bold text-[#174D3B] bg-[#F7F0E5] border border-[#16765B]/30 rounded-md px-3 py-1">
                {user?.isDemo ? 'DEMO DATA · ' : ''}
                {completed.length} / {BEFORE_YOU_APPLY_CHECKLIST.length} Completed
              </span>
            </div>

            <div className="space-y-2.5">
              {BEFORE_YOU_APPLY_CHECKLIST.map((item) => {
                const done = completed.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`w-full text-left rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                      done
                        ? 'border-[#16765B]/45 bg-[#D3E8DB]'
                        : 'border-[#16765B]/15 bg-[#F7F0E5] hover:bg-[#F0DFBD]/45'
                    }`}
                  >
                    {done ? (
                      <CheckSquare className="h-5 w-5 text-[#174D3B] shrink-0 mt-0.5" />
                    ) : (
                      <Square className="h-5 w-5 text-[#16765B] shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[#174D3B]">{item.title}</p>
                      <p className="text-xs text-[#2D4F38] mt-0.5">{item.detail}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="rounded-2xl border border-[#16765B]/25 bg-[#F7F0E5] p-6 space-y-4 shadow-xs">
            <h3 className="font-display text-lg font-bold text-[#174D3B]">
              Never Pay Pre-Employment Fees
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PAYMENT_WARNINGS.map((w) => (
                <div
                  key={w.title}
                  className="rounded-xl border border-[#16765B]/20 bg-[#E7EFE8] p-4 space-y-1"
                >
                  <h4 className="text-sm font-bold text-[#651F35]">{w.title}</h4>
                  <p className="text-xs text-[#2D4F38] leading-relaxed">{w.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="rounded-2xl border border-[#16765B]/25 bg-[#F7F0E5] p-6 space-y-4 shadow-xs">
            <h3 className="font-display text-lg font-bold text-[#174D3B]">
              Protect Sensitive Identity &amp; Banking Records
            </h3>
            <p className="text-sm text-[#2D4F38]">
              Never share OTPs, UPI PINs, or netbanking passwords with recruiters. Only provide
              Aadhaar/PAN during verified post-selection onboarding.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOCUMENT_SHARING_RISKS.map((d) => (
                <div
                  key={d.item}
                  className="rounded-xl border border-[#C69B36]/35 bg-[#FBF3DF] p-4 space-y-1"
                >
                  <h4 className="text-sm font-bold text-[#29272B] flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-[#C69B36]" />
                    <span>{d.item}</span>
                  </h4>
                  <p className="text-xs text-[#4F3B42] leading-relaxed">{d.risk}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'suspect' && (
          <div className="rounded-2xl border border-[#C69B36]/40 bg-[#FBF3DF] p-6 space-y-5 shadow-xs">
            <h3 className="font-display text-lg font-bold text-[#29272B] flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#C69B36]" />
              <span>If You Suspect a Recruitment Scam</span>
            </h3>
            <ol className="list-decimal pl-5 space-y-2.5 text-sm text-[#29272B] bg-[#F7F0E5] rounded-xl border border-[#C69B36]/30 p-5">
              <li>Stop engaging with suspicious links, QR codes, or Telegram groups immediately.</li>
              <li>Do not transfer any money—even small &quot;refundable verification&quot; amounts.</li>
              <li>Do not share further identity documents, selfies, or OTPs.</li>
              <li>Preserve full screenshots, email headers, offer letters, and phone numbers.</li>
              <li>Verify the role independently through the employer’s official careers website.</li>
              <li>Submit a report to Community Threat Intelligence to help warn other citizens.</li>
            </ol>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/student/scanner"
                className="rounded-lg bg-[#174D3B] px-4 py-2 text-xs font-semibold text-[#F7F0E5] hover:bg-[#123D2F]"
              >
                Scan Opportunity
              </Link>
              <Link
                to="/student/community?new=1"
                className="rounded-lg border border-[#174D3B]/30 bg-[#F7F0E5] px-4 py-2 text-xs font-semibold text-[#174D3B] hover:bg-[#E7EFE8]"
              >
                Submit Community Report
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'paid' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#842D48]/35 bg-[#FBEAE3] p-6 space-y-4 shadow-xs">
              <h3 className="font-display text-lg font-bold text-[#651F35] flex items-center gap-2">
                <PhoneCall className="h-5 w-5" />
                <span>If Money Has Already Been Paid (Immediate India Action Plan)</span>
              </h3>
              <ol className="list-decimal pl-5 space-y-2.5 text-sm text-[#29272B] bg-[#F7F0E5] rounded-xl border border-[#842D48]/25 p-5">
                {INDIA_EMERGENCY_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="text-xs text-[#4F3B42]">
                Important: JOBSHIELD cannot recover money or reverse bank/UPI transactions. Speed in
                calling 1930 and reporting at https://cybercrime.gov.in is critical for bank freeze
                actions.
              </p>
            </div>

            <div className="rounded-2xl border border-[#16765B]/25 bg-[#E7EFE8] p-6 space-y-3">
              <h3 className="font-display text-base font-bold text-[#174D3B]">
                If Personal Information Has Been Shared
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#2D4F38]">
                <li>Change affected passwords immediately and enable two-factor authentication.</li>
                <li>Secure your primary email account and review recent sign-in activity.</li>
                <li>Contact your bank immediately if account numbers, cards, or OTPs were exposed.</li>
                <li>Monitor bank statements and credit alerts for unauthorized activity.</li>
                <li>Preserve all evidence and file an identity misuse report if required.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-2">
              {AWARENESS_ARTICLES.map((art) => (
                <button
                  key={art.slug}
                  type="button"
                  onClick={() => setSelectedSlug(art.slug)}
                  className={`w-full text-left rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    art.slug === currentArticle.slug
                      ? 'border-[#174D3B] bg-[#174D3B] text-[#F7F0E5]'
                      : 'border-[#16765B]/25 bg-[#E7EFE8] text-[#174D3B] hover:bg-[#D5E6DA]'
                  }`}
                >
                  {art.title}
                </button>
              ))}
            </div>
            <div className="lg:col-span-8 rounded-2xl border border-[#16765B]/25 bg-[#F7F0E5] p-6 space-y-5 shadow-xs">
              <div>
                <h3 className="font-display text-xl font-bold text-[#174D3B]">
                  {currentArticle.title}
                </h3>
                <p className="mt-2 text-sm text-[#2D4F38] leading-relaxed">
                  {currentArticle.description}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                <div>
                  <h4 className="font-semibold text-[#174D3B] mb-2">How It Works</h4>
                  <ul className="list-disc pl-4 space-y-1 text-[#2D4F38]">
                    {currentArticle.howItWorks.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#651F35] mb-2">Warning Signs</h4>
                  <ul className="list-disc pl-4 space-y-1 text-[#2D4F38]">
                    {currentArticle.warningSigns.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="rounded-xl border border-[#16765B]/25 bg-[#E7EFE8] p-4 text-sm text-[#174D3B]">
                <strong>Example Scenario:</strong> {currentArticle.exampleScenario}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                <div>
                  <h4 className="font-semibold text-[#16765B] mb-2">Prevention</h4>
                  <ul className="list-disc pl-4 space-y-1 text-[#2D4F38]">
                    {currentArticle.prevention.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#174D3B] mb-2">What To Do If Affected</h4>
                  <ul className="list-disc pl-4 space-y-1 text-[#2D4F38]">
                    {currentArticle.whatToDo.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
