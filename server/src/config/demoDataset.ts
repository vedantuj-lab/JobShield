import type {
  CompanyRecord,
  DomainIndicator,
  ReportModerationStatus,
  RiskCategory,
  ScanFinding,
  ScanType,
  TrustIntelligenceResult,
} from '../../../src/types/jobshield';

export const DEMO_CITIZEN_ID = 'usr_demo_citizen';
export const DEMO_ADMIN_ID = 'usr_demo_admin';
export const DEMO_CITIZEN_EMAIL = 'aarav.demo@jobshield.example';
export const DEMO_ADMIN_EMAIL = 'admin.demo@jobshield.example';

export function daysAgo(days: number, hours = 10, mins = 15): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  d.setUTCHours(hours, mins, 0, 0);
  return d.toISOString();
}

export const DEMO_COLLEGES = [
  'Pune Institute of Engineering & Technology',
  'NIT Nagpur',
  'Anna University Chennai',
  'Manipal Institute of Technology',
  'COEP Technological University',
  'VIT Vellore',
  'IIIT Hyderabad',
  'RV College of Engineering Bengaluru',
  'VJTI Mumbai',
  'Delhi Technological University',
  'PEC Chandigarh',
  'SRM Institute of Science & Technology',
  'BIT Mesra',
  'PSG College of Technology',
  'NSUT New Delhi',
];

const FIRST_NAMES = [
  'Rohan', 'Ananya', 'Kabir', 'Sneha', 'Aditya', 'Priya', 'Vikram', 'Meera', 'Siddharth', 'Neha',
  'Arjun', 'Divya', 'Karthik', 'Ishita', 'Rahul', 'Pooja', 'Nikhil', 'Tanvi', 'Pranav', 'Shruti',
  'Varun', 'Aishwarya', 'Kunal', 'Riya', 'Harsh', 'Kavya', 'Manish', 'Aditi', 'Gaurav', 'Nandini',
  'Yash', 'Swati', 'Abhishek', 'Simran', 'Akash', 'Bhavna', 'Deepak', 'Mansi', 'Saurabh', 'Tanya',
];

const LAST_NAMES = [
  'Verma', 'Iyer', 'Nair', 'Sharma', 'Patel', 'Reddy', 'Joshi', 'Mehta', 'Kulkarni', 'Deshmukh',
  'Gupta', 'Bhat', 'Menon', 'Rao', 'Agarwal', 'Chatterjee', 'Bose', 'Malhotra', 'Chopra', 'Tiwari',
];

export interface DemoStudentBlueprint {
  id: string;
  name: string;
  email: string;
  authProvider: 'LOCAL' | 'GOOGLE';
  emailVerified: boolean;
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  college: string;
  createdAt: string;
}

export function buildSecondaryDemoStudents(): DemoStudentBlueprint[] {
  const students: DemoStudentBlueprint[] = [];
  for (let i = 1; i <= 118; i++) {
    const first = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor((i - 1) / 3) % LAST_NAMES.length];
    const slug = `${first.toLowerCase()}.${last.toLowerCase()}.${String(i).padStart(3, '0')}`;
    const isSuspended = i === 4 || i === 29 || i === 53 || i === 77 || i === 98 || i === 112;
    const isGoogle = i % 3 === 0;
    const daysBack = (i * 3) % 14;
    students.push({
      id: `usr_demo_student_${String(i).padStart(3, '0')}`,
      name: `${first} ${last}`,
      email: `${slug}@student.jobshield.example`,
      authProvider: isGoogle ? 'GOOGLE' : 'LOCAL',
      emailVerified: isGoogle || i % 7 !== 0,
      accountStatus: isSuspended ? 'SUSPENDED' : 'ACTIVE',
      college: DEMO_COLLEGES[i % DEMO_COLLEGES.length],
      createdAt: daysAgo(daysBack, 8 + (i % 10), (i * 7) % 55),
    });
  }
  return students;
}

export const DEMO_COMPANIES: Array<
  Omit<CompanyRecord, 'lastReviewedAt'> & { daysAgoReviewed: number }
> = [
  {
    id: 'cmp_demo_veridian',
    isDemo: true,
    companyName: 'Veridian Systems Pvt Ltd',
    officialDomain: 'veridian-systems.example',
    industry: 'Enterprise Software & Cloud Engineering',
    website: 'https://veridian-systems.example',
    relatedRecruiters: ['Neha Deshpande (campus-hiring@veridian-systems.example)'],
    relatedOpportunities: ['Associate Software Engineer — Pune Campus', 'Cloud QA Intern — Bengaluru'],
    publicInformationReferences: [
      'DEMO DATA — Sample Campus Placement Portal',
      'DEMO DATA — Verified Official Careers Record',
    ],
    verificationStatus: 'VERIFIED',
    notes: 'DEMO DATA: Clean engineering employer benchmark for verifying genuine campus offers.',
    daysAgoReviewed: 1,
  },
  {
    id: 'cmp_demo_apex',
    isDemo: true,
    companyName: 'Apex FinServe Solutions',
    officialDomain: 'apex-finserve.example',
    industry: 'Financial Technology & Risk Analytics',
    website: 'https://apex-finserve.example',
    relatedRecruiters: ['Sandeep Rao (talent@apex-finserve.example)'],
    relatedOpportunities: ['Financial Data Analyst (Campus Track)'],
    publicInformationReferences: [
      'DEMO DATA — Official Corporate Reference',
      'DEMO DATA — Frequently Impersonated Brand',
    ],
    verificationStatus: 'VERIFIED',
    notes: 'DEMO DATA: Genuine employer frequently impersonated by lookalike onboarding portals.',
    daysAgoReviewed: 2,
  },
  {
    id: 'cmp_demo_northstar',
    isDemo: true,
    companyName: 'Northstar Labs India',
    officialDomain: 'northstar-labs.example',
    industry: 'Applied AI & Platform Engineering',
    website: 'https://northstar-labs.example',
    relatedRecruiters: ['Ananya Krishnan (campus-hiring@northstar-labs.example)'],
    relatedOpportunities: ['Graduate Analyst Cohort 2026', 'Backend Summer Internship'],
    publicInformationReferences: [
      'DEMO DATA — University Placement Whitelist',
      'DEMO DATA — SPF/DKIM Aligned Careers Domain',
    ],
    verificationStatus: 'VERIFIED',
    notes: 'DEMO DATA: Verified partner campus recruiter with official ATS portal.',
    daysAgoReviewed: 2,
  },
  {
    id: 'cmp_demo_horizon',
    isDemo: true,
    companyName: 'Horizon Engineering Services',
    officialDomain: 'horizon-engineering.example',
    industry: 'Industrial IoT & Embedded Systems',
    website: 'https://horizon-engineering.example',
    relatedRecruiters: ['Raghav Menon (hr@horizon-engineering.example)'],
    relatedOpportunities: ['Summer Software Engineering Cohort', 'QA Automation Intern'],
    publicInformationReferences: [
      'DEMO DATA — Corporate Registry Sample',
      'DEMO DATA — Official Careers Portal',
    ],
    verificationStatus: 'VERIFIED',
    notes: 'DEMO DATA: Standard engineering internship employer with transparent no-fee policy.',
    daysAgoReviewed: 3,
  },
  {
    id: 'cmp_demo_indusgrid',
    isDemo: true,
    companyName: 'IndusGrid Cloud Corp',
    officialDomain: 'indusgrid-cloud.example',
    industry: 'Distributed Cloud Infrastructure',
    website: 'https://indusgrid-cloud.example',
    relatedRecruiters: ['Pooja Kulkarni (careers@indusgrid-cloud.example)'],
    relatedOpportunities: ['Site Reliability Apprentice'],
    publicInformationReferences: ['DEMO DATA — Official Placement Cell Listing'],
    verificationStatus: 'VERIFIED',
    notes: 'DEMO DATA: Confirmed legitimate mid-size cloud employer.',
    daysAgoReviewed: 4,
  },
  {
    id: 'cmp_demo_cloudpeak',
    isDemo: true,
    companyName: 'CloudPeak Analytics',
    officialDomain: 'cloudpeak-analytics.example',
    industry: 'Data Warehousing & BI',
    website: 'https://cloudpeak-analytics.example',
    relatedRecruiters: ['Priya Nair (unverified WhatsApp/Gmail outreach)'],
    relatedOpportunities: ['Backend Engineering Intern (Unverified Channel)'],
    publicInformationReferences: ['DEMO DATA — Submitted Startup Profile'],
    verificationStatus: 'UNVERIFIED',
    notes: 'DEMO DATA: Legitimate registration unconfirmed; WhatsApp-only leads flagged for caution.',
    daysAgoReviewed: 3,
  },
  {
    id: 'cmp_demo_quantummesh',
    isDemo: true,
    companyName: 'QuantumMesh Robotics',
    officialDomain: 'quantummesh-robotics.example',
    industry: 'Automation & Vision Systems',
    website: 'https://quantummesh-robotics.example',
    relatedRecruiters: ['Talent Team (jobs@quantummesh-robotics.example)'],
    relatedOpportunities: ['Computer Vision Trainee'],
    publicInformationReferences: ['DEMO DATA — Pending Startup Registry Review'],
    verificationStatus: 'UNVERIFIED',
    notes: 'DEMO DATA: New startup profile awaiting corporate domain corroboration.',
    daysAgoReviewed: 5,
  },
  {
    id: 'cmp_demo_zenith',
    isDemo: true,
    companyName: 'Zenith Mobility Tech',
    officialDomain: 'zenith-mobility.example',
    industry: 'EV Fleet Software',
    website: 'https://zenith-mobility.example',
    relatedRecruiters: ['HR Desk (hiring@zenith-mobility.example)'],
    relatedOpportunities: ['Embedded Firmware Intern'],
    publicInformationReferences: ['DEMO DATA — Student Submitted Employer'],
    verificationStatus: 'UNVERIFIED',
    notes: 'DEMO DATA: Pending verification after recent off-campus hackathon drive.',
    daysAgoReviewed: 6,
  },
  {
    id: 'cmp_demo_techsprint',
    isDemo: true,
    companyName: 'TechSprint Global Talent',
    officialDomain: 'techsprint-global.example',
    industry: 'Unverified EdTech / Placement Agency',
    website: 'https://techsprint-global.example',
    relatedRecruiters: ['Riya Kapoor (WhatsApp Desk)', 'internship.coordinator@outlook.com'],
    relatedOpportunities: ['Guaranteed AI Internship (Rs. 1,450 kit fee)'],
    publicInformationReferences: ['DEMO DATA — Repeated Community Escalations'],
    verificationStatus: 'SUSPICIOUS',
    notes: 'DEMO DATA: Multiple reports cite paid certification kits before interviews.',
    daysAgoReviewed: 1,
  },
  {
    id: 'cmp_demo_dailytype',
    isDemo: true,
    companyName: 'DailyType Remote Solutions',
    officialDomain: 'dailytype-remote.example',
    industry: 'Work-from-Home Data Entry Claims',
    website: 'https://dailytype-remote.example',
    relatedRecruiters: ['onboarding.dailytype@gmail.com'],
    relatedOpportunities: ['PDF Typing Specialist (Penalty Clause Trap)'],
    publicInformationReferences: ['DEMO DATA — Corroborated Community Warnings'],
    verificationStatus: 'SUSPICIOUS',
    notes: 'DEMO DATA: Promises high weekly payout with upfront registration deposit and contract penalty threats.',
    daysAgoReviewed: 2,
  },
  {
    id: 'cmp_demo_quickearn',
    isDemo: true,
    companyName: 'QuickEarn Digital Tasks',
    officialDomain: 'quickearn-tasks.example',
    industry: 'Prepaid Task Fraud Pattern',
    website: 'https://quickearn-tasks.example',
    relatedRecruiters: ['@QuickEarn_Desk_Demo (Telegram)'],
    relatedOpportunities: ['VIP Merchant Rating Task Ladder'],
    publicInformationReferences: ['DEMO DATA — Confirmed Task Scam Pattern'],
    verificationStatus: 'FLAGGED',
    notes: 'DEMO DATA: Confirmed Telegram prepaid recharge scam pattern.',
    daysAgoReviewed: 0,
  },
  {
    id: 'cmp_demo_globalhire',
    isDemo: true,
    companyName: 'GlobalHire Urgent Drive',
    officialDomain: 'globalhire-urgent-offer.example',
    industry: 'Fake Overseas / Remote Recruitment Portal',
    website: 'https://globalhire-urgent-offer.example',
    relatedRecruiters: ['talent.desk@globalhire-urgent-offer.example'],
    relatedOpportunities: ['Instant Remote Placement (Upfront KYC Form)'],
    publicInformationReferences: ['DEMO DATA — Corroborated KYC Harvesting Reports'],
    verificationStatus: 'FLAGGED',
    notes: 'DEMO DATA: Flagged for collecting Aadhaar, PAN, and cancelled cheque without interview.',
    daysAgoReviewed: 1,
  },
];

