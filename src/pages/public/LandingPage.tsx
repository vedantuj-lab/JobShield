import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CreditCard,
  FileWarning,
  Globe,
  GraduationCap,
  Laptop,
  MessageSquareWarning,
  Network,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { ResilientImage } from '../../components/common/RiskDisplay';
import { AWARENESS_ARTICLES } from '../../data/protectionData';

const THREAT_CARDS = [
  {
    title: 'Fake Offer Letters',
    icon: FileWarning,
    explanation: 'Forged appointment letters using real corporate logos and fabricated HR signatures.',
    warning: 'Warning sign: Offer issued without technical interviews or asking for joining fees.',
    surface: 'bg-[#FBEAE3] border-[#C65D45]/30',
    iconBox: 'bg-[#C65D45] text-[#F7F0E5]',
    titleColor: 'text-[#651F35]',
    warnColor: 'text-[#B85C32]',
  },
  {
    title: 'Fake HR Representatives',
    icon: UserX,
    explanation: 'Impersonators adopting real HR names over free webmail or personal messaging numbers.',
    warning: 'Warning sign: Recruiter emails from @gmail.com or refuses corporate email confirmation.',
    surface: 'bg-[#EFEAF2] border-[#563653]/25',
    iconBox: 'bg-[#563653] text-[#F7F0E5]',
    titleColor: 'text-[#46304F]',
    warnColor: 'text-[#563653]',
  },
  {
    title: 'Registration Fee Scams',
    icon: CreditCard,
    explanation: 'Requests for UPI transfers disguised as onboarding, processing, or kit deposits.',
    warning: 'Warning sign: Any demand for refundable money before your joining date.',
    surface: 'bg-[#FBF3DF] border-[#E3B34C]/45',
    iconBox: 'bg-[#C69B36] text-[#29272B]',
    titleColor: 'text-[#651F35]',
    warnColor: 'text-[#8C5A12]',
  },
  {
    title: 'Fake Internship Offers',
    icon: GraduationCap,
    explanation: 'Stipend promises targeting college students in exchange for mandatory paid training.',
    warning: 'Warning sign: Required payment to unlock internship certificates or project portals.',
    surface: 'bg-[#E7EFE8] border-[#174D3B]/25',
    iconBox: 'bg-[#174D3B] text-[#F7F0E5]',
    titleColor: 'text-[#174D3B]',
    warnColor: 'text-[#16765B]',
  },
  {
    title: 'Fraudulent Job Websites',
    icon: Globe,
    explanation: 'Lookalike portals designed to mimic major MNC careers pages and capture candidate logins.',
    warning: 'Warning sign: Misspelled domains, hyphenated HR URLs, or missing HTTPS.',
    surface: 'bg-[#EFEAF2] border-[#563653]/25',
    iconBox: 'bg-[#563653] text-[#F7F0E5]',
    titleColor: 'text-[#46304F]',
    warnColor: 'text-[#563653]',
  },
  {
    title: 'Telegram Task Scams',
    icon: MessageSquareWarning,
    explanation: 'Simple rating tasks that escalate into prepaid merchant recharge traps.',
    warning: 'Warning sign: Daily payout groups demanding deposits to unlock higher-tier tasks.',
    surface: 'bg-[#FBEAE3] border-[#C65D45]/30',
    iconBox: 'bg-[#C65D45] text-[#F7F0E5]',
    titleColor: 'text-[#651F35]',
    warnColor: 'text-[#B85C32]',
  },
  {
    title: 'Work-from-Home Fraud',
    icon: Laptop,
    explanation: 'Unrealistic part-time salary claims for minimal clerical or data-entry work.',
    warning: 'Warning sign: High weekly payouts promised for one hour of daily typing.',
    surface: 'bg-[#E7EFE8] border-[#174D3B]/25',
    iconBox: 'bg-[#174D3B] text-[#F7F0E5]',
    titleColor: 'text-[#174D3B]',
    warnColor: 'text-[#16765B]',
  },
  {
    title: 'Identity Theft',
    icon: ShieldAlert,
    explanation: 'Premature collection of Aadhaar, PAN, bank passbooks, and OTPs via unverified forms.',
    warning: 'Warning sign: KYC documents or OTPs requested before formal employment verification.',
    surface: 'bg-[#FBF3DF] border-[#E3B34C]/45',
    iconBox: 'bg-[#C69B36] text-[#29272B]',
    titleColor: 'text-[#651F35]',
    warnColor: 'text-[#8C5A12]',
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Submit',
    detail: 'Upload an offer letter, paste an email, submit a URL, enter a job description, or upload a chat screenshot.',
  },
  {
    step: '02',
    title: 'Analyse',
    detail: 'Extracts entities, compensation claims, urgency triggers, and payment demands using structured AI analysis.',
  },
  {
    step: '03',
    title: 'Verify',
    detail: 'Backend resolvers inspect domain DNS, TLS certificates, ICANN RDAP records, email headers, and threat feeds.',
  },
  {
    step: '04',
    title: 'Assess',
    detail: 'Rule-based Risk Engine separates Risk Score from Evidence Confidence and highlights missing evidence.',
  },
  {
    step: '05',
    title: 'Protect',
    detail: 'Receive explainable security reports, trust evidence graphs, and practical actions to stay safe.',
  },
];

