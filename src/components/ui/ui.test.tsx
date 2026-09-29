import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  RiskGauge,
  ScanSteps,
  ErrorNotice,
  Toggle,
  Button,
  EngineBadge,
  SimulationBadge,
  AnimatedNumber
} from './index';

describe('UI components', () => {
  it('RiskGauge aria attributes for score 92, level HIGH', () => {
    render(<RiskGauge score={92} level="HIGH" />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuenow', '92');
    expect(meter).toHaveAttribute('aria-label', 'Risk score 92 out of 100');
  });

  it('ScanSteps states for activeIndex -1, 1, 3', () => {
    const steps = ['Step 1', 'Step 2', 'Step 3'];

    const { rerender } = render(<ScanSteps steps={steps} activeIndex={-1} />);
    const items1 = screen.getAllByRole('listitem');
    expect(items1[0]).toHaveAttribute('data-state', 'pending');
    expect(items1[1]).toHaveAttribute('data-state', 'pending');
    expect(items1[2]).toHaveAttribute('data-state', 'pending');

    rerender(<ScanSteps steps={steps} activeIndex={1} />);
    const items2 = screen.getAllByRole('listitem');
    expect(items2[0]).toHaveAttribute('data-state', 'done');
    expect(items2[1]).toHaveAttribute('data-state', 'active');
    expect(items2[2]).toHaveAttribute('data-state', 'pending');

    rerender(<ScanSteps steps={steps} activeIndex={3} />);
    const items3 = screen.getAllByRole('listitem');
    expect(items3[0]).toHaveAttribute('data-state', 'done');
    expect(items3[1]).toHaveAttribute('data-state', 'done');
    expect(items3[2]).toHaveAttribute('data-state', 'done');
  });

  it('ErrorNotice: exact message, role alert, onRetry is called', async () => {
    const onRetry = vi.fn();
    render(<ErrorNotice message="Test error message" onRetry={onRetry} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Test error message');

    const btn = screen.getByRole('button', { name: /try again/i });
    await userEvent.click(btn);
    expect(onRetry).toHaveBeenCalled();
  });

  it('Toggle: onChange receives the flipped value', async () => {
    const onChange = vi.fn();
    render(<Toggle label="Enable Feature" checked={false} onChange={onChange} />);
    const toggle = screen.getByRole('switch');
    await userEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('Button loading: disabled with aria-busy', () => {
    render(<Button loading>Click Me</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('EngineBadge: both sources, and latency 12.4 shows "· 12 ms"', () => {
    const { rerender, container } = render(<EngineBadge source="python-api" latencyMs={12.4} />);
    expect(container).toHaveTextContent('Python risk engine (FastAPI)');
    expect(container).toHaveTextContent('· 12 ms');

    rerender(<EngineBadge source="browser" />);
    expect(container).toHaveTextContent('In-browser engine (offline)');
    expect(container).not.toHaveTextContent('ms');
  });

  it('SimulationBadge text', () => {
    render(<SimulationBadge />);
    const badge = screen.getByTestId('simulation-badge');
    expect(badge).toHaveTextContent(/^SIMULATION \/ DEMO$/);
  });

  it('AnimatedNumber: aria-label equals the formatted final value', () => {
    vi.useFakeTimers();
    render(<AnimatedNumber value={100} duration={500} format={(n) => `R${n}`} />);
    const span = screen.getByLabelText('R100');
    expect(span).toHaveAttribute('data-value', '100');
    vi.useRealTimers();
  });
});