export const DEMO_DOMAINS: Array<
  Omit<DomainIndicator, 'lastCheckedAt'> & { daysAgoChecked: number; daysAgoDetected: number }
> = [
  {
    id: 'dom_demo_1',
    isDemo: true,
    domainName: 'apex-careers-onboarding.example',
    relatedCompanyId: 'cmp_demo_apex',
    indicatorType: 'Lookalike Offer Portal',
    threatStatus: 'CONFIRMED_THREAT',
    severity: 'critical',
    source: 'DEMO DATA · Moderation (rep_demo_1)',
    evidenceSummary: 'Impersonates Apex FinServe Solutions and demands Rs. 2,499 UPI onboarding deposit.',
    relatedReportId: 'rep_demo_1',
    daysAgoDetected: 11,
    daysAgoChecked: 0,
  },
  {
    id: 'dom_demo_2',
    isDemo: true,
    domainName: 'quickearn-tasks.example',
    relatedCompanyId: 'cmp_demo_quickearn',
    indicatorType: 'Telegram Task Fraud',
    threatStatus: 'CONFIRMED_THREAT',
    severity: 'critical',
    source: 'DEMO DATA · Moderation (rep_demo_2)',
    evidenceSummary: 'Prepaid Telegram merchant task portal trapping candidates into escalation deposits.',
    relatedReportId: 'rep_demo_2',
    daysAgoDetected: 10,
    daysAgoChecked: 0,
  },
  {
    id: 'dom_demo_3',
    isDemo: true,
    domainName: 'apex-onboarding.example',
    relatedCompanyId: 'cmp_demo_apex',
    indicatorType: 'Fake Offer Distribution Domain',
    threatStatus: 'CONFIRMED_THREAT',
    severity: 'high',
    source: 'DEMO DATA · Moderation (rep_demo_7)',
    evidenceSummary: 'Distributes forged Apex Cloud offer PDFs with immediate UPI laptop fee clause.',
    relatedReportId: 'rep_demo_7',
    daysAgoDetected: 8,
    daysAgoChecked: 1,
  },
  {
    id: 'dom_demo_4',
    isDemo: true,
    domainName: 'pay-onboarding-portal.example',
    relatedCompanyId: null,
    indicatorType: 'Unencrypted UPI Checkout Trap',
    threatStatus: 'CONFIRMED_THREAT',
    severity: 'critical',
    source: 'DEMO DATA · URL Pipeline & Moderation',
    evidenceSummary: 'HTTP-only payment checkout masquerading as corporate onboarding fee verification.',
    relatedReportId: 'rep_demo_9',
    daysAgoDetected: 7,
    daysAgoChecked: 1,
  },
  {
    id: 'dom_demo_5',
    isDemo: true,
    domainName: 'secure-careers-verify.example',
    relatedCompanyId: null,
    indicatorType: 'Credential & Fee Phishing',
    threatStatus: 'CONFIRMED_THREAT',
    severity: 'high',
    source: 'DEMO DATA · Email Phishing Investigation',
    evidenceSummary: 'Spoofed recruitment verification email links failing SPF/DKIM authentication.',
    relatedReportId: 'rep_demo_10',
    daysAgoDetected: 6,
    daysAgoChecked: 1,
  },
  {
    id: 'dom_demo_6',
    isDemo: true,
    domainName: 'megadrive-2026-pass.example',
    relatedCompanyId: null,
    indicatorType: 'Fake Campus Drive Pass Scam',
    threatStatus: 'CONFIRMED_THREAT',
    severity: 'high',
    source: 'DEMO DATA · Moderation (rep_demo_11)',
    evidenceSummary: 'Collects Rs. 799 mega off-campus placement pass fees via personal UPI handles.',
    relatedReportId: 'rep_demo_11',
    daysAgoDetected: 5,
    daysAgoChecked: 2,
  },
  {
    id: 'dom_demo_7',
    isDemo: true,
    domainName: 'globalhire-urgent-offer.example',
    relatedCompanyId: 'cmp_demo_globalhire',
    indicatorType: 'KYC Harvesting Portal',
    threatStatus: 'SUSPICIOUS',
    severity: 'high',
    source: 'DEMO DATA · Corroborated Community Reports',
    evidenceSummary: 'Requests Aadhaar, PAN, selfie, and cancelled cheque without any prior interview.',
    relatedReportId: 'rep_demo_3',
    daysAgoDetected: 9,
    daysAgoChecked: 1,
  },
  {
    id: 'dom_demo_8',
    isDemo: true,
    domainName: 'dailytype-remote.example',
    relatedCompanyId: 'cmp_demo_dailytype',
    indicatorType: 'Data-Entry Penalty Trap',
    threatStatus: 'SUSPICIOUS',
    severity: 'medium',
    source: 'DEMO DATA · Community Escalation',
    evidenceSummary: 'Promotes Rs. 28,000/week typing jobs with hidden penalty agreements.',
    relatedReportId: 'rep_demo_8',
    daysAgoDetected: 7,
    daysAgoChecked: 2,
  },
  {
    id: 'dom_demo_9',
    isDemo: true,
    domainName: 'cloudpeak-hr-desk.example',
    relatedCompanyId: 'cmp_demo_cloudpeak',
    indicatorType: 'Lookalike Recruiter Domain',
    threatStatus: 'SUSPICIOUS',
    severity: 'medium',
    source: 'DEMO DATA · Domain Consistency Check',
    evidenceSummary: 'Hyphenated lookalike diverging from cloudpeak-analytics.example.',
    relatedReportId: 'rep_demo_5',
    daysAgoDetected: 4,
    daysAgoChecked: 1,
  },
  {
    id: 'dom_demo_10',
    isDemo: true,
    domainName: 'campus-hr-shortlist.example',
    relatedCompanyId: null,
    indicatorType: 'Phishing Interview Portal',
    threatStatus: 'SUSPICIOUS',
    severity: 'medium',
    source: 'DEMO DATA · URL Scanner Telemetry',
    evidenceSummary: 'Login wall asking candidates to sign in with personal Gmail credentials.',
    relatedReportId: null,
    daysAgoDetected: 3,
    daysAgoChecked: 1,
  },
  {
    id: 'dom_demo_11',
    isDemo: true,
    domainName: 'campusdrive-verify.example',
    relatedCompanyId: 'cmp_demo_techsprint',
    indicatorType: 'Paid Certification Drive',
    threatStatus: 'MONITORED',
    severity: 'medium',
    source: 'DEMO DATA · Automated Intake',
    evidenceSummary: 'Under moderator verification for mandatory Rs. 1,450 training kit checkout.',
    relatedReportId: 'rep_demo_4',
    daysAgoDetected: 5,
    daysAgoChecked: 1,
  },
  {
    id: 'dom_demo_12',
    isDemo: true,
    domainName: 'fasttrack-intern-kit.example',
    relatedCompanyId: null,
    indicatorType: 'Unverified Internship Portal',
    threatStatus: 'MONITORED',
    severity: 'low',
    source: 'DEMO DATA · Citizen Submission Queue',
    evidenceSummary: 'Recently reported summer internship landing page pending corroboration.',
    relatedReportId: null,
    daysAgoDetected: 2,
    daysAgoChecked: 0,
  },
  {
    id: 'dom_demo_13',
    isDemo: true,
    domainName: 'remote-ambassador-hub.example',
    relatedCompanyId: null,
    indicatorType: 'Social Ad Redirect Host',
    threatStatus: 'MONITORED',
    severity: 'low',
    source: 'DEMO DATA · URL Heuristic Monitor',
    evidenceSummary: 'Flagged for missing corporate entity disclosure on landing page.',
    relatedReportId: null,
    daysAgoDetected: 2,
    daysAgoChecked: 1,
  },
  {
    id: 'dom_demo_14',
    isDemo: true,
    domainName: 'veridian-systems.example',
    relatedCompanyId: 'cmp_demo_veridian',
    indicatorType: 'Official Corporate Reference',
    threatStatus: 'CLEARED',
    severity: 'low',
    source: 'DEMO DATA · Reference Whitelist',
    evidenceSummary: 'Matches verified demo campus partner domain with valid SPF/DKIM alignment.',
    relatedReportId: 'rep_demo_6',
    daysAgoDetected: 14,
    daysAgoChecked: 0,
  },
  {
    id: 'dom_demo_15',
    isDemo: true,
    domainName: 'northstar-labs.example',
    relatedCompanyId: 'cmp_demo_northstar',
    indicatorType: 'Official Corporate Reference',
    threatStatus: 'CLEARED',
    severity: 'low',
    source: 'DEMO DATA · Reference Whitelist',
    evidenceSummary: 'Confirmed official ATS careers domain for Northstar Labs India.',
    relatedReportId: null,
    daysAgoDetected: 14,
    daysAgoChecked: 0,
  },
  {
    id: 'dom_demo_16',
    isDemo: true,
    domainName: 'horizon-engineering.example',
    relatedCompanyId: 'cmp_demo_horizon',
    indicatorType: 'Official Corporate Reference',
    threatStatus: 'CLEARED',
    severity: 'low',
    source: 'DEMO DATA · Reference Whitelist',
    evidenceSummary: 'Confirmed official domain with zero payment-request history.',
    relatedReportId: null,
    daysAgoDetected: 13,
    daysAgoChecked: 1,
  },
];

export interface DemoCommunitySeed {
  id: string;
  reporterId: string;
  relatedScanId?: string;
  category: string;
  companyName: string;
  url: string;
  recruiterInfo: string;
  description: string;
  evidenceSummary: string;
  moneyRequested: boolean;
  moneyPaid: boolean;
  moderationStatus: ReportModerationStatus;
  moderationNotes: string;
  daysAgoCreated: number;
}

