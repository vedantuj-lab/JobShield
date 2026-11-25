export type ChatSender = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  timestamp: string;
  language?: string;
  languageName?: string;
  navigationUrl?: string;
  navigationLabel?: string;
  isVoiceInput?: boolean;
}

export interface ConversationSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  language?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  sttLang: string;
  ttsLang: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', name: 'Auto-Detect', nativeName: 'Auto Detect', sttLang: 'en-IN', ttsLang: 'en-IN' },
  { code: 'en', name: 'English', nativeName: 'English', sttLang: 'en-IN', ttsLang: 'en-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', sttLang: 'hi-IN', ttsLang: 'hi-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', sttLang: 'mr-IN', ttsLang: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', sttLang: 'gu-IN', ttsLang: 'gu-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', sttLang: 'ta-IN', ttsLang: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', sttLang: 'te-IN', ttsLang: 'te-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', sttLang: 'kn-IN', ttsLang: 'kn-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', sttLang: 'ml-IN', ttsLang: 'ml-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', sttLang: 'bn-IN', ttsLang: 'bn-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', sttLang: 'pa-IN', ttsLang: 'pa-IN' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', sttLang: 'ur-IN', ttsLang: 'ur-IN' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', sttLang: 'es-ES', ttsLang: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', sttLang: 'fr-FR', ttsLang: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', sttLang: 'de-DE', ttsLang: 'de-DE' },
];

export interface PresetPrompt {
  id: string;
  label: string;
  prompt: string;
  badge: string;
  langCode: string;
}

export const PRESET_CHAT_PROMPTS: PresetPrompt[] = [
  {
    id: 'pr_1',
    label: '👋 Greeting',
    prompt: 'Hi, tell me about JOBSHIELD',
    badge: 'English',
    langCode: 'en',
  },
  {
    id: 'pr_2',
    label: '👤 Introduction',
    prompt: 'My name is Vedant and I am a college student',
    badge: 'Memory Test',
    langCode: 'en',
  },
  {
    id: 'pr_3',
    label: '📋 Internship Safety',
    prompt: 'What should I check before applying for an internship?',
    badge: 'Checklist',
    langCode: 'en',
  },
  {
    id: 'pr_4',
    label: '⚠️ Registration Fee Scam',
    prompt: 'A recruiter asked me to pay ₹1,500 for a registration kit fee. What should I do?',
    badge: 'Scam Advice',
    langCode: 'en',
  },
  {
    id: 'pr_5',
    label: '🔍 Offer Letter Scanning',
    prompt: 'How do I scan an offer letter on JOBSHIELD?',
    badge: 'Guide',
    langCode: 'en',
  },
  {
    id: 'pr_6',
    label: '🇮🇳 हिंदी - नौकरी स्कैम',
    prompt: 'अगर कोई नौकरी देने से पहले पैसे मांगता है तो मुझे क्या करना चाहिए?',
    badge: 'Hindi',
    langCode: 'hi',
  },
  {
    id: 'pr_7',
    label: '🇮🇳 मराठी - बनावट नोकरी',
    prompt: 'मला बनावट नोकरीची ऑफर कशी ओळखता येईल?',
    badge: 'Marathi',
    langCode: 'mr',
  },
  {
    id: 'pr_8',
    label: '🇮🇳 ગુજરાતી - નકલી ઓફર',
    prompt: 'જો કોઈ નોકરી આપતા પહેલાં પૈસા માંગે તો મારે શું કરવું જોઈએ?',
    badge: 'Gujarati',
    langCode: 'gu',
  },
  {
    id: 'pr_9',
    label: '📊 My Recent Scans',
    prompt: 'Show me my recent high-risk scans',
    badge: 'Personal Data',
    langCode: 'en',
  },
  {
    id: 'pr_10',
    label: '💳 Already Paid Money',
    prompt: 'What if I have already paid money to a scammer?',
    badge: 'Emergency',
    langCode: 'en',
  },
];
