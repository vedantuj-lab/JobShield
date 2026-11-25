import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  FileText,
  Globe,
  Image as ImageIcon,
  Loader2,
  Mail,
  Replace,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { ResilientImage } from '../../components/common/RiskDisplay';
import { useToast } from '../../contexts/ToastContext';
import { apiRequest } from '../../services/api';
import type { ScanRecord, ScanType } from '../../types/jobshield';

interface ScannerTheme {
  id: ScanType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bannerTitle: string;
  bannerSubtitle: string;
  image: string;
  imageAlt: string;
  gradientCls: string;
  activeTabCls: string;
  inactiveTabCls: string;
  surfaceCls: string;
  accentTintCls: string;
  buttonCls: string;
  badgeTextCls: string;
}

const SCANNER_TABS: ScannerTheme[] = [
  {
    id: 'offer_letter',
    label: 'Offer Letter Scanner',
    icon: FileText,
    bannerTitle: 'Offer Letter Document Verification',
    bannerSubtitle:
      'Extracts employer claims, salary structures, domain references, and advance-fee demands from PDF or image offers.',
    image: '/src/assets/images/scanner_offer_analysis_1795578120650.jpg',
    imageAlt: 'Offer letter and laptop onboarding verification workspace',
    gradientCls: 'from-[#651F35]/95 via-[#B85C32]/88 to-[#C65D45]/65',
    activeTabCls: 'border-[#C65D45] bg-[#C65D45] text-[#F7F0E5] shadow-xs',
    inactiveTabCls: 'border-[#C65D45]/25 bg-[#F7F0E5] text-[#8C3F23] hover:bg-[#FBEAE3]',
    surfaceCls: 'border-[#C65D45]/30 bg-[#F7F0E5]',
    accentTintCls: 'border-[#B85C32]/30 bg-[#FBEAE3]/75',
    buttonCls: 'bg-[#C65D45] hover:bg-[#B85C32] text-[#F7F0E5]',
    badgeTextCls: 'text-[#F0DFBD]',
  },
  {
    id: 'email',
    label: 'Email Scanner',
    icon: Mail,
    bannerTitle: 'Recruitment Email & Header Analysis',
    bannerSubtitle:
      'Checks sender domain authenticity, Reply-To mismatches, phishing links, urgency patterns, and optional SPF/DKIM/DMARC headers.',
    image: '/src/assets/images/scanner_email_inspection_1795580301873.jpg',
    imageAlt: 'Inspecting suspicious recruitment email inbox on desk workstation',
    gradientCls: 'from-[#124547]/95 via-[#175E60]/88 to-[#16765B]/65',
    activeTabCls: 'border-[#175E60] bg-[#175E60] text-[#F7F0E5] shadow-xs',
    inactiveTabCls: 'border-[#A7BEA8]/50 bg-[#E7F2F0] text-[#175E60] hover:bg-[#D5E9E5]',
    surfaceCls: 'border-[#175E60]/25 bg-[#E7F2F0]',
    accentTintCls: 'border-[#A7BEA8]/55 bg-[#D5E9E5]/65',
    buttonCls: 'bg-[#175E60] hover:bg-[#124547] text-[#F7F0E5]',
    badgeTextCls: 'text-[#A7BEA8]',
  },
  {
    id: 'url',
    label: 'URL Scanner',
    icon: Globe,
    bannerTitle: 'SSRF-Protected Website & Link Inspection',
    bannerSubtitle:
      'Inspects domain DNS, ICANN RDAP registration, HTTPS certificates, redirect chains, and Google Web Risk intelligence.',
    image: '/src/assets/images/scanner_url_domain_1795580301089.jpg',
    imageAlt: 'Domain verification and SSL inspection workstation',
    gradientCls: 'from-[#2D1F34]/95 via-[#46304F]/88 to-[#563653]/65',
    activeTabCls: 'border-[#46304F] bg-[#46304F] text-[#F7F0E5] shadow-xs',
    inactiveTabCls: 'border-[#B9A5C9]/45 bg-[#EFEAF2] text-[#46304F] hover:bg-[#E4DCE9]',
    surfaceCls: 'border-[#563653]/25 bg-[#EFEAF2]',
    accentTintCls: 'border-[#B9A5C9]/45 bg-[#E4DCE9]/70',
    buttonCls: 'bg-[#46304F] hover:bg-[#563653] text-[#F7F0E5]',
    badgeTextCls: 'text-[#B9A5C9]',
  },
  {
    id: 'job_description',
    label: 'Job Description Scanner',
    icon: FileText,
    bannerTitle: 'Job Description & Listing Risk Scanner',
    bannerSubtitle:
      'Flags unrealistic salary promises, guaranteed hiring claims, registration fee clauses, MLM patterns, and vague employer identity.',
    image: '/src/assets/images/scanner_jd_laptop_1795586898006.jpg',
    imageAlt: 'Candidate carefully reviewing job listing details on laptop',
    gradientCls: 'from-[#6B521B]/95 via-[#A67F26]/88 to-[#C69B36]/65',
    activeTabCls: 'border-[#C69B36] bg-[#C69B36] text-[#29272B] shadow-xs',
    inactiveTabCls: 'border-[#C69B36]/35 bg-[#FBF3DF] text-[#6B521B] hover:bg-[#F5E7C4]',
    surfaceCls: 'border-[#C69B36]/35 bg-[#FBF3DF]',
    accentTintCls: 'border-[#E3B34C]/40 bg-[#E9D9C4]/70',
    buttonCls: 'bg-[#C69B36] hover:bg-[#A67F26] text-[#29272B]',
    badgeTextCls: 'text-[#F0DFBD]',
  },
  {
    id: 'screenshot',
    label: 'Screenshot & Message Scanner',
    icon: ImageIcon,
    bannerTitle: 'WhatsApp, Telegram & Chat Screenshot Scanner',
    bannerSubtitle:
      'Runs OCR extraction on recruitment chat screenshots and lets you verify or edit the text before security scoring.',
    image: '/src/assets/images/scanner_mobile_chat_1795580302782.jpg',
    imageAlt: 'Smartphone displaying recruitment chat message on desk',
    gradientCls: 'from-[#651F35]/95 via-[#842D48]/88 to-[#B86B77]/65',
    activeTabCls: 'border-[#E27D70] bg-[#E27D70] text-[#29272B] shadow-xs',
    inactiveTabCls: 'border-[#B86B77]/35 bg-[#FBEAE3] text-[#651F35] hover:bg-[#F5D6CB]',
    surfaceCls: 'border-[#B86B77]/30 bg-[#FBEAE3]',
    accentTintCls: 'border-[#E27D70]/35 bg-[#F5D6CB]/65',
    buttonCls: 'bg-[#E27D70] hover:bg-[#C65D45] text-[#29272B] hover:text-[#F7F0E5]',
    badgeTextCls: 'text-[#F0DFBD]',
  },
];