const REPORT_TEMPLATES: Array<{
  category: string;
  companyName: string;
  url: string;
  recruiterInfo: string;
  description: string;
  evidenceSummary: string;
  moneyRequested: boolean;
  moneyPaid: boolean;
}> = [
  {
    category: 'Registration Fee Scams',
    companyName: 'Apex FinServe Solutions (Impersonated)',
    url: 'https://apex-careers-onboarding.example/pay-fee',
    recruiterInfo: 'hr-onboarding@gmail.com',
    description:
      'DEMO DATA: Received an offer letter claiming to be from Apex FinServe asking for Rs. 2,499 refundable laptop security deposit via UPI prior to orientation.',
    evidenceSummary: 'PDF offer letter demanding QR payment and mismatching apex-finserve.example.',
    moneyRequested: true,
    moneyPaid: false,
  },
  {
    category: 'Telegram Task Scams',
    companyName: 'QuickEarn Digital Tasks',
    url: 'https://quickearn-tasks.example/vip-tier',
    recruiterInfo: '@QuickEarn_Desk_Demo',
    description:
      'DEMO DATA: Telegram group promised Rs. 4,500 daily for liking merchant links and locked withdrawals unless Rs. 5,000 prepaid deposit was sent.',
    evidenceSummary: 'Telegram chat screenshot showing prepaid VIP merchant ladder.',
    moneyRequested: true,
    moneyPaid: false,
  },
  {
    category: 'Fake Recruitment Websites',
    companyName: 'GlobalHire Urgent Drive',
    url: 'https://globalhire-urgent-offer.example/apply',
    recruiterInfo: 'talent.desk@globalhire-urgent-offer.example',
    description:
      'DEMO DATA: Website promises instant remote placement without interview and asks candidates to upload Aadhaar, PAN, and cancelled cheque upfront.',
    evidenceSummary: 'Newly observed lookalike portal requesting sensitive KYC upfront.',
    moneyRequested: false,
    moneyPaid: false,
  },
  {
    category: 'Fake Internships',
    companyName: 'TechSprint Global Talent',
    url: 'https://campusdrive-verify.example/register',
    recruiterInfo: 'internship.coordinator@outlook.com',
    description:
      'DEMO DATA: Campus WhatsApp forward claims guaranteed 6-month AI internship with Rs. 35,000 stipend after paying Rs. 1,450 certification kit fee.',
    evidenceSummary: 'WhatsApp forward with payment checkout link.',
    moneyRequested: true,
    moneyPaid: false,
  },
  {
    category: 'Recruiter Impersonation',
    companyName: 'CloudPeak Analytics',
    url: 'https://cloudpeak-hr-desk.example/interview',
    recruiterInfo: 'priya.hr.cloudpeak@gmail.com',
    description:
      'DEMO DATA: Individual impersonating CloudPeak HR contacted freshers via free Gmail asking for immediate Google Form submission with bank IFSC.',
    evidenceSummary: 'Gmail outreach conflicting with official cloudpeak-analytics.example domain.',
    moneyRequested: false,
    moneyPaid: false,
  },
  {
    category: 'Suspicious Emails',
    companyName: 'Veridian Systems Pvt Ltd',
    url: 'https://veridian-systems.example/careers',
    recruiterInfo: 'campus-hiring@veridian-systems.example',
    description:
      'DEMO DATA: Student flagged an unfamiliar email sender asking to schedule a technical round through official campus careers portal.',
    evidenceSummary: 'Verified official campus domain and valid DKIM headers.',
    moneyRequested: false,
    moneyPaid: false,
  },
  {
    category: 'Fake Job Offers',
    companyName: 'Apex Cloud Services (Lookalike)',
    url: 'https://apex-onboarding.example/offer-portal',
    recruiterInfo: 'hr-desk@apex-onboarding.example',
    description:
      'DEMO DATA: Unsolicited full-time offer letter issued without any interview round requesting Rs. 2,500 laptop dispatch deposit via UPI before evening.',
    evidenceSummary: 'Offer PDF with copied corporate emblem and urgent UPI payment clause.',
    moneyRequested: true,
    moneyPaid: false,
  },
  {
    category: 'Work-from-Home Scams',
    companyName: 'DailyType Remote Solutions',
    url: 'https://dailytype-remote.example/enroll',
    recruiterInfo: 'onboarding.dailytype@gmail.com',
    description:
      'DEMO DATA: Work-from-home typing job advertisement promised Rs. 28,000 per week for copying PDF pages and demanded Rs. 1,800 portal registration fee.',
    evidenceSummary: 'WhatsApp brochure promising unrealistic weekly typing payout.',
    moneyRequested: true,
    moneyPaid: false,
  },
  {
    category: 'Fake Recruitment Websites',
    companyName: 'Pay Onboarding Portal (Lookalike)',
    url: 'http://pay-onboarding-portal.example/upi-fee-verify',
    recruiterInfo: 'verify@pay-onboarding-portal.example',
    description:
      'DEMO DATA: Unencrypted HTTP checkout portal posing as IT onboarding pass verification and demanding Rs. 1,999 UPI transfer.',
    evidenceSummary: 'HTTP link collected from SMS phishing blast.',
    moneyRequested: true,
    moneyPaid: false,
  },
  {
    category: 'Suspicious Emails',
    companyName: 'Secure Careers Verify',
    url: 'https://secure-careers-verify.example/pay',
    recruiterInfo: 'hr-desk@secure-careers-verify.example',
    description:
      'DEMO DATA: Phishing email failed SPF and DKIM checks while pressuring freshers to pay Rs. 1,950 training slot fee inside 3 hours.',
    evidenceSummary: 'Raw email header showing spf=fail and Reply-To Gmail mismatch.',
    moneyRequested: true,
    moneyPaid: false,
  },
  {
    category: 'Fake Placement Drives',
    companyName: '2026 Mega Off-Campus Tech Drive',
    url: 'https://megadrive-2026-pass.example/tickets',
    recruiterInfo: 'megadrive.pass@gmail.com',
    description:
      'DEMO DATA: Poster shared across college groups selling Rs. 799 priority drive passes for major employers that never announced an off-campus event.',
    evidenceSummary: 'Poster screenshot + personal UPI QR merchant link.',
    moneyRequested: true,
    moneyPaid: true,
  },
  {
    category: 'Other Recruitment Fraud',
    companyName: 'FastTrack Legal Penalty Data Entry',
    url: 'https://fasttrack-intern-kit.example/agreement',
    recruiterInfo: 'legal.compliance.demo@outlook.com',
    description:
      'DEMO DATA: Threatened final-year student with fabricated court notice demanding Rs. 12,500 accuracy penalty over an unachievable PDF typing contract.',
    evidenceSummary: 'WhatsApp audio notice + unsigned PDF contract threat.',
    moneyRequested: true,
    moneyPaid: false,
  },
];

// Exact 38 reports: 12 UNDER_REVIEW, 18 CONFIRMED, 4 CORROBORATED, 4 REJECTED
// Citizen Demo submits exactly 5 reports: rep_demo_1 (CONFIRMED), rep_demo_4 (UNDER_REVIEW), rep_demo_7 (CONFIRMED), rep_demo_12 (CORROBORATED), rep_demo_19 (REJECTED)
export function buildDemoCommunityReports(): DemoCommunitySeed[] {
  const statusPlan: ReportModerationStatus[] = [
    'CONFIRMED',     // 1 (citizen)
    'CONFIRMED',     // 2
    'CORROBORATED',  // 3
    'UNDER_REVIEW',  // 4 (citizen)
    'UNDER_REVIEW',  // 5
    'REJECTED',      // 6
    'CONFIRMED',     // 7 (citizen)
    'CORROBORATED',  // 8
    'CONFIRMED',     // 9
    'CONFIRMED',     // 10
    'CONFIRMED',     // 11
    'CORROBORATED',  // 12 (citizen)
    'CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'CONFIRMED', // 13..18
    'REJECTED',      // 19 (citizen)
    'CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'CONFIRMED', // 20..25
    'CORROBORATED',  // 26
    'REJECTED',      // 27
    'REJECTED',      // 28
    // 29..38 = 10 more UNDER_REVIEW (total 4+5 + 10 = 12 UNDER_REVIEW)
    'UNDER_REVIEW', 'UNDER_REVIEW', 'UNDER_REVIEW', 'UNDER_REVIEW', 'UNDER_REVIEW',
    'UNDER_REVIEW', 'UNDER_REVIEW', 'UNDER_REVIEW', 'UNDER_REVIEW', 'UNDER_REVIEW',
  ];

  const citizenReportIndices = new Set([1, 4, 7, 12, 19]);

  return statusPlan.map((status, idx) => {
    const num = idx + 1;
    const tmpl = REPORT_TEMPLATES[idx % REPORT_TEMPLATES.length];
    const isCitizen = citizenReportIndices.has(num);
    const reporterId = isCitizen
      ? DEMO_CITIZEN_ID
      : `usr_demo_student_${String(((num * 5) % 118) + 1).padStart(3, '0')}`;
    const variantSuffix = num > REPORT_TEMPLATES.length ? ` [Case #${num}]` : '';
    const moderationNotes =
      status === 'CONFIRMED'
        ? `DEMO DATA: Verified fraud indicators for ${tmpl.companyName}; domain threat record updated.`
        : status === 'CORROBORATED'
        ? 'DEMO DATA: Corroborated by multiple independent citizen submissions; awaiting final domain block.'
        : status === 'REJECTED'
        ? 'DEMO DATA: Verified legitimate campus hiring communication; closed as false alarm.'
        : '';

    return {
      id: `rep_demo_${num}`,
      reporterId,
      relatedScanId:
        num === 1
          ? 'scn_demo_citizen_01'
          : num === 4
          ? 'scn_demo_citizen_21'
          : num === 7
          ? 'scn_demo_citizen_02'
          : undefined,
      category: tmpl.category,
      companyName: `${tmpl.companyName}${variantSuffix}`,
      url: tmpl.url,
      recruiterInfo: tmpl.recruiterInfo,
      description: `${tmpl.description}${variantSuffix}`,
      evidenceSummary: tmpl.evidenceSummary,
      moneyRequested: tmpl.moneyRequested,
      moneyPaid: num === 11 ? true : false,
      moderationStatus: status,
      moderationNotes,
      daysAgoCreated: Math.min(13, Math.floor(idx / 3)),
    };
  });
}

export interface DemoScanBluePrint {
  id: string;
  userId: string;
  scanName: string;
  scanType: ScanType;
  inputReference: string;
  extractedInformation: Record<string, unknown>;
  findings: ScanFinding[];
  positiveObservations: Array<{ title: string; detail: string; limitation: string }>;
  contradictions: string[];
  missingInformation: string[];
  recommendations: string[];
  riskScore: number;
  riskCategory: RiskCategory;
  evidenceConfidence: 'low' | 'medium' | 'high';
  saved: boolean;
  daysAgo: number;
  hours: number;
}

