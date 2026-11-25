export interface AwarenessArticle {
  slug: string;
  title: string;
  summary: string;
  description: string;
  howItWorks: string[];
  warningSigns: string[];
  exampleScenario: string;
  prevention: string[];
  whatToDo: string[];
}

export const BEFORE_YOU_APPLY_CHECKLIST = [
  {
    id: 'verify_website',
    title: 'Verify the official company website',
    detail: 'Search the company independently and compare the domain spelling character by character.',
  },
  {
    id: 'verify_recruiter',
    title: 'Independently verify the recruiter',
    detail: 'Confirm the recruiter works at the company via official HR channels, not just a profile name.',
  },
  {
    id: 'compare_email_domain',
    title: 'Compare the recruiter email domain',
    detail: 'Ensure the sender address ends with the company’s official domain rather than Gmail, Outlook, or lookalike suffixes.',
  },
  {
    id: 'check_official_channels',
    title: 'Check official recruitment channels',
    detail: 'Confirm the job ID or campus drive appears on the employer’s official careers portal or college placement cell.',
  },
  {
    id: 'review_offer_letter',
    title: 'Review the offer letter carefully',
    detail: 'Check reporting manager, compensation structure, office address, and absence of advance payment clauses.',
  },
  {
    id: 'inspect_application_urls',
    title: 'Inspect application and onboarding URLs',
    detail: 'Watch out for shortened links, misspelled domains, or unencrypted HTTP forms requesting sensitive data.',
  },
  {
    id: 'watch_unusual_fees',
    title: 'Watch for unusual fees or deposits',
    detail: 'Reject any request for registration, training, laptop, or security deposits before joining.',
  },
  {
    id: 'avoid_unnecessary_pii',
    title: 'Avoid sharing unnecessary personal information',
    detail: 'Do not submit Aadhaar, PAN, bank passbooks, or OTPs prior to verified onboarding.',
  },
];

export const PAYMENT_WARNINGS = [
  {
    title: 'Registration & Form Fees',
    detail: 'Scammers demand ₹499–₹3,500 to "activate" your candidate ID or confirm your interview slot.',
  },
  {
    title: 'Interview Scheduling Fees',
    detail: 'Legitimate employers never charge candidates to attend technical or HR interviews.',
  },
  {
    title: 'Document Processing Fees',
    detail: 'Requests for fees to verify academic records or generate an offer letter are fraudulent.',
  },
  {
    title: 'Mandatory Paid Training',
    detail: 'Demands to pay for a certificate or "pre-joining bootcamp" before receiving an offer are common traps.',
  },
  {
    title: 'Laptop & Equipment Deposits',
    detail: 'Fraudulent remote offers ask candidates to pay refundable deposits for company laptops.',
  },
  {
    title: 'Security & Caution Deposits',
    detail: 'Claims that a refundable deposit ensures attendance are fabricated to steal UPI transfers.',
  },
  {
    title: 'Task-Completion Recharges',
    detail: 'Telegram and WhatsApp task scams ask victims to deposit money to unlock higher-paying tasks.',
  },
];

export const DOCUMENT_SHARING_RISKS = [
  {
    item: 'Aadhaar & PAN Copies',
    risk: 'Used by fraudsters to open mule bank accounts, register fraudulent SIM cards, or impersonate you.',
  },
  {
    item: 'Bank Account & Passbook Details',
    risk: 'Exposed account details can be misused for unauthorized transfers or mule-account recruitment.',
  },
  {
    item: 'OTPs & Banking Passwords',
    risk: 'NEVER share OTPs, UPI PINs, or passwords with any recruiter or "verification agent" under any circumstance.',
  },
  {
    item: 'Signed Blank Cheques / Bonds',
    risk: 'Avoid signing financial guarantees or sending scanned signatures without legal and placement-cell review.',
  },
  {
    item: 'Live Selfies & Video KYC',
    risk: 'Holding your Aadhaar/PAN in a selfie video can be abused to bypass banking liveness checks or open unauthorized wallets.',
  },
  {
    item: 'Personal DigiLocker & Academic Marksheets',
    risk: 'Do not share DigiLocker PINs or original mark-sheet PDFs over WhatsApp or Telegram before verifying the employer offer.',
  },
];

