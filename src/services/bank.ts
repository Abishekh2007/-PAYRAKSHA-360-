// Vendor payments + Bank AI audit client (SIMULATION ONLY). Shared by the console, RakshaPay and the Auditor portal.

export type AuditVerdict = 'LIKELY_SAFE' | 'CAUTION' | 'SUSPICIOUS' | 'HIGH_RISK';

export interface BankVendor {
  id: string; name: string; brandColor: string; category: string; size: 'enterprise' | 'sme' | 'micro';
  city: string; lat: number; lng: number; vpa: string; verified: boolean; kycStatus: string; vendorAgeDays: number;
  latestAudit: { id: number; score: number; verdict: AuditVerdict; at: string } | null;
  stats?: { txCount: number; volume: number; avgTicket: number; disputes: number; disputeRatePct: number };
}
/** Bank-internal live view of one AI audit: prompt, streamed text and raw output (in memory on the server only). */
export interface AuditLive {
  available: boolean; simulation: true; model?: string; servedModel?: string | null; endpoint?: string;
  messages?: { role: string; content: string }[]; text?: string; thinking?: string; chunks?: number;
  status?: 'streaming' | 'done' | 'fallback' | 'simulated'; error?: string | null; finishReason?: string | null;
  usage?: Record<string, number> | null; parsed?: unknown; elapsedMs?: number;
}
export interface VendorDetail extends BankVendor {
  myHistory: { count: number; total: number; last: string | null };
  feeQuote: FeeInfo; qrText: string;
}
export interface FeeInfo { tier: string; fee: number; fixed?: boolean; simulated: true; basedOnPayments?: number; note?: string }
export interface ReasoningStep { title: string; detail: string; evidence: string[]; impact: 'raises' | 'lowers' | 'neutral' }
export interface CustomerAudit {
  id: number; status: 'running' | 'done'; score: number | null; verdict: AuditVerdict | null; verdictLabel: string;
  headline: string | null; keyPoints: string[]; recommendation: string | null; securityTips: string[];
  source: string | null; model: string | null; createdAt: string; privacy: string;
}
export interface AuditResponse {
  mode: 'full' | 'quick' | 'summary' | 'off'; vendor: { id: string; name: string; brandColor: string; verified: boolean };
  amount: number; largeAmount: number; report: CustomerAudit | null; fee: FeeInfo | null; warning?: string;
}
export interface AuditCustomer {
  customerId: string | null; name: string; kycLevel: string | null; customerSince: string | null; accountId: string; account: string;
  balanceDemo: number; aiAuditEnabled: boolean; transactions: number; volume: number; merchants: number; audits: number;
}
export interface FullAudit {
  customer?: AuditCustomer | null;
  id: number; transaction_ref: string; vendor_id: string; amount: number; device: string; kind: 'full' | 'quick';
  status: 'running' | 'done'; score: number | null; verdict: AuditVerdict | null; verdictLabel: string;
  headline: string | null; summary: string | null; reasoning: ReasoningStep[] | null; recommendation: string | null;
  data_used: { table: string; fields: Record<string, unknown> }[] | null; model: string | null; source: string | null;
  latency_ms: number | null; fee: number; fee_tier: string; vendorIssues: string[] | null; securityIssues: string[] | null;
  privacyNote: string | null; createdAt: string; vendor: { id: string; name: string; brandColor: string; city: string } | null;
}
export interface BankSettings {
  aiAuditEnabled: boolean; optOutAcknowledgedAt: string | null; warning: string;
  feeTiers: { tier: string; fee: number; minPayments: number }[]; largeAmount: number;
}

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (!r.ok) throw new Error((await r.json().catch(() => null))?.detail || `HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

export const bank = {
  vendors: () => j<{ vendors: BankVendor[]; largeAmount: number; database: string }>('/api/bank/vendors'),
  vendor: (id: string, amount: number) => j<VendorDetail>(`/api/bank/vendors/${encodeURIComponent(id)}?amount=${amount}`),
  audit: (vendorId: string, amount: number, device: string, transactionRef?: string) =>
    j<AuditResponse>('/api/bank/audit', { method: 'POST', body: JSON.stringify({ vendorId, amount, device, transactionRef }) }),
  report: (id: number) => j<CustomerAudit>(`/api/bank/audits/${id}`),
  live: (id: number) => j<AuditLive>(`/api/bank/audits/${id}/live`),
  audits: () => j<{ audits: FullAudit[]; database: string }>('/api/bank/audits'),
  settings: () => j<BankSettings>('/api/bank/settings'),
  setAudit: (on: boolean, acknowledged = false, device = 'customer') =>
    j<BankSettings>('/api/bank/settings', { method: 'POST', body: JSON.stringify({ aiAuditEnabled: on, acknowledged, device }) }),
  db: () => j<{ database: string; tables: Record<string, number>; log: { at: string; actor: string; action: string; detail: string }[] }>('/api/bank/db'),
};

/** Reads `vendorId=` from a PAYRAKSHA demo QR payload, else null. */
export function vendorIdFromQr(qrText: string | null | undefined): string | null {
  const m = /(?:^|\n)vendorId=([a-z0-9-]{1,40})\s*(?:\n|$)/i.exec(qrText || '');
  return m ? m[1] : null;
}

export const VERDICT_TONE: Record<AuditVerdict, { color: string; label: string }> = {
  LIKELY_SAFE: { color: '#10b981', label: 'Low risk' },
  CAUTION: { color: '#f59e0b', label: 'Caution' },
  SUSPICIOUS: { color: '#f97316', label: 'Suspicious' },
  HIGH_RISK: { color: '#ef4444', label: 'Multiple warning signals detected' },
};

export function scoreColor(score: number | null | undefined): string {
  if (score == null) return '#64748b';
  return score < 30 ? '#10b981' : score < 55 ? '#f59e0b' : score < 75 ? '#f97316' : '#ef4444';
}

export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
