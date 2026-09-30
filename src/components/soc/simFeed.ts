// Simulated SOC event feed (head-owned). Every event is one of the 12 DEMO scenarios run through the
// in-browser engine: nothing here is real traffic, and every label a page shows from it says SIMULATION.
import { FLAGSHIP_SCENARIO_ID, runScenarioLocal, scenarios } from '../../engine';
import type { RiskLevelId, RiskReport } from '../../types';

export type SimChannel = 'WHATSAPP' | 'SMS' | 'CALL' | 'SOCIAL' | 'EMAIL' | 'WEB' | 'QR' | 'APP';
export type SimStatus = 'HELD' | 'CHECK' | 'LOW';

export const SIM_CHANNELS: SimChannel[] = ['WHATSAPP', 'SMS', 'CALL', 'SOCIAL', 'EMAIL', 'WEB', 'QR', 'APP'];

export const STATUS_LABEL: Record<SimStatus, string> = {
  HELD: 'HELD FOR REVIEW',
  CHECK: 'CHECK BEFORE PAYING',
  LOW: 'LOW RISK',
};

export interface SimEvent {
  /** `sim-${scenarioId}`: stable across calls, usable as a React key. */
  id: string;
  scenarioId: string;
  /** Epoch ms. */
  at: number;
  /** IST wall clock, HH:MM:SS (24 h). */
  time: string;
  channel: SimChannel;
  /** The scenario title, e.g. "Electricity Disconnection Scam". */
  title: string;
  /** Fake DEMO UPI handle, e.g. "unknown-electricity@demo". */
  handle: string;
  amount: number | null;
  score: number;
  level: RiskLevelId;
  status: SimStatus;
  report: RiskReport;
}

const reportCache = new Map<string, RiskReport>();
function reportFor(scenarioId: string): RiskReport {
  let report = reportCache.get(scenarioId);
  if (!report) {
    report = runScenarioLocal(scenarioId);
    reportCache.set(scenarioId, report);
  }
  return report;
}

/** whatsapp → WHATSAPP, sms → SMS, phone_call → CALL, social_media → SOCIAL, email → EMAIL, unknown_website → WEB,
 *  official_app → APP, known_merchant → QR, anything else → QR when paid by QR, otherwise WEB. */
export function channelFor(report: RiskReport): SimChannel {
  switch (report.payment.source) {
    case 'whatsapp':
      return 'WHATSAPP';
    case 'sms':
      return 'SMS';
    case 'phone_call':
      return 'CALL';
    case 'social_media':
      return 'SOCIAL';
    case 'email':
      return 'EMAIL';
    case 'unknown_website':
      return 'WEB';
    case 'official_app':
      return 'APP';
    case 'known_merchant':
      return 'QR';
    default:
      return report.payment.viaQr ? 'QR' : 'WEB';
  }
}

/** HIGH / HIGH_CAUTION → HELD, CAUTION → CHECK, LOW → LOW. */
export function statusForLevel(level: RiskLevelId): SimStatus {
  if (level === 'HIGH' || level === 'HIGH_CAUTION') return 'HELD';
  return level === 'CAUTION' ? 'CHECK' : 'LOW';
}

const IST = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/** "HH:MM:SS" in India Standard Time. */
export const istTime = (ms: number): string => IST.format(new Date(ms));

/**
 * The simulated feed: the flagship scenario (utility_scam) first, then the other scenarios in book order.
 * Event i happened (i * 47 + 13) seconds before `now`. `count` caps the length (default: all 12).
 * Reports are computed once per scenario and cached, so calling this on every tick is cheap.
 */
export function simulatedFeed({ now = Date.now(), count }: { now?: number; count?: number } = {}): SimEvent[] {
  const ids = [FLAGSHIP_SCENARIO_ID, ...scenarios.map((s) => s.id).filter((id) => id !== FLAGSHIP_SCENARIO_ID)];
  const n = Math.max(0, Math.min(count ?? ids.length, ids.length));
  return ids.slice(0, n).map((scenarioId, i) => {
    const report = reportFor(scenarioId);
    const scenario = scenarios.find((s) => s.id === scenarioId);
    const at = now - (i * 47 + 13) * 1000;
    return {
      id: `sim-${scenarioId}`,
      scenarioId,
      at,
      time: istTime(at),
      channel: channelFor(report),
      title: scenario?.title ?? scenarioId,
      handle: report.payment.recipient ?? 'unknown@demo',
      amount: report.payment.amount,
      score: report.score,
      level: report.level,
      status: statusForLevel(report.level),
      report,
    };
  });
}

/** One ticker line: "SIMULATION · 14:02:11 IST · WHATSAPP · Electricity Disconnection Scam · unknown-electricity@demo · RISK 92 · HELD FOR REVIEW". */
export function tickerLine(e: SimEvent): string {
  return `SIMULATION · ${e.time} IST · ${e.channel} · ${e.title} · ${e.handle} · RISK ${e.score} · ${STATUS_LABEL[e.status]}`;
}
