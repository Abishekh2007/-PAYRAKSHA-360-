import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildDemoQrPayload,
  validateDemoQrFields,
  decodeQrFromImageData,
  decodeQrFromFile,
  startCameraScan,
  QrReadError,
  CameraUnavailableError,
  generateQrSvg
} from './qr';
import QRCode from 'qrcode';

describe('qr service', () => {
  let userMediaMock: any;
  let createElementSpy: any;

  beforeEach(() => {
    userMediaMock = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: userMediaMock },
      configurable: true,
    });
    // mock RAF and Canvas for camera scan
    vi.stubGlobal('requestAnimationFrame', (cb: any) => setTimeout(() => cb(performance.now()), 16));
    vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('buildDemoQrPayload gives the exact output for a full field set', () => {
    const fields = {
      recipient: 'abc@demo',
      amount: 1000,
      merchant: 'ABC Store',
      note: 'Hello',
      source: 'WhatsApp',
      scenario: 'QR001',
      urgency: true,
      recipientVerified: false
    };
    const expected = [
      'PAYRAKSHA://demo-payment',
      'recipient=abc@demo',
      'amount=1000',
      'merchant=ABC Store',
      'note=Hello',
      'source=WhatsApp',
      'urgency=true',
      'recipientVerified=false',
      'scenario=QR001'
    ].join('\n');
    expect(buildDemoQrPayload(fields)).toBe(expected);
  });

  it('validateDemoQrFields gives the three messages and null', () => {
    expect(validateDemoQrFields({ recipient: 'abc@demo', amount: 100, merchant: 'M' })).toBeNull();
    expect(validateDemoQrFields({ recipient: 'abc@gmail.com', amount: 100, merchant: 'M' }))
      .toBe('Use a demo recipient ending in @demo.');
    expect(validateDemoQrFields({ recipient: 'abc@demo', amount: 0, merchant: 'M' }))
      .toBe('Enter a demo amount between ₹1 and ₹10,00,000.');
    expect(validateDemoQrFields({ recipient: 'abc@demo', amount: 100, merchant: 'upi://pay' }))
      .toBe('Real payment links are not allowed in demo QR codes.');
  });

  it('round-trip: create, rasterize, and decode from ImageData', async () => {
    const payload = 'PAYRAKSHA://demo-payment\nrecipient=test@demo\namount=50\nmerchant=Test';
    // Generate QR using QRCode
    const qrData = QRCode.create(payload, { errorCorrectionLevel: 'M' });
    const size = qrData.modules.size;
    const quiet = 4;
    const finalSize = size + 2 * quiet;
    const scale = 4;
    const pxSize = finalSize * scale;

    const data = new Uint8ClampedArray(pxSize * pxSize * 4);
    // Fill with white
    for (let i = 0; i < data.length; i++) data[i] = 255;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (qrData.modules.get(x, y)) { // black
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const py = (y + quiet) * scale + dy;
              const px = (x + quiet) * scale + dx;
              const idx = (py * pxSize + px) * 4;
              data[idx] = 0;
              data[idx + 1] = 0;
              data[idx + 2] = 0;
              data[idx + 3] = 255;
            }
          }
        }
      }
    }

    const imageData = { data, width: pxSize, height: pxSize } as unknown as ImageData;
    const decoded = decodeQrFromImageData(imageData);
    expect(decoded).toBe(payload);
  });

  it('an all-white image gives null', () => {
    const data = new Uint8ClampedArray(100 * 100 * 4);
    data.fill(255);
    const imageData = { data, width: 100, height: 100 } as unknown as ImageData;
    expect(decodeQrFromImageData(imageData)).toBeNull();
  });

  it('decodeQrFromFile rejects non-image with QrReadError', async () => {
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });
    await expect(decodeQrFromFile(file)).rejects.toThrow(QrReadError);
    await expect(decodeQrFromFile(file)).rejects.toThrow('Unable to read QR. Try again or upload a clearer image.');
  });

  it('startCameraScan rejects with Camera unavailable when mediaDevices is undefined', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });

    // Test that creating a video element doesn't fail here just in case
    const video = document.createElement('video');
    await expect(startCameraScan(video, () => {})).rejects.toThrow(CameraUnavailableError);
    await expect(startCameraScan(video, () => {})).rejects.toThrow('Camera unavailable. Use Demo QR or Upload QR.');
  });

  it('startCameraScan rejects when getUserMedia rejects', async () => {
    userMediaMock.mockRejectedValueOnce(new Error('NotAllowedError'));
    const video = document.createElement('video');
    await expect(startCameraScan(video, () => {})).rejects.toThrow(CameraUnavailableError);
  });
});
