// In-browser engine: the same reference engine (shared/reference/engine.mjs) the Python port is tested against.
import * as E from '../../shared/reference/engine.mjs';
import engineSettings from '../../shared/engine-config.json';
import lexicon from '../../shared/lexicon.json';
import urlRules from '../../shared/url-rules.json';
import recipients from '../../shared/recipients.json';
import patterns from '../../shared/patterns.json';
import scenarioJson from '../../shared/scenarios.json';
import type {
  AnalyzeInput, BehaviourKey, EngineConfig, InputPatch, LivePhase, LiveStage, QrAnalysis, RiskLevelId,
  RiskReport, Scenario, ScenarioBook, SourceId, TextAnalysis, UrlAnalysis,
} from '../types';

export const engineConfig = { engine: engineSettings, lexicon, urlRules, recipients, patterns } as unknown as EngineConfig;
export const scenarioBook = scenarioJson as unknown as ScenarioBook;
export const scenarios: Scenario[] = scenarioBook.scenarios;

export const ENGINE_VERSION = E.ENGINE_VERSION;
export const ENGINE_NAME = engineConfig.engine.engineName;
export const SIMULATION_NOTICE = E.SIMULATION_NOTICE;
export const DISCLAIMER = E.DISCLAIMER;
export const DNA_LABELS = E.DNA_LABELS;
export const FACTOR_KEYS = E.FACTOR_KEYS;
export const FACTOR_LABELS = engineConfig.engine.factorLabels;
export const FACTOR_WEIGHTS = engineConfig.engine.weights;
export const BASELINE = engineConfig.engine.baseline;
export const LEVELS = engineConfig.engine.levels;
export const fmtINR = E.fmtINR;

export const SOURCE_OPTIONS: { id: SourceId; label: string }[] = (Object.keys(engineConfig.engine.sourceLabels) as SourceId[]).map(
  (id) => ({ id, label: engineConfig.engine.sourceLabels[id] }),
);
export const BEHAVIOUR_OPTIONS: { id: BehaviourKey; label: string }[] = [
  { id: 'onCall', label: 'On a call with the requester' },
  { id: 'screenShare', label: 'Screen sharing / remote access app active' },
  { id: 'newDevice', label: 'Paying from a new device' },
  { id: 'lateNight', label: 'Late-night request' },
  { id: 'rapidAttempts', label: 'Rapid repeated payment attempts' },
];
export const URGENCY_OPTIONS = ['none', 'low', 'medium', 'high'] as const;

export function analyzeLocal(input: AnalyzeInput): RiskReport {
  return E.analyze(input, engineConfig, 'browser');
}
export function analyzeTextLocal(text: string): TextAnalysis {
  return E.analyzeText(text, engineConfig);
}
export function analyzeUrlLocal(url: string): UrlAnalysis {
  return E.analyzeUrl(url, engineConfig);
}
export function parseQrLocal(raw: string): QrAnalysis {
  return E.parseQr(raw, engineConfig);
}
export function levelOf(score: number): RiskLevelId {
  return E.levelFor(score, engineConfig).id;
}
export function applyPatch(input: AnalyzeInput, patch: InputPatch): AnalyzeInput {
  return E.applyPatch(input, patch);
}

/** Finds a scenario by id ('utility_scam') or QR id ('QR001'). Throws on unknown ids. */
export function getScenario(id: string): Scenario {
  const s = scenarios.find((x) => x.id === id || x.qrId === id);
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}
export function scenarioToInput(idOrScenario: string | Scenario): AnalyzeInput {
  return E.scenarioInput(typeof idOrScenario === 'string' ? getScenario(idOrScenario) : idOrScenario);
}
export function runScenarioLocal(id: string): RiskReport {
  return analyzeLocal(scenarioToInput(id));
}

const pick = (ids: string[]): Scenario[] => ids.map(getScenario);
/** QR001..QR009 in demo order (spec §6). */
export const qrScenarios = (): Scenario[] => pick(scenarioBook.qrOrder);
/** Scam Lab order (spec §16). */
export const labScenarios = (): Scenario[] => pick(scenarioBook.labOrder);
/** Demo Control Center order (spec §25). */
export const controlScenarios = (): Scenario[] => pick(scenarioBook.controlOrder);

/** QR001: the electricity-bill scam used by the main demo (92 / 100). */
export const FLAGSHIP_SCENARIO_ID = 'utility_scam';

export interface SequenceStep { id: string; label: string; input: AnalyzeInput; report: RiskReport }

/** Spec §18 counterfactual: cumulative steps on the flagship scenario (verify recipient, official app, no urgency). */
export function runCounterfactual(): { base: RiskReport; steps: (SequenceStep & { prompt: string; button: string })[]; finalText: string } {
  const seq = scenarioBook.sequences.counterfactual;
  let input = scenarioToInput(seq.baseScenario);
  const base = analyzeLocal(input);
  const steps = seq.steps.map((st) => {
    input = applyPatch(input, st.patch);
    return { id: st.id, label: st.button, prompt: st.prompt, button: st.button, input, report: analyzeLocal(input) };
  });
  return { base, steps, finalText: seq.finalText };
}

/** Spec §15 what-if: the base scenario with the chosen controls applied (in control order). */
export function whatIfInput(activeControlIds: readonly string[]): AnalyzeInput {
  const seq = scenarioBook.sequences.whatIf;
  let input = scenarioToInput(seq.baseScenario);
  for (const c of seq.controls) if (activeControlIds.includes(c.id)) input = applyPatch(input, c.patch);
  return input;
}

/** Spec §37 signals connected: cumulative steps from a QR alone to the full scam context. */
export function runSignalsConnected(): { title: string; steps: SequenceStep[]; finalText: string } {
  const seq = scenarioBook.sequences.signalsConnected;
  let input: AnalyzeInput = { ...seq.base };
  const steps = seq.steps.map((st) => {
    input = applyPatch(input, st.patch);
    return { id: st.id, label: st.label, input, report: analyzeLocal(input) };
  });
  return { title: seq.title, steps, finalText: seq.finalText };
}

/** Spec §17 live simulation: the input revealed so far at a stage (message, url, qr, full). */
export function liveStageInput(stage: LiveStage): AnalyzeInput {
  const seq = scenarioBook.sequences.liveSimulation;
  const base = scenarioToInput(seq.baseScenario) as Record<string, unknown>;
  const st = seq.stages[stage];
  const partial: Record<string, unknown> = {};
  for (const f of st.fields) if (base[f] !== undefined) partial[f] = base[f];
  const input = partial as AnalyzeInput;
  return st.payment ? applyPatch(input, { payment: st.payment }) : input;
}

/** Spec §17 phases, each with the report for the input revealed at that phase. */
export function runLiveSimulation(): { baseScenario: string; phases: (LivePhase & { report: RiskReport })[] } {
  const seq = scenarioBook.sequences.liveSimulation;
  const byStage = new Map<LiveStage, RiskReport>();
  const phases = seq.phases.map((p) => {
    if (!byStage.has(p.stage)) byStage.set(p.stage, analyzeLocal(liveStageInput(p.stage)));
    return { ...p, report: byStage.get(p.stage) as RiskReport };
  });
  return { baseScenario: seq.baseScenario, phases };
}