const CORE_MODULES = [
  {
    title: 'Unified Recruitment Scanner',
    subtitle: 'Module 01',
    icon: ScanSearch,
    description:
      'Five dedicated inspection interfaces for Offer Letters, Recruitment Emails, Website URLs, Job Descriptions, and WhatsApp/Telegram Screenshots.',
    anchor: '/features#scanner',
    image: '/src/assets/images/scanner_offer_analysis_1795578120650.jpg',
    imageAlt: 'Printed employment offer letter on desk beside laptop verification view',
    cardClass: 'bg-[#FBEAE3] border-[#C65D45]/35 text-[#29272B]',
    iconClass: 'bg-[#C65D45] text-[#F7F0E5]',
    linkClass: 'text-[#B85C32] hover:text-[#651F35]',
    subClass: 'text-[#C65D45]',
    bodyClass: 'text-[#4F3B42]',
  },
  {
    title: 'Recruitment Trust Intelligence',
    subtitle: 'Module 02',
    icon: Network,
    description:
      'Investigates Company, Official Domain, Recruiter, Email, Offer, URL, and Payment relationships with an interactive React Flow Evidence Graph.',
    anchor: '/features#trust-intelligence',
    image: '/src/assets/images/trust_company_verification_1795580302513.jpg',
    imageAlt: 'Researchers cross-checking corporate registration and domain ownership records',
    cardClass: 'bg-[#E7EFE8] border-[#16765B]/35 text-[#29272B]',
    iconClass: 'bg-[#16765B] text-[#F7F0E5]',
    linkClass: 'text-[#16765B] hover:text-[#174D3B]',
    subClass: 'text-[#174D3B]',
    bodyClass: 'text-[#2D4B40]',
  },
  {
    title: 'Community Threat Intelligence',
    subtitle: 'Module 03',
    icon: Users,
    description:
      'Citizens and students report suspicious drives and scam domains with automatic duplicate detection and privacy masking before moderator confirmation.',
    anchor: '/features#community',
    image: '/src/assets/images/community_collab_team_1795588753753.jpg',
    imageAlt: 'Students and researchers collaborating around a laptop on community threat reports',
    cardClass: 'bg-[#F3E7DA] border-[#A96B45]/35 text-[#29272B]',
    iconClass: 'bg-[#A96B45] text-[#F7F0E5]',
    linkClass: 'text-[#A96B45] hover:text-[#651F35]',
    subClass: 'text-[#A96B45]',
    bodyClass: 'text-[#4F3B42]',
  },
  {
    title: 'User Protection Centre',
    subtitle: 'Module 04',
    icon: ShieldCheck,
    description:
      'Interactive Before You Apply checklist, pre-payment and KYC warnings, and step-by-step India 1930 / cybercrime.gov.in response guidance.',
    anchor: '/features#protection',
    image: '/src/assets/images/protection_safety_study_1795586899841.jpg',
    imageAlt: 'Graduate checking pre-application safety checklists calmly at desk',
    cardClass: 'bg-[#E3EDE6] border-[#174D3B]/35 text-[#29272B]',
    iconClass: 'bg-[#174D3B] text-[#F7F0E5]',
    linkClass: 'text-[#174D3B] hover:text-[#16765B]',
    subClass: 'text-[#174D3B]',
    bodyClass: 'text-[#2D4B40]',
  },
  {
    title: 'Citizen & Administrator Portals',
    subtitle: 'Module 05',
    icon: UserCheck,
    description:
      'Strictly separated Citizen / Student and Administrator portals with instant Demo sandboxes, Google OAuth verification, moderation queues, audit logs, and system health.',
    anchor: '/features#governance',
    image: '/src/assets/images/admin_moderation_console_1795586899448.jpg',
    imageAlt: 'Administrator reviewing moderation and security telemetry',
    cardClass: 'md:col-span-2 bg-gradient-to-br from-[#563653] via-[#46304F] to-[#651F35] border-[#B9A5C9]/35 text-[#F7F0E5]',
    iconClass: 'bg-[#B9A5C9] text-[#29272B]',
    linkClass: 'text-[#F0DFBD] hover:text-white',
    subClass: 'text-[#B9A5C9]',
    bodyClass: 'text-[#E9D9C4]/95',
  },
];

