import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Scan from './Scan';
import { usePayStore } from '../store/payStore';
import { startCameraScan, decodeQrFromFile, QR_READ_ERROR } from '../../../src/services/qr';

vi.mock('../../../src/services/qr', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/services/qr')>();
  return {
    ...actual,
    startCameraScan: vi.fn(),
    decodeQrFromFile: vi.fn(),
  };
});

// Since framer-motion has some issues with unmounting in Jest/Vitest sometimes, we mock useReducedMotion
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

describe('Scan screen', () => {
  let originalIsSecureContext: boolean | undefined;

  beforeEach(() => {
    usePayStore.setState({ draft: null, records: [], link: { online: false, lastSeen: null, target: null } });
    vi.clearAllMocks();

    originalIsSecureContext = window.isSecureContext;
    Object.defineProperty(window, 'isSecureContext', {
      writable: true,
      value: true,
    });

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn(),
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'isSecureContext', {
      writable: true,
      value: originalIsSecureContext,
    });
  });

  const renderWithRouter = () => {
    return render(
      <MemoryRouter initialEntries={['/scan']}>
        <Routes>
          <Route path="/scan" element={<Scan />} />
          <Route path="/pay" element={<div>PAY SCREEN</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows camera help card and does not call startCameraScan if not secure context', () => {
    Object.defineProperty(window, 'isSecureContext', { value: false });
    renderWithRouter();

    expect(screen.getByTestId('camera-help')).toBeInTheDocument();
    expect(screen.getByText(/Camera needs a secure/i)).toBeInTheDocument();
    expect(startCameraScan).not.toHaveBeenCalled();
  });

  it('calls startCameraScan and on result sets draft and navigates to pay', async () => {
    const user = userEvent.setup();
    let captureResult: (text: string) => void = () => {};
    const mockStop = vi.fn();

    vi.mocked(startCameraScan).mockImplementation(async (video, onResult) => {
      captureResult = onResult;
      return { stop: mockStop };
    });

    const { unmount } = renderWithRouter();

    // Verify it started scanning
    expect(startCameraScan).toHaveBeenCalled();

    // Simulate finding a QR
    captureResult('X');

    // Should navigate to pay
    await screen.findByText('PAY SCREEN');
    expect(usePayStore.getState().draft).toEqual({
      input: { qrText: 'X' },
      source: 'camera',
    });

    // Unmount should stop
    unmount();
    expect(mockStop).toHaveBeenCalled();
  });

  it('handles gallery upload success', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    vi.mocked(decodeQrFromFile).mockResolvedValue('GALLERY_QR');

    const input = screen.getByTestId('gallery-input') as HTMLInputElement;
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });

    await user.upload(input, file);

    await screen.findByText('PAY SCREEN');
    expect(usePayStore.getState().draft).toEqual({
      input: { qrText: 'GALLERY_QR' },
      source: 'gallery',
    });
  });

  it('handles gallery upload failure', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    vi.mocked(decodeQrFromFile).mockRejectedValue(new Error('fail'));

    const input = screen.getByTestId('gallery-input') as HTMLInputElement;
    const file = new File(['bad'], 'bad.png', { type: 'image/png' });

    await user.upload(input, file);

    await screen.findByText(QR_READ_ERROR);
  });

  it('disables console target if empty, and enables if present', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithRouter();

    const disabledBtn = screen.getByText('Scan what the console shows').closest('button');
    expect(disabledBtn).toBeDisabled();

    unmount();

    usePayStore.setState({
      link: {
        online: true,
        lastSeen: null,
        target: { qrText: 'CONSOLE_TEXT', label: 'Console Target', setAt: new Date().toISOString() },
      },
    });

    renderWithRouter();
    const enabledBtn = screen.getByText('Scan what the console shows').closest('button');
    expect(enabledBtn).not.toBeDisabled();

    await user.click(enabledBtn!);
    await screen.findByText('PAY SCREEN');

    expect(usePayStore.getState().draft).toEqual({
      input: { qrText: 'CONSOLE_TEXT' },
      source: 'console-target',
      label: 'Console Target',
    });
  });

  it('lists Demo QR samples with Electricity Disconnection Scam first and tapping sets sample', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    const sampleBtn = screen.getByText('Demo QR samples');
    await user.click(sampleBtn);

    const firstSample = await screen.findByText('Electricity Disconnection Scam');
    expect(firstSample).toBeInTheDocument();

    await user.click(firstSample);

    await screen.findByText('PAY SCREEN');

    const draft = usePayStore.getState().draft;
    expect(draft?.source).toBe('sample');
    expect(draft?.label).toBe('Electricity Disconnection Scam');
    expect(draft?.input.qrText).toBeTruthy();
  });
});