// Exact 24 Citizen Demo Scans: 7 HIGH_RISK, 9 SUSPICIOUS, 8 LOWER_RISK
// Distribution: 5 offer_letter, 5 email, 5 url, 5 job_description, 4 screenshot
// Saved reports: 9 saved across ALL 5 scanner types
export function buildCitizenDemoScans(): DemoScanBluePrint[] {
  const specs: Array<{
    id: string;
    scanName: string;
    scanType: ScanType;
    inputReference: string;
    companyName: string;
    recruiterName?: string;
    recruiterEmail?: string;
    jobTitle?: string;
    salary?: string;
    website?: string;
    applicationUrl?: string;
    payment?: string[];
    riskCategory: 'HIGH_RISK' | 'SUSPICIOUS' | 'LOWER_RISK';
    riskScore: number;
    saved: boolean;
    daysAgo: number;
    hours: number;
    summary: string;
    findingTitle?: string;
    findingDesc?: string;
    findingEvidence?: string;
    findingSource?: string;
    contradiction?: string;
  }> = [
    // --- OFFER LETTER (5: 2 High, 1 Suspicious, 2 Lower) ---
    {
      id: 'scn_demo_citizen_01',
      scanName: 'Apex FinServe Analyst Offer Letter (Demo)',
      scanType: 'offer_letter',
      inputReference: 'Uploaded file: Apex_Offer_Letter_Demo.pdf',
      companyName: 'Apex FinServe Solutions',
      recruiterName: 'Vikram Mehta (Claimed HR)',
      recruiterEmail: 'hr-onboarding@gmail.com',
      jobTitle: 'Junior Financial Data Analyst',
      salary: 'Rs. 9,50,000 / year',
      website: 'https://apex-careers-onboarding.example',
      applicationUrl: 'https://apex-careers-onboarding.example/pay-fee',
      payment: ['Transfer Rs. 2,499 refundable laptop deposit via UPI before orientation'],
      riskCategory: 'HIGH_RISK',
      riskScore: 86,
      saved: true,
      daysAgo: 1,
      hours: 14,
      summary: 'DEMO DATA: Unsolicited appointment letter demanding Rs. 2,499 UPI onboarding deposit with free Gmail HR contact.',
      findingTitle: 'Advance Registration & Laptop Deposit Demand',
      findingDesc: 'Offer demands Rs. 2,499 refundable deposit via UPI prior to orientation while impersonating Apex FinServe.',
      findingEvidence: 'Clause 4: Deposit Rs. 2,499 via UPI before 6:00 PM to confirm asset dispatch.',
      findingSource: 'Payment Red-Flag Rule Engine',
      contradiction: 'Claims Apex FinServe Solutions (apex-finserve.example) while routing payments through apex-careers-onboarding.example.',
    },
    {
      id: 'scn_demo_citizen_02',
      scanName: 'Apex Cloud Immediate Onboarding Offer (Demo)',
      scanType: 'offer_letter',
      inputReference: 'Uploaded file: Apex_Cloud_Direct_Offer.pdf',
      companyName: 'Apex Cloud Services (Lookalike)',
      recruiterName: 'Rakesh Malhotra',
      recruiterEmail: 'hr-desk@apex-onboarding.example',
      jobTitle: 'Cloud Support Trainee',
      salary: 'Rs. 85,000 / month',
      website: 'https://apex-onboarding.example',
      applicationUrl: 'https://apex-onboarding.example/offer-portal',
      payment: ['Rs. 2,500 biometric pass & verification fee'],
      riskCategory: 'HIGH_RISK',
      riskScore: 82,
      saved: true,
      daysAgo: 3,
      hours: 11,
      summary: 'DEMO DATA: Zero-interview offer letter issued from lookalike onboarding domain demanding upfront pass fee.',
      findingTitle: 'Confirmed Lookalike Offer Domain + Upfront Pass Fee',
      findingDesc: 'Domain apex-onboarding.example matches confirmed community fraud reports.',
      findingEvidence: 'URL apex-onboarding.example/offer-portal flagged in Threat Intelligence.',
      findingSource: 'Threat Feed Correlation',
      contradiction: 'Issued full-time offer without technical interview or ATS tracking ID.',
    },
    {
      id: 'scn_demo_citizen_03',
      scanName: 'CloudPeak Analytics Stipend Letter (Demo)',
      scanType: 'offer_letter',
      inputReference: 'Uploaded file: CloudPeak_Stipend_Offer.pdf',
      companyName: 'CloudPeak Analytics',
      recruiterName: 'Priya Nair',
      recruiterEmail: 'priya.hr.cloudpeak@gmail.com',
      jobTitle: 'Data Analytics Intern',
      salary: 'Rs. 22,000 / month',
      website: 'https://cloudpeak-hr-desk.example',
      riskCategory: 'SUSPICIOUS',
      riskScore: 48,
      saved: false,
      daysAgo: 4,
      hours: 16,
      summary: 'DEMO DATA: Stipend structure looks realistic, but letter routes replies to @gmail.com and an unverified subdomain.',
      findingTitle: 'Consumer Webmail + Unverified Domain Mismatch',
      findingDesc: 'Recruiter communicates via @gmail.com while company domain cloudpeak-analytics.example is unverified.',
      findingEvidence: 'Sender: priya.hr.cloudpeak@gmail.com vs cloudpeak-hr-desk.example.',
      findingSource: 'Company Domain Consistency Engine',
      contradiction: 'Official company record lists cloudpeak-analytics.example, not cloudpeak-hr-desk.example.',
    },
    {
      id: 'scn_demo_citizen_04',
      scanName: 'Veridian Systems Graduate Offer (Demo)',
      scanType: 'offer_letter',
      inputReference: 'Uploaded file: Veridian_Graduate_Offer_Demo.pdf',
      companyName: 'Veridian Systems Pvt Ltd',
      recruiterName: 'Neha Deshpande',
      recruiterEmail: 'campus-hiring@veridian-systems.example',
      jobTitle: 'Associate Software Engineer',
      salary: 'Rs. 6,50,000 CTC',
      website: 'https://veridian-systems.example',
      applicationUrl: 'https://veridian-systems.example/careers',
      riskCategory: 'LOWER_RISK',
      riskScore: 12,
      saved: true,
      daysAgo: 6,
      hours: 10,
      summary: 'DEMO DATA: Campus graduate offer aligned with official veridian-systems.example domain with zero fees.',
    },
    {
      id: 'scn_demo_citizen_05',
      scanName: 'Horizon Engineering Summer Internship Offer (Demo)',
      scanType: 'offer_letter',
      inputReference: 'Uploaded file: Horizon_Internship_Cohort.pdf',
      companyName: 'Horizon Engineering Services',
      recruiterName: 'Raghav Menon',
      recruiterEmail: 'hr@horizon-engineering.example',
      jobTitle: 'Summer Software Engineering Intern',
      salary: 'Rs. 22,000 / month',
      website: 'https://horizon-engineering.example',
      applicationUrl: 'https://horizon-engineering.example/careers',
      riskCategory: 'LOWER_RISK',
      riskScore: 15,
      saved: false,
      daysAgo: 9,
      hours: 15,
      summary: 'DEMO DATA: Official internship appointment letter matching Horizon Engineering records without payment clauses.',
    },

    // --- EMAIL (5: 2 High, 2 Suspicious, 1 Lower) ---
    {
      id: 'scn_demo_citizen_06',
      scanName: 'Email: Urgent Onboarding Slot Fee (Demo)',
      scanType: 'email',
      inputReference: 'hr-desk@secure-careers-verify.example',
      companyName: 'Secure Careers Verify',
      recruiterEmail: 'hr-desk@secure-careers-verify.example',
      website: 'https://secure-careers-verify.example/pay',
      payment: ['Pay Rs. 1,950 refundable training slot fee inside 3 hours'],
      riskCategory: 'HIGH_RISK',
      riskScore: 81,
      saved: true,
      daysAgo: 2,
      hours: 9,
      summary: 'DEMO DATA: Phishing email failing SPF/DKIM authentication while pressuring candidate to pay Rs. 1,950.',
      findingTitle: 'SPF/DKIM Failure + High-Urgency Fee Demand',
      findingDesc: 'Email failed SPF and DMARC validation, sets Reply-To to Gmail, and enforces a 3-hour payment deadline.',
      findingEvidence: 'Authentication-Results: spf=fail dmarc=fail; Reply-To: quickhire.payments@gmail.com',
      findingSource: 'Email Header & Phishing Inspector',
      contradiction: 'Reply-To Gmail address contradicts claimed corporate verification sender.',
    },
    {
      id: 'scn_demo_citizen_07',
      scanName: 'Email: CloudPeak Immediate Shortlist Payment (Demo)',
      scanType: 'email',
      inputReference: 'hr.cloudpeak.hiring@gmail.com',
      companyName: 'CloudPeak Analytics',
      recruiterEmail: 'hr.cloudpeak.hiring@gmail.com',
      website: 'https://campusdrive-verify.example',
      payment: ['Pay Rs. 1,450 verification slot booking charge today'],
      riskCategory: 'HIGH_RISK',
      riskScore: 78,
      saved: false,
      daysAgo: 4,
      hours: 12,
      summary: 'DEMO DATA: Consumer Gmail shortlist notification demanding immediate Rs. 1,450 booking fee.',
      findingTitle: 'Consumer Webmail + Mandatory Slot Fee',
      findingDesc: 'Sender uses free webmail while directing candidates to pay Rs. 1,450 via external link.',
      findingEvidence: 'From: hr.cloudpeak.hiring@gmail.com · "Pay Rs. 1,450 to lock slot"',
      findingSource: 'Email Content & Domain Analyzer',
    },
    {
      id: 'scn_demo_citizen_08',
      scanName: 'Email: TechSprint Certification Drive Invite (Demo)',
      scanType: 'email',
      inputReference: 'internship.coordinator@outlook.com',
      companyName: 'TechSprint Global Talent',
      recruiterEmail: 'internship.coordinator@outlook.com',
      website: 'https://techsprint-global.example/apply',
      riskCategory: 'SUSPICIOUS',
      riskScore: 52,
      saved: true,
      daysAgo: 5,
      hours: 17,
      summary: 'DEMO DATA: Unverified Outlook outreach promoting guaranteed internship cohort linked to suspicious agency.',
      findingTitle: 'Guaranteed Internship Claim from Free Outlook Account',
      findingDesc: 'Promises guaranteed stipend internship via personal webmail linked to suspicious company record.',
      findingEvidence: 'internship.coordinator@outlook.com -> cmp_demo_techsprint (SUSPICIOUS)',
      findingSource: 'Recruiter Domain Validator',
    },
    {
      id: 'scn_demo_citizen_09',
      scanName: 'Email: Campus Interview Google Form KYC (Demo)',
      scanType: 'email',
      inputReference: 'recruiting.campus.desk@gmail.com',
      companyName: 'Zenith Mobility Tech',
      recruiterEmail: 'recruiting.campus.desk@gmail.com',
      website: 'https://zenith-mobility.example',
      riskCategory: 'SUSPICIOUS',
      riskScore: 44,
      saved: false,
      daysAgo: 7,
      hours: 13,
      summary: 'DEMO DATA: Requests Aadhaar scan in a pre-interview screening form sent from a Gmail address.',
      findingTitle: 'Premature KYC Document Collection Request',
      findingDesc: 'Email requests Aadhaar number and PAN upload before any formal technical screening.',
      findingEvidence: 'Body text requests Aadhaar PDF in Google Form prior to interview.',
      findingSource: 'Privacy & PII Boundary Rule',
    },
    {
      id: 'scn_demo_citizen_10',
      scanName: 'Email: Northstar Labs Technical Round Schedule (Demo)',
      scanType: 'email',
      inputReference: 'campus-hiring@northstar-labs.example',
      companyName: 'Northstar Labs India',
      recruiterName: 'Ananya Krishnan',
      recruiterEmail: 'campus-hiring@northstar-labs.example',
      website: 'https://careers.northstar-labs.example/students',
      riskCategory: 'LOWER_RISK',
      riskScore: 14,
      saved: false,
      daysAgo: 8,
      hours: 11,
      summary: 'DEMO DATA: SPF/DKIM-aligned interview schedule email matching official Northstar Labs India domain.',
    },

    // --- URL (5: 1 High, 2 Suspicious, 2 Lower) ---
    {
      id: 'scn_demo_citizen_11',
      scanName: 'URL: http://pay-onboarding-portal.example/upi-fee-verify',
      scanType: 'url',
      inputReference: 'http://pay-onboarding-portal.example/upi-fee-verify',
      companyName: 'Apex FinServe Solutions (Claimed)',
      website: 'http://pay-onboarding-portal.example/upi-fee-verify',
      applicationUrl: 'http://pay-onboarding-portal.example/upi-fee-verify',
      payment: ['UPI checkout page requesting onboarding deposit'],
      riskCategory: 'HIGH_RISK',
      riskScore: 84,
      saved: true,
      daysAgo: 2,
      hours: 15,
      summary: 'DEMO DATA: Unencrypted HTTP UPI payment link matching confirmed threat indicator dom_demo_4.',
      findingTitle: 'Confirmed Threat Domain + Missing HTTPS Encryption',
      findingDesc: 'Portal runs over plain HTTP and matches confirmed UPI fee fraud indicator.',
      findingEvidence: 'Indicator dom_demo_4 (CONFIRMED_THREAT) + HTTP scheme.',
      findingSource: 'URL & Threat Feed Inspector',
    },
    {
      id: 'scn_demo_citizen_12',
      scanName: 'URL: https://globalhire-urgent-offer.example/apply',
      scanType: 'url',
      inputReference: 'https://globalhire-urgent-offer.example/apply',
      companyName: 'GlobalHire Urgent Drive',
      website: 'https://globalhire-urgent-offer.example/apply',
      applicationUrl: 'https://globalhire-urgent-offer.example/apply',
      riskCategory: 'SUSPICIOUS',
      riskScore: 58,
      saved: true,
      daysAgo: 3,
      hours: 18,
      summary: 'DEMO DATA: Hyphenated lookalike recruitment link flagged SUSPICIOUS for upfront KYC collection.',
      findingTitle: 'Suspicious KYC Harvesting Domain',
      findingDesc: 'Domain flagged SUSPICIOUS in Community Threat Intelligence for requesting Aadhaar and bank cheque.',
      findingEvidence: 'Indicator dom_demo_7 + hyphenated urgency pattern.',
      findingSource: 'JOBSHIELD Threat Intelligence',
    },
    {
      id: 'scn_demo_citizen_13',
      scanName: 'URL: https://campus-hr-shortlist.example/login',
      scanType: 'url',
      inputReference: 'https://campus-hr-shortlist.example/login',
      companyName: 'Unidentified Employer',
      website: 'https://campus-hr-shortlist.example/login',
      applicationUrl: 'https://campus-hr-shortlist.example/login',
      riskCategory: 'SUSPICIOUS',
      riskScore: 51,
      saved: false,
      daysAgo: 5,
      hours: 12,
      summary: 'DEMO DATA: Generic shortlist login page missing official company affiliation details.',
      findingTitle: 'Credential Login Prompt Without Employer Identity',
      findingDesc: 'Domain asks candidates to sign in using personal email credentials to view a claimed offer.',
      findingEvidence: 'Indicator dom_demo_10 (SUSPICIOUS).',
      findingSource: 'URL Phishing Heuristics',
    },
    {
      id: 'scn_demo_citizen_14',
      scanName: 'URL: https://careers.northstar-labs.example/students',
      scanType: 'url',
      inputReference: 'https://careers.northstar-labs.example/students',
      companyName: 'Northstar Labs India',
      website: 'https://careers.northstar-labs.example/students',
      applicationUrl: 'https://careers.northstar-labs.example/students',
      riskCategory: 'LOWER_RISK',
      riskScore: 10,
      saved: false,
      daysAgo: 9,
      hours: 10,
      summary: 'DEMO DATA: Official HTTPS student recruitment portal matching verified Northstar Labs domain.',
    },
    {
      id: 'scn_demo_citizen_15',
      scanName: 'URL: https://veridian-systems.example/campus-2026',
      scanType: 'url',
      inputReference: 'https://veridian-systems.example/campus-2026',
      companyName: 'Veridian Systems Pvt Ltd',
      website: 'https://veridian-systems.example/campus-2026',
      applicationUrl: 'https://veridian-systems.example/campus-2026',
      riskCategory: 'LOWER_RISK',
      riskScore: 11,
      saved: false,
      daysAgo: 11,
      hours: 14,
      summary: 'DEMO DATA: Official campus placement URL aligned with Veridian Systems reference whitelist.',
    },

    // --- JOB DESCRIPTION (5: 1 High, 2 Suspicious, 2 Lower) ---
    {
      id: 'scn_demo_citizen_16',
      scanName: 'JD: Part-Time App Rating (Rs. 4,500/day) (Demo)',
      scanType: 'job_description',
      inputReference: 'Pasted Job Description',
      companyName: 'QuickEarn Digital Tasks',
      jobTitle: 'Part-Time Remote Task Associate',
      salary: 'Rs. 4,500 - Rs. 8,000 per day',
      applicationUrl: 'https://quickearn-tasks.example/vip-tier',
      payment: ['Upgrade merchant tier with Rs. 5,000 prepaid recharge'],
      riskCategory: 'HIGH_RISK',
      riskScore: 89,
      saved: true,
      daysAgo: 2,
      hours: 19,
      summary: 'DEMO DATA: Classic prepaid task fraud job post promising disproportionate daily earnings without qualifications.',
      findingTitle: 'Prepaid Task Escalation + Unrealistic Daily Payout',
      findingDesc: 'Requires prepaid merchant deposit to unlock withdrawals for simple app-rating tasks.',
      findingEvidence: '"Activate VIP merchant tier with Rs. 5,000 refundable deposit"',
      findingSource: 'Scam Pattern & Salary Analyzer',
    },
    {
      id: 'scn_demo_citizen_17',
      scanName: 'JD: Backend Engineering Intern — CloudPeak (Demo)',
      scanType: 'job_description',
      inputReference: 'Pasted Job Description',
      companyName: 'CloudPeak Analytics',
      jobTitle: 'Backend Engineering Intern',
      salary: 'Rs. 18,000 - 25,000 / month',
      riskCategory: 'SUSPICIOUS',
      riskScore: 39,
      saved: false,
      daysAgo: 5,
      hours: 9,
      summary: 'DEMO DATA: Technical stack looks credible, but posting tells candidates to DM a WhatsApp number instead of official ATS.',
      findingTitle: 'Official Corporate Application Channel Omitted',
      findingDesc: 'Asks applicants to message a personal WhatsApp number instead of applying on cloudpeak-analytics.example.',
      findingEvidence: 'Application instruction: "WhatsApp CV to HR desk"',
      findingSource: 'Application Channel Validator',
    },
    {
      id: 'scn_demo_citizen_18',
      scanName: 'JD: Remote PDF Typing & Formatting Specialist (Demo)',
      scanType: 'job_description',
      inputReference: 'Pasted Job Description',
      companyName: 'DailyType Remote Solutions',
      jobTitle: 'Remote PDF Data Entry Operator',
      salary: 'Rs. 28,000 / week',
      applicationUrl: 'https://dailytype-remote.example/enroll',
      payment: ['Rs. 1,800 portal setup fee + 95% accuracy penalty clause'],
      riskCategory: 'SUSPICIOUS',
      riskScore: 63,
      saved: true,
      daysAgo: 6,
      hours: 16,
      summary: 'DEMO DATA: High weekly typing pay paired with upfront registration fee and contract penalty warnings.',
      findingTitle: 'Data-Entry Registration Fee & Penalty Clause Pattern',
      findingDesc: 'Charges Rs. 1,800 setup fee and enforces steep financial accuracy penalties.',
      findingEvidence: '"Mandatory Rs. 1,800 portal registration & accuracy compliance bond"',
      findingSource: 'Job Scam Pattern Engine',
    },
    {
      id: 'scn_demo_citizen_19',
      scanName: 'JD: Junior QA Automation Intern — Horizon (Demo)',
      scanType: 'job_description',
      inputReference: 'Pasted Job Description',
      companyName: 'Horizon Engineering Services',
      jobTitle: 'Junior QA Automation Intern',
      salary: 'Rs. 20,000 / month',
      website: 'https://horizon-engineering.example',
      applicationUrl: 'https://horizon-engineering.example/careers',
      riskCategory: 'LOWER_RISK',
      riskScore: 16,
      saved: false,
      daysAgo: 10,
      hours: 11,
      summary: 'DEMO DATA: Realistic QA internship description specifying technical test + two interviews on official portal.',
    },
    {
      id: 'scn_demo_citizen_20',
      scanName: 'JD: Site Reliability Apprentice — IndusGrid (Demo)',
      scanType: 'job_description',
      inputReference: 'Pasted Job Description',
      companyName: 'IndusGrid Cloud Corp',
      jobTitle: 'Site Reliability Apprentice',
      salary: 'Rs. 30,000 / month',
      website: 'https://indusgrid-cloud.example',
      applicationUrl: 'https://indusgrid-cloud.example/careers',
      riskCategory: 'LOWER_RISK',
      riskScore: 13,
      saved: false,
      daysAgo: 12,
      hours: 13,
      summary: 'DEMO DATA: Clear Linux/Kubernetes learning track with transparent campus interview workflow.',
    },

    // --- SCREENSHOT & MESSAGE (4: 1 High, 2 Suspicious, 1 Lower) ---
    {
      id: 'scn_demo_citizen_21',
      scanName: 'Telegram Chat: VIP Task Activation Deposit (Demo)',
      scanType: 'screenshot',
      inputReference: 'Screenshot (Telegram Message): telegram_vip_task_demo.png',
      companyName: 'QuickEarn Digital Tasks',
      recruiterName: '@QuickEarn_Desk_Demo',
      payment: ['Transfer Rs. 1,500 activation deposit to unlock Rs. 6,000 VIP batch'],
      riskCategory: 'HIGH_RISK',
      riskScore: 87,
      saved: false,
      daysAgo: 1,
      hours: 19,
      summary: 'DEMO DATA: OCR text from Telegram chat demands Rs. 1,500 prepaid deposit to unlock social-media task earnings.',
      findingTitle: 'Telegram Prepaid Task Withdrawal Trap',
      findingDesc: 'Chat insists candidate deposit Rs. 1,500 before receiving promised task payout.',
      findingEvidence: 'OCR: "Transfer Rs. 1,500 activation deposit to unlock Rs. 6,000 VIP batch"',
      findingSource: 'OCR & Chat Fraud Detector',
    },
    {
      id: 'scn_demo_citizen_22',
      scanName: 'WhatsApp Message: Paid Certification Kit Fee (Demo)',
      scanType: 'screenshot',
      inputReference: 'Screenshot (WhatsApp Message): chat_hr_slot_demo.png',
      companyName: 'TechSprint Global Talent',
      recruiterName: 'Riya Kapoor (WhatsApp)',
      payment: ['Rs. 1,450 certification kit fee via Google Pay'],
      riskCategory: 'SUSPICIOUS',
      riskScore: 54,
      saved: true,
      daysAgo: 3,
      hours: 17,
      summary: 'DEMO DATA: WhatsApp chat promises guaranteed placement after paying Rs. 1,450 training kit fee.',
      findingTitle: 'Paid Training Kit Linked to Placement Guarantee',
      findingDesc: 'Guarantees internship offer upon paying Rs. 1,450 upfront via UPI.',
      findingEvidence: 'OCR: "Pay Rs. 1,450 kit fee now to confirm guaranteed placement"',
      findingSource: 'OCR & Scam Content Analyzer',
    },
    {
      id: 'scn_demo_citizen_23',
      scanName: 'Social Ad Screenshot: Mega Off-Campus Pass (Demo)',
      scanType: 'screenshot',
      inputReference: 'Screenshot (Social Media Advertisement): mega_drive_poster.png',
      companyName: '2026 Mega Off-Campus Tech Drive',
      applicationUrl: 'https://megadrive-2026-pass.example/tickets',
      payment: ['Rs. 799 priority interview pass via UPI QR'],
      riskCategory: 'SUSPICIOUS',
      riskScore: 61,
      saved: false,
      daysAgo: 7,
      hours: 16,
      summary: 'DEMO DATA: Unofficial off-campus placement drive poster charging Rs. 799 priority pass fee.',
      findingTitle: 'Paid Mega Placement Drive Pass Fee',
      findingDesc: 'Poster uses brand names without authorization and sells interview passes via personal UPI.',
      findingEvidence: 'OCR: "Book 2026 Mega Tech Drive VIP Pass — Rs. 799"',
      findingSource: 'OCR & Drive Verification Check',
    },
    {
      id: 'scn_demo_citizen_24',
      scanName: 'Campus Placement Cell Pre-Placement Talk Notice (Demo)',
      scanType: 'screenshot',
      inputReference: 'Screenshot (Email Screenshot): placement_ppt_notice.png',
      companyName: 'Northstar Labs India',
      recruiterEmail: 'campus-hiring@northstar-labs.example',
      website: 'https://careers.northstar-labs.example/students',
      riskCategory: 'LOWER_RISK',
      riskScore: 17,
      saved: false,
      daysAgo: 10,
      hours: 15,
      summary: 'DEMO DATA: Verified university placement office screenshot scheduling an official on-campus talk.',
    },
  ];

  return specs.map((s) => {
    const findings: ScanFinding[] = s.findingTitle
      ? [
          {
            title: s.findingTitle,
            severity: s.riskCategory === 'HIGH_RISK' ? 'high' : 'medium',
            description: s.findingDesc || '',
            evidence: s.findingEvidence || '',
            source: s.findingSource || 'JOBSHIELD Security Analyzer',
            confidence: s.riskCategory === 'HIGH_RISK' ? 'high' : 'medium',
            recommendation:
              s.riskCategory === 'HIGH_RISK'
                ? 'Stop communication immediately and never transfer registration, deposit, or kit fees.'
                : 'Cross-verify independently on the official employer domain or your university placement cell.',
            scoreImpact: s.riskScore,
          },
        ]
      : [];

    const positiveObservations =
      s.riskCategory === 'LOWER_RISK'
        ? [
            {
              title: 'Official Domain & Zero-Fee Alignment',
              detail: `Referenced domain aligns with verified employer records for ${s.companyName} and contains no fee demands.`,
              limitation:
                'Lower Risk reflects absence of detected fraud flags, not an absolute guarantee of authenticity.',
            },
          ]
        : s.riskCategory === 'SUSPICIOUS' && s.id === 'scn_demo_citizen_17'
        ? [
            {
              title: 'Realistic Technical Stack & Stipend',
              detail: 'Job description lists standard engineering skills and realistic internship stipend.',
              limitation: 'Scammers frequently copy legitimate job descriptions while substituting WhatsApp contact channels.',
            },
          ]
        : [];

    return {
      id: s.id,
      userId: DEMO_CITIZEN_ID,
      scanName: s.scanName,
      scanType: s.scanType,
      inputReference: s.inputReference,
      extractedInformation: {
        companyName: s.companyName,
        candidateName: 'Aarav Kulkarni',
        recruiterName: s.recruiterName,
        recruiterEmail: s.recruiterEmail,
        jobTitle: s.jobTitle,
        salary: s.salary,
        website: s.website,
        applicationUrl: s.applicationUrl,
        paymentInstructions: s.payment || [],
        rawSummary: s.summary,
      },
      findings,
      positiveObservations,
      contradictions: s.contradiction ? [s.contradiction] : [],
      missingInformation:
        s.riskCategory === 'LOWER_RISK'
          ? ['Direct real-time HRIS/ATS confirmation remains external to this demo sandbox.']
          : ['No verified corporate ATS requisition ID or signed SPF/DKIM proof supplied.'],
      recommendations:
        s.riskCategory === 'HIGH_RISK'
          ? [
              'Do not transfer money or upload Aadhaar, PAN, or bank account copies.',
              'Submit or review this entity inside Community Threat Intelligence.',
            ]
          : s.riskCategory === 'SUSPICIOUS'
          ? [
              'Verify directly through the official company careers page before responding.',
              'Avoid sharing sensitive identity documents prior to verified interviews.',
            ]
          : ['Confirm schedule or offer acceptance through your college placement portal.'],
      riskScore: s.riskScore,
      riskCategory: s.riskCategory,
      evidenceConfidence: s.riskCategory === 'HIGH_RISK' ? 'high' : 'medium',
      saved: s.saved,
      daysAgo: s.daysAgo,
      hours: s.hours,
    };
  });
}

