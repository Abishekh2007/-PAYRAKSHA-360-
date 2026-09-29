import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { runScenarioLocal, analyzeUrlLocal } from '../../engine';
import { ScamDnaChart } from './ScamDnaChart';
import { AttackChainView } from './AttackChainView';
import { ContributionsChart } from './ContributionsChart';
import { SignalList } from './SignalList';
import { UrlChecksList } from './UrlChecksList';

describe('Risk Visualisations', () => {
  const report = runScenarioLocal('utility_scam');

  it('ScamDnaChart shows every dna label and percent', () => {
    const { rerender } = render(<ScamDnaChart dna={report.dna} variant="bars" />);
    for (const d of report.dna) {
      expect(screen.getAllByText(d.label).length).toBeGreaterThan(0);
      expect(screen.getAllByText(`${d.percent}%`).length).toBeGreaterThan(0);
    }

    rerender(<ScamDnaChart dna={report.dna} variant="radar" />);
    for (const d of report.dna) {
      expect(screen.getAllByText(d.label).length).toBeGreaterThan(0);
      expect(screen.getAllByText(`${d.percent}%`).length).toBeGreaterThan(0);
    }
  });

  it('AttackChainView renders li items with matching data-active', () => {
    render(<AttackChainView nodes={report.attackChain} animate={false} />);
    const list = screen.getByTestId('attack-chain');
    const items = list.querySelectorAll('li');
    expect(items.length).toBe(report.attackChain.length);
    report.attackChain.forEach((node, idx) => {
      expect(items[idx].getAttribute('data-active')).toBe(String(node.active));
    });
  });

  it('ContributionsChart shows baseline and top factor', () => {
    render(<ContributionsChart contributions={report.contributions} score={report.score} clamped />);
    expect(screen.getAllByText('Baseline residual risk', { exact: false }).length).toBeGreaterThan(0);

    const factorRows = report.contributions.filter(c => c.kind !== 'baseline').sort((a, b) => b.points - a.points);
    if (factorRows.length > 0) {
      const top = factorRows[0];
      expect(screen.getAllByText(top.label, { exact: false }).length).toBeGreaterThan(0);
      expect(screen.getAllByText(`+${top.points}`, { exact: false }).length).toBeGreaterThan(0);
    }

    expect(screen.getAllByText(`Total: ${report.score}`, { exact: false }).length).toBeGreaterThan(0);
  });

  it('SignalList for text signals shows each label', () => {
    const signals = report.analyses.text?.signals || [];
    render(<SignalList signals={signals} />);
    for (const s of signals) {
      expect(screen.getAllByText(`${s.label}:`, { exact: false }).length).toBeGreaterThan(0);
    }
  });

  it('UrlChecksList shows domain and handles errors', () => {
    const analysisId = analyzeUrlLocal('http://kyc-update-verify.xyz/login');
    const { rerender, container } = render(<UrlChecksList analysis={analysisId} />);

    expect(screen.getAllByText(/kyc-update-verify\.xyz/i).length).toBeGreaterThan(0);
    expect(container.querySelector('a')).toBeNull();

    const invalid = analyzeUrlLocal('not a url');
    rerender(<UrlChecksList analysis={invalid} />);
    expect(screen.getAllByText('Enter a valid URL.', { exact: false }).length).toBeGreaterThan(0);
  });
});
