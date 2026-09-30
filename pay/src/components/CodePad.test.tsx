import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CodePad, DEMO_LOGIN_CODE, DEMO_PAY_CODE } from './CodePad';

const type = (code: string) => code.split('').forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));

describe('CodePad (demo codes)', () => {
  it('uses the agreed demo codes', () => {
    expect(DEMO_LOGIN_CODE).toBe('3023');
    expect(DEMO_PAY_CODE).toBe('2026');
  });

  it('calls onSuccess for the right code and shows an error for a wrong one', () => {
    vi.useFakeTimers();
    const ok = vi.fn();
    render(<CodePad expected="2026" title="t" subtitle="s" onSuccess={ok} />);
    type('1111');
    expect(screen.getByRole('alert').textContent).toMatch(/Incorrect demo code/);
    act(() => { vi.advanceTimersByTime(500); });
    type('2026');
    act(() => { vi.advanceTimersByTime(200); });
    expect(ok).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/never enter your real UPI PIN/)).toBeTruthy();
    vi.useRealTimers();
  });
});