const AWARENESS_IMAGE_MAP: Record<string, { src: string; alt: string }> = {
  'fake-hr-scams': {
    src: '/src/assets/images/scanner_email_inspection_1795580301873.jpg',
    alt: 'Inspecting suspicious recruitment email headers and sender domain on laptop',
  },
  'fake-internship-offers': {
    src: '/src/assets/images/trust_company_verification_1795580302513.jpg',
    alt: 'Checking company domain consistency and internship offer records',
  },
  'registration-fee-fraud': {
    src: '/src/assets/images/scanner_offer_analysis_1795578120650.jpg',
    alt: 'Reviewing offer letter clauses for fraudulent registration fee requests',
  },
  'telegram-task-scams': {
    src: '/src/assets/images/scanner_mobile_chat_1795580302782.jpg',
    alt: 'Reviewing suspicious messaging chat conversation on smartphone',
  },
  'work-from-home-scams': {
    src: '/src/assets/images/scanner_url_domain_1795580301089.jpg',
    alt: 'Analyzing work-from-home recruitment portal domain and SSL details',
  },
  phishing: {
    src: '/src/assets/images/awareness_phishing_email_1795578122206.jpg',
    alt: 'Student learning how to detect recruitment phishing portals and suspicious job posts',
  },
};

const AWARENESS_SLUGS = [
  'fake-hr-scams',
  'fake-internship-offers',
  'registration-fee-fraud',
  'telegram-task-scams',
  'work-from-home-scams',
  'phishing',
];

