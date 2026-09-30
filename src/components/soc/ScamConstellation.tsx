// STUB: contract only. Builder task `intel` implements this file.
// The acceptance tests in test/acceptance/constellation.test.tsx are written from the comments below.
import type { RiskReport, Severity } from '../../types';

export interface ConstellationStar {
  /** `dna-${strand.key}` or `sig-${signal.id}`. */
  id: string;
  label: string;
  kind: 'dna' | 'signal';
  severity: Severity;
}

export interface PatternHypothesis {
  /** Category id, e.g. 'utility'. */
  category: string;
  /** Category label, e.g. 'Utility / Electricity'. */
  label: string;
  /** Simulated confidence, integer 0..99 (never 100). */
  percent: number;
}

/**
 * stars: first every report.dna strand whose severity !== 'none', as { id: `dna-${strand.key}`, label: strand.label, kind: 'dna', severity },
 *        then every report.analyses.text.signals entry whose severity !== 'none', as { id: `sig-${signal.id}`, label: signal.label, kind: 'signal', severity }.
 * hypotheses (at most 3):
 *   positive = the entries of report.analyses.text.categoryScores whose value > 0; total = the sum of their values
 *   order: report.analyses.text.category first (when it is among positive), then the other positive categories
 *          by value descending, ties by category id ascending
 *   label: report.analyses.text.categoryLabel for the report's own category; otherwise engineConfig.engine.categories[id]?.label ?? id
 *          (engineConfig is exported by src/engine)
 *   percent = Math.round(100 * value / (total + 1))   (so never 100)
 * null / undefined report → { stars: [], hypotheses: [] }
 * Examples (runScenarioLocal):
 *   'utility_scam'       categoryScores { utility: 3 } → hypotheses [{ category: 'utility', label: 'Utility / Electricity', percent: 75 }];
 *                        8 dna stars + 4 signal stars = 12 stars
 *   'customer_care_scam' { customer_care: 3, refund: 1 } → [{ 'customer_care', 'Customer Care', 60 }, { 'refund', 'Refund', 20 }]
 *   'legit_merchant'     → 0 stars
 */
export function constellationFor(report: RiskReport | null | undefined): { stars: ConstellationStar[]; hypotheses: PatternHypothesis[] } {
  void report;
  return { stars: [], hypotheses: [] };
}

export interface ScamConstellationProps {
  report: RiskReport | null;
  className?: string;
}

/**
 * Scam constellation: the warning signals of one report drawn as stars joined to the detected pattern.
 * Renders:
 *   - a wrapper with data-testid="scam-constellation"
 *   - an <svg role="img" aria-label="Scam constellation (simulation)"> with a central node whose <text> is report.patternName,
 *     and one element per star with data-testid={`star-${star.id}`} and data-severity={star.severity}, each joined to the centre by a line
 *   - <ul aria-label="Pattern hypotheses"> with one <li data-testid={`hypothesis-${i}`}> per hypothesis (i from 0), showing its label and `${percent}%`
 *   - the text 'SIMULATED CONFIDENCE' and the text 'SIMULATION'
 *   - no stars → the text 'NO WARNING SIGNALS CONNECTED'; no hypotheses → the text 'NO PATTERN HYPOTHESIS'
 *   - report === null → both empty-state texts
 */
export function ScamConstellation({ report, className = '' }: ScamConstellationProps) {
  return (
    <div data-testid="scam-constellation-stub" className={className}>
      Scam constellation (not built yet){report ? `: ${report.patternName}` : ''}
    </div>
  );
}
