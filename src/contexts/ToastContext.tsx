import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, tone, message }]);
      setTimeout(() => removeToast(id), 4500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg transition-all ${
              t.tone === 'success'
                ? 'bg-[#E7EFE8] border-[#16765B]/35 text-[#174D3B]'
                : t.tone === 'error'
                ? 'bg-[#FBEAE3] border-[#842D48]/35 text-[#651F35]'
                : 'bg-[#29272B] border-[#E3B34C]/40 text-[#F7F0E5]'
            }`}
          >
            {t.tone === 'success' && <CheckCircle2 className="w-4 h-4 text-[#16765B] shrink-0 mt-0.5" />}
            {t.tone === 'error' && <AlertTriangle className="w-4 h-4 text-[#842D48] shrink-0 mt-0.5" />}
            {t.tone === 'info' && <Info className="w-4 h-4 text-[#E3B34C] shrink-0 mt-0.5" />}
            <span className="flex-1 leading-snug font-medium">{t.message}</span>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
              className="opacity-60 hover:opacity-100 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
