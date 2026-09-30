import type { RiskLevelId } from '../../../src/types';
import type { PayTone } from '../lib/payView';
import { formatInr as libFormatInr } from '../lib/payView';

export const decisionLabels: Record<string, string> = {
  pending: 'Checked',
  cancelled: 'Cancelled',
  verify: 'Verifying payee',
  trusted: 'Asked a trusted contact',
  paid_demo: 'Paid (demo)',
};

export const levelToneClassMap: Record<RiskLevelId, string> = {
  LOW: 'bg-risk-low-soft text-risk-low-ink',
  CAUTION: 'bg-risk-caution-soft text-risk-caution-ink',
  HIGH_CAUTION: 'bg-risk-elevated-soft text-risk-elevated-ink',
  HIGH: 'bg-risk-high-soft text-risk-high-ink',
};

export function formatInr(amount: number): string {
  return libFormatInr(amount);
}

export function formatShortTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDayHeader(iso: string): string {
  const d = new Date(iso);
  const now = new Date();

  const isToday = d.getDate() === now.getDate() &&
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.getDate() === yesterday.getDate() &&
                      d.getMonth() === yesterday.getMonth() &&
                      d.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