// Builds 436 secondary demo scans across the 118 demo students:
// 89 HIGH_RISK + 133 SUSPICIOUS + 214 LOWER_RISK = 436
// Combined with Citizen Demo (7 High, 9 Suspicious, 8 Lower = 24) => Grand Total = 460 (96 High, 142 Suspicious, 222 Lower)
export function buildSecondaryDemoScans(students: DemoStudentBlueprint[]): DemoScanBluePrint[] {
  const categories: Array<'HIGH_RISK' | 'SUSPICIOUS' | 'LOWER_RISK'> = [
    ...Array(89).fill('HIGH_RISK' as const),
    ...Array(133).fill('SUSPICIOUS' as const),
    ...Array(214).fill('LOWER_RISK' as const),
  ];

  const scanTypes: ScanType[] = [
    'offer_letter',
    'email',
    'url',
    'job_description',
    'screenshot',
  ];

  const highTemplates = [
    {
      company: 'Apex FinServe Solutions (Impersonated)',
      domain: 'apex-careers-onboarding.example',
      namePrefix: 'Impersonated Analyst Offer',
      finding: 'Advance UPI Deposit Requested',
      score: 84,
    },
    {
      company: 'QuickEarn Digital Tasks',
      domain: 'quickearn-tasks.example',
      namePrefix: 'Telegram VIP Task Ladder',
      finding: 'Prepaid Task Recharge Scheme',
      score: 88,
    },
    {
      company: 'Pay Onboarding Portal',
      domain: 'pay-onboarding-portal.example',
      namePrefix: 'HTTP UPI Onboarding Link',
      finding: 'Unencrypted Payment Verification Portal',
      score: 81,
    },
  ];

  const suspTemplates = [
    {
      company: 'GlobalHire Urgent Drive',
      domain: 'globalhire-urgent-offer.example',
      namePrefix: 'Instant KYC Application Portal',
      finding: 'Premature Aadhaar/PAN Upload Form',
      score: 54,
    },
    {
      company: 'TechSprint Global Talent',
      domain: 'campusdrive-verify.example',
      namePrefix: 'Paid Certification Kit Outreach',
      finding: 'Unverified Training Fee Mentioned',
      score: 49,
    },
    {
      company: 'CloudPeak Analytics',
      domain: 'cloudpeak-hr-desk.example',
      namePrefix: 'Gmail Recruiter Screening Invite',
      finding: 'Consumer Webmail Domain Mismatch',
      score: 45,
    },
  ];

  const lowTemplates = [
    {
      company: 'Veridian Systems Pvt Ltd',
      domain: 'veridian-systems.example',
      namePrefix: 'Veridian Campus Engineering Role',
      score: 14,
    },
    {
      company: 'Northstar Labs India',
      domain: 'northstar-labs.example',
      namePrefix: 'Northstar Graduate Analyst Check',
      score: 12,
    },
    {
      company: 'Horizon Engineering Services',
      domain: 'horizon-engineering.example',
      namePrefix: 'Horizon QA Internship Verification',
      score: 16,
    },
  ];

  return categories.map((riskCategory, idx) => {
    const student = students[idx % students.length];
    const scanType = scanTypes[idx % scanTypes.length];
    const daysAgoVal = idx % 14;
    const hours = 8 + (idx % 12);

    if (riskCategory === 'HIGH_RISK') {
      const tmpl = highTemplates[idx % highTemplates.length];
      return {
        id: `scn_demo_pool_${String(idx + 1).padStart(3, '0')}`,
        userId: student.id,
        scanName: `${tmpl.namePrefix} #${idx + 1} (Demo)`,
        scanType,
        inputReference: `https://${tmpl.domain}/intake-${idx + 1}`,
        extractedInformation: {
          companyName: tmpl.company,
          website: `https://${tmpl.domain}`,
          applicationUrl: `https://${tmpl.domain}/pay`,
          paymentInstructions: ['Prepaid registration or onboarding deposit required'],
          rawSummary: `DEMO DATA: Simulated ${scanType.replace('_', ' ')} high-risk scan by ${student.name}.`,
        },
        findings: [
          {
            title: tmpl.finding,
            severity: 'high',
            description: `Detected high-risk indicator associated with ${tmpl.domain}.`,
            evidence: `Reference ${tmpl.domain}`,
            source: 'JOBSHIELD Automated Scanner',
            confidence: 'high',
            recommendation: 'Do not pay advance fees or share sensitive identity records.',
            scoreImpact: tmpl.score,
          },
        ],
        positiveObservations: [],
        contradictions: [`Routes candidate to ${tmpl.domain} instead of an official corporate portal.`],
        missingInformation: ['No verified corporate ATS confirmation available.'],
        recommendations: ['Decline payment requests and submit to Community Threat Intelligence.'],
        riskScore: tmpl.score + (idx % 7),
        riskCategory: 'HIGH_RISK',
        evidenceConfidence: 'high',
        saved: idx % 5 === 0,
        daysAgo: daysAgoVal,
        hours,
      };
    }

    if (riskCategory === 'SUSPICIOUS') {
      const tmpl = suspTemplates[idx % suspTemplates.length];
      return {
        id: `scn_demo_pool_${String(idx + 1).padStart(3, '0')}`,
        userId: student.id,
        scanName: `${tmpl.namePrefix} #${idx + 1} (Demo)`,
        scanType,
        inputReference: `https://${tmpl.domain}/review-${idx + 1}`,
        extractedInformation: {
          companyName: tmpl.company,
          website: `https://${tmpl.domain}`,
          rawSummary: `DEMO DATA: Simulated ${scanType.replace('_', ' ')} suspicious scan by ${student.name}.`,
        },
        findings: [
          {
            title: tmpl.finding,
            severity: 'medium',
            description: `Observed unverified recruitment pattern linked to ${tmpl.domain}.`,
            evidence: `Matched heuristic on ${tmpl.domain}`,
            source: 'Domain & Content Analyzer',
            confidence: 'medium',
            recommendation: 'Verify independently through the official company careers page.',
            scoreImpact: tmpl.score,
          },
        ],
        positiveObservations: [],
        contradictions: [],
        missingInformation: ['Official HR verification headers absent.'],
        recommendations: ['Confirm with university placement office before proceeding.'],
        riskScore: tmpl.score + (idx % 9),
        riskCategory: 'SUSPICIOUS',
        evidenceConfidence: 'medium',
        saved: idx % 8 === 0,
        daysAgo: daysAgoVal,
        hours,
      };
    }

    const tmpl = lowTemplates[idx % lowTemplates.length];
    return {
      id: `scn_demo_pool_${String(idx + 1).padStart(3, '0')}`,
      userId: student.id,
      scanName: `${tmpl.namePrefix} #${idx + 1} (Demo)`,
      scanType,
      inputReference: `https://${tmpl.domain}/careers`,
      extractedInformation: {
        companyName: tmpl.company,
        website: `https://${tmpl.domain}`,
        recruiterEmail: `careers@${tmpl.domain}`,
        rawSummary: `DEMO DATA: Standard lower-risk ${scanType.replace('_', ' ')} check by ${student.name}.`,
      },
      findings: [],
      positiveObservations: [
        {
          title: 'Official Reference Domain Match',
          detail: `Domain ${tmpl.domain} aligns with verified campus placement directory.`,
          limitation: 'Lower risk does not substitute for direct placement portal confirmation.',
        },
      ],
      contradictions: [],
      missingInformation: [],
      recommendations: ['Continue application strictly inside official corporate portal.'],
      riskScore: tmpl.score + (idx % 6),
      riskCategory: 'LOWER_RISK',
      evidenceConfidence: 'medium',
      saved: idx % 10 === 0,
      daysAgo: daysAgoVal,
      hours,
    };
  });
}