interface ScannerPreset {
  id: string;
  label: string;
  badge: 'High Risk' | 'Suspicious' | 'Lower Risk' | 'Insufficient Evidence';
  scanName?: string;
  offerText?: string;
  emailSender?: string;
  emailSubject?: string;
  emailBody?: string;
  emailHeaders?: string;
  url?: string;
  claimedCompany?: string;
  jdTitle?: string;
  jdText?: string;
  shotChannel?: string;
  shotText?: string;
}

const SCANNER_PRESETS: Record<ScanType, ScannerPreset[]> = {
  offer_letter: [
    {
      id: 'ol_1',
      label: 'Apex Cloud Deposit Scam',
      badge: 'High Risk',
      scanName: 'Sample High-Risk Offer — Apex Cloud Careers',
      offerText:
        'OFFER OF APPOINTMENT — Apex Cloud Tech Services\nCongratulations! You are selected immediately without interview for Cloud Software Intern at Rs. 85,000/month.\nTo confirm your laptop dispatch and employee ID badge, transfer a refundable security deposit of Rs. 2,500 via UPI before 6:00 PM today.\nReply via WhatsApp or careers@apex-onboarding.example.',
    },
    {
      id: 'ol_2',
      label: 'TechSprint Kit Fee Offer',
      badge: 'High Risk',
      scanName: 'Sample High-Risk Offer — TechSprint Training Kit',
      offerText:
        'TECHSPRINT SOLUTIONS PRIVATE LIMITED\nProvisional Internship Appointment — Full Stack Trainee (Stipend Rs. 30,000/month).\nMandatory Condition: Deposit Rs. 1,750 certification kit fee at https://techsprint-portal-verify.example/pay within 4 hours to activate joining ID.\nHR Desk: hr@techsprint-portal-verify.example.',
    },
    {
      id: 'ol_3',
      label: 'Gmail HR Unverified Offer',
      badge: 'Suspicious',
      scanName: 'Sample Suspicious Offer — Gmail Recruiter',
      offerText:
        'Offer Letter — Business Operations Associate\nEmployer: Meridian Global Consulting\nCTC: Rs. 6.4 LPA, Location: Hyderabad.\nPlease reply with Aadhaar, PAN, and bank passbook copy to hr.meridian.recruiters@gmail.com to complete pre-joining formalities.',
    },
    {
      id: 'ol_4',
      label: 'Horizon Verified Internship',
      badge: 'Lower Risk',
      scanName: 'Sample Standard Offer — Horizon Engineering',
      offerText:
        'HORIZON ENGINEERING SERVICES\nOffer of Internship — Summer Software Engineering Cohort\nStipend: Rs. 22,000/month. Location: Bengaluru.\nNo fees, deposits, or payments are required at any stage of hiring or onboarding.\nVerify this letter on our official portal at https://horizon-engineering.example/careers or contact hr@horizon-engineering.example.',
    },
    {
      id: 'ol_5',
      label: 'Minimal Snippet (Insufficient)',
      badge: 'Insufficient Evidence',
      scanName: 'Sample Minimal Offer Fragment',
      offerText: 'Congratulations, your internship interview went well. HR will follow up soon.',
    },
  ],
  email: [
    {
      id: 'em_1',
      label: 'SPF Fail + Training Fee',
      badge: 'High Risk',
      emailSender: 'hr-desk@secure-careers-verify.example',
      emailSubject: 'URGENT: Final Offer Confirmation — Pay Training Fee Today',
      emailBody:
        'Dear Candidate,\nYour profile is shortlisted for Direct Onboarding. Pay Rs. 1,950 refundable training & verification fee within 3 hours at https://secure-careers-verify.example/pay to keep your seat.',
      emailHeaders: 'Authentication-Results: spf=fail dkim=none dmarc=fail\nReply-To: quickhire.payments@gmail.com',
    },
    {
      id: 'em_2',
      label: 'Phishing Portal Login Link',
      badge: 'High Risk',
      emailSender: 'alerts@veridian-campus-hr.example',
      emailSubject: 'Download Encrypted Appointment Letter Now',
      emailBody:
        'Sign in with your college email password on http://veridian-campus-hr.example/login-verify to unlock your 2026 campus offer PDF within 2 hours.',
      emailHeaders: 'Authentication-Results: spf=softfail dkim=fail dmarc=fail',
    },
    {
      id: 'em_3',
      label: 'Reply-To Mismatch Notice',
      badge: 'Suspicious',
      emailSender: 'talent@kestrel-infotech.example',
      emailSubject: 'Remote Analyst Onboarding Form',
      emailBody:
        'Hello,\nComplete your KYC upload (PAN + Aadhaar) before evening so we can schedule your orientation session.',
      emailHeaders: 'Reply-To: kestrel.hiring.desk@outlook.com',
    },
    {
      id: 'em_4',
      label: 'Northstar Campus Interview',
      badge: 'Lower Risk',
      emailSender: 'campus-hiring@northstar-labs.example',
      emailSubject: 'Technical Interview Schedule — Graduate Analyst',
      emailBody:
        'Hello,\nThank you for applying through your college placement office. Your technical round is scheduled for Tuesday at 11:00 AM IST via our official portal at https://northstar-labs.example/interviews.',
      emailHeaders: 'Authentication-Results: spf=pass dkim=pass dmarc=pass',
    },
    {
      id: 'em_5',
      label: 'Short Note (Insufficient)',
      badge: 'Insufficient Evidence',
      emailSender: 'contact@example.com',
      emailSubject: 'Following up on application',
      emailBody: 'Hi, please confirm if you are available for a brief call tomorrow afternoon.',
      emailHeaders: '',
    },
  ],
  url: [
    {
      id: 'url_1',
      label: 'UPI Onboarding Portal (HTTP)',
      badge: 'High Risk',
      url: 'http://pay-onboarding-portal.example/upi-fee-verify',
      claimedCompany: 'Infosys Limited',
    },
    {
      id: 'url_2',
      label: 'Lookalike TechCareers Auth',
      badge: 'High Risk',
      url: 'https://tcs-verify-careers.example/auth-check',
      claimedCompany: 'Tata Consultancy Services',
    },
    {
      id: 'url_3',
      label: 'FastTrack Intern Form',
      badge: 'Suspicious',
      url: 'https://fasttrack-intern-kit.example/register',
      claimedCompany: 'FastTrack Digital',
    },
    {
      id: 'url_4',
      label: 'Northstar Official Portal',
      badge: 'Lower Risk',
      url: 'https://careers.northstar-labs.example/students',
      claimedCompany: 'Northstar Labs',
    },
    {
      id: 'url_5',
      label: 'Generic Unaffiliated URL',
      badge: 'Insufficient Evidence',
      url: 'https://example.org/careers-page',
      claimedCompany: '',
    },
  ],
  job_description: [
    {
      id: 'jd_1',
      label: 'Telegram Daily Task + Fee',
      badge: 'High Risk',
      jdTitle: 'Remote Data Entry & Daily Task Specialist — Rs. 90,000/mo',
      jdText:
        'Guaranteed job offer! Earn Rs. 3,000 daily working 1 hour from phone. No skills or interview needed. Join our Telegram group and pay Rs. 1,200 registration kit fee to unlock daily task payouts and invite 3 friends for bonus levels.',
    },
    {
      id: 'jd_2',
      label: 'PDF Typing Penalty Trap',
      badge: 'High Risk',
      jdTitle: 'Work From Home PDF Typing — Rs. 24,000 Weekly',
      jdText:
        'Convert 300 PDF images into Word files in 5 days. Zero experience needed. Candidates signing the agreement must pay a Rs. 999 portal registration charge and accept a Rs. 12,000 accuracy penalty clause.',
    },
    {
      id: 'jd_3',
      label: 'Vague Commission Affiliate',
      badge: 'Suspicious',
      jdTitle: 'Campus Growth Associate — Earn Up to Rs. 50,000/mo',
      jdText:
        'Flexible student role with uncapped earnings. Recruit 5 peers per week to qualify for team bonus tiers. Message our WhatsApp coordinator to receive your onboarding link.',
    },
    {
      id: 'jd_4',
      label: 'Horizon QA Automation Intern',
      badge: 'Lower Risk',
      jdTitle: 'Junior QA Automation Intern',
      jdText:
        'Horizon Engineering is hiring 4th-year CS/IT students for a 6-month QA internship in Pune. Required: JavaScript, Playwright/Selenium basics, Git. Selection via technical assessment and 2 interviews. Stipend Rs. 20,000/month. Apply at https://horizon-engineering.example/careers.',
    },
    {
      id: 'jd_5',
      label: 'Brief Role Summary',
      badge: 'Insufficient Evidence',
      jdTitle: 'Software Support Trainee',
      jdText: 'Looking for a fresher trainee comfortable with SQL and basic Linux troubleshooting in Bengaluru.',
    },
  ],
  screenshot: [
    {
      id: 'sc_1',
      label: 'Telegram VIP Recharge Task',
      badge: 'High Risk',
      shotChannel: 'Telegram Message',
      shotText:
        'Telegram HR Desk: Congrats! Your YouTube like-and-subscribe task account is approved. Transfer Rs. 1,500 activation deposit to unlock Rs. 6,000 VIP batch payout immediately.',
    },
    {
      id: 'sc_2',
      label: 'WhatsApp Laptop Deposit',
      badge: 'High Risk',
      shotChannel: 'WhatsApp Message',
      shotText:
        'WhatsApp Recruiter (+91 90000 00000): Your Apex Cloud appointment letter is ready! Send Rs. 2,500 refundable laptop courier insurance via UPI ID hr-verify@upi within 2 hours.',
    },
    {
      id: 'sc_3',
      label: 'Instagram WFH KYC Request',
      badge: 'Suspicious',
      shotChannel: 'Social Media Advertisement',
      shotText:
        'Direct Remote Hiring! Work 2 hrs/day and earn Rs. 35,000/mo. DM your Aadhaar card, PAN photo, and WhatsApp number to get started today.',
    },
    {
      id: 'sc_4',
      label: 'Campus Placement Cell Notice',
      badge: 'Lower Risk',
      shotChannel: 'Email Screenshot',
      shotText:
        'Campus Placement Cell Notice: Northstar Labs campus drive pre-placement talk is scheduled on Friday at 3:00 PM in Seminar Hall B. Apply only on the official university portal.',
    },
    {
      id: 'sc_5',
      label: 'Short Chat Ping',
      badge: 'Insufficient Evidence',
      shotChannel: 'WhatsApp Message',
      shotText: 'Hi Aarav, please share your updated resume PDF when you have a moment.',
    },
  ],
};

