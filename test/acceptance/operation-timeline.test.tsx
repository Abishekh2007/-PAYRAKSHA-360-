import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  OperationTimeline,
  OPERATION_STATUS_LABEL,
  type OperationBeat,
} from '../../src/components/soc';

const beats: OperationBeat[] = [
  {
    id: 'a',
    time: 'T+00:00',
    stage: 'MESSAGE',
    title: 'Suspicious message received',
    detail: 'Urgency cues found',
    score: 54,
    level: 'CAUTION',
  },
  {
    id: 'b',
    time: 'T+00:02',
    stage: 'LINK',
    title: 'Suspicious link opened',
    score: 65,
    level: 'HIGH_CAUTION',
  },
  {
    id: 'c',
    time: 'T+00:04',
    stage: 'QR',
    title: 'QR detected',
    score: null,
    level: null,
  },
];

describe('OPERATION_STATUS_LABEL', () => {
  it('maps each status to the expected label', () => {
    expect(OPERATION_STATUS_LABEL).toEqual({
      idle: 'STANDBY',
      running: 'IN PROGRESS',
      complete: 'COMPLETE',
    });
  });
});

describe('OperationTimeline', () => {
  it('renders running operation with revealed beats and status chip', () => {
    render(
      <OperationTimeline
        name="Blackout"
        beats={beats}
        revealed={2}
        status="running"
      />
    );

    const timeline = screen.getByTestId('operation-timeline');
    expect(timeline).toHaveAttribute('data-status', 'running');
    expect(
      screen.getByRole('heading', { name: 'OPERATION BLACKOUT' })
    ).toBeInTheDocument();
    expect(timeline).toHaveTextContent('3 BEATS');
    expect(timeline).toHaveTextContent('SIMULATION');

    const statusEl = screen.getByTestId('operation-status');
    expect(statusEl).toHaveTextContent('IN PROGRESS');

    const list = screen.getByRole('list', { name: 'Operation timeline' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);

    const beat01 = screen.getByTestId('beat-01');
    expect(beat01).toHaveTextContent('T+00:00');
    expect(beat01).toHaveTextContent('MESSAGE');
    expect(beat01).toHaveTextContent('Suspicious message received');
    expect(beat01).toHaveTextContent('Urgency cues found');
    expect(beat01).toHaveTextContent('RISK 54');
    expect(beat01).not.toHaveAttribute('aria-current', 'step');

    const beat02 = screen.getByTestId('beat-02');
    expect(beat02).toHaveTextContent('T+00:02');
    expect(beat02).toHaveTextContent('LINK');
    expect(beat02).toHaveTextContent('Suspicious link opened');
    expect(beat02).toHaveTextContent('RISK 65');
    expect(beat02).toHaveAttribute('aria-current', 'step');

    expect(screen.queryByTestId('beat-03')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Replay operation' })
    ).toBeNull();
  });

  it('renders default idle status with zero revealed beats', () => {
    render(<OperationTimeline name="Blackout" beats={beats} revealed={0} />);

    const timeline = screen.getByTestId('operation-timeline');
    expect(timeline).toHaveAttribute('data-status', 'idle');

    const statusEl = screen.getByTestId('operation-status');
    expect(statusEl).toHaveTextContent('STANDBY');

    const list = screen.getByRole('list', { name: 'Operation timeline' });
    expect(within(list).queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.queryByTestId('beat-01')).toBeNull();
  });

  it('clamps revealed count when revealed exceeds beats length', () => {
    render(<OperationTimeline name="Blackout" beats={beats} revealed={99} />);

    const list = screen.getByRole('list', { name: 'Operation timeline' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);

    const beat03 = screen.getByTestId('beat-03');
    expect(beat03).toHaveAttribute('aria-current', 'step');
    expect(beat03).toHaveTextContent('QR detected');
    expect(beat03.textContent).not.toContain('RISK null');
    expect(beat03.textContent).not.toContain('RISK undefined');
  });

  it('clamps revealed count when revealed is negative', () => {
    render(<OperationTimeline name="Blackout" beats={beats} revealed={-1} />);

    const list = screen.getByRole('list', { name: 'Operation timeline' });
    expect(within(list).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('renders replay button when complete with onReplay callback and handles clicks', async () => {
    const user = userEvent.setup();
    const handleReplay = vi.fn();

    render(
      <OperationTimeline
        name="Blackout"
        beats={beats}
        revealed={3}
        status="complete"
        onReplay={handleReplay}
      />
    );

    const statusEl = screen.getByTestId('operation-status');
    expect(statusEl).toHaveTextContent('COMPLETE');

    const replayButton = screen.getByRole('button', {
      name: 'Replay operation',
    });
    expect(replayButton).toBeInTheDocument();

    await user.click(replayButton);
    expect(handleReplay).toHaveBeenCalledTimes(1);
  });

  it('does not render replay button when complete without onReplay or running with onReplay', () => {
    const handleReplay = vi.fn();

    const { unmount } = render(
      <OperationTimeline
        name="Blackout"
        beats={beats}
        revealed={3}
        status="complete"
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Replay operation' })
    ).toBeNull();

    unmount();

    render(
      <OperationTimeline
        name="Blackout"
        beats={beats}
        revealed={2}
        status="running"
        onReplay={handleReplay}
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Replay operation' })
    ).toBeNull();
  });

  it('formats heading with uppercase operation name', () => {
    render(<OperationTimeline name="Power Grid" beats={beats} revealed={1} />);
    expect(
      screen.getByRole('heading', { name: 'OPERATION POWER GRID' })
    ).toBeInTheDocument();
  });
});