// Curated Fictional Recruiters, Opportunities & 5 Complete Investigation Graph Scenarios
export const DEMO_RECRUITER_SAMPLES = [
  {
    id: 'rec_demo_1',
    recruiterName: 'Neha Deshpande',
    recruiterEmail: 'campus-hiring@veridian-systems.example',
    companyName: 'Veridian Systems Pvt Ltd',
    officialWebsite: 'https://veridian-systems.example',
    applicationUrl: 'https://veridian-systems.example/careers',
    status: 'Supported',
    isDemo: true,
  },
  {
    id: 'rec_demo_2',
    recruiterName: 'Ananya Krishnan',
    recruiterEmail: 'campus-hiring@northstar-labs.example',
    companyName: 'Northstar Labs India',
    officialWebsite: 'https://northstar-labs.example',
    applicationUrl: 'https://careers.northstar-labs.example/students',
    status: 'Confirmed',
    isDemo: true,
  },
  {
    id: 'rec_demo_3',
    recruiterName: 'Raghav Menon',
    recruiterEmail: 'hr@horizon-engineering.example',
    companyName: 'Horizon Engineering Services',
    officialWebsite: 'https://horizon-engineering.example',
    applicationUrl: 'https://horizon-engineering.example/careers',
    status: 'Supported',
    isDemo: true,
  },
  {
    id: 'rec_demo_4',
    recruiterName: 'Vikram Mehta (Claimed HR)',
    recruiterEmail: 'hr-onboarding@gmail.com',
    companyName: 'Apex FinServe Solutions',
    officialWebsite: 'https://apex-finserve.example',
    applicationUrl: 'https://apex-careers-onboarding.example/pay-fee',
    status: 'Contradictory',
    isDemo: true,
  },
  {
    id: 'rec_demo_5',
    recruiterName: 'Priya Nair',
    recruiterEmail: 'priya.hr.cloudpeak@gmail.com',
    companyName: 'CloudPeak Analytics',
    officialWebsite: 'https://cloudpeak-analytics.example',
    applicationUrl: 'https://cloudpeak-hr-desk.example/interview',
    status: 'Suspicious',
    isDemo: true,
  },
  {
    id: 'rec_demo_6',
    recruiterName: 'Riya Kapoor (WhatsApp Desk)',
    recruiterEmail: 'internship.coordinator@outlook.com',
    companyName: 'TechSprint Global Talent',
    officialWebsite: 'https://techsprint-global.example',
    applicationUrl: 'https://campusdrive-verify.example/register',
    status: 'Suspicious',
    isDemo: true,
  },
  {
    id: 'rec_demo_7',
    recruiterName: '@QuickEarn_Desk_Demo',
    recruiterEmail: 'Telegram Handle Only',
    companyName: 'QuickEarn Digital Tasks',
    officialWebsite: 'https://quickearn-tasks.example',
    applicationUrl: 'https://quickearn-tasks.example/vip-tier',
    status: 'Suspicious',
    isDemo: true,
  },
  {
    id: 'rec_demo_8',
    recruiterName: 'Unidentified Campus Coordinator',
    recruiterEmail: 'Not provided',
    companyName: 'QuantumMesh Robotics',
    officialWebsite: 'https://quantummesh-robotics.example',
    applicationUrl: '',
    status: 'Missing Evidence',
    isDemo: true,
  },
];

