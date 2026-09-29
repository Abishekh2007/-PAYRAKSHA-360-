// Types for engine.mjs, the executable spec shared by the browser (direct import) and the Python port.
// Every number in a report is computed by the engine; UI code never hard-codes scores.

export type RiskLevelId = 'LOW' | 'CAUTION' | 'HIGH_CAUTION' | 'HIGH';
export type Severity = 'none' | 'low' | 'medium' | 'high';
export type CueGroup = 'urgency' | 'threat' | 'authority' | 'paymentRequest' | 'lure' | 'secrecy' | 'credential';
export type FactorKey =
  | 'recipientNovelty' | 'urgency' | 'impersonation' | 'amountAnomaly' | 'suspiciousURL'
  | 'qrRedirection' | 'socialEngineering' | 'contextMismatch' | 'behaviouralAnomaly' | 'untrustedSource';
export type SourceId =
  | 'official_app' | 'known_merchant' | 'email' | 'sms' | 'unknown' | 'whatsapp' | 'social_media' | 'phone_call' | 'unknown_website';
export type UrgencyLevel = 'none' | 'low' | 'medium' | 'high';
export type BehaviourKey = 'onCall' | 'screenShare' | 'newDevice' | 'lateNight' | 'rapidAttempts';
export type CategoryId =
  | 'utility' | 'bank_kyc' | 'customer_care' | 'shopping' | 'prize' | 'job' | 'investment'
  | 'refund' | 'parcel' | 'qr_receive' | 'personal' | 'unknown';

/** Optional payment context from the user or a scenario. Missing fields are taken from the message / QR. */
export interface PaymentInput {
  recipient?: string;
  amount?: number;
  merchant?: string;
  /** Must be a SourceId here (only QR `source=` text is normalised by the engine). Default: QR source, else 'unknown'. */
  source?: SourceId;
  recipientVerified?: boolean;
  /** false = the recipient has not been looked up yet (e.g. a QR on its own). Default true. */
  recipientChecked?: boolean;
  previousPayments?: number;
  typicalAmount?: number;
  amountUnusual?: boolean | null;
  urgency?: UrgencyLevel;
  hasPaymentRequest?: boolean;
}
export type BehaviourInput = Partial<Record<BehaviourKey, boolean>>;

export interface AnalyzeInput {
  scenarioId?: string;
  message?: string;
  url?: string;
  qrText?: string;
  payment?: PaymentInput;
  behaviour?: BehaviourInput;
}
export type InputPatch = Omit<AnalyzeInput, 'scenarioId'>;

export interface TextSignal { id: string; label: string; cues: string[]; count: number; severity: Severity }
export interface TextAnalysis {
  text: string;
  empty: boolean;
  cues: Record<CueGroup, string[]>;
  counts: Record<CueGroup, number>;
  category: CategoryId;
  categoryLabel: string;
  categoryScores: Record<string, number>;
  amount: number | null;
  urls: string[];
  signals: TextSignal[];
}

export interface UrlCheck { id: string; label: string; points: number; detail: string }
export interface UrlAnalysis {
  input: string;
  valid: boolean;
  /** 'Enter a valid URL.' when invalid, otherwise null. */
  error: string | null;
  normalized: string;
  scheme: string;
  host: string;
  path: string;
  registeredDomain: string;
  tld: string;
  /** Simulated intelligence: 'trusted' | 'reported' | 'new' | 'unknown'. */
  reputation: string;
  reputationNote: string;
  checks: UrlCheck[];
  score: number;
  level: RiskLevelId;
  levelLabel: string;
}

export type QrFormat = 'empty' | 'payraksha' | 'upi' | 'url' | 'text';
export interface QrFields {
  recipient?: string;
  amount?: number;
  merchant?: string;
  note?: string;
  source?: string;
  sourceLabel?: string;
  scenario?: string;
  url?: string;
}
export interface QrAnalysis {
  raw: string;
  format: QrFormat;
  fields: QrFields;
  urgentFlag: boolean;
  warnings: string[];
  isDemo: boolean;
  /** 'Unable to read QR. Try again or upload a clearer image.' for empty input, otherwise null. */
  error: string | null;
}

export interface PaymentContext {
  recipient: string | null;
  recipientName: string | null;
  inDirectory: boolean;
  recipientChecked: boolean;
  recipientVerified: boolean;
  previousPayments: number;
  amount: number | null;
  typicalAmount: number;
  amountUnusual: boolean | null;
  merchant: string | null;
  source: SourceId;
  sourceLabel: string;
  sourceTrust: number;
  category: CategoryId;
  categoryLabel: string;
  urgencyLevel: UrgencyLevel | null;
  hasPaymentRequest: boolean;
  viaQr: boolean;
  url: string | null;
}

export interface Contribution {
  key: string;
  label: string;
  kind: 'baseline' | 'factor' | 'combo';
  /** Feature value 0..1 (1 for baseline and combos). */
  value: number;
  weight: number;
  /** Points this item adds. All contributions sum to the unclamped score. */
  points: number;
  severity: Severity;
  detail: string;
}
export interface DnaStrand { key: FactorKey; label: string; value: number; percent: number; severity: Severity; points: number }
export interface DetectedPattern { id: string; name: string; kind: string }
export interface AttackChainNode { id: string; icon: string; label: string; active: boolean; detail: string; severity: Severity }
export interface Explanation { headline: string; summary: string; reasons: string[]; trustSignals: string[]; disclaimer: string }
/**
 * Action ids and labels: 'verify' VERIFY OFFICIALLY, 'cancel' CANCEL, 'trusted' ASK TRUSTED CONTACT,
 * 'analysis' VIEW FULL ANALYSIS, 'continue' CONTINUE (SIMULATION) (LOW risk only; never pays anything).
 * HIGH: verify, cancel, trusted, analysis. HIGH_CAUTION: verify, trusted, cancel, analysis. CAUTION: verify, analysis, cancel. LOW: continue, analysis.
 */
