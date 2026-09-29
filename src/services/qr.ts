// STUB: the services task implements decoding (jsqr), camera scanning and full payload building.
import QRCode from 'qrcode';

export const QR_READ_ERROR = 'Unable to read QR. Try again or upload a clearer image.';
export const CAMERA_ERROR = 'Camera unavailable. Use Demo QR or Upload QR.';

export class QrReadError extends Error {
  constructor(message = QR_READ_ERROR) { super(message); this.name = 'QrReadError'; }
}
export class CameraUnavailableError extends Error {
  constructor(message = CAMERA_ERROR) { super(message); this.name = 'CameraUnavailableError'; }
}

/** Fields of a PAYRAKSHA demo QR. Recipients must be fake demo ids ending in "@demo". */
export interface DemoQrFields {
  recipient: string;
  amount: number;
  merchant: string;
  note?: string;
  /** Free text such as "WhatsApp Demo" (the engine normalises it). */
  source?: string;
  scenario?: string;
  urgency?: boolean;
  recipientVerified?: boolean;
}

/** Builds a demo payload ("PAYRAKSHA://demo-payment" + key=value lines). Never a real UPI link. */
export function buildDemoQrPayload(f: DemoQrFields): string {
  const lines = ['PAYRAKSHA://demo-payment', `recipient=${f.recipient}`, `amount=${f.amount}`, `merchant=${f.merchant}`];
  if (f.note) lines.push(`note=${f.note}`);
  if (f.source) lines.push(`source=${f.source}`);
  if (f.urgency !== undefined) lines.push(`urgency=${f.urgency}`);
  if (f.recipientVerified !== undefined) lines.push(`recipientVerified=${f.recipientVerified}`);
  if (f.scenario) lines.push(`scenario=${f.scenario}`);
  return lines.join('\n');
}

/** Decodes a QR from raw pixels; null when none is found. */
export function decodeQrFromImageData(_data: ImageData): string | null {
  return null;
}

/** Decodes a QR from an uploaded image. Rejects with QrReadError when unreadable. */
export async function decodeQrFromFile(_file: File): Promise<string> {
  throw new QrReadError();
}

/** Starts the rear camera on `video` and calls onResult once with the decoded text. Rejects with CameraUnavailableError. */
export async function startCameraScan(_video: HTMLVideoElement, _onResult: (text: string) => void): Promise<{ stop: () => void }> {
  throw new CameraUnavailableError();
}

/** Renders text as an SVG QR code string. */
export async function generateQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
}

export function svgToDataUrl(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