export const DEMO_OPPORTUNITY_SAMPLES = [
  {
    id: 'opp_demo_1',
    title: 'Associate Software Engineer (Campus 2026)',
    companyName: 'Veridian Systems Pvt Ltd',
    officialWebsite: 'https://veridian-systems.example',
    recruiterName: 'Neha Deshpande',
    recruiterEmail: 'campus-hiring@veridian-systems.example',
    applicationUrl: 'https://veridian-systems.example/careers',
    paymentRequested: false,
    offerSummary: 'Rs. 6,50,000 CTC · Full-time Pune Campus · Zero fees',
    jobDescriptionSummary: 'Campus hiring after coding test and two technical rounds',
    riskTag: 'LOWER RISK · VERIFIED',
    isDemo: true,
  },
  {
    id: 'opp_demo_2',
    title: 'Financial Data Analyst (Impersonated Offer)',
    companyName: 'Apex FinServe Solutions',
    officialWebsite: 'https://apex-finserve.example',
    recruiterName: 'Vikram Mehta (Claimed HR)',
    recruiterEmail: 'hr-onboarding@gmail.com',
    applicationUrl: 'https://apex-careers-onboarding.example/pay-fee',
    paymentRequested: true,
    offerSummary: 'Rs. 9,50,000 CTC · Demands Rs. 2,499 UPI security deposit',
    jobDescriptionSummary: 'Unsolicited appointment issued without interview',
    riskTag: 'HIGH RISK · IMPERSONATION',
    isDemo: true,
  },
  {
    id: 'opp_demo_3',
    title: 'VIP Merchant Rating Task Ladder',
    companyName: 'QuickEarn Digital Tasks',
    officialWebsite: 'https://quickearn-tasks.example',
    recruiterName: '@QuickEarn_Desk_Demo',
    recruiterEmail: 'support@quickearn-tasks.example',
    applicationUrl: 'https://quickearn-tasks.example/vip-tier',
    paymentRequested: true,
    offerSummary: 'Promises Rs. 4,500/day after Rs. 5,000 prepaid deposit',
    jobDescriptionSummary: 'Telegram app-liking and merchant recharge task scheme',
    riskTag: 'HIGH RISK · TASK SCAM',
    isDemo: true,
  },
  {
    id: 'opp_demo_4',
    title: 'Backend Engineering Intern (Unverified WhatsApp)',
    companyName: 'CloudPeak Analytics',
    officialWebsite: 'https://cloudpeak-analytics.example',
    recruiterName: 'Priya Nair',
    recruiterEmail: 'priya.hr.cloudpeak@gmail.com',
    applicationUrl: 'https://cloudpeak-hr-desk.example/interview',
    paymentRequested: false,
    offerSummary: 'Rs. 22,000/month · Recruiter uses Gmail & hyphenated portal',
    jobDescriptionSummary: 'Node.js & PostgreSQL internship with unverified outreach channel',
    riskTag: 'SUSPICIOUS · DOMAIN MISMATCH',
    isDemo: true,
  },
  {
    id: 'opp_demo_5',
    title: 'Guaranteed AI Internship + Kit Fee',
    companyName: 'TechSprint Global Talent',
    officialWebsite: 'https://techsprint-global.example',
    recruiterName: 'Riya Kapoor',
    recruiterEmail: 'internship.coordinator@outlook.com',
    applicationUrl: 'https://campusdrive-verify.example/register',
    paymentRequested: true,
    offerSummary: 'Rs. 35,000 stipend conditional on Rs. 1,450 certification kit fee',
    jobDescriptionSummary: 'WhatsApp forward promising guaranteed remote placement',
    riskTag: 'SUSPICIOUS · PAID TRAINING TRAP',
    isDemo: true,
  },
  {
    id: 'opp_demo_6',
    title: 'Graduate Analyst Cohort 2026',
    companyName: 'Northstar Labs India',
    officialWebsite: 'https://northstar-labs.example',
    recruiterName: 'Ananya Krishnan',
    recruiterEmail: 'campus-hiring@northstar-labs.example',
    applicationUrl: 'https://careers.northstar-labs.example/students',
    paymentRequested: false,
    offerSummary: 'Rs. 24,000/month internship leading to PPO',
    jobDescriptionSummary: 'Campus assessment + panel interviews via official portal',
    riskTag: 'LOWER RISK · VERIFIED',
    isDemo: true,
  },
  {
    id: 'opp_demo_7',
    title: 'Remote PDF Data Entry Specialist',
    companyName: 'DailyType Remote Solutions',
    officialWebsite: 'https://dailytype-remote.example',
    recruiterName: 'Onboarding Desk',
    recruiterEmail: 'onboarding.dailytype@gmail.com',
    applicationUrl: 'https://dailytype-remote.example/enroll',
    paymentRequested: true,
    offerSummary: 'Rs. 28,000/week typing payout + Rs. 1,800 registration fee',
    jobDescriptionSummary: 'Typing PDF pages with accuracy penalty agreement',
    riskTag: 'SUSPICIOUS · PENALTY TRAP',
    isDemo: true,
  },
  {
    id: 'opp_demo_8',
    title: 'Site Reliability Apprentice',
    companyName: 'IndusGrid Cloud Corp',
    officialWebsite: 'https://indusgrid-cloud.example',
    recruiterName: 'Pooja Kulkarni',
    recruiterEmail: 'careers@indusgrid-cloud.example',
    applicationUrl: 'https://indusgrid-cloud.example/careers',
    paymentRequested: false,
    offerSummary: 'Rs. 30,000/month apprentice role · Bengaluru Hybrid',
    jobDescriptionSummary: 'Linux & observability apprenticeship with zero fees',
    riskTag: 'LOWER RISK · VERIFIED',
    isDemo: true,
  },
];

export interface DemoGraphScenario {
  id: string;
  title: string;
  subtitle: string;
  result: TrustIntelligenceResult;
}

