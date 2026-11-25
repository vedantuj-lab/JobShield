import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Mail,
  Network,
  PhoneCall,
  ScanSearch,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { ResilientImage } from '../../components/common/RiskDisplay';
import {
  AWARENESS_ARTICLES,
  DOCUMENT_SHARING_RISKS,
  INDIA_EMERGENCY_STEPS,
  PAYMENT_WARNINGS,
} from '../../data/protectionData';
import { apiRequest } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export function AboutPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#651F35] via-[#842D48] to-[#563653] text-[#F0DFBD] py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#E27D70]">
              About JOBSHIELD
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F7F0E5] tracking-tight">
              Protect Your Career Before Scammers Destroy It.
            </h1>
            <p className="text-[#F0DFBD]/95 leading-relaxed">
              JOBSHIELD is an AI-powered Recruitment Trust &amp; Protection Platform created by Team
              Tech Dynamites (Vedant Dalvi and Prince Gupta) to help Indian college students, citizens,
              and job seekers evaluate recruitment communications before losing money or exposing
              sensitive identity documents.
            </p>
            <p className="text-[#F0DFBD]/85 leading-relaxed">
              Instead of guessing whether an offer is genuine, JOBSHIELD investigates evidence
              across documents, domains, email headers, and moderated community intelligence—returning
              clear risk indicators alongside what could not be verified.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-2xl border border-[#F0DFBD]/30 aspect-video shadow-xl">
              <ResilientImage
                src="/src/assets/images/about_team_workspace_1795578122013.jpg"
                alt="JOBSHIELD engineering and recruitment security research workspace"
                fallbackTitle="Team Tech Dynamites"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-[#F7F0E5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-[#C65D45]/25 bg-[#FBEAE3] p-6 space-y-2 shadow-xs">
            <h2 className="font-display text-lg font-bold text-[#651F35]">Evidence First</h2>
            <p className="text-sm text-[#29272B]/85 leading-relaxed">
              Every finding cites its exact source and separates risk indicators from evidence
              confidence.
            </p>
          </div>
          <div className="rounded-xl border border-[#174D3B]/25 bg-[#E7EFE8] p-6 space-y-2 shadow-xs">
            <h2 className="font-display text-lg font-bold text-[#174D3B]">Honest Uncertainty</h2>
            <p className="text-sm text-[#29272B]/85 leading-relaxed">
              When data is incomplete or external checks are unavailable, JOBSHIELD returns
              Insufficient Evidence instead of fabricating assurance.
            </p>
          </div>
          <div className="rounded-xl border border-[#563653]/25 bg-[#EFEAF2] p-6 space-y-2 shadow-xs">
            <h2 className="font-display text-lg font-bold text-[#46304F]">Team Tech Dynamites</h2>
            <p className="text-sm text-[#29272B]/85 leading-relaxed">
              Engineered by Vedant Dalvi and Prince Gupta for students, placement cells, and
              early-career applicants across India.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

export function HowItWorksPage() {
  const stages = [
    {
      num: '01',
      title: 'Input & File Signature Validation',
      desc: 'PDFs, screenshots, emails, URLs, and job descriptions are validated for size, format, and magic-byte integrity. URLs pass strict SSRF and private-IP blocking before any network lookup.',
      tone: 'bg-[#FBEAE3] border-[#C65D45]/25',
    },
    {
      num: '02',
      title: 'Document & Header Extraction',
      desc: 'PDF text layers are extracted safely in confined temporary storage. Screenshots undergo OCR with user-editable review so OCR mistakes never corrupt the score silently.',
      tone: 'bg-[#E7EFE8] border-[#174D3B]/25',
    },
    {
      num: '03',
      title: 'Technical Domain, DNS, TLS & Email Checks',
      desc: 'Server-side resolvers inspect DNS MX/SPF/DMARC records, ICANN RDAP registration, HTTPS certificates, controlled redirects, and Google Web Risk (when configured).',
      tone: 'bg-[#EFEAF2] border-[#563653]/25',
    },
    {
      num: '04',
      title: 'Gemini AI Content Analysis with Prompt-Injection Defense',
      desc: 'Untrusted recruitment text is isolated from system instructions and analyzed for contradictions, payment demands, unrealistic CTC claims, and missing facts.',
      tone: 'bg-[#FBF3DF] border-[#C69B36]/35',
    },
    {
      num: '05',
      title: 'Risk Engine & Separate Evidence Confidence',
      desc: 'Documented rules prevent duplicate scoring and output Lower Risk (0–29), Suspicious (30–59), High Risk (60–100), or Insufficient Evidence—always paired with limitations.',
      tone: 'bg-[#E9D9C4] border-[#651F35]/20',
    },
  ];

  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#651F35] via-[#842D48] to-[#563653] text-[#F0DFBD] py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#E27D70]">
              Verification Pipeline
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F7F0E5]">
              How JOBSHIELD Evaluates Recruitment Material
            </h1>
            <p className="text-[#F0DFBD]/90 leading-relaxed">
              Every submission passes through validation, extraction, technical inspection, AI
              analysis, evidence correlation, and rule-based scoring.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-[#F0DFBD]/30 aspect-[16/10]">
              <ResilientImage
                src="/src/assets/images/scanner_url_domain_1795580301089.jpg"
                alt="Technical verification pipeline inspecting domains and SSL metadata"
                fallbackTitle="Technical Verification Pipeline"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-[#F7F0E5]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-5">
          {stages.map((s) => (
            <div key={s.num} className={`rounded-xl border p-6 flex gap-5 shadow-xs ${s.tone}`}>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#651F35] text-[#F0DFBD] font-mono-tabular text-sm font-bold shrink-0">
                {s.num}
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-lg font-bold text-[#29272B]">{s.title}</h2>
                <p className="text-sm text-[#4F3B42] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
          <div className="pt-4">
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 rounded-lg bg-[#C65D45] px-5 py-3 text-sm font-semibold text-[#F7F0E5] hover:bg-[#B85C32]"
            >
              <span>Choose Your Workspace to Run a Scan</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

export function FeaturesPage() {
  const sections = [
    {
      id: 'scanner',
      icon: ScanSearch,
      title: '1. Unified Recruitment Scanner',
      image: '/src/assets/images/scanner_offer_analysis_1795578120650.jpg',
      imageAlt: 'Offer letter verification desk',
      cardClass: 'bg-[#FBEAE3] border-[#C65D45]/30',
      iconClass: 'bg-[#C65D45] text-[#F7F0E5]',
      points: [
        'Offer Letter Scanner (PDF, image, or pasted text extraction and consistency checks)',
        'Email Scanner (sender/reply-to mismatch, free webmail detection, SPF/DKIM/DMARC header parsing)',
        'URL Scanner (SSRF-safe validation, DNS, RDAP, TLS inspection, redirects, Google Web Risk)',
        'Job Description Scanner (unrealistic salary, guaranteed selection, MLM/task patterns)',
        'Screenshot & Message Scanner (OCR extraction with user verification before analysis)',
      ],
    },
    {
      id: 'trust-intelligence',
      icon: Network,
      title: '2. Recruitment Trust Intelligence',
      image: '/src/assets/images/trust_company_verification_1795580302513.jpg',
      imageAlt: 'Company and recruiter identity verification',
      cardClass: 'bg-[#E7EFE8] border-[#16765B]/30',
      iconClass: 'bg-[#16765B] text-[#F7F0E5]',
      points: [
        'Company Verification, Recruiter Verification, and Opportunity Verification',
        'Four independent verification statements preventing false Genuine/Fake shortcuts',
        'Interactive React Flow Evidence Graph connecting Company, Domain, Recruiter, Email, Offer, JD, URL, and Payment claims',
      ],
    },
    {
      id: 'community',
      icon: Users,
      title: '3. Community Threat Intelligence',
      image: '/src/assets/images/community_collab_team_1795588753753.jpg',
      imageAlt: 'Community threat intelligence research team',
      cardClass: 'bg-[#F3E7DA] border-[#A96B45]/30',
      iconClass: 'bg-[#A96B45] text-[#F7F0E5]',
      points: [
        'Structured reporting for 10 Indian recruitment fraud categories',
        'Automatic duplicate detection and privacy masking of personal contact details',
        'Admin moderation workflow (Under Review, Corroborated, Confirmed, Rejected)',
      ],
    },
    {
      id: 'protection',
      icon: ShieldCheck,
      title: '4. User Protection Centre',
      image: '/src/assets/images/protection_safety_study_1795586899841.jpg',
      imageAlt: 'Student recruitment safety guidance',
      cardClass: 'bg-[#E3EDE6] border-[#174D3B]/30',
      iconClass: 'bg-[#174D3B] text-[#F7F0E5]',
      points: [
        'Interactive Before You Apply checklist saved to your profile',
        'Before You Pay and Before Sharing Documents risk guidance',
        'India 1930 cybercrime helpline and cybercrime.gov.in emergency response guide',
      ],
    },
    {
      id: 'governance',
      icon: UserCheck,
      title: '5. User and Admin Management',
      image: '/src/assets/images/admin_security_operations_1795580300367.jpg',
      imageAlt: 'Administrator security operations console',
      cardClass: 'md:col-span-2 bg-gradient-to-br from-[#563653] via-[#46304F] to-[#651F35] border-[#B9A5C9]/35 text-[#F7F0E5]',
      iconClass: 'bg-[#B9A5C9] text-[#29272B]',
      dark: true,
      points: [
        'Strictly separated Citizen / Student and Administrator portals with Demo sandboxes and Google OAuth enforcement',
        'Admin user management, platform scan monitoring, and community moderation queue',
        'Authoritative company records, domain threat indicators, evidence logs, audit logs, and system health',
      ],
    },
  ];

  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#651F35] via-[#842D48] to-[#563653] text-[#F0DFBD] py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#E27D70]">
            Platform Architecture
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F7F0E5]">
            Five Finalized JOBSHIELD Core Modules
          </h1>
          <p className="text-[#F0DFBD]/90 max-w-2xl">
            Every module is integrated end-to-end with backend validation, persistent reports, and
            strictly separated Citizen / Student and Administrator workspaces.
          </p>
        </div>
      </section>

      <section className="py-14 bg-[#F7F0E5]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.id}
                id={sec.id}
                className={`rounded-2xl border overflow-hidden shadow-xs ${sec.cardClass}`}
              >
                <div className="h-44 overflow-hidden bg-[#29272B]">
                  <ResilientImage
                    src={sec.image}
                    alt={sec.imageAlt}
                    fallbackTitle={sec.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${sec.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2
                      className={`font-display text-lg font-bold ${
                        sec.dark ? 'text-[#F7F0E5]' : 'text-[#29272B]'
                      }`}
                    >
                      {sec.title}
                    </h2>
                  </div>
                  <ul
                    className={`space-y-2.5 text-sm ${
                      sec.dark ? 'text-[#E9D9C4]' : 'text-[#29272B]/85'
                    }`}
                  >
                    {sec.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2.5">
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            sec.dark ? 'text-[#E27D70]' : 'text-[#16765B]'
                          }`}
                        />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </PublicLayout>
  );
}

export function SafetyGuidePage() {
  const [params, setParams] = useSearchParams();
  const selectedSlug = params.get('article') || AWARENESS_ARTICLES[0].slug;
  const current =
    AWARENESS_ARTICLES.find((a) => a.slug === selectedSlug) || AWARENESS_ARTICLES[0];

  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#651F35] via-[#842D48] to-[#B85C32] text-[#F0DFBD] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F0DFBD]">
              Safety Guide
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F7F0E5]">
              Recruitment Fraud Prevention &amp; Emergency Response
            </h1>
            <p className="text-[#F0DFBD]/90 max-w-2xl">
              Understand how recruitment scams operate in India, what never to pay or share, and
              immediate action steps if you suspect fraud.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-[#F0DFBD]/30 aspect-[16/9]">
              <ResilientImage
                src="/src/assets/images/awareness_phishing_email_1795578122206.jpg"
                alt="Student verifying online recruitment safety steps"
                fallbackTitle="Safety Library"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#F7F0E5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="rounded-2xl border border-[#842D48]/30 bg-[#FADED8] p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#651F35]">
              <PhoneCall className="h-5 w-5" />
              <h2 className="font-display text-lg font-bold">
                If Money Has Already Been Paid (India Cyber Fraud Response)
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-[#29272B]">
              {INDIA_EMERGENCY_STEPS.map((step, i) => (
                <div key={step} className="rounded-lg border border-[#842D48]/25 bg-[#F7F0E5] p-3.5">
                  <span className="font-mono-tabular text-xs font-bold text-[#651F35]">0{i + 1}. </span>
                  {step}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#4F3B42]">
              Note: JOBSHIELD provides analysis and reporting guidance only; it cannot reverse bank
              transactions or recover transferred funds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#C65D45]/25 bg-[#FBEAE3] p-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-[#651F35]">Before You Pay</h2>
              <div className="space-y-3">
                {PAYMENT_WARNINGS.map((w) => (
                  <div key={w.title} className="border-b border-[#C65D45]/20 pb-3 last:border-0 last:pb-0">
                    <h3 className="text-sm font-semibold text-[#651F35]">{w.title}</h3>
                    <p className="text-xs text-[#4F3B42] mt-0.5">{w.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#A96B45]/25 bg-[#E9D9C4] p-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-[#651F35]">
                Before Sharing Sensitive Documents
              </h2>
              <div className="space-y-3">
                {DOCUMENT_SHARING_RISKS.map((d) => (
                  <div
                    key={d.item}
                    className="border-b border-[#651F35]/15 pb-3 last:border-0 last:pb-0"
                  >
                    <h3 className="text-sm font-semibold text-[#842D48] flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{d.item}</span>
                    </h3>
                    <p className="text-xs text-[#29272B]/85 mt-1">{d.risk}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-2">
              <h2 className="font-display text-lg font-bold text-[#651F35] mb-3">
                Awareness Library (10 Guides)
              </h2>
              {AWARENESS_ARTICLES.map((art) => (
                <button
                  key={art.slug}
                  type="button"
                  onClick={() => setParams({ article: art.slug })}
                  className={`w-full text-left rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    art.slug === current.slug
                      ? 'border-[#651F35] bg-[#651F35] text-[#F7F0E5]'
                      : 'border-[#651F35]/15 bg-[#F0DFBD]/75 text-[#29272B] hover:bg-[#E9D9C4]'
                  }`}
                >
                  {art.title}
                </button>
              ))}
            </div>

            <div className="lg:col-span-8 rounded-2xl border border-[#651F35]/20 bg-[#F0DFBD]/45 p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#651F35]">{current.title}</h2>
                <p className="mt-2 text-[#29272B]/85 leading-relaxed">{current.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-display text-sm font-bold text-[#651F35] mb-2">
                    How This Scam Works
                  </h3>
                  <ul className="space-y-2 text-sm text-[#4F3B42] list-disc pl-4">
                    {current.howItWorks.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-[#842D48] mb-2">Warning Signs</h3>
                  <ul className="space-y-2 text-sm text-[#4F3B42] list-disc pl-4">
                    {current.warningSigns.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="rounded-xl border border-[#C65D45]/25 bg-[#E9D9C4] p-4">
                <h3 className="font-display text-sm font-bold text-[#651F35]">Example Scenario</h3>
                <p className="mt-1 text-sm text-[#29272B]/85 leading-relaxed">
                  {current.exampleScenario}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-display text-sm font-bold text-[#174D3B] mb-2">Prevention</h3>
                  <ul className="space-y-2 text-sm text-[#4F3B42] list-disc pl-4">
                    {current.prevention.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-[#651F35] mb-2">
                    What To Do If Affected
                  </h3>
                  <ul className="space-y-2 text-sm text-[#4F3B42] list-disc pl-4">
                    {current.whatToDo.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

export function ContactPage() {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Campus Placement Inquiry');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, subject, message }),
      });
      setSent(true);
      showToast('Your message was submitted to JOBSHIELD.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to send message.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="py-14 bg-[#F7F0E5]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-2xl border border-[#651F35]/20 bg-[#F0DFBD]/55 p-6 sm:p-8 space-y-6 shadow-xs">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#C65D45]">
                Contact JOBSHIELD
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#651F35] mt-1">
                Get in Touch With Team Tech Dynamites
              </h1>
              <p className="text-sm text-[#4F3B42] mt-2">
                Questions about campus placement-cell onboarding, bug reports, or recruitment threat
                research? Send us a message below.
              </p>
            </div>

            {sent ? (
              <div className="rounded-xl border border-[#16765B]/35 bg-[#E7EFE8] p-5 space-y-2">
                <p className="font-semibold text-[#174D3B] flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Message Received</span>
                </p>
                <p className="text-sm text-[#29272B]">
                  Thank you for contacting JOBSHIELD. To report an active job scam for threat
                  analysis, please sign in to the Citizen / Student portal and use Community Threat Intelligence.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#651F35] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-[#A96B45]/35 bg-[#F7F0E5] px-3.5 py-2.5 text-sm focus:border-[#651F35] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#651F35] mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-[#A96B45]/35 bg-[#F7F0E5] px-3.5 py-2.5 text-sm focus:border-[#651F35] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#651F35] mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-[#A96B45]/35 bg-[#F7F0E5] px-3.5 py-2.5 text-sm focus:border-[#651F35] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#651F35] mb-1">Message</label>
                  <textarea
                    rows={5}
                    required
                    minLength={15}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-lg border border-[#A96B45]/35 bg-[#F7F0E5] px-3.5 py-2.5 text-sm focus:border-[#651F35] focus:outline-none"
                    placeholder="Describe your inquiry (minimum 15 characters)..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#C65D45] px-5 py-2.5 text-sm font-semibold text-[#F7F0E5] hover:bg-[#B85C32] disabled:opacity-60"
                >
                  <Mail className="h-4 w-4" />
                  <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

export function PrivacyPolicyPage() {
  return (
    <PublicLayout>
      <section className="py-14 bg-[#F7F0E5]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 rounded-2xl border border-[#651F35]/20 bg-[#F0DFBD]/55 p-8 space-y-5">
          <h1 className="font-display text-3xl font-bold text-[#651F35]">Privacy Policy</h1>
          <p className="text-sm text-[#4F3B42] leading-relaxed">
            JOBSHIELD is designed around data minimization, purpose limitation, and user control in
            alignment with India’s Digital Personal Data Protection principles.
          </p>
          <div className="space-y-3 text-sm text-[#4F3B42] leading-relaxed">
            <h2 className="font-display text-lg font-semibold text-[#651F35]">
              1. Information Collected
            </h2>
            <p>
              We store your account name, email, optional institution, role, and scan reports you
              initiate. Uploaded files are validated in confined storage and temporary processing files
              are deleted immediately after extraction.
            </p>
            <h2 className="font-display text-lg font-semibold text-[#651F35]">
              2. Sensitive Personal Data Protection
            </h2>
            <p>
              Do not upload Aadhaar, PAN, bank account credentials, or passwords. Community reports
              mask personal email addresses and Indian mobile numbers before public display.
            </p>
            <h2 className="font-display text-lg font-semibold text-[#651F35]">
              3. Account Deletion &amp; Control
            </h2>
            <p>
              You may delete individual scan records or permanently delete your entire real account and
              associated scans at any time from Profile &amp; Settings.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

export function TermsPage() {
  return (
    <PublicLayout>
      <section className="py-14 bg-[#F7F0E5]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 rounded-2xl border border-[#651F35]/20 bg-[#F0DFBD]/55 p-8 space-y-5">
          <h1 className="font-display text-3xl font-bold text-[#651F35]">Terms and Conditions</h1>
          <div className="space-y-3 text-sm text-[#4F3B42] leading-relaxed">
            <h2 className="font-display text-lg font-semibold text-[#651F35]">
              1. Advisory Nature of Security Reports
            </h2>
            <p>
              JOBSHIELD provides automated technical observations, AI-assisted content analysis, and
              moderated community intelligence. A Lower Risk score does not certify that a job offer
              is genuine, and JOBSHIELD does not replace official verification with employers or
              placement cells.
            </p>
            <h2 className="font-display text-lg font-semibold text-[#651F35]">
              2. Acceptable Use
            </h2>
            <p>
              Users may only submit recruitment materials they are authorized to review. Attempting to
              probe internal networks, submit malicious executables, or abuse community reporting with
              fabricated accusations will result in account suspension.
            </p>
            <h2 className="font-display text-lg font-semibold text-[#651F35]">
              3. No Financial Recovery Guarantee
            </h2>
            <p>
              JOBSHIELD cannot reverse payments or recover lost funds. Victims of financial fraud in
              India must contact their bank, call 1930, and file a report at cybercrime.gov.in.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
