import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/utils';
import QrGenerator from './QrGenerator';
import * as linkService from '../services/link';
import { useDemoStore } from '../store/demoStore';

vi.mock('../services/link', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/link')>();
  return {
    ...actual,
    setLinkTarget: vi.fn(),
  };
});

describe('QrGenerator', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    useDemoStore.getState().resetDemo();
    vi.mocked(linkService.setLinkTarget).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates a QR and shows success UI', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithRouter(<QrGenerator />, { route: '/qr-generator' });

    // Expecting DEMO QR FORGE HUD Panel to be present
    expect(screen.getByText('DEMO QR FORGE')).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'QR001' }));
    
    // Recipient field must be populated
    const recipientInput = screen.getByRole('textbox', { name: 'Recipient' }) as HTMLInputElement;
    expect(recipientInput.value).toBe('unknown-electricity@demo');
    
    await user.click(screen.getByRole('button', { name: 'GENERATE DEMO QR' }));
    
    // We expect the image and pre to show up
    const img = await screen.findByAltText('Demo QR code');
    expect(img).toBeInTheDocument();
    
    // Should contain "PAYRAKSHA://demo-payment"
    const pre = screen.getByText(/PAYRAKSHA:\/\/demo-payment/i);
    expect(pre).toHaveTextContent('recipient=unknown-electricity@demo');
  });

  it('validates against missing @demo', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithRouter(<QrGenerator />, { route: '/qr-generator' });
    
    await user.type(screen.getByRole('textbox', { name: 'Recipient' }), 'someone@okbank');
    await user.type(screen.getByRole('spinbutton', { name: 'Amount (₹)' }), '100');
    
    await user.click(screen.getByRole('button', { name: 'GENERATE DEMO QR' }));
    
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Use a demo recipient ending in @demo.');
  });

  it('validates against payment links', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithRouter(<QrGenerator />, { route: '/qr-generator' });
    
    await user.type(screen.getByRole('textbox', { name: 'Recipient' }), 'test@demo');
    await user.type(screen.getByRole('spinbutton', { name: 'Amount (₹)' }), '100');
    await user.type(screen.getByRole('textbox', { name: 'Note' }), 'upi://pay?pa=x');
    
    await user.click(screen.getByRole('button', { name: 'GENERATE DEMO QR' }));
    
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Real payment links are not allowed in demo QR codes.');
  });

  it('sends to phone target successfully', async () => {
    vi.mocked(linkService.setLinkTarget).mockResolvedValueOnce({ qrText: 'xyz', label: 'test', setAt: 'now' });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithRouter(<QrGenerator />, { route: '/qr-generator' });

    await user.click(await screen.findByRole('button', { name: 'QR001' }));
    await user.click(screen.getByRole('button', { name: 'GENERATE DEMO QR' }));
    
    const sendBtn = await screen.findByRole('button', { name: 'SEND TO PHONE TARGET' });
    await user.click(sendBtn);

    expect(linkService.setLinkTarget).toHaveBeenCalled();
    const alert = await screen.findByRole('status');
    expect(alert).toHaveTextContent('Sent — on the phone, “Scan what the console shows” now opens this QR.');
  });

  it('shows offline status when send to phone target fails', async () => {
    vi.mocked(linkService.setLinkTarget).mockResolvedValueOnce(null);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithRouter(<QrGenerator />, { route: '/qr-generator' });

    await user.click(await screen.findByRole('button', { name: 'QR001' }));
    await user.click(screen.getByRole('button', { name: 'GENERATE DEMO QR' }));
    
    const sendBtn = await screen.findByRole('button', { name: 'SEND TO PHONE TARGET' });
    await user.click(sendBtn);

    const alert = await screen.findByRole('status');
    expect(alert).toHaveTextContent('Phone link offline — start PAYRAKSHA with the launcher so the phone can reach it.');
  });
});