export function ScannerPage() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const initialType = (params.get('type') as ScanType) || 'offer_letter';
  const [activeTab, setActiveTab] = useState<ScanType>(
    SCANNER_TABS.some((t) => t.id === initialType) ? initialType : 'offer_letter'
  );

  useEffect(() => {
    const q = params.get('type') as ScanType;
    if (q && SCANNER_TABS.some((t) => t.id === q)) {
      setActiveTab(q);
    }
  }, [params]);

  const switchTab = (tab: ScanType) => {
    setActiveTab(tab);
    setParams({ type: tab });
    setError('');
  };

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Offer Letter State
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [offerPreviewUrl, setOfferPreviewUrl] = useState<string | null>(null);
  const [offerName, setOfferName] = useState('');
  const [offerText, setOfferText] = useState('');

  // Email State
  const [emailSender, setEmailSender] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailHeaders, setEmailHeaders] = useState('');
  const [emailFile, setEmailFile] = useState<File | null>(null);

  // URL State
  const [targetUrl, setTargetUrl] = useState('');
  const [claimedCompany, setClaimedCompany] = useState('');

  // JD State
  const [jdTitle, setJdTitle] = useState('');
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState<File | null>(null);

  // Screenshot State (2-step OCR + human review)
  const [shotFile, setShotFile] = useState<File | null>(null);
  const [shotPreviewUrl, setShotPreviewUrl] = useState<string | null>(null);
  const [shotChannel, setShotChannel] = useState('WhatsApp Message');
  const [shotOcrText, setShotOcrText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrNotice, setOcrNotice] = useState('');

  useEffect(() => {
    const state = location.state as { rescanFrom?: ScanRecord } | null;
    const prev = state?.rescanFrom;
    if (!prev) return;
    const ext = prev.extractedInformation;
    setActiveTab(prev.scanType);
    if (prev.scanType === 'offer_letter') {
      setOfferName(prev.scanName);
      setOfferText(
        [
          ext.companyName ? `Company: ${ext.companyName}` : '',
          ext.jobTitle ? `Role: ${ext.jobTitle}` : '',
          ext.salary ? `Compensation: ${ext.salary}` : '',
          ext.recruiterEmail ? `Recruiter Email: ${ext.recruiterEmail}` : '',
          ext.website || ext.applicationUrl ? `Website: ${ext.website || ext.applicationUrl}` : '',
          ext.paymentInstructions ? `Payment Instructions: ${ext.paymentInstructions}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      );
    } else if (prev.scanType === 'email') {
      setEmailSender(ext.recruiterEmail || '');
      setEmailSubject(prev.scanName.replace(/^Email:\s*/i, ''));
      setEmailBody(
        [
          ext.companyName ? `Company: ${ext.companyName}` : '',
          ext.website || ext.applicationUrl ? `Link: ${ext.website || ext.applicationUrl}` : '',
          ext.paymentInstructions ? `Payment Note: ${ext.paymentInstructions}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      );
    } else if (prev.scanType === 'url') {
      setTargetUrl(ext.website || ext.applicationUrl || prev.inputReference || '');
      setClaimedCompany(ext.companyName || '');
    } else if (prev.scanType === 'job_description') {
      setJdTitle(ext.jobTitle || prev.scanName.replace(/^JD:\s*/i, ''));
      setJdText(
        [
          ext.companyName ? `Company: ${ext.companyName}` : '',
          ext.salary ? `Salary: ${ext.salary}` : '',
          ext.applicationUrl ? `Application URL: ${ext.applicationUrl}` : '',
          ext.paymentInstructions ? `Payment Note: ${ext.paymentInstructions}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      );
    } else if (prev.scanType === 'screenshot') {
      setShotOcrText(
        [
          ext.companyName ? `Company: ${ext.companyName}` : '',
          ext.recruiterEmail ? `Contact: ${ext.recruiterEmail}` : '',
          ext.paymentInstructions ? `Payment Request: ${ext.paymentInstructions}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      );
    }
    showToast(`Pre-filled ${prev.scanName} for rescan — review or update inputs before running.`, 'info');
  }, [location.state, showToast]);

  useEffect(() => {
    return () => {
      if (offerPreviewUrl) URL.revokeObjectURL(offerPreviewUrl);
    };
  }, [offerPreviewUrl]);

  useEffect(() => {
    return () => {
      if (shotPreviewUrl) URL.revokeObjectURL(shotPreviewUrl);
    };
  }, [shotPreviewUrl]);

  const handleOfferFileChange = (file: File | null) => {
    if (offerPreviewUrl) URL.revokeObjectURL(offerPreviewUrl);
    if (!file) {
      setOfferFile(null);
      setOfferPreviewUrl(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds maximum allowed size of 5 MB.');
      return;
    }
    setError('');
    setOfferFile(file);
    if (file.type.startsWith('image/')) {
      setOfferPreviewUrl(URL.createObjectURL(file));
    } else {
      setOfferPreviewUrl(null);
    }
  };

  const handleShotFileChange = async (file: File | null) => {
    if (shotPreviewUrl) URL.revokeObjectURL(shotPreviewUrl);
    if (!file) {
      setShotFile(null);
      setShotPreviewUrl(null);
      setOcrNotice('');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image exceeds maximum allowed size of 5 MB.');
      return;
    }
    setError('');
    setShotFile(file);
    setShotPreviewUrl(URL.createObjectURL(file));
    setOcrLoading(true);
    setOcrNotice('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiRequest<{
        ocrStatus: string;
        extractedText: string;
        error?: string;
      }>('/api/scans/screenshot-ocr', {
        method: 'POST',
        body: fd,
      });
      if (res.extractedText) {
        setShotOcrText(res.extractedText);
        setOcrNotice(
          'Text extracted via OCR. Review and correct any OCR errors below before running verification.'
        );
      } else {
        setOcrNotice(res.error || 'No text extracted. Please type or paste the message text below.');
      }
    } catch (err) {
      setOcrNotice(
        err instanceof Error ? err.message : 'OCR extraction failed. Paste the text manually below.'
      );
    } finally {
      setOcrLoading(false);
    }
  };

  const applyPreset = (preset: ScannerPreset) => {
    setError('');
    if (activeTab === 'offer_letter') {
      setOfferName(preset.scanName || preset.label);
      setOfferText(preset.offerText || '');
    } else if (activeTab === 'email') {
      setEmailSender(preset.emailSender || '');
      setEmailSubject(preset.emailSubject || '');
      setEmailBody(preset.emailBody || '');
      setEmailHeaders(preset.emailHeaders || '');
    } else if (activeTab === 'url') {
      setTargetUrl(preset.url || '');
      setClaimedCompany(preset.claimedCompany || '');
    } else if (activeTab === 'job_description') {
      setJdTitle(preset.jdTitle || '');
      setJdText(preset.jdText || '');
    } else if (activeTab === 'screenshot') {
      setShotChannel(preset.shotChannel || 'WhatsApp Message');
      setShotOcrText(preset.shotText || '');
    }
    showToast(`Loaded DEMO DATA preset: ${preset.label} (${preset.badge})`, 'info');
  };

  const loadSamplePreset = (variant: 'risky' | 'clean') => {
    const list = SCANNER_PRESETS[activeTab];
    const target = variant === 'risky' ? list[0] : list[3] || list[list.length - 1];
    if (target) applyPreset(target);
  };

  const submitOfferLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!offerFile && !offerText.trim()) {
      setError('Upload an offer letter file or paste offer letter text before starting verification.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (offerFile) fd.append('file', offerFile);
      if (offerText.trim()) fd.append('text', offerText.trim());
      if (offerName.trim()) fd.append('scanName', offerName.trim());
      const res = await apiRequest<{ scan: ScanRecord }>('/api/scans/offer-letter', {
        method: 'POST',
        body: fd,
      });
      showToast('Offer letter verification completed.', 'success');
      navigate(`/student/reports/${res.scan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Offer letter scan failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailFile && !emailBody.trim() && !emailSender.trim()) {
      setError('Enter an email body, sender email, or upload an .eml/image file to analyse.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('senderEmail', emailSender);
      fd.append('subject', emailSubject);
      fd.append('body', emailBody);
      fd.append('rawHeaders', emailHeaders);
      if (emailFile) fd.append('file', emailFile);
      const res = await apiRequest<{ scan: ScanRecord }>('/api/scans/email', {
        method: 'POST',
        body: fd,
      });
      showToast('Email analysis completed.', 'success');
      navigate(`/student/reports/${res.scan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email scan failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!targetUrl.trim()) {
      setError('Please enter a website URL to inspect.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest<{ scan: ScanRecord }>('/api/scans/url', {
        method: 'POST',
        body: JSON.stringify({ url: targetUrl, claimedCompany }),
      });
      showToast('Website security scan completed.', 'success');
      navigate(`/student/reports/${res.scan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'URL scan failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitJobDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!jdFile && !jdText.trim()) {
      setError('Paste a job description or upload a PDF/TXT file to analyse.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('jobTitle', jdTitle);
      fd.append('text', jdText);
      if (jdFile) fd.append('file', jdFile);
      const res = await apiRequest<{ scan: ScanRecord }>('/api/scans/job-description', {
        method: 'POST',
        body: fd,
      });
      showToast('Job description analysis completed.', 'success');
      navigate(`/student/reports/${res.scan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Job description scan failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitScreenshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('text', shotOcrText);
      fd.append('channel', shotChannel);
      if (shotFile) fd.append('file', shotFile);
      const res = await apiRequest<{ scan: ScanRecord }>('/api/scans/screenshot', {
        method: 'POST',
        body: fd,
      });
      showToast('Screenshot and message verification completed.', 'success');
      navigate(`/student/reports/${res.scan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Screenshot verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentTabMeta = SCANNER_TABS.find((t) => t.id === activeTab) || SCANNER_TABS[0];

  return (
    <StudentLayout title="Unified Recruitment Scanner">
      <div className="space-y-6">
        {/* Scanner Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {SCANNER_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-xs font-semibold transition-colors ${
                  active ? tab.activeTabCls : tab.inactiveTabCls
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Photographic Visual Context Banner for Active Scanner */}
        <div className="relative overflow-hidden rounded-2xl border border-[#563653]/25 bg-[#29272B] text-[#F7F0E5] shadow-sm">
          <ResilientImage
            src={currentTabMeta.image}
            alt={currentTabMeta.imageAlt}
            fallbackTitle={currentTabMeta.bannerTitle}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${currentTabMeta.gradientCls}`} />
          <div className="relative z-10 p-6 sm:p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-1.5">
              <p className={`text-xs font-semibold uppercase tracking-wider ${currentTabMeta.badgeTextCls}`}>
                Module 01 · {currentTabMeta.label}
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F7F0E5]">
                {currentTabMeta.bannerTitle}
              </h2>
              <p className="text-sm text-[#F7F0E5]/90 leading-relaxed">
                {currentTabMeta.bannerSubtitle}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => loadSamplePreset('risky')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#F0DFBD]/40 bg-[#29272B]/45 px-3.5 py-2 text-xs font-semibold text-[#F0DFBD] hover:bg-[#29272B]/65 backdrop-blur-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>DEMO DATA: High-Risk Sample</span>
              </button>
              <button
                type="button"
                onClick={() => loadSamplePreset('clean')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#F7F0E5]/30 bg-[#F7F0E5]/15 px-3.5 py-2 text-xs font-semibold text-[#F7F0E5] hover:bg-[#F7F0E5]/25 backdrop-blur-xs"
              >
                <span>DEMO DATA: Lower-Risk Sample</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5 Curated Demo Presets for Active Scanner */}
        <div className={`rounded-2xl border p-4 space-y-2.5 ${currentTabMeta.surfaceCls}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#46304F]">
              DEMO DATA · 5 Quick Test Presets for {currentTabMeta.label}
            </p>
            <span className="text-[11px] text-[#4F3B42]">
              Click any sample to populate realistic test inputs instantly
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {SCANNER_PRESETS[activeTab].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-xl border border-[#563653]/20 bg-[#FFFDF8] px-3 py-2 text-left hover:border-[#46304F] hover:bg-[#F0DFBD]/45 transition-colors"
              >
                <p className="text-xs font-bold text-[#29272B] truncate">{preset.label}</p>
                <p
                  className={`text-[10px] font-bold uppercase mt-0.5 ${
                    preset.badge === 'High Risk'
                      ? 'text-[#842D48]'
                      : preset.badge === 'Suspicious'
                      ? 'text-[#A67F26]'
                      : preset.badge === 'Lower Risk'
                      ? 'text-[#16765B]'
                      : 'text-[#563653]'
                  }`}
                >
                  {preset.badge}
                </p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[#651F35]/30 bg-[#FBEAE3] p-4 text-sm text-[#651F35] flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Offer Letter Scanner — Terracotta, Burnt Orange, Soft Cream */}
        {activeTab === 'offer_letter' && (
          <form
            onSubmit={submitOfferLetter}
            className={`rounded-2xl border ${currentTabMeta.surfaceCls} p-6 space-y-5 shadow-xs`}
          >
            <div>
              <h3 className="font-display text-lg font-bold text-[#651F35]">
                Submit Offer Letter for Inspection
              </h3>
              <p className="text-xs text-[#4F3B42] mt-1">
                Upload a PDF or image offer letter (max 5 MB) or paste its full text. Remember: a
                polished logo does not verify authenticity.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#651F35] mb-1">
                Scan Label <span className="text-[#B85C32] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={offerName}
                onChange={(e) => setOfferName(e.target.value)}
                placeholder="e.g. Acme Tech Internship Offer"
                className="w-full rounded-lg border border-[#C65D45]/30 bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#C65D45] focus:outline-none"
              />
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) handleOfferFileChange(dropped);
              }}
              className="rounded-xl border-2 border-dashed border-[#C65D45]/40 bg-[#FBEAE3]/70 p-6 text-center space-y-3"
            >
              {offerFile ? (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-[#651F35]">
                    {offerFile.name}{' '}
                    <span className="font-mono-tabular text-xs font-normal text-[#B85C32]">
                      ({(offerFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  {offerPreviewUrl && (
                    <img
                      src={offerPreviewUrl}
                      alt="Offer letter preview"
                      className="mx-auto max-h-56 rounded-lg border border-[#C65D45]/25"
                    />
                  )}
                  <div className="flex justify-center gap-3">
                    <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#C65D45]/35 bg-[#FFFDF8] px-3 py-1.5 text-xs font-medium text-[#651F35] cursor-pointer hover:bg-[#FBEAE3]">
                      <Replace className="h-3.5 w-3.5" />
                      <span>Replace File</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                        className="hidden"
                        onChange={(e) => handleOfferFileChange(e.target.files?.[0] || null)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOfferFileChange(null)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#842D48]/35 bg-[#FFFDF8] px-3 py-1.5 text-xs font-medium text-[#842D48] hover:bg-[#FBEAE3]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-7 w-7 text-[#C65D45] mx-auto" />
                  <p className="text-sm font-medium text-[#651F35]">
                    Drag and drop an offer letter here, or browse files
                  </p>
                  <p className="text-xs text-[#B85C32]">
                    Supported formats: PDF, PNG, JPEG, WEBP, TXT · Maximum size: 5 MB
                  </p>
                  <label className="inline-block rounded-lg border border-[#C65D45]/35 bg-[#FFFDF8] px-4 py-2 text-xs font-semibold text-[#651F35] cursor-pointer hover:bg-[#F0DFBD]/65">
                    Browse File
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                      className="hidden"
                      onChange={(e) => handleOfferFileChange(e.target.files?.[0] || null)}
                    />
                  </label>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#651F35] mb-1">
                Or Paste Offer Letter Text
              </label>
              <textarea
                rows={6}
                value={offerText}
                onChange={(e) => setOfferText(e.target.value)}
                placeholder="Paste the full offer letter content including company name, salary, joining date, recruiter email, and any payment instructions..."
                className="w-full rounded-lg border border-[#C65D45]/30 bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#C65D45] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold disabled:opacity-60 ${currentTabMeta.buttonCls}`}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{submitting ? 'Verifying Offer Letter...' : 'Start Verification'}</span>
            </button>
          </form>
        )}

        {/* 2. Email Scanner — Deep Teal, Sage, Pale Mint */}
        {activeTab === 'email' && (
          <form
            onSubmit={submitEmail}
            className={`rounded-2xl border ${currentTabMeta.surfaceCls} p-6 space-y-5 shadow-xs`}
          >
            <div>
              <h3 className="font-display text-lg font-bold text-[#175E60]">
                Submit Recruitment Email
              </h3>
              <p className="text-xs text-[#2B4C4F] mt-1">
                Analyse sender address, Reply-To mismatch, urgency triggers, embedded URLs, and
                optional SPF/DKIM/DMARC headers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#175E60] mb-1">
                  Sender Email Address
                </label>
                <input
                  type="email"
                  value={emailSender}
                  onChange={(e) => setEmailSender(e.target.value)}
                  placeholder="hr@company.example"
                  className="w-full rounded-lg border border-[#A7BEA8] bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#175E60] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#175E60] mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Congratulations! Interview Shortlist"
                  className="w-full rounded-lg border border-[#A7BEA8] bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#175E60] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#175E60] mb-1">
                Email Body Content
              </label>
              <textarea
                rows={6}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Paste the complete email message..."
                className="w-full rounded-lg border border-[#A7BEA8] bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#175E60] focus:outline-none"
              />
            </div>

            <div className={`rounded-xl border p-4 space-y-2 ${currentTabMeta.accentTintCls}`}>
              <label className="block text-sm font-medium text-[#175E60]">
                Original Email Headers{' '}
                <span className="text-[#2B4C4F] font-normal">
                  (Optional — enables SPF/DKIM/DMARC check)
                </span>
              </label>
              <textarea
                rows={3}
                value={emailHeaders}
                onChange={(e) => setEmailHeaders(e.target.value)}
                placeholder="Authentication-Results: spf=pass dkim=pass dmarc=pass..."
                className="w-full rounded-lg border border-[#A7BEA8] bg-[#FFFDF8] px-3.5 py-2.5 font-mono-tabular text-xs text-[#29272B] focus:border-[#175E60] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#175E60] mb-1">
                Or Upload Email File / Screenshot (.eml, .txt, PNG, JPEG)
              </label>
              <input
                type="file"
                accept=".eml,.txt,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setEmailFile(e.target.files?.[0] || null)}
                className="text-sm text-[#2B4C4F]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold disabled:opacity-60 ${currentTabMeta.buttonCls}`}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{submitting ? 'Analysing Email...' : 'Analyse Email'}</span>
            </button>
          </form>
        )}

        {/* 3. URL Scanner — Dark Violet & Muted Lavender */}
        {activeTab === 'url' && (
          <form
            onSubmit={submitUrl}
            className={`rounded-2xl border ${currentTabMeta.surfaceCls} p-6 space-y-5 shadow-xs`}
          >
            <div>
              <h3 className="font-display text-lg font-bold text-[#46304F]">
                Inspect Recruitment Website or Application Link
              </h3>
              <p className="text-xs text-[#563653] mt-1">
                Protected against SSRF, private IPs, and localhost probing. Inspects DNS, RDAP,
                HTTPS certificates, redirects, and Google Web Risk.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#46304F] mb-1">Website URL *</label>
              <input
                type="text"
                required
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://careers.example/apply"
                className="w-full rounded-lg border border-[#B9A5C9]/70 bg-[#FFFDF8] px-3.5 py-2.5 font-mono-tabular text-sm text-[#29272B] focus:border-[#46304F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#46304F] mb-1">
                Claimed Company Name{' '}
                <span className="text-[#563653] font-normal">
                  (Optional — checks domain consistency)
                </span>
              </label>
              <input
                type="text"
                value={claimedCompany}
                onChange={(e) => setClaimedCompany(e.target.value)}
                placeholder="e.g. Infosys, TCS, Northstar Labs"
                className="w-full rounded-lg border border-[#B9A5C9]/70 bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#46304F] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold disabled:opacity-60 ${currentTabMeta.buttonCls}`}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{submitting ? 'Scanning Website...' : 'Scan Website'}</span>
            </button>
          </form>
        )}

        {/* 4. Job Description Scanner — Mustard, Saffron, Warm Beige */}
        {activeTab === 'job_description' && (
          <form
            onSubmit={submitJobDescription}
            className={`rounded-2xl border ${currentTabMeta.surfaceCls} p-6 space-y-5 shadow-xs`}
          >
            <div>
              <h3 className="font-display text-lg font-bold text-[#6B521B]">
                Analyse Job Description
              </h3>
              <p className="text-xs text-[#4F3B42] mt-1">
                Detect unrealistic salary packages, vague employer identity, registration fees, MLM
                structures, or task-based earning traps.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6B521B] mb-1">
                Job Title / Listing Name{' '}
                <span className="text-[#8C6414] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={jdTitle}
                onChange={(e) => setJdTitle(e.target.value)}
                placeholder="e.g. Remote Data Analyst / Part-Time Listing"
                className="w-full rounded-lg border border-[#C69B36]/45 bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#C69B36] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6B521B] mb-1">
                Job Description Text
              </label>
              <textarea
                rows={7}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the job posting, qualifications, compensation, and application instructions..."
                className="w-full rounded-lg border border-[#C69B36]/45 bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#C69B36] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6B521B] mb-1">
                Or Upload PDF / TXT Job Description
              </label>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                className="text-sm text-[#6B521B]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold disabled:opacity-60 ${currentTabMeta.buttonCls}`}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{submitting ? 'Analysing Job Description...' : 'Analyse Job Description'}</span>
            </button>
          </form>
        )}

        {/* 5. Screenshot & Message Scanner — Coral, Dusty Rose, Soft Peach */}
        {activeTab === 'screenshot' && (
          <form
            onSubmit={submitScreenshot}
            className={`rounded-2xl border ${currentTabMeta.surfaceCls} p-6 space-y-5 shadow-xs`}
          >
            <div>
              <h3 className="font-display text-lg font-bold text-[#651F35]">
                Upload Message Screenshot &amp; Review OCR
              </h3>
              <p className="text-xs text-[#4F3B42] mt-1">
                Upload a WhatsApp, Telegram, social ad, or offer screenshot. Review and correct the
                OCR-extracted text before running final verification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#651F35] mb-1">
                  Message Source Channel
                </label>
                <select
                  value={shotChannel}
                  onChange={(e) => setShotChannel(e.target.value)}
                  className="w-full rounded-lg border border-[#B86B77]/45 px-3.5 py-2.5 text-sm bg-[#FFFDF8] text-[#29272B] focus:border-[#E27D70] focus:outline-none"
                >
                  <option value="WhatsApp Message">WhatsApp Message</option>
                  <option value="Telegram Message">Telegram Message</option>
                  <option value="Email Screenshot">Email Screenshot</option>
                  <option value="Social Media Advertisement">Social Media Advertisement</option>
                  <option value="Offer Letter Image">Offer Letter Image</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#651F35] mb-1">
                  Upload Screenshot Image (PNG, JPEG, WEBP)
                </label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={(e) => handleShotFileChange(e.target.files?.[0] || null)}
                  className="w-full text-sm text-[#4F3B42] pt-1.5"
                />
              </div>
            </div>

            {shotPreviewUrl ? (
              <div className={`rounded-xl border p-4 ${currentTabMeta.accentTintCls}`}>
                <img
                  src={shotPreviewUrl}
                  alt="Uploaded recruitment screenshot preview"
                  className="max-h-60 rounded-lg border border-[#B86B77]/35 mx-auto"
                />
              </div>
            ) : (
              shotOcrText.trim().length > 0 && (
                <div className={`rounded-xl border p-4 space-y-2 ${currentTabMeta.accentTintCls}`}>
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#651F35]">
                    <span>Simulated {shotChannel} Capture Preview</span>
                    <span className="font-mono-tabular text-[10px] uppercase">DEMO DATA</span>
                  </div>
                  <div className="rounded-xl border border-[#B86B77]/30 bg-[#FFFDF8] p-3.5 text-sm text-[#29272B] leading-relaxed shadow-xs">
                    {shotOcrText}
                  </div>
                </div>
              )
            )}

            {ocrLoading && (
              <div className="rounded-lg border border-[#E27D70]/35 bg-[#FFFDF8] p-3.5 text-sm text-[#651F35] flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Extracting text from image with OCR...</span>
              </div>
            )}

            {ocrNotice && (
              <div className="rounded-lg border border-[#175E60]/25 bg-[#E7F2F0] p-3.5 text-xs text-[#175E60]">
                {ocrNotice}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#651F35] mb-1">
                Extracted / Message Text{' '}
                <span className="text-[#4F3B42] font-normal">
                  (Verify and correct before scanning)
                </span>
              </label>
              <textarea
                rows={6}
                required
                minLength={20}
                value={shotOcrText}
                onChange={(e) => setShotOcrText(e.target.value)}
                placeholder="Extracted text appears here, or paste the WhatsApp/Telegram message directly..."
                className="w-full rounded-lg border border-[#B86B77]/45 bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#29272B] focus:border-[#E27D70] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || ocrLoading}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold disabled:opacity-60 ${currentTabMeta.buttonCls}`}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{submitting ? 'Analysing Message...' : 'Run Security Verification'}</span>
            </button>
          </form>
        )}
      </div>
    </StudentLayout>
  );
}
