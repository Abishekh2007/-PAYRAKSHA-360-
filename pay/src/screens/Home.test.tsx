import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import { usePayStore } from '../store/payStore';

// Mock matchMedia for framer-motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('../lib/link', () => ({
  heartbeat: vi.fn().mockResolvedValue({ ok: true, target: null })
}));

describe('Home screen', () => {
  beforeEach(() => {
    usePayStore.setState({
      deviceName: 'Test User',
      draft: null,
      records: [],
      link: { online: false, lastSeen: null, target: null }
    });
  });

  const renderHome = () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pay" element={<div>PAY SCREEN</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders search pill and action labels', () => {
    renderHome();
    expect(screen.getByText('Pay friends and merchants')).toBeInTheDocument();

    const actionLabels = [
      'Scan anyQR code',
      'Paycontacts',
      'Pay phonenumber',
      'Banktransfer',
      'Pay UPIID',
      'Selftransfer',
      'Paybills',
      'Mobilerecharge'
    ];
    // Due to <br/> it might format differently, let's just check words
    expect(screen.getAllByText('Scan anyQR code').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Paycontacts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pay phonenumber').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Banktransfer').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pay UPIID').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Selftransfer').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Paybills').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mobilerecharge').length).toBeGreaterThan(0);
  });

  it('displays offline chip when offline and online chip when linked', () => {
    renderHome();
    expect(screen.getByText('Console offline · checks run on this phone')).toBeInTheDocument();

    usePayStore.setState({ link: { online: true, lastSeen: null, target: null } });
    renderHome(); // Re-render triggers state update check
    expect(screen.getAllByText('Linked to console').length).toBeGreaterThan(0);
  });

  it('shows toast when a demo-only tile is clicked', async () => {
    const user = userEvent.setup();
    renderHome();

    // Click 'Pay phone number'
    const payPhoneBtn = screen.getByText('Pay phonenumber').closest('button');
    await user.click(payPhoneBtn!);

    expect(screen.getByRole('status')).toHaveTextContent('Demo only — RakshaPay checks QR payments. Try Scan any QR code.');
  });

  it('navigates to /pay with target checking draft', async () => {
    const user = userEvent.setup();
    usePayStore.setState({
      link: { online: true, lastSeen: null, target: { setAt: '2023-01-01T00:00:00Z', label: 'Test Target QR', qrText: 'test:123' } }
    });

    renderHome();

    expect(screen.getByText('The console is showing a demo QR')).toBeInTheDocument();
    expect(screen.getByText('Test Target QR')).toBeInTheDocument();

    const checkBtn = screen.getByText('Check it');
    await user.click(checkBtn);

    expect(screen.getByText('PAY SCREEN')).toBeInTheDocument();
    const draft = usePayStore.getState().draft;
    expect(draft).toEqual({
      input: { qrText: 'test:123' },
      source: 'console-target',
      label: 'Test Target QR'
    });
  });

  it('allows payment amount entry on sheet and sets draft', async () => {
    const user = userEvent.setup();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    renderHome();

    // Ravi is a contact. We can split text or click button containing Ravi
    const raviBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Ravi'));
    expect(raviBtn).toBeDefined();
    await user.click(raviBtn!);

    // Dialog pops up
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // The name comes from JSON: "Ravi - Saved Contact"
    expect(screen.getByText('Ravi - Saved Contact')).toBeInTheDocument();

    // Click '5', '0', '0'
    const digit5 = screen.getByRole('button', { name: 'Digit 5' });
    const digit0 = screen.getByRole('button', { name: 'Digit 0' });

    await user.click(digit5);
    await user.click(digit0);
    await user.click(digit0);

    expect(screen.getByText('₹500')).toBeInTheDocument();

    const payBtn = screen.getByRole('button', { name: /Check & pay/i });
    await user.click(payBtn);

    expect(screen.getByText('PAY SCREEN')).toBeInTheDocument();
    const draft = usePayStore.getState().draft;
    expect(draft).toEqual({
      input: { payment: { recipient: 'friend-ravi@demo', amount: 500 } },
      source: 'manual',
      label: 'Pay Ravi - Saved Contact'
    });
  });

  it('contains no password inputs', () => {
    renderHome();
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    expect(passwordInputs.length).toBe(0);
  });
});
