import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type { ConfidenceLevel, RiskCategory } from '../../types/jobshield';

export function BrandLogo({
  dark = false,
  variant,
}: {
  dark?: boolean;
  variant?: 'dark' | 'light' | 'burgundy' | 'plum' | 'forest' | 'emerald';
}) {
  const resolved = variant ?? (dark ? 'dark' : 'light');
  const badgeStyle =
    resolved === 'burgundy'
      ? 'bg-[#C65D45] border-[#E27D70] text-[#F7F0E5]'
      : resolved === 'plum'
      ? 'bg-[#842D48] border-[#B9A5C9] text-[#F7F0E5]'
      : resolved === 'forest'
      ? 'bg-[#16765B] border-[#C69B36] text-[#F7F0E5]'
      : resolved === 'emerald'
      ? 'bg-[#16765B] border-[#E3B34C] text-[#F7F0E5]'
      : resolved === 'dark'
      ? 'bg-[#651F35] border-[#C65D45] text-[#F0DFBD]'
      : 'bg-[#563653] border-[#842D48] text-[#F7F0E5]';

  const isDarkText =
    resolved === 'dark' ||
    resolved === 'burgundy' ||
    resolved === 'plum' ||
    resolved === 'forest' ||
    resolved === 'emerald';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${badgeStyle}`}>
        <Shield className="h-4 w-4" />
      </span>
      <span
        className={`font-display text-lg font-bold tracking-tight ${
          isDarkText ? 'text-[#F7F0E5]' : 'text-[#29272B]'
        }`}
      >
        JOBSHIELD
      </span>
    </span>
  );
}

export function DemoModeBanner({ theme = 'citizen' }: { theme?: 'citizen' | 'admin' }) {
  const { user, resetDemoData } = useAuth();
  const { showToast } = useToast();
  const [resetting, setResetting] = useState(false);

  if (!user?.isDemo) return null;

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemoData();
      showToast('Demo sandbox restored to initial sample records.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to reset demo data.', 'error');
    } finally {
      setResetting(false);
    }
  };

  const containerStyle =
    theme === 'admin'
      ? 'border-[#C69B36]/45 bg-[#29272B] text-[#E9D9C4]'
      : 'border-[#563653]/25 bg-[#F0DFBD] text-[#29272B]';

  const labelStyle =
    theme === 'admin'
      ? 'bg-[#16765B]/30 border-[#16765B] text-[#A7BEA8]'
      : 'bg-[#563653] border-[#46304F] text-[#F7F0E5]';

  const buttonStyle =
    theme === 'admin'
      ? 'bg-[#C69B36] text-[#29272B] hover:bg-[#E3B34C]'
      : 'bg-[#C65D45] text-[#F7F0E5] hover:bg-[#B85C32]';

  return (
    <div
      className={`mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border px-4 py-3 shadow-xs ${containerStyle}`}
    >
      <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
        <span
          className={`inline-flex items-center rounded border px-2 py-0.5 font-mono-tabular text-[11px] font-bold tracking-wide uppercase whitespace-nowrap ${labelStyle}`}
        >
          DEMO DATA
        </span>
        <span className="leading-snug">
          You are exploring the isolated <strong>{user.role === 'ADMIN' ? 'Administrator' : 'Citizen / Student'}</strong>{' '}
          demo workspace. Preloaded records are sample data and separate from real accounts.
        </span>
      </div>
      <button
        type="button"
        onClick={handleReset}
        disabled={resetting}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 ${buttonStyle}`}
      >
        <RotateCcw className={`h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
        <span>{resetting ? 'Resetting...' : 'Reset Demo Data'}</span>
      </button>
    </div>
  );
}

export function getRiskMeta(category: RiskCategory) {
  switch (category) {
    case 'LOWER_RISK':
      return {
        label: 'Lower Risk',
        textClass: 'text-[#174D3B]',
        bgClass: 'bg-[#E7EFE8] border-[#16765B]/35',
        barClass: 'bg-[#16765B]',
        Icon: CheckCircle2,
      };
    case 'SUSPICIOUS':
      return {
        label: 'Suspicious',
        textClass: 'text-[#8C5A12]',
        bgClass: 'bg-[#F0DFBD] border-[#C69B36]/45',
        barClass: 'bg-[#C69B36]',
        Icon: AlertTriangle,
      };
    case 'HIGH_RISK':
      return {
        label: 'High Risk',
        textClass: 'text-[#651F35]',
        bgClass: 'bg-[#FADED8] border-[#C65D45]/45',
        barClass: 'bg-[#842D48]',
        Icon: AlertOctagon,
      };
    default:
      return {
        label: 'Insufficient Evidence',
        textClass: 'text-[#46304F]',
        bgClass: 'bg-[#E9E2F2] border-[#563653]/30',
        barClass: 'bg-[#563653]',
        Icon: HelpCircle,
      };
  }
}

export function RiskStatusLabel({
  category,
  score,
}: {
  category: RiskCategory;
  score?: number | null;
}) {
  const meta = getRiskMeta(category);
  const Icon = meta.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${meta.bgClass} ${meta.textClass}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{meta.label}</span>
      {typeof score === 'number' && (
        <span className="font-mono-tabular opacity-90">{score}/100</span>
      )}
    </span>
  );
}

export function ConfidenceLabel({ level }: { level: ConfidenceLevel }) {
  const label =
    level === 'high'
      ? 'High Confidence'
      : level === 'medium'
      ? 'Medium Confidence'
      : 'Low Confidence';
  return (
    <span className="font-mono-tabular text-xs font-semibold text-[#175E60]">
      {label}
    </span>
  );
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#651F35] text-[#F0DFBD] p-6 text-center ${className}`}
      >
        <Shield className="h-8 w-8 text-[#E27D70] mb-2" />
        <p className="text-sm font-medium">{fallbackTitle}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
