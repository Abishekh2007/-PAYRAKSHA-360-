import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  HudPanel, KpiTile, ShieldStatus, SHIELD_STATE_LABEL, StatusPill, ThreatLevel, Ticker, shieldStateFor,
  simulatedFeed, socToneForLevel, statusForLevel, tickerLine,
} from '.';

describe('SOC kit primitives', () => {
  it('socToneForLevel maps risk levels to console tones', () => {
    expect(socToneForLevel('LOW')).toBe('green');
    expect(socToneForLevel('CAUTION')).toBe('amber');
    expect(socToneForLevel('HIGH_CAUTION')).toBe('orange');
    expect(socToneForLevel('HIGH')).toBe('red');
    expect(socToneForLevel(null)).toBe('slate');
  });

  it('HudPanel renders eyebrow, title and body; no header without them', () => {
    const { rerender } = render(
      <HudPanel eyebrow="MONITOR" title="Command Center" data-testid="p">
        body
      </HudPanel>,
    );
    expect(screen.getByRole('heading', { name: 'Command Center' })).toBeInTheDocument();
    expect(screen.getByText('MONITOR')).toBeInTheDocument();
    rerender(<HudPanel data-testid="p">only body</HudPanel>);
    expect(screen.getByTestId('p').querySelector('header')).toBeNull();
  });

  it('ThreatLevel shows the level, score and LIVE pill', () => {
    const { rerender } = render(<ThreatLevel level="HIGH" score={92} />);
    const el = screen.getByTestId('threat-level');
    expect(el).toHaveAttribute('data-level', 'HIGH');
    expect(el).toHaveTextContent('THREAT LEVEL');
    expect(el).toHaveTextContent('HIGH RISK');
    expect(el).toHaveTextContent('92/100');
    expect(el).toHaveTextContent('LIVE');
    rerender(<ThreatLevel level={null} live={false} />);
    expect(screen.getByTestId('threat-level')).toHaveTextContent('MONITORING');
    expect(screen.getByTestId('threat-level')).not.toHaveTextContent('LIVE');
  });

  it('ShieldStatus shows the state label and shieldStateFor maps levels', () => {
    render(<ShieldStatus state="hold" shield="QR SHIELD" score={92} />);
    const el = screen.getByTestId('shield-status');
    expect(el).toHaveAttribute('data-state', 'hold');
    expect(el).toHaveTextContent(SHIELD_STATE_LABEL.hold);
    expect(el).toHaveTextContent('QR SHIELD · SIMULATION');
    expect(shieldStateFor('HIGH')).toBe('hold');
    expect(shieldStateFor('HIGH_CAUTION')).toBe('hold');
    expect(shieldStateFor('CAUTION')).toBe('caution');
    expect(shieldStateFor('LOW')).toBe('clear');
    expect(shieldStateFor(null)).toBe('idle');
    expect(shieldStateFor('LOW', true)).toBe('scanning');
  });

  it('Ticker is a labelled marquee; StatusPill and KpiTile render their text', () => {
    render(
      <>
        <Ticker items={['ALPHA', 'BRAVO']} />
        <StatusPill tone="green">ENGINE ONLINE</StatusPill>
        <KpiTile label="Held for review" value={10} data-testid="kpi" />
      </>,
    );
    expect(screen.getByRole('marquee', { name: 'Simulated alert ticker' })).toBeInTheDocument();
    expect(screen.getAllByText('ALPHA').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('ENGINE ONLINE')).toBeInTheDocument();
    expect(screen.getByTestId('kpi')).toHaveTextContent('10');
  });
});

describe('simulatedFeed', () => {
  const now = Date.UTC(2026, 8, 30, 8, 30, 0); // 14:00:00 IST
  const feed = simulatedFeed({ now });

  it('lists all 12 DEMO scenarios, flagship first, newest first', () => {
    expect(feed).toHaveLength(12);
    expect(feed[0].scenarioId).toBe('utility_scam');
    expect(feed[0].score).toBe(92);
    expect(feed[0].level).toBe('HIGH');
    expect(feed[0].channel).toBe('WHATSAPP');
    expect(feed[0].handle).toBe('unknown-electricity@demo');
    expect(feed[0].time).toBe('13:59:47');
    expect(new Set(feed.map((e) => e.id)).size).toBe(12);
    for (let i = 1; i < feed.length; i++) expect(feed[i].at).toBeLessThan(feed[i - 1].at);
    for (const e of feed) expect(e.handle.endsWith('@demo')).toBe(true);
  });

  it('maps channels and statuses', () => {
    const byId = Object.fromEntries(feed.map((e) => [e.scenarioId, e]));
    expect(byId.customer_care_scam.channel).toBe('CALL');
    expect(byId.kyc_scam.channel).toBe('SMS');
    expect(byId.legit_utility.channel).toBe('APP');
    expect(byId.legit_merchant.channel).toBe('QR');
    expect(byId.legit_utility.status).toBe('LOW');
    expect(statusForLevel('HIGH_CAUTION')).toBe('HELD');
    expect(statusForLevel('CAUTION')).toBe('CHECK');
    expect(simulatedFeed({ now, count: 3 })).toHaveLength(3);
  });

  it('tickerLine is labelled SIMULATION', () => {
    expect(tickerLine(feed[0])).toBe(
      'SIMULATION · 13:59:47 IST · WHATSAPP · Electricity Disconnection Scam · unknown-electricity@demo · RISK 92 · HELD FOR REVIEW',
    );
  });
});