export const AWARENESS_ARTICLES: AwarenessArticle[] = [
  {
    slug: 'fake-hr-scams',
    title: 'Fake HR Scams',
    summary: 'Impersonators posing as HR managers from major IT firms using free or lookalike email domains.',
    description:
      'Fraudsters create profiles and email accounts mimicking respected Indian IT and consulting firms to gain immediate trust from fresh graduates.',
    howItWorks: [
      'The scammer obtains candidate contact details from public job boards or leaked lists.',
      'They contact the candidate claiming to be an HR manager at a well-known company.',
      'After a brief phone call or automated quiz, they send a realistic-looking offer letter from a non-corporate domain.',
      'They request a "verification" or "onboarding" fee via UPI before issuing final joining details.',
    ],
    warningSigns: [
      'Recruiter uses @gmail.com or a hyphenated lookalike domain like @company-careers-hr.com.',
      'No formal technical interview round was conducted.',
      'Immediate urgency to pay a fee within a few hours.',
    ],
    exampleScenario:
      'A final-year B.Tech student receives an email from "hr.recruitment.tcs@gmail.com" offering a Software Engineer role after a 10-question Google Form, asking for ₹2,200 as a refundable verification fee.',
    prevention: [
      'Verify the recruiter’s email domain matches the company’s official corporate website.',
      'Check your application status directly inside the company’s official careers portal.',
    ],
    whatToDo: [
      'Stop communicating immediately and do not pay any fee.',
      'Preserve email headers and screenshots and report the domain on JOBSHIELD.',
    ],
  },
  {
    slug: 'fake-internship-offers',
    title: 'Fake Internship Offers',
    summary: 'Paid "stipend internships" that require students to pay registration or training fees upfront.',
    description:
      'Targeted heavily at college students seeking mandatory academic internships, these schemes promise attractive certificates and remote stipends in exchange for upfront fees.',
    howItWorks: [
      'Advertisements promise guaranteed internships at reputed brands with minimal screening.',
      'Students receive instant selection letters praising their resume.',
      'Before starting, students are told to pay for a "project kit", LMS portal access, or training fee.',
    ],
    warningSigns: [
      'Offer arrives without a live interview or portfolio review.',
      'Stipend is conditional on paying an upfront registration fee.',
      'Company address is vague or uses only a WhatsApp number.',
    ],
    exampleScenario:
      'A second-year student receives a WhatsApp message offering a ₹15,000/month remote Web Development internship, provided they pay ₹1,499 for "mandatory server onboarding".',
    prevention: [
      'Consult your college placement cell before paying any internship onboarding fee.',
      'Scan the offer letter and payment URL in JOBSHIELD first.',
    ],
    whatToDo: [
      'Refuse all upfront payments and alert classmates through your placement coordinator.',
    ],
  },
  {
    slug: 'fake-placement-drives',
    title: 'Fake Placement Drives',
    summary: 'Unauthorized off-campus drive invitations collecting registration fees from graduating batches.',
    description:
      'Scammers circulate polished posters for "Mega Off-Campus Placement Drives" using logos of well-known companies to collect registration fees from hundreds of students.',
    howItWorks: [
      'Posters circulate in student Telegram and WhatsApp groups.',
      'A Google Form or lookalike website collects resumes and a ₹500–₹1,500 drive pass fee.',
      'After collecting funds, the organizers disappear or cancel the drive.',
    ],
    warningSigns: [
      'Official company careers pages show no mention of the mega drive.',
      'Payment is requested via personal UPI QR codes.',
    ],
    exampleScenario:
      'A poster circulates in campus groups inviting freshers to a "2026 Mega Tech Drive" with a ₹799 pass fee payable to a personal UPI ID.',
    prevention: [
      'Cross-verify off-campus drives on the official company social channels and careers portal.',
    ],
    whatToDo: [
      'Do not register or pay; warn campus groups and submit a Community Report.',
    ],
  },
  {
    slug: 'registration-fee-fraud',
    title: 'Registration Fee Fraud',
    summary: 'Advance-fee schemes disguised as refundable security deposits, kit charges, or interview passes.',
    description:
      'Advance-fee recruitment fraud extracts money directly from job seekers under changing pretexts before cutting off contact.',
    howItWorks: [
      'Candidate receives confirmation of shortlisting.',
      'Scammer requests a small initial registration fee.',
      'Once paid, scammers invent secondary fees (ID card, background check, laptop insurance).',
    ],
    warningSigns: [
      'Any demand for money at any stage before joining.',
      'Claims that the fee is "100% refundable with first salary".',
    ],
    exampleScenario:
      'After paying ₹1,000 for "interview registration", a candidate is asked for ₹4,500 more for "laptop courier insurance".',
    prevention: [
      'Adopt a strict rule: legitimate employers pay employees, never the reverse.',
    ],
    whatToDo: [
      'Stop paying immediately; if already paid, call 1930 and file at cybercrime.gov.in.',
    ],
  },
  {
    slug: 'telegram-task-scams',
    title: 'Telegram Task Scams',
    summary: 'Part-time rating/liking tasks that escalate into prepaid crypto or merchant recharge traps.',
    description:
      'One of India’s fastest-growing cyber financial frauds starts with simple social media or hotel-rating tasks and transitions into prepaid deposit demands.',
    howItWorks: [
      'Initial WhatsApp/SMS offers ₹150–₹500 for liking videos or reviewing places.',
      'Victim is moved to a Telegram group and receives small initial payouts to build trust.',
      'Scammers introduce "VIP prepaid tasks" requiring the victim to deposit ₹5,000–₹1,00,000+.',
      'Withdrawals are blocked with fabricated "tax" or "credit score" penalties.',
    ],
    warningSigns: [
      'Recruitment happens exclusively on WhatsApp and Telegram.',
      'Payment for liking posts, subscribing, or completing "merchant recharge" tasks.',
    ],
    exampleScenario:
      'A student earns ₹300 for rating three businesses, then is asked to deposit ₹10,000 into a Telegram task portal to unlock a ₹14,000 payout.',
    prevention: [
      'Never join Telegram groups offering daily payouts for simple clicks or prepaid tasks.',
    ],
    whatToDo: [
      'Block the contacts, preserve Telegram chat screenshots and UTR IDs, and call 1930 immediately if money was sent.',
    ],
  },
  {
    slug: 'work-from-home-scams',
    title: 'Work-from-Home Scams',
    summary: 'Unrealistic remote salary promises targeting students and freshers seeking flexible income.',
    description:
      'Fraudulent remote job ads lure applicants with high monthly packages for 1–2 hours of daily work, hiding identity theft or fee traps.',
    howItWorks: [
      'Social media ads promise ₹40,000+/month for basic remote clerical tasks.',
      'Applicants are pushed into paying onboarding fees or sharing KYC documents.',
    ],
    warningSigns: [
      'Hourly pay far exceeds Indian market rates for unskilled remote work.',
      'No verifiable employer office or corporate website.',
    ],
    exampleScenario:
      'An Instagram ad promises ₹35,000/month for 1 hour/day of remote catalog formatting, then asks for Aadhaar, PAN, and ₹1,800 portal setup fee.',
    prevention: [
      'Check salary realism and verify the company entity before applying.',
    ],
    whatToDo: [
      'Avoid sharing KYC documents and report the advertisement URL.',
    ],
  },
  {
    slug: 'data-entry-scams',
    title: 'Data-Entry Scams',
    summary: 'Contract traps threatening legal notices and penalties over fabricated "accuracy failures".',
    description:
      'Victims are hired to type PDFs into Word documents within impossible deadlines, then threatened with fake legal notices demanding penalty payments.',
    howItWorks: [
      'Candidate signs a digital "work agreement" containing heavy penalty clauses.',
      'Impossible formatting rules guarantee the candidate falls short of 95% accuracy.',
      'Fake advocates call demanding ₹8,000–₹25,000 to settle a non-existent court case.',
    ],
    warningSigns: [
      'Typing PDF pages for unusually high per-page rates.',
      'Agreements mentioning heavy monetary penalties for typing errors.',
    ],
    exampleScenario:
      'A fresher receives a PDF-typing job paying ₹18,000 for 500 pages, then receives an intimidating call from a "legal officer" demanding ₹12,500 for missed accuracy.',
    prevention: [
      'Never sign employment contracts imposing financial penalties for typing errors.',
    ],
    whatToDo: [
      'Do not pay intimidation demands; genuine companies do not collect fines over WhatsApp.',
    ],
  },
  {
    slug: 'phishing',
    title: 'Recruitment Phishing',
    summary: 'Lookalike job portals and login pages built to steal email, bank, or university credentials.',
    description:
      'Phishing links embedded in fake interview emails mimic official company portals or cloud sign-in screens to harvest credentials.',
    howItWorks: [
      'Email urges you to "Log in to view your offer letter" or "Verify campus credentials".',
      'The link opens a lookalike domain capturing passwords or session tokens.',
    ],
    warningSigns: [
      'Misspelled domain names (e.g., accenture-portal-login.xyz).',
      'Unexpected sign-in prompts asking for email or banking passwords.',
    ],
    exampleScenario:
      'An email link opens a fake portal asking for your personal Gmail password to "download your encrypted appointment letter".',
    prevention: [
      'Inspect every recruitment link with the JOBSHIELD URL Scanner before opening.',
    ],
    whatToDo: [
      'Change your password immediately and enable 2FA if you entered credentials.',
    ],
  },
  {
    slug: 'identity-theft',
    title: 'Identity Theft in Hiring',
    summary: 'Harvesting Aadhaar, PAN, selfies, and bank accounts under the guise of KYC verification.',
    description:
      'Some scams do not ask for money at all—they collect full KYC packets to commit financial fraud or open unauthorized accounts in the victim’s name.',
    howItWorks: [
      'Fake job portal requires Aadhaar, PAN, live selfie, and bank passbook during application.',
      'Documents are sold or used to pass KYC checks elsewhere.',
    ],
    warningSigns: [
      'Full KYC documents demanded before an interview has even occurred.',
      'Requests for OTPs sent to your Aadhaar-linked mobile number.',
    ],
    exampleScenario:
      'A candidate uploads Aadhaar, PAN, and bank details into an unverified Google Form for a "campus ambassador" role.',
    prevention: [
      'Share only a resume during initial applications; withhold identity and bank records until verified onboarding.',
    ],
    whatToDo: [
      'Monitor bank accounts, lock biometrics via official UIDAI channels if needed, and report identity misuse.',
    ],
  },
  {
    slug: 'recruiter-impersonation',
    title: 'Recruiter Impersonation',
    summary: 'Spoofing real recruiters’ names and photos to lend false credibility to fraudulent offers.',
    description:
      'Fraudsters copy real HR executives’ names and photos onto WhatsApp or fake email addresses, hoping candidates only check whether the person exists online.',
    howItWorks: [
      'Scammer picks a real HR manager’s name from a public professional network.',
      'They message candidates on WhatsApp or a lookalike email domain.',
      'Candidates search the name, see a real employee, and falsely assume the message is genuine.',
    ],
    warningSigns: [
      'Communication comes from personal phone numbers or non-corporate emails.',
      'Refusal to email from an official corporate address.',
    ],
    exampleScenario:
      'A scammer messages on WhatsApp using the name and headshot of a real Bengaluru HR lead, asking the student to join a private Telegram channel.',
    prevention: [
      'Remember: a matching public name never verifies that the person contacting you is actually that recruiter.',
    ],
    whatToDo: [
      'Contact the company’s official recruitment desk independently to confirm.',
    ],
  },
];

export const INDIA_EMERGENCY_STEPS = [
  'Stop all further payments immediately—do not pay "unlock" or "refund processing" fees.',
  'Preserve all WhatsApp/Telegram chats, emails, headers, offer letters, and caller numbers.',
  'Save UPI transaction IDs, UTR numbers, bank account numbers, and payment receipts.',
  'Contact your bank or UPI payment provider immediately to flag the fraudulent transaction.',
  'Call India’s National Cyber Crime Financial Fraud Helpline: 1930.',
  'File an official complaint online at https://cybercrime.gov.in.',
  'Retain your complaint acknowledgement number for bank and police follow-up.',
];