export function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const target = document.getElementById(id);
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 60);
      }
    }
  }, [location.hash]);

  const featuredArticles = AWARENESS_SLUGS.map((slug) =>
    AWARENESS_ARTICLES.find((a) => a.slug === slug)
  ).filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <PublicLayout>
      {/* 1. Deep Burgundy, Coral, Terracotta, Champagne Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#651F35] via-[#842D48] to-[#563653] text-[#F0DFBD] border-b border-[#C65D45]/40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#E27D70]/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#C65D45]/25 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-22">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <p className="inline-flex items-center gap-2 rounded-lg border border-[#F0DFBD]/30 bg-[#29272B]/35 px-3.5 py-1.5 text-xs sm:text-sm font-semibold tracking-wide text-[#FDE8DF]">
                <ShieldCheck className="h-4 w-4 text-[#E27D70] shrink-0" />
                <span>AI-Powered Recruitment Trust &amp; Scam Verification Platform</span>
              </p>

              <h1
                className="font-display font-bold tracking-tight text-[#FFFDF8] leading-[1.08] drop-shadow-sm"
                style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.6rem)', textWrap: 'balance' }}
              >
                Protect Your Career Before Scammers Destroy It.
              </h1>

              <p className="text-base sm:text-lg text-[#F7F0E5]/95 leading-relaxed max-w-xl">
                Verify job offers, HR emails, career URLs, job descriptions, and WhatsApp or
                Telegram messages using technical domain checks and explainable AI evidence —
                before you pay fees or share Aadhaar or PAN.
              </p>

              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3.5 pt-2">
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#C65D45] px-7 py-4 text-base font-bold text-[#FFFDF8] hover:bg-[#D46B52] border border-[#F0DFBD]/50 shadow-xl shadow-[#29272B]/45 transition-all"
                >
                  <span>Verify an Offer / Open Demo</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#F0DFBD]/50 bg-[#29272B]/35 px-6 py-4 text-sm sm:text-base font-semibold text-[#F7F0E5] hover:bg-[#651F35] transition-colors"
                >
                  Explore How It Works
                </Link>
              </div>

              <div className="pt-5 border-t border-[#F0DFBD]/25 flex flex-wrap gap-x-6 gap-y-2.5 text-xs sm:text-sm font-medium text-[#F0DFBD]">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#E27D70] shrink-0" />
                  Evidence-Based Analysis
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#E27D70] shrink-0" />
                  Citizen &amp; Admin Demo Workspaces
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#E27D70] shrink-0" />
                  Safer Job Applications
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-2xl border border-[#F0DFBD]/35 bg-[#29272B] shadow-2xl">
                <div className="aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden">
                  <ResilientImage
                    src="/src/assets/images/landing_burgundy_hero_1795586898907.jpg"
                    alt="Graduate checking recruitment offer letter authenticity on laptop at study table"
                    fallbackTitle="JOBSHIELD Offer Verification"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="bg-[#29272B] border-t border-[#842D48]/60 px-5 py-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[#F0DFBD]">
                  <span>Scans Offer Letters, Emails, URLs, JDs &amp; Chat Screenshots</span>
                  <span className="font-mono-tabular font-semibold text-[#E27D70]">
                    5 Integrated Security Modules
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Problem Section (Soft Cream background + Terracotta, Plum, Saffron, Forest Green cards) */}
      <section className="py-16 lg:py-20 bg-[#F7F0E5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10 sm:mb-12">
            <p className="text-xs font-bold uppercase tracking-wider text-[#B85C32] mb-2">
              Threat Landscape
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#651F35] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Not Every Job Opportunity Is What It Claims to Be.
            </h2>
            <p className="mt-3 text-base text-[#4F3B42] leading-relaxed">
              Citizens, students, and fresh graduates face increasingly convincing impersonation and
              advance-fee schemes. Recognize these eight high-frequency recruitment threats before responding.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {THREAT_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`rounded-xl border p-6 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.surface}`}
                >
                  <div className="space-y-3">
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBox}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className={`font-display text-lg font-bold ${card.titleColor}`}>
                      {card.title}
                    </h3>
                    <p className="text-sm text-[#29272B]/85 leading-relaxed">{card.explanation}</p>
                  </div>
                  <p className={`mt-auto pt-3 border-t border-[#29272B]/10 text-xs font-semibold leading-relaxed ${card.warnColor}`}>
                    {card.warning}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. How JOBSHIELD Works (Pale Sage & Warm Beige) */}
      <section
        id="how-it-works"
        className="scroll-mt-20 py-16 lg:py-20 bg-gradient-to-b from-[#E7EFE8] to-[#E9D9C4] border-y border-[#174D3B]/15"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-[#174D3B] mb-2">
                Verification Pipeline
              </p>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#29272B] tracking-tight">
                How JOBSHIELD Works
              </h2>
              <p className="mt-3 text-base text-[#29272B]/85 leading-relaxed">
                Every submission moves through five transparent stages combining document validation,
                technical domain inspection, AI extraction, and evidence-bounded scoring.
              </p>
            </div>
            <Link
              to="/how-it-works"
              className="text-sm font-semibold text-[#174D3B] hover:text-[#651F35] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Read full methodology</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-7 left-10 right-10 h-0.5 bg-[#174D3B]/25"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative">
              {WORKFLOW_STEPS.map((item, idx) => (
                <div key={item.step} className="relative flex lg:flex-col gap-4 items-start">
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="sm:hidden absolute left-6 top-12 bottom-0 w-0.5 bg-[#174D3B]/25"
                    />
                  )}
                  <div className="relative z-10 inline-flex h-12 w-12 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-xl bg-[#174D3B] text-[#F0DFBD] font-mono-tabular text-sm font-bold border-4 border-[#E7EFE8] shadow-sm">
                    {item.step}
                  </div>
                  <div className="rounded-xl border border-[#174D3B]/20 bg-[#F7F0E5] p-5 space-y-2 flex-1 w-full shadow-xs">
                    <h3 className="font-display text-base font-bold text-[#174D3B]">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-[#29272B]/85 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Five Core Modules (Dedicated palette per module card) */}
      <section id="features" className="scroll-mt-20 py-16 lg:py-20 bg-[#F7F0E5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10 sm:mb-12">
            <p className="text-xs font-bold uppercase tracking-wider text-[#B85C32] mb-2">
              Platform Modules
            </p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#651F35] tracking-tight">
              Five Integrated Recruitment Security Modules
            </h2>
            <p className="mt-3 text-base text-[#4F3B42] leading-relaxed">
              Every module works together—from initial document inspection to trust relationship
              mapping, community threat intelligence, safety checklists, and administrative governance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CORE_MODULES.map((mod, idx) => {
              const Icon = mod.icon;
              const isWideBanner = idx === CORE_MODULES.length - 1;
              return (
                <div
                  key={mod.title}
                  className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-lg ${mod.cardClass}`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 h-full">
                    <div
                      className={`sm:col-span-5 relative min-h-[210px] ${
                        isWideBanner ? 'md:max-h-[260px]' : ''
                      } bg-[#29272B]`}
                    >
                      <ResilientImage
                        src={mod.image}
                        alt={mod.imageAlt}
                        fallbackTitle={mod.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="sm:col-span-7 p-6 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold uppercase tracking-wide ${mod.subClass}`}>
                            {mod.subtitle}
                          </span>
                          <span
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${mod.iconClass}`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                        </div>
                        <h3 className="font-display text-xl font-bold">{mod.title}</h3>
                        <p className={`text-sm leading-relaxed ${mod.bodyClass}`}>
                          {mod.description}
                        </p>
                      </div>
                      <Link
                        to={mod.anchor}
                        className={`inline-flex items-center gap-1.5 text-sm font-semibold ${mod.linkClass}`}
                      >
                        <span>Learn More</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Why JOBSHIELD? (Deep Plum / Burgundy with Champagne & Coral highlights) */}
      <section
        id="why-jobshield"
        className="scroll-mt-20 py-16 lg:py-20 bg-gradient-to-br from-[#563653] via-[#46304F] to-[#651F35] text-[#F0DFBD]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#FDE8DF]">
                Why JOBSHIELD
              </p>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FFFDF8] tracking-tight">
                Evidence Boundaries Over Blind AI Guesses.
              </h2>
              <p className="text-base text-[#F0DFBD]/95 leading-relaxed">
                Generic AI chat tools guess blindly and treat missing facts as harmless. JOBSHIELD
                combines SSRF-safe URL telemetry, technical header inspection, and explainable risk
                scoring built specifically for citizens, students, and early-career applicants.
              </p>
            </div>
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Multi-format recruitment scanning',
                  detail: 'Inspect offer letters, emails, website URLs, job descriptions, and chat screenshots.',
                },
                {
                  title: 'Company & recruiter consistency checks',
                  detail: 'Cross-check corporate domains against sender headers and application portals.',
                },
                {
                  title: 'Explainable risk reports',
                  detail: 'Separates Risk Score from Evidence Confidence and flags missing evidence honestly.',
                },
                {
                  title: 'Evidence-based verification',
                  detail: 'Inspects RDAP, DNS, TLS certificates, and Google Web Risk when configured.',
                },
                {
                  title: 'Community threat intelligence',
                  detail: 'Citizen scam reporting moderated by security administrators with privacy masking.',
                },
                {
                  title: 'Practical protection guidance',
                  detail: 'Interactive pre-apply checklists and India 1930 / cybercrime.gov.in escalation steps.',
                },
              ].map((point) => (
                <div
                  key={point.title}
                  className="rounded-xl border border-[#B9A5C9]/25 bg-[#29272B]/35 p-5 space-y-1.5"
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-[#E27D70] shrink-0 mt-0.5" />
                    <h3 className="font-display text-sm sm:text-base font-bold text-[#FFFDF8]">
                      {point.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#F0DFBD]/90 leading-relaxed pl-7">
                    {point.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Awareness Section (Warm Beige background) */}
      <section className="py-16 lg:py-20 bg-[#E9D9C4] border-b border-[#651F35]/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-[#B85C32] mb-2">
                Safety Education
              </p>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#651F35] tracking-tight">
                Recruitment Safety Library
              </h2>
              <p className="mt-2 text-base text-[#29272B]/85">
                Explore practical guides on how hiring scams operate and how to protect your money
                and identity documents.
              </p>
            </div>
            <Link
              to="/safety-guide"
              className="inline-flex items-center gap-2 rounded-lg border border-[#651F35]/25 bg-[#F7F0E5] px-4 py-2.5 text-sm font-semibold text-[#651F35] hover:bg-[#F0DFBD] shrink-0"
            >
              <BookOpen className="h-4 w-4 text-[#C65D45]" />
              <span>Open Full Safety Guide</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article) => {
              const img = AWARENESS_IMAGE_MAP[article.slug] || {
                src: '/src/assets/images/awareness_phishing_email_1795578122206.jpg',
                alt: article.title,
              };
              return (
                <Link
                  key={article.slug}
                  to={`/safety-guide?article=${article.slug}`}
                  className="group rounded-2xl border border-[#651F35]/15 bg-[#F7F0E5] overflow-hidden hover:border-[#C65D45] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[16/10] w-full overflow-hidden bg-[#651F35]">
                      <ResilientImage
                        src={img.src}
                        alt={img.alt}
                        fallbackTitle={article.title}
                        className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <h3 className="font-display text-base sm:text-lg font-bold text-[#651F35] group-hover:text-[#C65D45] transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-[#4F3B42] leading-relaxed">{article.summary}</p>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <span className="text-xs font-semibold text-[#B85C32] inline-flex items-center gap-1">
                      <span>Read Awareness Guide</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Final CTA (Burgundy-to-Plum gradient with Champagne text) */}
      <section className="bg-gradient-to-r from-[#651F35] via-[#842D48] to-[#563653] text-[#F0DFBD] py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#C65D45]/40 border border-[#F0DFBD]/35 text-[#FFFDF8] mx-auto">
            <Briefcase className="h-6 w-6" />
          </div>
          <h2
            className="font-display text-3xl sm:text-4xl font-bold text-[#FFFDF8] tracking-tight drop-shadow-xs"
            style={{ textWrap: 'balance' }}
          >
            Don&apos;t Trust Every Job Offer. Verify It First.
          </h2>
          <p className="text-base text-[#F0DFBD]/95 max-w-2xl mx-auto leading-relaxed">
            Explore the instant Citizen or Administrator Demo workspaces, sign in with Google, or
            register a Citizen / Student account to inspect recruitment material safely.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/signin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#C65D45] px-7 py-4 text-base font-bold text-[#FFFDF8] hover:bg-[#D46B52] border border-[#F0DFBD]/50 shadow-xl shadow-[#29272B]/40 transition-all"
            >
              <span>Get Started / Open Demo</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[#F0DFBD]/50 bg-[#29272B]/35 px-7 py-4 text-base font-semibold text-[#F7F0E5] hover:bg-[#29272B]/60 transition-colors"
            >
              Create Citizen Account
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
