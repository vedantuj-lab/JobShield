import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  ChevronDown,
  Globe,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  Trash2,
  User,
  Volume2,
  X,
  History,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../services/api';
import {
  ChatMessage,
  ConversationSession,
  PRESET_CHAT_PROMPTS,
  PresetPrompt,
  SUPPORTED_LANGUAGES,
} from '../../types/chat';
import { VoiceControls, useVoiceSynthesis } from './VoiceControls';

const STORAGE_KEY_SESSIONS = 'jobshield_ai_chat_sessions_v1';
const STORAGE_KEY_ACTIVE_ID = 'jobshield_ai_chat_active_id_v1';

export function AIChatDrawer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [muted, setMuted] = useState(false);

  const { speak, stop, speaking } = useVoiceSynthesis();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load sessions from localStorage or initialize primary session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);

      if (saved) {
        const parsed: ConversationSession[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(savedActiveId && parsed.some((s) => s.id === savedActiveId) ? savedActiveId : parsed[0].id);
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Default Initial Session
    const initialSession: ConversationSession = {
      id: `session_${Date.now()}`,
      title: 'General Safety Consultation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg_welcome',
          sender: 'assistant',
          text: `Hello${user ? ' ' + user.name : ''}! I am JOBSHIELD AI Assistant, your intelligent recruitment safety guide. Ask me anything about job offer verification, identifying scams, or navigating JOBSHIELD features in English, Hindi (हिंदी), Marathi (मराठी), Gujarati (ગુજરાતી), or your preferred language!`,
          timestamp: new Date().toISOString(),
          language: 'en',
          languageName: 'English',
        },
      ],
    };

    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    }
    if (activeSessionId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeSessionId);
    }
  }, [sessions, activeSessionId]);

  // Scroll to latest message
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, sessions, activeSessionId, isProcessing]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const createNewSession = () => {
    const newSession: ConversationSession = {
      id: `session_${Date.now()}`,
      title: `Conversation ${sessions.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg_init_${Date.now()}`,
          sender: 'assistant',
          text: `Hello! I am JOBSHIELD AI Assistant. How can I help you today? You can type or use voice in English, Hindi, Marathi, Gujarati, or any preferred language.`,
          timestamp: new Date().toISOString(),
          language: 'en',
          languageName: 'English',
        },
      ],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setShowHistorySidebar(false);
  };

  const clearCurrentSessionMessages = () => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            updatedAt: new Date().toISOString(),
            messages: [
              {
                id: `msg_cleared_${Date.now()}`,
                sender: 'assistant',
                text: 'Conversation history cleared. How can I assist you with your recruitment safety questions?',
                timestamp: new Date().toISOString(),
                language: 'en',
                languageName: 'English',
              },
            ],
          };
        }
        return s;
      })
    );
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      createNewSession();
      return;
    }
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated[0].id);
    }
  };

  const handleSendMessage = async (customText?: string, isVoice = false) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isProcessing) return;

    if (!customText) {
      setInputText('');
    }

    stop(); // Stop any active speech

    const userMessage: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
      isVoiceInput: isVoice,
    };

    // Update session immediately with user message
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const isFirstUserMsg = s.messages.filter((m) => m.sender === 'user').length === 0;
          const updatedTitle = isFirstUserMsg ? textToSend.slice(0, 32) + (textToSend.length > 32 ? '...' : '') : s.title;
          return {
            ...s,
            title: updatedTitle,
            updatedAt: new Date().toISOString(),
            messages: [...s.messages, userMessage],
          };
        }
        return s;
      })
    );

    setIsProcessing(true);

    try {
      const currentHistory = (activeSession?.messages || []).map((m) => ({
        sender: m.sender,
        text: m.text,
        language: m.language,
      }));

      // Call backend AI Chat endpoint
      const response = await apiRequest<{
        text: string;
        detectedLanguage: string;
        detectedLanguageName: string;
        navigationUrl?: string;
        navigationLabel?: string;
      }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: [...currentHistory, { sender: 'user', text: textToSend }],
          preferredLanguage: selectedLanguage,
          currentRoute: location.pathname,
        }),
      });

      const assistantMessage: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toISOString(),
        language: response.detectedLanguage,
        languageName: response.detectedLanguageName,
        navigationUrl: response.navigationUrl,
        navigationLabel: response.navigationLabel,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              updatedAt: new Date().toISOString(),
              messages: [...s.messages, assistantMessage],
            };
          }
          return s;
        })
      );

      // Auto-vocalize response if unmuted
      if (!muted) {
        speak(response.text, response.detectedLanguage, false);
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        text: 'I encountered an error connecting to the AI Assistant. Please check your connection and try sending your message again.',
        timestamp: new Date().toISOString(),
        language: 'en',
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: [...s.messages, errorMessage],
            };
          }
          return s;
        })
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePresetClick = (preset: PresetPrompt) => {
    if (preset.langCode && preset.langCode !== 'en') {
      setSelectedLanguage(preset.langCode);
    }
    handleSendMessage(preset.prompt, false);
  };

  const handleVoiceTranscript = (transcript: string) => {
    if (transcript.trim()) {
      handleSendMessage(transcript, true);
    }
  };

  const navigateToPage = (url?: string) => {
    if (!url) return;
    setIsOpen(false);
    navigate(url);
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (Bottom-Right) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-[#46304F] text-[#F7F0E5] px-4 py-3 shadow-xl border-2 border-[#F0DFBD]/60 hover:bg-[#563653] hover:scale-105 active:scale-95 transition-all group focus:outline-none focus:ring-4 focus:ring-[#C65D45]/40"
          aria-label="Open JOBSHIELD AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C65D45] opacity-60"></span>
            <div className="relative rounded-full bg-[#C65D45] p-2 text-[#FFFDF8]">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold tracking-wide uppercase text-[#F0DFBD]">
              AI Assistant
            </span>
            <span className="text-[11px] font-medium text-[#E9D9C4] group-hover:underline">
              Ask AI or Voice
            </span>
          </div>
        </button>
      )}

      {/* CHAT DRAWER CONTAINER */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ${
            isFullScreen
              ? 'inset-0 bg-[#29272B]/95 backdrop-blur-md p-2 sm:p-6 flex items-center justify-center'
              : 'bottom-4 right-4 w-[95vw] sm:w-[460px] h-[640px] max-h-[90vh] rounded-2xl shadow-2xl border-2 border-[#563653]/40 bg-[#F7F0E5] flex flex-col overflow-hidden'
          }`}
        >
          <div
            className={`flex flex-col h-full w-full bg-[#F7F0E5] overflow-hidden ${
              isFullScreen ? 'max-w-5xl rounded-2xl border border-[#563653]/40 shadow-2xl' : ''
            }`}
          >
            {/* HEADER BAR */}
            <div className="bg-[#46304F] text-[#F7F0E5] px-4 py-3 border-b border-[#563653] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="rounded-lg bg-[#C65D45] p-1.5 text-[#FFFDF8] shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-bold text-[#F7F0E5] truncate">
                      JOBSHIELD AI Assistant
                    </h3>
                    <span className="rounded bg-[#16765B] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F7F0E5] shrink-0">
                      Multi-lingual
                    </span>
                  </div>
                  <p className="text-[11px] text-[#F0DFBD] truncate flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#16765B] animate-pulse"></span>
                    <span>{isProcessing ? 'AI is thinking...' : speaking ? 'Speaking answer...' : 'Online & Ready'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Language Selector Dropdown */}
                <div className="relative inline-block">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    title="Select Assistant Language"
                    className="rounded-lg bg-[#563653] border border-[#B9A5C9]/40 text-[#F7F0E5] text-[11px] font-semibold px-2 py-1 pr-6 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#F0DFBD]"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                  <Globe className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-[#F0DFBD] pointer-events-none" />
                </div>

                {/* Toggle History Sidebar */}
                <button
                  type="button"
                  onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                  title="Conversation History"
                  className="rounded-lg bg-[#563653] p-1.5 text-[#F0DFBD] hover:bg-[#651F35] transition-colors"
                >
                  <History className="h-4 w-4" />
                </button>

                {/* New Chat Button */}
                <button
                  type="button"
                  onClick={createNewSession}
                  title="Start New Conversation"
                  className="rounded-lg bg-[#563653] p-1.5 text-[#F0DFBD] hover:bg-[#651F35] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>

                {/* Full-Screen Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  title={isFullScreen ? 'Restore Window' : 'Full Screen Mode'}
                  className="hidden sm:block rounded-lg bg-[#563653] p-1.5 text-[#F0DFBD] hover:bg-[#651F35] transition-colors"
                >
                  {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Assistant"
                  className="rounded-lg bg-[#651F35] p-1.5 text-[#F7F0E5] hover:bg-[#842D48] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* MAIN CONTENT BODY (Feed or History Sidebar) */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* HISTORY SIDEBAR OVERLAY */}
              {showHistorySidebar && (
                <div className="absolute inset-0 z-20 bg-[#29272B]/90 backdrop-blur-xs flex">
                  <div className="w-80 max-w-[85%] bg-[#46304F] text-[#F7F0E5] p-4 flex flex-col justify-between border-r border-[#563653] shadow-xl">
                    <div className="space-y-4 overflow-y-auto">
                      <div className="flex items-center justify-between border-b border-[#563653] pb-3">
                        <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#F0DFBD]">
                          Saved Conversations
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowHistorySidebar(false)}
                          className="text-[#E9D9C4] hover:text-[#F7F0E5]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={createNewSession}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#C65D45] px-3 py-2 text-xs font-bold text-[#F7F0E5] hover:bg-[#B85C32] transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Start New Conversation</span>
                      </button>

                      <div className="space-y-1.5">
                        {sessions.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setActiveSessionId(s.id);
                              setShowHistorySidebar(false);
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                              s.id === activeSessionId
                                ? 'bg-[#563653] text-[#F0DFBD] font-bold border border-[#F0DFBD]/30'
                                : 'text-[#E9D9C4] hover:bg-[#563653]/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <MessageSquare className="h-3.5 w-3.5 text-[#C65D45] shrink-0" />
                              <span className="truncate">{s.title}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => deleteSession(s.id, e)}
                              className="text-[#E9D9C4]/60 hover:text-[#C65D45] p-1"
                              title="Delete Session"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#563653] text-[10px] text-[#B9A5C9]">
                      Conversations are saved locally in your browser workspace.
                    </div>
                  </div>
                  <div className="flex-1" onClick={() => setShowHistorySidebar(false)}></div>
                </div>
              )}

              {/* MESSAGES FEED AREA */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F7F0E5]">
                {activeSession?.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-[#46304F] text-[#F0DFBD] flex items-center justify-center shrink-0 border border-[#563653]">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2 shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-[#C65D45] text-[#F7F0E5] rounded-tr-none'
                          : 'bg-[#FFFDF8] text-[#29272B] border border-[#563653]/20 rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-80 border-b border-current/15 pb-1">
                        <span className="font-semibold">
                          {msg.sender === 'user' ? user?.name || 'You' : 'JOBSHIELD AI'}
                          {msg.isVoiceInput && ' (Voice)'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {msg.languageName && (
                            <span className="rounded bg-current/15 px-1 py-0.2 font-mono uppercase">
                              {msg.languageName}
                            </span>
                          )}
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                      {/* Navigation Shortcut Button inside AI Message */}
                      {msg.navigationUrl && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => navigateToPage(msg.navigationUrl)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#16765B] px-3 py-1.5 text-xs font-bold text-[#F7F0E5] hover:bg-[#174D3B] transition-colors shadow-xs"
                          >
                            <span>{msg.navigationLabel || 'Open Feature Page'}</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Replay Voice Button */}
                      {msg.sender === 'assistant' && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => speak(msg.text, msg.language || 'en', false)}
                            className="text-[10px] font-semibold text-[#563653] hover:text-[#C65D45] flex items-center gap-1"
                          >
                            <Volume2 className="h-3 w-3" />
                            <span>Replay Voice</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {msg.sender === 'user' && (
                      <div className="h-8 w-8 rounded-full bg-[#C65D45] text-[#F7F0E5] flex items-center justify-center shrink-0 border border-[#842D48]/30">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex gap-3 justify-start">
                    <div className="h-8 w-8 rounded-full bg-[#46304F] text-[#F0DFBD] flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 animate-bounce" />
                    </div>
                    <div className="rounded-2xl bg-[#FFFDF8] border border-[#563653]/20 px-4 py-3 text-xs text-[#563653] flex items-center gap-2">
                      <span className="font-semibold">JOBSHIELD AI is thinking</span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C65D45] animate-ping"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C65D45] animate-ping [animation-delay:0.2s]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C65D45] animate-ping [animation-delay:0.4s]"></span>
                      </span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* PRESET STARTER PILLS */}
            <div className="bg-[#EFEAF2] px-3 py-2 border-t border-[#563653]/15 overflow-x-auto whitespace-nowrap shrink-0 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-[#563653] tracking-wide shrink-0">
                Sample Prompts:
              </span>
              {PRESET_CHAT_PROMPTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetClick(p)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFDF8] border border-[#563653]/25 px-2.5 py-1 text-[11px] font-semibold text-[#29272B] hover:bg-[#F0DFBD] hover:border-[#563653] transition-colors shrink-0"
                >
                  <span>{p.label}</span>
                  <span className="rounded bg-[#563653]/15 px-1 text-[9px] text-[#563653]">
                    {p.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* INPUT & VOICE CONTROLS FOOTER */}
            <div className="bg-[#FFFDF8] border-t border-[#563653]/20 p-3 space-y-2 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <VoiceControls
                  onTranscript={handleVoiceTranscript}
                  selectedLanguage={selectedLanguage}
                  isProcessing={isProcessing}
                  muted={muted}
                  onMuteToggle={() => setMuted(!muted)}
                />

                <button
                  type="button"
                  onClick={clearCurrentSessionMessages}
                  className="text-[11px] font-semibold text-[#842D48] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Clear Chat</span>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    selectedLanguage === 'hi'
                      ? 'हिंदी में अपना प्रश्न लिखें या बोलें...'
                      : selectedLanguage === 'mr'
                      ? 'मराठीत आपला प्रश्न लिहा किंवा बोला...'
                      : selectedLanguage === 'gu'
                      ? 'ગુજરાતીમાં તમારો પ્રશ્ન લખો અથવા બોલો...'
                      : 'Ask JOBSHIELD AI in any language...'
                  }
                  disabled={isProcessing}
                  className="flex-1 rounded-xl border border-[#563653]/30 bg-[#F7F0E5] px-3.5 py-2.5 text-xs text-[#29272B] placeholder-[#563653]/60 focus:outline-none focus:ring-2 focus:ring-[#C65D45]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing}
                  className="rounded-xl bg-[#46304F] px-4 py-2.5 text-xs font-bold text-[#F7F0E5] hover:bg-[#563653] disabled:opacity-40 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
