import { GoogleGenAI } from '@google/genai';
import { dbStore } from '../../config/store';
import type { AuthUser, ScanRecord, CommunityReport } from '../../../../src/types/jobshield';

export interface ChatMessageInput {
  sender: 'user' | 'assistant';
  text: string;
  language?: string;
}

export interface ChatAssistantRequest {
  message: string;
  conversationHistory?: ChatMessageInput[];
  preferredLanguage?: string;
  currentRoute?: string;
}

export interface ChatAssistantResponse {
  text: string;
  detectedLanguage: string; // e.g. 'en', 'hi', 'mr', 'gu', 'ta', 'te', 'es', etc.
  detectedLanguageName: string;
  navigationUrl?: string;
  navigationLabel?: string;
  actionData?: Record<string, unknown>;
  sessionId?: string;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to detect language code from text
export function detectLanguageCode(text: string, fallbackPref = 'en'): { code: string; name: string } {
  const clean = text.trim();
  if (!clean) return { code: 'en', name: 'English' };

  // Devanagari Script (Hindi vs Marathi heuristic)
  if (/[\u0900-\u097F]/.test(clean)) {
    // Avoid \b word boundaries for Devanagari Unicode characters
    const isMarathi = /(मला|माझे|माझं|नाव|काय|आहे|बनावट|करावे|सांगा|कशी|येईल|ओळखता|कशा|मिळेल|करू)/i.test(clean);
    if (isMarathi) {
      return { code: 'mr', name: 'Marathi' };
    }
    return { code: 'hi', name: 'Hindi' };
  }

  // Gujarati Script
  if (/[\u0A80-\u0AFF]/.test(clean)) {
    return { code: 'gu', name: 'Gujarati' };
  }

  // Tamil Script
  if (/[\u0B80-\u0BFF]/.test(clean)) {
    return { code: 'ta', name: 'Tamil' };
  }

  // Telugu Script
  if (/[\u0C00-\u0C7F]/.test(clean)) {
    return { code: 'te', name: 'Telugu' };
  }

  // Kannada Script
  if (/[\u0C80-\u0CFF]/.test(clean)) {
    return { code: 'kn', name: 'Kannada' };
  }

  // Malayalam Script
  if (/[\u0D00-\u0D7F]/.test(clean)) {
    return { code: 'ml', name: 'Malayalam' };
  }

  // Bengali Script
  if (/[\u0980-\u09FF]/.test(clean)) {
    return { code: 'bn', name: 'Bengali' };
  }

  // Spanish Heuristic
  if (/\b(hola|cómo|que|nombre|empleo|estafa|gracias|pago)\b/i.test(clean)) {
    return { code: 'es', name: 'Spanish' };
  }

  // French Heuristic
  if (/\b(bonjour|salut|comment|m'appelle|emploi|arnaque|merci)\b/i.test(clean)) {
    return { code: 'fr', name: 'French' };
  }

  // German Heuristic
  if (/\b(hallo|guten|wie|heiße|job|betrug|danke)\b/i.test(clean)) {
    return { code: 'de', name: 'German' };
  }

  if (fallbackPref && fallbackPref !== 'auto' && fallbackPref !== 'en') {
    const langNames: Record<string, string> = {
      hi: 'Hindi',
      mr: 'Marathi',
      gu: 'Gujarati',
      ta: 'Tamil',
      te: 'Telugu',
      kn: 'Kannada',
      ml: 'Malayalam',
      bn: 'Bengali',
      pa: 'Punjabi',
      ur: 'Urdu',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
    };
    return { code: fallbackPref, name: langNames[fallbackPref] || 'English' };
  }

  return { code: 'en', name: 'English' };
}

// Extract conversation memory (e.g. user name, student background, etc.) from history
function extractConversationMemory(history: ChatMessageInput[]): { name?: string; contextNotes: string[] } {
  let name: string | undefined = undefined;
  const contextNotes: string[] = [];

  for (const msg of history) {
    if (msg.sender === 'user') {
      const text = msg.text;
      // Match "My name is X", "I am X", "माझे नाव X आहे", "मेरा नाम X है", "મારું નામ X છે"
      const nameMatchEng = text.match(/(?:my name is|i am|call me)\s+([A-Za-z\u0900-\u097F\u0A80-\u0AFF]{2,20})/i);
      const nameMatchHin = text.match(/(?:मेरा नाम|माझं नाव|माझे नाव|મારું નામ)\s+([A-Za-z\u0900-\u097F\u0A80-\u0AFF]{2,20})/i);
      if (nameMatchEng && !['a', 'the', 'seeking', 'looking', 'student', 'freelancer'].includes(nameMatchEng[1].toLowerCase())) {
        name = nameMatchEng[1];
      } else if (nameMatchHin) {
        name = nameMatchHin[1];
      }

      if (/student|college|fresher|internship/i.test(text)) {
        contextNotes.push('User mentioned being a student or looking for an internship.');
      }
      if (/registration fee|pay|paid|money|upi/i.test(text)) {
        contextNotes.push('User inquired about recruitment fees or payments.');
      }
    }
  }

  return { name, contextNotes: Array.from(new Set(contextNotes)) };
}

export async function processChatAssistantRequest(
  req: ChatAssistantRequest,
  authUser?: AuthUser
): Promise<ChatAssistantResponse> {
  const userMsg = req.message.trim();
  const history = req.conversationHistory || [];
  const prefLang = req.preferredLanguage || 'auto';

  const lang = detectLanguageCode(userMsg, prefLang);
  const memory = extractConversationMemory(history);

  // Retrieve user's own authorized context if logged in
  let userContextSummary = '';
  let userScans: ScanRecord[] = [];
  let userReports: CommunityReport[] = [];

  if (authUser) {
    userScans = dbStore.listScansByUser(authUser.id);
    userReports = dbStore.listReports({ isDemo: authUser.isDemo }).filter(r => r.reporterId === authUser.id);
    userContextSummary = `Logged in User: ${authUser.name} (${authUser.role}, College: ${authUser.college || 'N/A'}).
Authorized Scans Count: ${userScans.length}. High Risk Scans: ${userScans.filter(s => s.riskCategory === 'HIGH_RISK').length}.
Submitted Community Reports: ${userReports.length}.`;
  }

  const aiClient = getGeminiClient();

  if (aiClient) {
    try {
      const historyFormatted = history.map((m) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');

      const systemPrompt = `
You are "JOBSHIELD AI Assistant", an intelligent, friendly, conversational AI guide for the JOBSHIELD recruitment security platform.

CORE INSTRUCTIONS:
1. LANGUAGE REQUIREMENT: You MUST respond in ${lang.name} (${lang.code}). If the user used ${lang.name}, respond fluently and naturally in ${lang.name}. Do NOT switch to English unless explicitly asked.
2. PERSONALITY: Helpful, empathetic, intelligent, clear, natural. Never sound like a rigid template or canned bot.
3. CONVERSATION MEMORY: Remember context.
   - Stored User Name: ${memory.name || authUser?.name || 'Not provided yet'}
   - Context Notes: ${memory.contextNotes.join('; ')}
   - Active User Info: ${userContextSummary}
4. JOBSHIELD PLATFORM KNOWLEDGE:
   - Offer Letter Scanner (/student/scanner?type=offer_letter)
   - Email Scanner (/student/scanner?type=email)
   - URL Scanner (/student/scanner?type=url)
   - Job Description Scanner (/student/scanner?type=job_description)
   - Screenshot Scanner (/student/scanner?type=screenshot)
   - Trust Intelligence & Evidence Graph (/student/trust-intelligence)
   - Community Threat Intelligence (/student/community)
   - User Protection Centre (/student/protection)
   - Scan History (/student/history) & Saved Reports (/student/saved)
   - National Cybercrime Helpline in India: Call 1930 & report on https://cybercrime.gov.in
5. PERSONAL DATA LOOKUPS: If the user asks about their own scans or reports, use their active user info provided above.
6. NAVIGATION SUGGESTIONS: Include relevant JOBSHIELD page links or guidance when appropriate.

OUTPUT FORMAT:
Respond in JSON format with:
{
  "text": "Your helpful conversational answer in ${lang.name}",
  "navigationUrl": "/student/scanner?type=offer_letter", // optional route if relevant
  "navigationLabel": "Open Offer Letter Scanner" // optional action label if relevant
}
`;

      const promptParts = [
        { text: systemPrompt },
        { text: `Conversation History:\n${historyFormatted}` },
        { text: `Current Route Context: ${req.currentRoute || 'N/A'}` },
        { text: `User Message: ${userMsg}` },
      ];

      const response = await aiClient.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts: promptParts },
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawJson = (response.text || '').trim();
      if (rawJson) {
        const parsed = JSON.parse(rawJson.replace(/```json|```/g, ''));
        return {
          text: parsed.text || 'I am here to help you with recruitment verification.',
          detectedLanguage: lang.code,
          detectedLanguageName: lang.name,
          navigationUrl: parsed.navigationUrl || undefined,
          navigationLabel: parsed.navigationLabel || undefined,
        };
      }
    } catch (err) {
      console.warn('Gemini chat request fallback:', err instanceof Error ? err.message : err);
    }
  }

  // --- INTELLIGENT MULTILINGUAL FALLBACK ENGINE ---
  // Runs if Gemini API key is unset or transient error occurs
  return generateIntelligentFallbackResponse(userMsg, history, lang, memory, authUser, userScans, userReports);
}

function generateIntelligentFallbackResponse(
  userMsg: string,
  history: ChatMessageInput[],
  lang: { code: string; name: string },
  memory: { name?: string; contextNotes: string[] },
  authUser?: AuthUser,
  userScans: ScanRecord[] = [],
  userReports: CommunityReport[] = []
): ChatAssistantResponse {
  const lower = userMsg.toLowerCase();
  const userName = memory.name || authUser?.name;

  // 1. GREETINGS & INTRODUCTIONS
  if (/^(hi|hello|hey|namaste|greetings|hola|bonjour|hallo)\b/i.test(lower) || /^(नमस्ते|नमस्कार|केम छो|કેમ છો)/.test(userMsg)) {
    if (lang.code === 'hi') {
      return {
        text: userName
          ? `नमस्ते ${userName}! JOBSHIELD AI असिस्टेंट में आपका स्वागत है। मैं आज आपकी क्या सहायता कर सकता हूँ?`
          : 'नमस्ते! JOBSHIELD AI असिस्टेंट में आपका स्वागत है। आप मुझसे जॉब स्कैम, ऑफर लेटर जांच, या सुरक्षा युक्तियों के बारे में पूछ सकते हैं।',
        detectedLanguage: 'hi',
        detectedLanguageName: 'Hindi',
      };
    }
    if (lang.code === 'mr') {
      return {
        text: userName
          ? `नमस्कार ${userName}! JOBSHIELD AI असिस्टंटमध्ये आपले स्वागत आहे. मी आज आपल्याला कशी मदत करू शकतो?`
          : 'नमस्कार! JOBSHIELD AI असिस्टंटमध्ये आपले स्वागत आहे. आपण मला नोकरीतील फसवणूक, ऑफर लेटर तपासणी किंवा सुरक्षा उपायांबद्दल विचारू शकता.',
        detectedLanguage: 'mr',
        detectedLanguageName: 'Marathi',
      };
    }
    if (lang.code === 'gu') {
      return {
        text: userName
          ? `નમસ્તે ${userName}! JOBSHIELD AI આસિસ્ટન્ટમાં આપનું સ્વાગત છે. હું આજે તમને કેવી રીતે મદદ કરી શકું?`
          : 'નમસ્તે! JOBSHIELD AI આસિસ્ટન્ટમાં આપનું સ્વાગત છે. તમે મને નોકરીના કૌભાંડો, ઓફર લેટર તપાસ અથવા સુરક્ષા ટિપ્સ વિશે પૂછી શકો છો.',
        detectedLanguage: 'gu',
        detectedLanguageName: 'Gujarati',
      };
    }
    return {
      text: userName
        ? `Hello ${userName}! Welcome back to JOBSHIELD. How can I assist you today?`
        : 'Hello! Welcome to JOBSHIELD. I am your AI safety assistant. How can I help you today?',
      detectedLanguage: 'en',
      detectedLanguageName: 'English',
    };
  }

  // 2. NAME INTRODUCTIONS & NAME RECALL
  if (/my name is|i am|माझे नाव|माझं नाव|मेरा नाम|મારું નામ/i.test(userMsg)) {
    if (lang.code === 'hi') {
      return {
        text: `आपसे मिलकर खुशी हुई, ${userName || 'मित्र'}! मैंने आपका नाम नोट कर लिया है। आज मैं आपकी करियर सुरक्षा में कैसे मदद कर सकता हूँ?`,
        detectedLanguage: 'hi',
        detectedLanguageName: 'Hindi',
      };
    }
    if (lang.code === 'mr') {
      return {
        text: `आपल्याला भेटून आनंद झाला, ${userName || 'मित्र'}! मी आपले नाव लक्षात ठेवले आहे. आज मी आपल्याला कशी मदत करू शकतो?`,
        detectedLanguage: 'mr',
        detectedLanguageName: 'Marathi',
      };
    }
    if (lang.code === 'gu') {
      return {
        text: `તમને મળીને આનંદ થયો, ${userName || 'મિત્ર'}! હું તમારું નામ યાદ રાખીશ. આજે હું તમને કેવી રીતે મદદ કરી શકું?`,
        detectedLanguage: 'gu',
        detectedLanguageName: 'Gujarati',
      };
    }
    return {
      text: `Nice to meet you, ${userName || 'there'}! I've noted your name in our conversation context. How can I assist you today?`,
      detectedLanguage: 'en',
      detectedLanguageName: 'English',
    };
  }

  if (/what is my name|do you know my name|मेरा नाम क्या है|माझे नाव काय आहे|મારું નામ શું છે/i.test(lower)) {
    if (userName) {
      if (lang.code === 'hi') {
        return { text: `आपका नाम ${userName} है।`, detectedLanguage: 'hi', detectedLanguageName: 'Hindi' };
      }
      if (lang.code === 'mr') {
        return { text: `आपले नाव ${userName} आहे.`, detectedLanguage: 'mr', detectedLanguageName: 'Marathi' };
      }
      if (lang.code === 'gu') {
        return { text: `તમારું નામ ${userName} છે.`, detectedLanguage: 'gu', detectedLanguageName: 'Gujarati' };
      }
      return { text: `Your name is ${userName}.`, detectedLanguage: 'en', detectedLanguageName: 'English' };
    } else {
      return {
        text: lang.code === 'hi'
          ? 'आपने अभी तक मुझे अपना नाम नहीं बताया है। आप मुझे अपना नाम बता सकते हैं!'
          : lang.code === 'mr'
          ? 'आपण मला अद्याप आपले नाव सांगितले नाही. आपण मला आपले नाव सांगू शकता!'
          : lang.code === 'gu'
          ? 'તમે મને હજુ સુધી તમારું નામ નથી કહ્યું. તમે મને તમારું નામ કહી શકો છો!'
          : 'You haven\'t shared your name with me yet. Feel free to introduce yourself!',
        detectedLanguage: lang.code,
        detectedLanguageName: lang.name,
      };
    }
  }

  // 3. FAKE JOB / INTERNSHIP IDENTIFICATION GUIDANCE
  if (/fake job|fake internship|identify|banaavatu|फर्जी नौकरी|बनावट नोकरी|નકલી નોકરી/i.test(lower) || /(बनावट|ओळखता|फर्जी)/.test(userMsg)) {
    if (lang.code === 'mr') {
      return {
        text: 'बनावट नोकरी किंवा इंटर्नशिप ओळखण्यासाठी या ५ गोष्टी तपासा:\n१. कोणतीही खरी कंपनी नोकरीसाठी नोंदणी किंवा लॅपटॉप फी मागत नाही.\n२. ईमेल आयडी @gmail.com ऐवजी कंपनीच्या अधिकृत डोमेनचा आहे का ते तपासा.\n३. मुलाखतीशिवाय थेट अपॉइंटमेंट लेटर आल्यास सावध रहा.\n४. टेलिग्राम किंवा व्हॉट्सॲप टास्कद्वारे पैशांचे आमिष दाखवल्यास ती फसवणूक आहे.\n५. JOBSHIELD मधील ऑफर लेटर स्कॅनर वापरून लेटर लगेच तपासा.',
        detectedLanguage: 'mr',
        detectedLanguageName: 'Marathi',
        navigationUrl: '/student/scanner?type=offer_letter',
        navigationLabel: 'ऑफर लेटर स्कॅन करा',
      };
    }
    if (lang.code === 'hi') {
      return {
        text: 'फर्जी नौकरी या इंटर्नशिप की पहचान करने के मुख्य तरीके:\n1. कोई भी वास्तविक कंपनी शामिल होने से पहले पैसे नहीं मांगती।\n2. भर्तीकर्ता का ईमेल आधिकारिक कंपनी डोमेन से होना चाहिए, न कि मुफ्त Gmail/Outlook से।\n3. बिना इंटरव्यू के सीधा अपॉइंटमेंट लेटर मिलने पर सावधान रहें।\n4. JOBSHIELD के ऑफर लेटर या URL स्कैनर में लिंक और लेटर स्कैन करें।',
        detectedLanguage: 'hi',
        detectedLanguageName: 'Hindi',
        navigationUrl: '/student/scanner?type=offer_letter',
        navigationLabel: 'ऑफर लेटर स्कैन करें',
      };
    }
    if (lang.code === 'gu') {
      return {
        text: 'નકલી નોકરી કે ઈન્ટર્નશિપ ઓળખવાની રીતો:\n1. સાચી કંપની ક્યારેય રજીસ્ટ્રેશન કે ડિપોઝિટ ફી માંગતી નથી.\n2. ઈમેલ રીક્રુટરના ઓફિશિયલ ડોમેન પરથી હોવો જોઈએ.\n3. ઇન્ટરવ્યુ વિના સીધી પસંદગી થાય તો સાવધ રહો.\n4. JOBSHIELD ના ઓફર લેટર સ્કેનર વડે ચકાસણી કરો.',
        detectedLanguage: 'gu',
        detectedLanguageName: 'Gujarati',
        navigationUrl: '/student/scanner?type=offer_letter',
        navigationLabel: 'ઓફર લેટર સ્કેન કરો',
      };
    }
    return {
      text: 'Here are the key warning signs of a fake job or internship offer:\n1. Unsolicited Selection: Offer received without a formal technical or HR interview.\n2. Advance Payment Clause: Demanding fees for registration, laptop delivery, or training kits.\n3. Consumer Webmail: Recruiter communicates via free Gmail/Outlook instead of the official company domain.\n4. Urgent Deadlines: Forcing you to transfer UPI money within hours.\n\nYou can upload any offer letter PDF or paste a message into JOBSHIELD Scanner to verify it instantly!',
      detectedLanguage: 'en',
      detectedLanguageName: 'English',
      navigationUrl: '/student/scanner?type=offer_letter',
      navigationLabel: 'Open Offer Letter Scanner',
    };
  }

  // 4. PERSONAL SCAN & REPORT DATA LOOKUPS
  if (/my recent scans|my latest scan|show my scans|my high risk|मेरी स्कैन|माझे स्कॅन|મારી સ્કેન/i.test(lower)) {
    if (userScans.length > 0) {
      const latest = userScans[0];
      const highRisk = userScans.filter(s => s.riskCategory === 'HIGH_RISK');

      let summaryText = `You have performed ${userScans.length} total security scans. Your latest scan is "${latest.scanName}" with risk level ${latest.riskCategory.replace('_', ' ')} (Score: ${latest.riskScore}/100).`;
      if (highRisk.length > 0) {
        summaryText += ` You have ${highRisk.length} high-risk scan(s) that required attention.`;
      }

      if (lang.code === 'hi') {
        summaryText = `आपने कुल ${userScans.length} सुरक्षा स्कैन किए हैं। आपका नवीनतम स्कैन "${latest.scanName}" है (जोखिम स्तर: ${latest.riskCategory})। आपके पास ${highRisk.length} उच्च-जोखिम वाले परिणाम हैं।`;
      } else if (lang.code === 'mr') {
        summaryText = `आपण एकूण ${userScans.length} सुरक्षा स्कॅन केले आहेत. आपला अलिकडील स्कॅन "${latest.scanName}" आहे (धोका पातळी: ${latest.riskCategory}).`;
      } else if (lang.code === 'gu') {
        summaryText = `તમે કુલ ${userScans.length} સુરક્ષા સ્કેન કર્યા છે. તમારું તાજેતરનું સ્કેન "${latest.scanName}" છે (જોખમ સ્તર: ${latest.riskCategory}).`;
      }

      return {
        text: summaryText,
        detectedLanguage: lang.code,
        detectedLanguageName: lang.name,
        navigationUrl: '/student/history',
        navigationLabel: 'View Full Scan History',
      };
    } else {
      return {
        text: 'You haven\'t performed any security scans yet. You can scan an offer letter, email, website URL, job description, or chat screenshot anytime.',
        detectedLanguage: lang.code,
        detectedLanguageName: lang.name,
        navigationUrl: '/student/scanner',
        navigationLabel: 'Launch Scanner',
      };
    }
  }

  if (/my saved reports|saved reports|माझे सेव्ह केलेले रिपोर्ट|मेरी सेव रिपोर्ट/i.test(lower)) {
    const saved = userScans.filter(s => s.saved);
    return {
      text: `You currently have ${saved.length} saved security report(s) in your bookmarks.`,
      detectedLanguage: lang.code,
      detectedLanguageName: lang.name,
      navigationUrl: '/student/saved',
      navigationLabel: 'Manage Saved Reports',
    };
  }

  if (/status of my community report|my report status|मेरे रिपोर्ट की स्थिति|माझ्या रिपोर्टची स्थिती/i.test(lower)) {
    if (userReports.length > 0) {
      const rep = userReports[0];
      return {
        text: `Your submitted community report regarding "${rep.companyName || rep.category}" is currently marked as ${rep.moderationStatus.replace('_', ' ')}.`,
        detectedLanguage: lang.code,
        detectedLanguageName: lang.name,
        navigationUrl: '/student/community?tab=mine',
        navigationLabel: 'View My Community Reports',
      };
    } else {
      return {
        text: 'You have not submitted any community threat reports yet. If you encounter a suspicious job offer, you can report it to warn others.',
        detectedLanguage: lang.code,
        detectedLanguageName: lang.name,
        navigationUrl: '/student/community?new=1',
        navigationLabel: 'Submit a Threat Report',
      };
    }
  }

  // 5. GENERAL KNOWLEDGE (e.g. "What is AI?")
  if (/what is artificial intelligence|what is ai|आर्टिफिशियल इंटेलिजेंस क्या है|कृत्रिम बुद्धिमत्ता म्हणजे काय/i.test(lower)) {
    if (lang.code === 'hi') {
      return {
        text: 'आर्टिफिशियल इंटेलिजेंस (AI) कंप्यूटर साइंस की एक शाखा है जो कंप्यूटर और मशीनों को इंसानों की तरह सोचने, सीखने, समस्या सुलझाने और निर्णय लेने में सक्षम बनाती है।',
        detectedLanguage: 'hi',
        detectedLanguageName: 'Hindi',
      };
    }
    if (lang.code === 'mr') {
      return {
        text: 'कृत्रिम बुद्धिमत्ता (AI) ही संगणक शास्त्राची एक शाखा आहे जी संगणक आणि यंत्रांना मानवाप्रमाणे विचार करण्यास, शिकण्यास आणि निर्णय घेण्यास सक्षम करते.',
        detectedLanguage: 'mr',
        detectedLanguageName: 'Marathi',
      };
    }
    if (lang.code === 'gu') {
      return {
        text: 'આર્ટિફિશિયલ ઇન્ટેલિજન્સ (AI) કોમ્પ્યુટર વિજ્ઞાનની એક શાખા છે જે કોમ્પ્યુટર અને મશીનોને માણસોની જેમ વિચારવા, શીખવા અને નિર્ણયો લેવા માટે સક્ષમ બનાવે છે.',
        detectedLanguage: 'gu',
        detectedLanguageName: 'Gujarati',
      };
    }
    return {
      text: 'Artificial Intelligence (AI) is a field of computer science that enables systems to perform tasks that typically require human intelligence, such as learning, pattern recognition, decision-making, and natural language processing.',
      detectedLanguage: 'en',
      detectedLanguageName: 'English',
    };
  }

  // 6. RECRUITMENT FRAUD & PAYMENT ADVICE
  if (/fee|pay|paid|money|deposit|registration|₹|rs|पैसे|फीस|फी|રૂપિયા/i.test(lower)) {
    if (lang.code === 'hi') {
      return {
        text: 'महत्वपूर्ण नियम: कोई भी वास्तविक कंपनी नौकरी या इंटर्नशिप देने के लिए पंजीकरण शुल्क, लैपटॉप जमा राशि, या प्रशिक्षण फीस की मांग नहीं करती है। अगर किसी ने आपसे पैसे मांगे हैं, तो भुगतान न करें और आधिकारिक कंपनी वेबसाइट पर सत्यापित करें। यदि आप पहले ही भुगतान कर चुके हैं, तो तुरंत अपने बैंक से संपर्क करें और साइबर क्राइम हेल्पलाइन 1930 पर कॉल करें।',
        detectedLanguage: 'hi',
        detectedLanguageName: 'Hindi',
        navigationUrl: '/student/protection',
        navigationLabel: 'सुरक्षा केंद्र देखें',
      };
    }
    if (lang.code === 'mr') {
      return {
        text: 'महत्त्वाचा नियम: कोणतीही खरी कंपनी नोकरी किंवा इंटर्नशिपसाठी नोंदणी शुल्क, लॅपटॉप डिपॉझिट किंवा ट्रेनिंग फी मागत नाही. जर कोणी पैसे मागितले असतील तर पैसे देऊ नका. तुम्ही आधीच पैसे भरले असल्यास, लगेच तुमच्या बँकेशी संपर्क साधा आणि सायबर क्राइम हेल्पलाइन 1930 वर कॉल करा.',
        detectedLanguage: 'mr',
        detectedLanguageName: 'Marathi',
        navigationUrl: '/student/protection',
        navigationLabel: 'सुरक्षा केंद्र पहा',
      };
    }
    if (lang.code === 'gu') {
      return {
        text: 'મહત્વપૂર્ણ નિયમ: કોઈ પણ સાચી કંપની નોકરી કે ઈન્ટર્નશિપ માટે રજીસ્ટ્રેશન ફી, લેપટોપ ડિપોઝિટ કે તાલીમ ફી માંગતી નથી. જો કોઈએ તમારી પાસે પૈસા માંગ્યા હોય તો ચૂકવણી કરશો નહીં. જો તમે પહેલેથી જ ચૂકવણી કરી દીધી હોય, તો તરત જ તમારી બેંકનો સંપર્ક કરો અને સાયબર ક્રાઇમ હેલ્પલાઇન 1930 પર કૉલ કરો.',
        detectedLanguage: 'gu',
        detectedLanguageName: 'Gujarati',
        navigationUrl: '/student/protection',
        navigationLabel: 'સુરક્ષા કેન્દ્ર જુઓ',
      };
    }
    return {
      text: 'Golden Rule: Legitimate employers NEVER demand registration fees, laptop deposits, training kit charges, or caution money before joining. If you have been asked to pay, refrain from transferring funds and verify the recruiter\'s official domain. If you have already lost money to a scam in India, contact your bank immediately and call the Cybercrime Helpline at 1930.',
      detectedLanguage: 'en',
      detectedLanguageName: 'English',
      navigationUrl: '/student/protection',
      navigationLabel: 'Open Protection Centre',
    };
  }

  // 7. JOBSHIELD FEATURES EXPLANATION & NAVIGATION
  if (/scan offer letter|offer letter scanner|ऑफर लेटर/i.test(lower)) {
    return {
      text: lang.code === 'hi'
        ? 'ऑफर लेटर स्कैनर में आप अपना ऑफर लेटर PDF या इमेज अपलोड कर सकते हैं। सिस्टम कंपनी डोमेन, फीस की शर्तें और भर्तीकर्ता की ईमेल आईडी की जांच करता है।'
        : lang.code === 'mr'
        ? 'ऑफर लेटर स्कॅनरमध्ये आपण आपले ऑफर लेटर PDF किंवा इमेज अपलोड करू शकता. सिस्टीम कंपनीचे डोमेन आणि फीच्या अटी तपासते.'
        : lang.code === 'gu'
        ? 'ઓફર લેટર સ્કેનરમાં તમે તમારો ઓફર લેટર PDF અથવા ઈમેજ અપલોડ કરી શકો છો.'
        : 'The Offer Letter Scanner analyzes appointment PDFs or images for unverified webmail, advance deposit demands, and lookalike domain red flags.',
      detectedLanguage: lang.code,
      detectedLanguageName: lang.name,
      navigationUrl: '/student/scanner?type=offer_letter',
      navigationLabel: 'Open Offer Letter Scanner',
    };
  }

  if (/check website|url scanner|suspicious url|वेबसाइट/i.test(lower)) {
    return {
      text: lang.code === 'hi'
        ? 'आप URL स्कैनर का उपयोग करके संदिग्ध भर्ती वेबसाइटों, लुकअलाइक्स और अनएन्क्रिप्टेड भुगतान लिंक की जांच कर सकते हैं।'
        : 'You can verify suspicious job application links, recruitment domains, and checkout portals using the URL Scanner.',
      detectedLanguage: lang.code,
      detectedLanguageName: lang.name,
      navigationUrl: '/student/scanner?type=url',
      navigationLabel: 'Open URL Scanner',
    };
  }

  if (/evidence graph|trust graph|ग्राफ/i.test(lower)) {
    return {
      text: lang.code === 'hi'
        ? 'एविडेंस ग्राफ कंपनी, डोमेन, भर्तीकर्ता, ईमेल, ऑफर लेटर और भुगतान अनुरोधों के बीच के संबंधों को दृश्य रूप से दिखाता है।'
        : 'The Evidence Graph maps visual connections between companies, official domains, recruiters, emails, offer letters, application URLs, and payment requests.',
      detectedLanguage: lang.code,
      detectedLanguageName: lang.name,
      navigationUrl: '/student/trust-intelligence',
      navigationLabel: 'Open Evidence Graph',
    };
  }

  // DEFAULT CONVERSATIONAL RESPONSE
  if (lang.code === 'hi') {
    return {
      text: `धन्यवाद ${userName ? userName + ' ' : ''}! मैं JOBSHIELD AI असिस्टेंट हूँ। आप मुझसे ऑफर लेटर जांचने, फर्जी कंपनियों की पहचान करने, या सुरक्षा दिशानिर्देशों के बारे में पूछ सकते हैं। आप क्या जानना चाहेंगे?`,
      detectedLanguage: 'hi',
      detectedLanguageName: 'Hindi',
    };
  }
  if (lang.code === 'mr') {
    return {
      text: `धन्यवाद ${userName ? userName + ' ' : ''}! मी JOBSHIELD AI असिस्टंट आहे. आपण मला ऑफर लेटर तपासणी, बनावट कंपन्या ओळखणे किंवा सुरक्षा मार्गदर्शक तत्त्वांविषयी विचारू शकता.`,
      detectedLanguage: 'mr',
      detectedLanguageName: 'Marathi',
    };
  }
  if (lang.code === 'gu') {
    return {
      text: `આભાર ${userName ? userName + ' ' : ''}! હું JOBSHIELD AI આસિસ્ટન્ટ છું. તમે મને ઓફર લેટર તપાસવા અથવા સુરક્ષા માર્ગદર્શિકા વિશે પૂછી શકો છો.`,
      detectedLanguage: 'gu',
      detectedLanguageName: 'Gujarati',
    };
  }

  return {
    text: `Thank you ${userName ? userName + ' ' : ''}! As your JOBSHIELD AI Assistant, I can help you evaluate job offers, detect scams, explain security risk levels, or guide you through platform tools. What would you like to explore?`,
    detectedLanguage: 'en',
    detectedLanguageName: 'English',
  };
}
