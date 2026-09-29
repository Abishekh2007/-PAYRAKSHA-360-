import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, act, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/utils';
import QrShield from './QrShield';
import { CAMERA_ERROR, QR_READ_ERROR } from '../services/qr';

describe('QrShield', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs analysis for QR001 via demo button and shows steps and result', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithRouter(<QrShield />, { route: '/qr' });

    await user.click(await screen.findByRole('button', { name: 'USE DEMO QR' }));
    
    const qr001Btn = await screen.findByRole('button', { name: /QR001 \· /i });
    await user.click(qr001Btn);
    
    // Steps should appear
    expect(await screen.findByText(/Extracting payment metadata/i)).toBeInTheDocument();

    // Advance to let analysis resolve
    await act(() => vi.advanceTimersByTime(2000));
    
    const res = await screen.findByTestId('risk-result', {}, { timeout: 5000 });
    expect(res).toHaveAttribute('data-score', '92');
  });

  it('runs analysis for QR002 via demo button and gets 12', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithRouter(<QrShield />, { route: '/qr' });

    await user.click(await screen.findByRole('button', { name: 'USE DEMO QR' }));
    
    const qr002Btn = await screen.findByRole('button', { name: /QR002 \· /i });
    await user.click(qr002Btn);
    
    await act(() => vi.advanceTimersByTime(2000));
    
    const res = await screen.findByTestId('risk-result', {}, { timeout: 5000 });
    expect(res).toHaveAttribute('data-score', '12');
  });

  it('shows CAMERA_ERROR when starting camera', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithRouter(<QrShield />, { route: '/qr' });

    await user.click(await screen.findByRole('button', { name: 'START CAMERA' }));
    
    // Assuming startCameraScan throws (which it does in stub), it will render ErrorNotice
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(CAMERA_ERROR);
  });

  it('shows QR_READ_ERROR on invalid file upload', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithRouter(<QrShield />, { route: '/qr' });

    // Click upload QR image, which clicks the hidden input
    const input = screen.getByTestId('qr-upload');
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });

    // Hidden inputs can't be interacted with directly by userEvent unless visibility checks are bypassed,
    // so we use fireEvent for file change event.
    fireEvent.change(input, { target: { files: [file] } });

    await act(() => vi.advanceTimersByTime(2000));
    const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(alert).toHaveTextContent(QR_READ_ERROR);
  });

  it('runs analysis for QR005 via deep link and gets 88', async () => {
    renderWithRouter(<QrShield />, { route: '/qr?demo=QR005' });
    
    // Automatically runs
    await act(() => vi.advanceTimersByTime(2000));

    const res = await screen.findByTestId('risk-result', {}, { timeout: 5000 });
    expect(res).toHaveAttribute('data-score', '88');
  });
});
