import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../types/chat';

// Browser Web Speech Recognition Types
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface VoiceControlsProps {
  onTranscript: (transcript: string) => void;
  selectedLanguage: string;
  isProcessing: boolean;
  muted: boolean;
  onMuteToggle: () => void;
}

export function useVoiceSynthesis() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const speak = useCallback((text: string, langCode = 'en', muted = false) => {
    if (muted || !supported || typeof window === 'undefined') return;

    window.speechSynthesis.cancel(); // Stop any active speech

    // Strip Markdown links, symbols, or formatting tags for clean vocalization
    const cleanText = text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#~`]/g, '')
      .replace(/(https?:\/\/[^\s]+)/g, 'link')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Map language code to BCP 47 tag
    const matchedLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    const targetTag = matchedLangObj?.ttsLang || 'en-IN';
    utterance.lang = targetTag;
    utterance.rate = 0.98; // Natural conversational rate
    utterance.pitch = 1.0;

    // Voice selection matching requested language
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(targetTag.toLowerCase().slice(0, 2)));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  return { speak, stop, speaking, supported };
}

export function VoiceControls({
  onTranscript,
  selectedLanguage,
  isProcessing,
  muted,
  onMuteToggle,
}: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [sttSupported, setSttSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSttSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;

      // Select STT language
      const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage);
      rec.lang = langObj && langObj.code !== 'auto' ? langObj.sttLang : 'en-IN';

      rec.onstart = () => {
        setIsListening(true);
        setLiveTranscript('');
        setVoiceError(null);
      };

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += text;
          } else {
            interim += text;
          }
        }

        const currentText = final || interim;
        setLiveTranscript(currentText);

        if (final.trim()) {
          onTranscript(final.trim());
          setIsListening(false);
        }
      };

      rec.onerror = (event: any) => {
        setIsListening(false);
        const errType = event.error;
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setVoiceError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (errType === 'no-speech') {
          setVoiceError('No speech was detected. Please tap the microphone and try speaking again.');
        } else if (errType === 'audio-capture') {
          setVoiceError('No microphone hardware detected on this device.');
        } else {
          setVoiceError(`Voice input error (${errType}). You can continue using text chat below.`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setSttSupported(false);
    }
  }, [selectedLanguage, onTranscript]);

  const toggleListening = () => {
    if (!sttSupported) {
      setVoiceError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari, or type your query in text chat.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setVoiceError(null);
      setLiveTranscript('');
      try {
        const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage);
        if (recognitionRef.current) {
          recognitionRef.current.lang = langObj && langObj.code !== 'auto' ? langObj.sttLang : 'en-IN';
          recognitionRef.current.start();
        }
      } catch (err) {
        setIsListening(false);
        setVoiceError('Could not start microphone listener. Tap again or use text chat.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleListening}
          disabled={isProcessing}
          title={isListening ? 'Stop Listening' : 'Speak to JOBSHIELD AI Assistant'}
          className={`relative inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-md ${
            isListening
              ? 'bg-[#842D48] text-[#F7F0E5] ring-4 ring-[#842D48]/30 animate-pulse'
              : 'bg-[#C65D45] text-[#FFFDF8] hover:bg-[#B85C32]'
          } disabled:opacity-50`}
        >
          {isListening ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F0DFBD] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F0DFBD]"></span>
              </span>
              <span>Listening... Tap to Stop</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 shrink-0" />
              <span>Voice Search</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onMuteToggle}
          title={muted ? 'Unmute Audio Voice Responses' : 'Mute Voice Responses'}
          className="rounded-full border border-[#563653]/30 bg-[#F7F0E5] p-2 text-[#46304F] hover:bg-[#F0DFBD] transition-colors"
        >
          {muted ? <VolumeX className="h-4 w-4 text-[#842D48]" /> : <Volume2 className="h-4 w-4 text-[#16765B]" />}
        </button>
      </div>

      {isListening && (
        <div className="rounded-xl border border-[#C65D45]/30 bg-[#FBEAE3] p-3 text-xs text-[#651F35] space-y-1 animate-fade-in">
          <div className="flex items-center justify-between font-semibold">
            <span>Listening to your voice...</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-0.5 bg-[#C65D45] animate-bounce"></span>
              <span className="h-3 w-0.5 bg-[#C65D45] animate-bounce [animation-delay:0.2s]"></span>
              <span className="h-2 w-0.5 bg-[#C65D45] animate-bounce [animation-delay:0.4s]"></span>
            </span>
          </div>
          <p className="font-mono text-[#29272B] italic">
            {liveTranscript ? `"${liveTranscript}"` : 'Speak clearly into your microphone...'}
          </p>
        </div>
      )}

      {voiceError && (
        <div className="rounded-xl border border-[#842D48]/30 bg-[#FBEAE3] p-2.5 text-xs text-[#842D48] flex items-center justify-between gap-2">
          <span>{voiceError}</span>
          <button
            type="button"
            onClick={() => setVoiceError(null)}
            className="text-[10px] font-bold uppercase underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
