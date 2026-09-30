import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { ScamRadar, radarDistance, simulatedFeed, STATUS_LABEL, SIM_CHANNELS } from '../../src/components/soc';

const now = Date.UTC(2026, 8, 30, 8, 30, 0); // 14:00:00 IST
const events = simulatedFeed({ now }); // 12 DEMO events, newest first

describe('radarDistance', () => {
  it('computes exact distance for known scores with clamping', () => {
    expect(radarDistance(0)).toBe(0.92);
    expect(radarDistance(50)).toBe(0.5);
    expect(radarDistance(92)).toBe(0.147);
    expect(radarDistance(100)).toBe(0.08);
    expect(radarDistance(150)).toBe(0.08);
    expect(radarDistance(-5)).toBe(0.92);
  });

  it('keeps all simulated event scores within normalized bounds [0.08, 0.92]', () => {
    for (const e of events) {
      const dist = radarDistance(e.score);
      expect(dist).toBeGreaterThanOrEqual(0.08);
      expect(dist).toBeLessThanOrEqual(0.92);
    }
  });

  it('monotonically decreases distance as risk score increases', () => {
    const scores = [-10, 0, 15, 50, 75, 92, 100, 110];
    for (let i = 0; i < scores.length - 1; i++) {
      expect(radarDistance(scores[i])).toBeGreaterThanOrEqual(radarDistance(scores[i + 1]));
    }
  });
});

describe('ScamRadar', () => {
  it('renders full radar with active contact, blips, sweep, and interactive contacts list', () => {
    const onSelect = vi.fn();
    render(<ScamRadar events={events} activeId="sim-utility_scam" onSelect={onSelect} />);

    const radar = screen.getByTestId('scam-radar');
    expect(radar).toBeInTheDocument();
    expect(radar).toHaveTextContent('SIMULATION');

    const svg = screen.getByRole('img', { name: 'Scam radar (simulation)' });
    expect(svg).toBeInTheDocument();
    for (const channel of SIM_CHANNELS) {
      expect(svg).toHaveTextContent(channel);
    }

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      const blip = screen.getByTestId(`radar-blip-${e.id}`);
      expect(blip).toBeInTheDocument();
      expect(blip).toHaveAttribute('data-level', e.level);
      expect(blip).toHaveAttribute('data-distance', String(radarDistance(e.score)));
      if (i === 0) {
        expect(blip).toHaveAttribute('data-active', 'true');
      } else {
        expect(blip).not.toHaveAttribute('data-active', 'true');
      }
    }

    expect(screen.getByTestId('radar-sweep')).toBeInTheDocument();

    const list = screen.getByRole('list', { name: 'Radar contacts' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(12);

    const buttons = within(list).getAllByRole('button');
    expect(buttons).toHaveLength(12);

    for (let i = 0; i < events.length; i++) {
      const btn = buttons[i];
      expect(btn).toHaveTextContent(events[i].time);
      expect(btn).toHaveTextContent(events[i].channel);
      expect(btn).toHaveTextContent(events[i].title);
      expect(btn).toHaveTextContent(`RISK ${events[i].score}`);
      expect(btn).toHaveTextContent(STATUS_LABEL[events[i].status]);
      if (i === 0) {
        expect(btn).toHaveAttribute('aria-pressed', 'true');
      } else {
        expect(btn).toHaveAttribute('aria-pressed', 'false');
      }
    }

    fireEvent.click(buttons[2]);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(events[2]);
  });

  it('renders radar with sweep=false and no active contact', () => {
    render(<ScamRadar events={events} sweep={false} />);

    expect(screen.getByTestId('scam-radar')).toBeInTheDocument();
    expect(screen.queryByTestId('radar-sweep')).toBeNull();

    for (const e of events) {
      const blip = screen.getByTestId(`radar-blip-${e.id}`);
      expect(blip).not.toHaveAttribute('data-active', 'true');
    }

    const list = screen.getByRole('list', { name: 'Radar contacts' });
    const buttons = within(list).getAllByRole('button');
    for (const btn of buttons) {
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('renders empty radar with NO CONTACTS when events is empty', () => {
    const { container } = render(<ScamRadar events={[]} />);

    const radar = screen.getByTestId('scam-radar');
    expect(radar).toBeInTheDocument();
    expect(radar).toHaveTextContent('NO CONTACTS');
    expect(radar).toHaveTextContent('SIMULATION');

    const list = screen.getByRole('list', { name: 'Radar contacts' });
    expect(within(list).queryAllByRole('listitem')).toHaveLength(0);

    expect(container.querySelectorAll('[data-testid^="radar-blip-"]')).toHaveLength(0);
  });
});
