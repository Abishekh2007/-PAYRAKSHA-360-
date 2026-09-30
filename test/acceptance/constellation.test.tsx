import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { constellationFor, ScamConstellation } from '../../src/components/soc';
import { runScenarioLocal, scenarios } from '../../src/engine';

describe('constellationFor and ScamConstellation', () => {
  it('constellationFor(null) and constellationFor(undefined) toEqual { stars: [], hypotheses: [] }', () => {
    expect(constellationFor(null)).toEqual({ stars: [], hypotheses: [] });
    expect(constellationFor(undefined)).toEqual({ stars: [], hypotheses: [] });
  });

  it('builds the expected stars and hypotheses for utility_scam', () => {
    const utility = runScenarioLocal('utility_scam');
    const expected = [
      ...utility.dna.filter((s) => s.severity !== 'none').map((s) => ({ id: `dna-${s.key}`, label: s.label, kind: 'dna' as const, severity: s.severity })),
      ...utility.analyses.text.signals.filter((s) => s.severity !== 'none').map((s) => ({ id: `sig-${s.id}`, label: s.label, kind: 'signal' as const, severity: s.severity })),
    ];
    expect(expected).toHaveLength(12);

    const result = constellationFor(utility);
    expect(result.stars).toEqual(expected);
    expect(result.hypotheses).toEqual([{ category: 'utility', label: 'Utility / Electricity', percent: 75 }]);
  });

  it('builds hypotheses for customer_care_scam', () => {
    const care = runScenarioLocal('customer_care_scam');
    expect(constellationFor(care).hypotheses).toEqual([
      { category: 'customer_care', label: 'Customer Care', percent: 60 },
      { category: 'refund', label: 'Refund', percent: 20 },
    ]);
  });

  it('has 0 stars for legit_merchant', () => {
    expect(constellationFor(runScenarioLocal('legit_merchant')).stars).toHaveLength(0);
  });

  it('validates hypotheses constraints for all scenarios', () => {
    for (const s of scenarios) {
      const result = constellationFor(runScenarioLocal(s.id));
      expect(result.hypotheses.length).toBeLessThanOrEqual(3);
      for (const h of result.hypotheses) {
        expect(Number.isInteger(h.percent)).toBe(true);
        expect(h.percent).toBeGreaterThanOrEqual(0);
        expect(h.percent).toBeLessThanOrEqual(99);
      }
    }
  });

  it('renders ScamConstellation for utility_scam', () => {
    const utility = runScenarioLocal('utility_scam');
    const expected = [
      ...utility.dna.filter((s) => s.severity !== 'none').map((s) => ({ id: `dna-${s.key}`, label: s.label, kind: 'dna', severity: s.severity })),
      ...utility.analyses.text.signals.filter((s) => s.severity !== 'none').map((s) => ({ id: `sig-${s.id}`, label: s.label, kind: 'signal', severity: s.severity })),
    ];

    render(<ScamConstellation report={utility} />);
    const wrapper = screen.getByTestId('scam-constellation');
    const img = screen.getByRole('img', { name: 'Scam constellation (simulation)' });
    expect(img).toHaveTextContent(utility.patternName);

    for (const star of expected) {
      expect(screen.getByTestId(`star-${star.id}`)).toHaveAttribute('data-severity', star.severity);
    }

    screen.getByRole('list', { name: 'Pattern hypotheses' });
    const hyp0 = screen.getByTestId('hypothesis-0');
    expect(hyp0).toHaveTextContent('Utility / Electricity');
    expect(hyp0).toHaveTextContent('75%');
    expect(screen.queryByTestId('hypothesis-1')).toBeNull();

    expect(wrapper).toHaveTextContent('SIMULATED CONFIDENCE');
    expect(wrapper).toHaveTextContent('SIMULATION');
  });

  it('renders ScamConstellation for customer_care_scam', () => {
    const care = runScenarioLocal('customer_care_scam');
    render(<ScamConstellation report={care} />);
    const hyp0 = screen.getByTestId('hypothesis-0');
    expect(hyp0).toHaveTextContent('Customer Care');
    expect(hyp0).toHaveTextContent('60%');
    const hyp1 = screen.getByTestId('hypothesis-1');
    expect(hyp1).toHaveTextContent('Refund');
    expect(hyp1).toHaveTextContent('20%');
  });

  it('renders ScamConstellation for legit_merchant', () => {
    const { container } = render(<ScamConstellation report={runScenarioLocal('legit_merchant')} />);
    const wrapper = screen.getByTestId('scam-constellation');
    expect(wrapper).toHaveTextContent('NO WARNING SIGNALS CONNECTED');
    expect(container.querySelectorAll('[data-testid^="star-"]')).toHaveLength(0);
  });

  it('renders ScamConstellation for null report', () => {
    render(<ScamConstellation report={null} />);
    const wrapper = screen.getByTestId('scam-constellation');
    expect(wrapper).toHaveTextContent('NO WARNING SIGNALS CONNECTED');
    expect(wrapper).toHaveTextContent('NO PATTERN HYPOTHESIS');
  });
});