export type ActionId = 'verify' | 'cancel' | 'trusted' | 'analysis' | 'continue';
export interface RecommendationAction { id: ActionId; label: string }
/** Titles: HIGH "DON'T PAY YET", HIGH_CAUTION 'VERIFY BEFORE PAYING', CAUTION 'PROCEED WITH CARE', LOW 'LOW RISK'. */
export interface Recommendation {
  verdict: 'DONT_PAY_YET' | 'VERIFY_FIRST' | 'PROCEED_WITH_CARE' | 'LOOKS_SAFE';
  title: string;
  message: string;
  actions: RecommendationAction[];
}

export interface RiskReport {
  /** Deterministic id such as 'PR-1A2B3C4D'. */
  id: string;
  simulation: true;
  notice: string;
  engine: { name: string; version: string; runtime: string };
  input: AnalyzeInput;
  analyses: { text: TextAnalysis; url: UrlAnalysis | null; qr: QrAnalysis | null };
  payment: PaymentContext;
  features: Record<FactorKey, number> & { recipientVerified: number; sourceTrust: number };
  featureDetails: Record<FactorKey, string>;
  contributions: Contribution[];
  /** 0..100, computed. */
  score: number;
  clamped: boolean;
  level: RiskLevelId;
  levelLabel: string;
  /** Scam DNA strands in display order. */
  dna: DnaStrand[];
  patterns: DetectedPattern[];
  patternName: string;
  attackChain: AttackChainNode[];
  explanation: Explanation;
  recommendation: Recommendation;
}

export interface LevelDef { id: RiskLevelId; label: string; min: number; max: number }
export interface CategoryDef { label: string; claim: string; org: boolean; neverCollects: boolean; typicalAmount: number }
export interface EngineSettings {
  version: string;
  engineName: string;
  baseline: number;
  weights: Record<FactorKey, number>;
  factorLabels: Record<FactorKey, string>;
  levels: LevelDef[];
  sourceTrust: Record<SourceId, number>;
  sourceLabels: Record<SourceId, string>;
  categories: Record<CategoryId, CategoryDef>;
  [key: string]: unknown;
}
export interface EngineConfig {
  engine: EngineSettings;
  lexicon: Record<string, unknown>;
  urlRules: Record<string, unknown>;
  recipients: Record<string, unknown>;
  patterns: Record<string, unknown>;
}

export interface Scenario {
  id: string;
  qrId: string | null;
  kind: 'scam' | 'legit';
  icon: string;
  title: string;
  shortLabel: string;
  labLabel: string;
  summary: string;
  messageSource: string;
  message: string;
  url: string;
  qrText: string;
  payment: PaymentInput;
  behaviour: BehaviourInput;
}
export type LiveStage = 'message' | 'url' | 'qr' | 'full';
export interface LivePhase { id: string; icon: string; text: string; stage: LiveStage }
export interface ScenarioBook {
  scenarios: Scenario[];
  qrOrder: string[];
  labOrder: string[];
  controlOrder: string[];
  sequences: {
    counterfactual: { baseScenario: string; steps: { id: string; prompt: string; button: string; patch: InputPatch }[]; finalText: string };
    whatIf: { baseScenario: string; title: string; controls: { id: string; label: string; from: string; to: string; patch: InputPatch }[]; finalText: string };
    signalsConnected: { title: string; base: InputPatch; steps: { id: string; label: string; patch: InputPatch }[]; finalText: string };
    liveSimulation: { baseScenario: string; phases: LivePhase[]; stages: Record<LiveStage, { fields: string[]; payment?: PaymentInput }> };
  };
}

export const ENGINE_VERSION: string;
export const CUE_GROUPS: CueGroup[];
export const FACTOR_KEYS: FactorKey[];
export const DNA_KEYS: FactorKey[];
export const DNA_LABELS: Record<FactorKey, string>;
export const DISCLAIMER: string;
export const SIMULATION_NOTICE: string;

export function analyze(input: AnalyzeInput, cfg: EngineConfig, runtime?: string): RiskReport;
export function analyzeText(text: string, cfg: EngineConfig): TextAnalysis;
export function analyzeUrl(raw: string, cfg: EngineConfig): UrlAnalysis;
export function parseQr(raw: string, cfg: EngineConfig): QrAnalysis;
export function applyPatch(input: AnalyzeInput, patch: InputPatch): AnalyzeInput;
export function scenarioInput(s: Scenario): AnalyzeInput;
export function levelFor(score: number, cfg: EngineConfig): LevelDef;
export function severityOf(v: number, thresholds: { severityHigh: number; severityMedium: number }): Severity;
export function normalizeSource(v: string, cfg: EngineConfig): SourceId;
export function extractAmount(text: string): number | null;
export function extractUrls(text: string): string[];
export function fmtINR(v: number): string;
export function fmtNum(v: number): string;
export function fnv1a(s: string): number;