export const DEMO_GRAPH_SCENARIOS: DemoGraphScenario[] = [
  {
    id: 'graph_impersonation',
    title: '1. Offer Impersonation Scam',
    subtitle: 'Apex FinServe lookalike domain + Gmail recruiter + Rs. 2,499 UPI fee',
    result: {
      statements: {
        companyExistence: {
          status: 'Supported by Reference Directory',
          detail: 'Apex FinServe Solutions exists in demo reference records (apex-finserve.example).',
          limitation: 'Legitimate companies are frequently targeted by impersonators; company existence never validates an offer.',
        },
        officialWebsite: {
          status: 'Contradictory — Lookalike Portal',
          detail: 'Offer routes payment to apex-careers-onboarding.example instead of official apex-finserve.example.',
          limitation: 'Always confirm hiring portals on the official domain root.',
        },
        recruiterAssociation: {
          status: 'Contradictory — Webmail Sender',
          detail: 'Recruiter uses hr-onboarding@gmail.com rather than @apex-finserve.example.',
          limitation: 'Consumer webmail addresses cannot establish corporate employment.',
        },
        specificOpportunity: {
          status: 'Suspicious — Payment Requested',
          detail: 'Demands Rs. 2,499 UPI laptop security deposit prior to orientation.',
          limitation: 'Advance fee requests are a primary indicator of recruitment fraud.',
        },
      },
      nodes: [
        { id: 'n_cmp', entityType: 'company', entityName: 'Apex FinServe Solutions', verificationStatus: 'Confirmed', source: 'Demo Reference Directory', confidence: 'high', details: 'Official domain is apex-finserve.example.' },
        { id: 'n_dom', entityType: 'domain', entityName: 'apex-finserve.example', verificationStatus: 'Confirmed', source: 'Reference Whitelist', confidence: 'high', details: 'Verified corporate domain in reference table.' },
        { id: 'n_rec', entityType: 'recruiter', entityName: 'Vikram Mehta (Claimed HR)', verificationStatus: 'Unverified', source: 'Offer PDF Header', confidence: 'low', details: 'No corporate directory corroboration.' },
        { id: 'n_eml', entityType: 'email', entityName: 'hr-onboarding@gmail.com', verificationStatus: 'Contradictory', source: 'Sender Validator', confidence: 'high', details: 'Free Gmail address conflicts with official domain.' },
        { id: 'n_off', entityType: 'offer_letter', entityName: 'Analyst Offer PDF', verificationStatus: 'Suspicious', source: 'Document Parser', confidence: 'high', details: 'Issued without prior technical interview.' },
        { id: 'n_url', entityType: 'application_url', entityName: 'apex-careers-onboarding.example', verificationStatus: 'Suspicious', source: 'Threat Indicator dom_demo_1', confidence: 'high', details: 'Confirmed lookalike domain impersonating Apex FinServe.' },
        { id: 'n_pay', entityType: 'payment_request', entityName: 'Rs. 2,499 UPI Deposit', verificationStatus: 'Suspicious', source: 'Payment Rule Engine', confidence: 'high', details: 'Requests refundable laptop deposit via UPI QR.' },
        { id: 'n_evd', entityType: 'evidence', entityName: 'Community Report rep_demo_1', verificationStatus: 'Confirmed', source: 'Moderation Queue', confidence: 'high', details: 'Corroborated by confirmed student report.' },
      ],
      edges: [
        { id: 'e1', source: 'n_cmp', target: 'n_dom', status: 'Confirmed', explanation: 'Official corporate domain matches Apex FinServe record.' },
        { id: 'e2', source: 'n_rec', target: 'n_eml', status: 'Unverified', explanation: 'Claimed HR identity uses unverified consumer Gmail.' },
        { id: 'e3', source: 'n_eml', target: 'n_dom', status: 'Contradictory', explanation: '@gmail.com contradicts official @apex-finserve.example domain.' },
        { id: 'e4', source: 'n_off', target: 'n_url', status: 'Suspicious', explanation: 'Offer directs candidate to lookalike payment domain.' },
        { id: 'e5', source: 'n_url', target: 'n_pay', status: 'Suspicious', explanation: 'Lookalike URL collects Rs. 2,499 UPI deposit.' },
        { id: 'e6', source: 'n_evd', target: 'n_url', status: 'Confirmed', explanation: 'Confirmed community moderation evidence links domain to advance-fee fraud.' },
      ],
      checksPerformed: [
        'Company Reference Registry Match',
        'Sender vs Official Domain Consistency Check',
        'Community Threat Indicator Correlation',
        'Advance-Fee & Payment Clause Inspection',
      ],
      missingEvidence: [
        'Official Apex FinServe ATS requisition confirmation',
        'Corporate DKIM-signed email headers',
      ],
    },
  },
  {
    id: 'graph_verified',
    title: '2. Verified Campus Offer',
    subtitle: 'Veridian Systems official domain + aligned recruiter + zero fee',
    result: {
      statements: {
        companyExistence: {
          status: 'Supported by Reference Directory',
          detail: 'Veridian Systems Pvt Ltd verified in demo campus partner records.',
          limitation: 'Still confirm the final offer inside your university placement office.',
        },
        officialWebsite: {
          status: 'Supported — Domain Aligned',
          detail: 'Careers portal matches official domain veridian-systems.example.',
          limitation: 'Visual page parity should still be checked carefully.',
        },
        recruiterAssociation: {
          status: 'Supported — Corporate Email Match',
          detail: 'campus-hiring@veridian-systems.example shares the verified corporate domain.',
          limitation: 'Domain match supports sender alignment but never proves personal identity alone.',
        },
        specificOpportunity: {
          status: 'Supported — Zero Payment Demands',
          detail: 'Associate Software Engineer offer contains zero upfront fee clauses.',
          limitation: 'Direct employer ATS confirmation remains authoritative.',
        },
      },
      nodes: [
        { id: 'v_cmp', entityType: 'company', entityName: 'Veridian Systems Pvt Ltd', verificationStatus: 'Confirmed', source: 'Demo Reference Directory', confidence: 'high', details: 'Verified campus placement partner.' },
        { id: 'v_dom', entityType: 'domain', entityName: 'veridian-systems.example', verificationStatus: 'Confirmed', source: 'Threat Indicator dom_demo_14', confidence: 'high', details: 'Cleared official corporate reference domain.' },
        { id: 'v_rec', entityType: 'recruiter', entityName: 'Neha Deshpande', verificationStatus: 'Supported', source: 'Campus Placement Schedule', confidence: 'medium', details: 'Campus coordinator associated with Veridian Systems.' },
        { id: 'v_eml', entityType: 'email', entityName: 'campus-hiring@veridian-systems.example', verificationStatus: 'Confirmed', source: 'Header Validator', confidence: 'high', details: 'SPF pass & DKIM pass on veridian-systems.example.' },
        { id: 'v_off', entityType: 'offer_letter', entityName: 'Graduate ASE Offer', verificationStatus: 'Supported', source: 'Offer Analyzer', confidence: 'medium', details: 'Standard CTC structure with zero registration fees.' },
        { id: 'v_url', entityType: 'application_url', entityName: 'veridian-systems.example/careers', verificationStatus: 'Confirmed', source: 'URL Scanner', confidence: 'high', details: 'HTTPS route on official domain root.' },
      ],
      edges: [
        { id: 've1', source: 'v_cmp', target: 'v_dom', status: 'Confirmed', explanation: 'Official domain registered in Veridian Systems reference.' },
        { id: 've2', source: 'v_rec', target: 'v_eml', status: 'Supported', explanation: 'Email address sits on official corporate domain.' },
        { id: 've3', source: 'v_eml', target: 'v_dom', status: 'Confirmed', explanation: 'SPF/DKIM alignment confirmed against corporate domain.' },
        { id: 've4', source: 'v_off', target: 'v_url', status: 'Supported', explanation: 'Offer references official corporate careers portal.' },
      ],
      checksPerformed: [
        'Reference Directory Employer Verification',
        'Email SPF/DKIM Alignment Check',
        'Application URL Root Domain Match',
        'Advance-Fee Absence Verification',
      ],
      missingEvidence: [
        'Real-time third-party HRIS API integration (external to demo sandbox)',
      ],
    },
  },
  {
    id: 'graph_telegram',
    title: '3. Telegram Task Scam',
    subtitle: 'QuickEarn handle + prepaid VIP merchant deposit + missing corporate email',
    result: {
      statements: {
        companyExistence: {
          status: 'Suspicious — Flagged Entity',
          detail: 'QuickEarn Digital Tasks is flagged FLAGGED across multiple task-fraud reports.',
          limitation: 'Unregistered task schemes frequently rotate display names.',
        },
        officialWebsite: {
          status: 'Suspicious — Confirmed Threat Domain',
          detail: 'quickearn-tasks.example is listed as CONFIRMED_THREAT (dom_demo_2).',
          limitation: 'Avoid visiting or entering credentials/UPI PINs on flagged portals.',
        },
        recruiterAssociation: {
          status: 'Missing Evidence — Chat Handle Only',
          detail: 'Recruiter communicates solely via @QuickEarn_Desk_Demo on Telegram without a corporate email.',
          limitation: 'Anonymous messaging handles provide zero corporate accountability.',
        },
        specificOpportunity: {
          status: 'Suspicious — Prepaid Deposit Trap',
          detail: 'Requires Rs. 5,000 VIP merchant recharge to unlock promised Rs. 4,500/day earnings.',
          limitation: 'Prepaid task escalation is a documented financial fraud mechanism.',
        },
      },
      nodes: [
        { id: 't_cmp', entityType: 'company', entityName: 'QuickEarn Digital Tasks', verificationStatus: 'Suspicious', source: 'Company Directory', confidence: 'high', details: 'Flagged for Telegram prepaid task fraud.' },
        { id: 't_rec', entityType: 'recruiter', entityName: '@QuickEarn_Desk_Demo', verificationStatus: 'Unverified', source: 'Telegram OCR', confidence: 'high', details: 'Anonymous Telegram desk handle.' },
        { id: 't_miss', entityType: 'missing_evidence', entityName: 'No Corporate Email / Address', verificationStatus: 'Missing Evidence', source: 'Completeness Check', confidence: 'high', details: 'Zero verifiable corporate email or registered office.' },
        { id: 't_jd', entityType: 'job_description', entityName: 'Rs. 4,500/day App Rating', verificationStatus: 'Suspicious', source: 'Scam Pattern Analyzer', confidence: 'high', details: 'Unrealistic salary-to-effort ratio.' },
        { id: 't_url', entityType: 'application_url', entityName: 'quickearn-tasks.example/vip-tier', verificationStatus: 'Suspicious', source: 'Threat Indicator dom_demo_2', confidence: 'high', details: 'Confirmed threat indicator.' },
        { id: 't_pay', entityType: 'payment_request', entityName: 'Rs. 5,000 Prepaid Recharge', verificationStatus: 'Suspicious', source: 'Payment Rule Engine', confidence: 'high', details: 'Locks withdrawal behind escalating deposit.' },
      ],
      edges: [
        { id: 'te1', source: 't_rec', target: 't_miss', status: 'Missing Evidence', explanation: 'Telegram handle cannot be mapped to a verified corporate domain.' },
        { id: 'te2', source: 't_jd', target: 't_url', status: 'Suspicious', explanation: 'Task listing routes candidates to confirmed threat portal.' },
        { id: 'te3', source: 't_url', target: 't_pay', status: 'Suspicious', explanation: 'Portal forces prepaid VIP deposit before payout.' },
      ],
      checksPerformed: [
        'Telegram / WhatsApp Channel Risk Check',
        'Prepaid Task Pattern Detection',
        'Threat Indicator Domain Lookup',
      ],
      missingEvidence: [
        'Official corporate registration or CIN',
        'Corporate recruiter email address',
      ],
    },
  },
  {
    id: 'graph_domain_mismatch',
    title: '4. Recruiter Domain Mismatch',
    subtitle: 'CloudPeak Analytics vs Gmail recruiter & hyphenated interview portal',
    result: {
      statements: {
        companyExistence: {
          status: 'Unverified Reference Entry',
          detail: 'CloudPeak Analytics exists as an UNVERIFIED entry (cloudpeak-analytics.example).',
          limitation: 'Pending corporate verification does not prove fraud or legitimacy.',
        },
        officialWebsite: {
          status: 'Contradictory — Hyphenated Lookalike',
          detail: 'Interview link points to cloudpeak-hr-desk.example instead of cloudpeak-analytics.example.',
          limitation: 'Employers rarely host candidate forms on separate unrelated hyphenated domains.',
        },
        recruiterAssociation: {
          status: 'Contradictory — Free Gmail Account',
          detail: 'Priya Nair emailed from priya.hr.cloudpeak@gmail.com.',
          limitation: 'Cannot verify employment via consumer Gmail.',
        },
        specificOpportunity: {
          status: 'Suspicious — PII Form Request',
          detail: 'Pre-interview form requests bank IFSC and identity copies before live technical screening.',
          limitation: 'Withhold banking and KYC details until formal verified onboarding.',
        },
      },
      nodes: [
        { id: 'm_cmp', entityType: 'company', entityName: 'CloudPeak Analytics', verificationStatus: 'Unverified', source: 'Reference Directory', confidence: 'medium', details: 'Unverified startup record (cloudpeak-analytics.example).' },
        { id: 'm_dom', entityType: 'domain', entityName: 'cloudpeak-analytics.example', verificationStatus: 'Unverified', source: 'Company Directory', confidence: 'medium', details: 'Listed corporate domain.' },
        { id: 'm_eml', entityType: 'email', entityName: 'priya.hr.cloudpeak@gmail.com', verificationStatus: 'Contradictory', source: 'Header Validator', confidence: 'high', details: 'Consumer Gmail does not match corporate domain.' },
        { id: 'm_url', entityType: 'application_url', entityName: 'cloudpeak-hr-desk.example', verificationStatus: 'Suspicious', source: 'Threat Indicator dom_demo_9', confidence: 'medium', details: 'Suspicious hyphenated lookalike domain.' },
        { id: 'm_jd', entityType: 'job_description', entityName: 'Backend Engineering Intern', verificationStatus: 'Unverified', source: 'JD Analyzer', confidence: 'medium', details: 'Technical role summary matches market stipend.' },
      ],
      edges: [
        { id: 'me1', source: 'm_cmp', target: 'm_dom', status: 'Unverified', explanation: 'Company directory entry pending full corporate confirmation.' },
        { id: 'me2', source: 'm_eml', target: 'm_dom', status: 'Contradictory', explanation: 'Gmail sender diverges from cloudpeak-analytics.example.' },
        { id: 'me3', source: 'm_jd', target: 'm_url', status: 'Suspicious', explanation: 'Application redirects to flagged lookalike domain.' },
      ],
      checksPerformed: [
        'Domain Consistency Comparison',
        'Recruiter Webmail Check',
        'PII Harvesting Form Check',
      ],
      missingEvidence: [
        'Corporate email confirmation from @cloudpeak-analytics.example',
        'Verified technical interviewer details',
      ],
    },
  },
  {
    id: 'graph_insufficient',
    title: '5. Insufficient Evidence Case',
    subtitle: 'Minimal WhatsApp snippet lacking domain, email, URL & employer ID',
    result: {
      statements: {
        companyExistence: {
          status: 'Insufficient Evidence',
          detail: 'No verifiable company name or corporate registration details were provided.',
          limitation: 'JOBSHIELD does not fabricate or guess corporate legitimacy when evidence is missing.',
        },
        officialWebsite: {
          status: 'Insufficient Evidence',
          detail: 'No official website URL or domain name was included in the submission.',
          limitation: 'Request the official corporate website before taking action.',
        },
        recruiterAssociation: {
          status: 'Insufficient Evidence',
          detail: 'Only an unnamed messaging contact was present without corporate email headers.',
          limitation: 'Cannot verify recruiter affiliation without a corporate domain.',
        },
        specificOpportunity: {
          status: 'Insufficient Evidence',
          detail: 'Missing job description, compensation terms, and interview workflow details.',
          limitation: 'Ask for full written details on an official company email before proceeding.',
        },
      },
      nodes: [
        { id: 'i_rec', entityType: 'recruiter', entityName: 'Unnamed Messaging Contact', verificationStatus: 'Unverified', source: 'Short Message Snippet', confidence: 'low', details: 'No corporate name or email provided.' },
        { id: 'i_m1', entityType: 'missing_evidence', entityName: 'Company Name Missing', verificationStatus: 'Missing Evidence', source: 'Completeness Guard', confidence: 'high', details: 'Employer identity omitted.' },
        { id: 'i_m2', entityType: 'missing_evidence', entityName: 'Official Website Missing', verificationStatus: 'Missing Evidence', source: 'Completeness Guard', confidence: 'high', details: 'No domain available for RDAP/DNS inspection.' },
        { id: 'i_m3', entityType: 'missing_evidence', entityName: 'Corporate Email Headers Missing', verificationStatus: 'Missing Evidence', source: 'Completeness Guard', confidence: 'high', details: 'Cannot inspect SPF/DKIM/DMARC alignment.' },
      ],
      edges: [
        { id: 'ie1', source: 'i_rec', target: 'i_m1', status: 'Missing Evidence', explanation: 'Contact omitted employer name.' },
        { id: 'ie2', source: 'i_rec', target: 'i_m2', status: 'Missing Evidence', explanation: 'No official domain provided for verification.' },
        { id: 'ie3', source: 'i_rec', target: 'i_m3', status: 'Missing Evidence', explanation: 'No email headers available.' },
      ],
      checksPerformed: ['Entity Extraction & Completeness Boundary Check'],
      missingEvidence: [
        'Official company name',
        'Corporate website URL',
        'Recruiter corporate email address',
        'Complete offer or job description text',
      ],
    },
  },
];
