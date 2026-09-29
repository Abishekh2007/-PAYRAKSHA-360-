import jsQR from 'jsqr';
import QRCode from 'qrcode';

export const QR_READ_ERROR = 'Unable to read QR. Try again or upload a clearer image.';
export const CAMERA_ERROR = 'Camera unavailable. Use Demo QR or Upload QR.';

export class QrReadError extends Error {
  constructor(message = QR_READ_ERROR) { super(message); this.name = 'QrReadError'; }
}
export class CameraUnavailableError extends Error {
  constructor(message = CAMERA_ERROR) { super(message); this.name = 'CameraUnavailableError'; }
}

export interface DemoQrFields {
  recipient: string;
  amount: number;
  merchant: string;
  note?: string;
  source?: string;
  scenario?: string;
  urgency?: boolean;
  recipientVerified?: boolean;
}

export function buildDemoQrPayload(f: DemoQrFields): string {
  const lines = ['PAYRAKSHA://demo-payment', `recipient=${f.recipient}`, `amount=${f.amount}`, `merchant=${f.merchant}`];
  if (f.note) lines.push(`note=${f.note}`);
  if (f.source) lines.push(`source=${f.source}`);
  if (f.urgency !== undefined) lines.push(`urgency=${f.urgency}`);
  if (f.recipientVerified !== undefined) lines.push(`recipientVerified=${f.recipientVerified}`);
  if (f.scenario) lines.push(`scenario=${f.scenario}`);
  return lines.join('\n');
}

export function validateDemoQrFields(f: DemoQrFields): string | null {
  if (!f.recipient.endsWith('@demo')) return 'Use a demo recipient ending in @demo.';
  if (f.amount < 1 || f.amount > 1000000) return 'Enter a demo amount between ₹1 and ₹10,00,000.';

  const hasUpi = Object.values(f).some(v => typeof v === 'string' && v.toLowerCase().includes('upi:'));
  if (hasUpi) return 'Real payment links are not allowed in demo QR codes.';
  return null;
}

export function decodeQrFromImageData(data: ImageData): string | null {
  const code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' });
  return code ? code.data : null;
}

export async function decodeQrFromFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new QrReadError();
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new QrReadError();

  let img: HTMLImageElement | ImageBitmap | null = null;
  let objectUrl: string | null = null;

  try {
    if (typeof createImageBitmap !== 'undefined') {
      img = await createImageBitmap(file);
    } else {
      objectUrl = URL.createObjectURL(file);
      const imageEl = new Image();
      imageEl.src = objectUrl;
      img = imageEl;
      await new Promise<void>((resolve, reject) => {
        imageEl.onload = () => resolve();
        imageEl.onerror = () => reject();
      });
    }

    const { width, height } = img;
    const maxSide = Math.max(width, height);
    let drawWidth = width;
    let drawHeight = height;

    if (maxSide > 1024) {
      const scale = 1024 / maxSide;
      drawWidth = Math.round(width * scale);
      drawHeight = Math.round(height * scale);
    }

    canvas.width = drawWidth;
    canvas.height = drawHeight;
    ctx.drawImage(img as CanvasImageSource, 0, 0, drawWidth, drawHeight);

    const imageData = ctx.getImageData(0, 0, drawWidth, drawHeight);
    let result = decodeQrFromImageData(imageData);

    if (result === null && maxSide > 1024) {
      const maxSideOrig = Math.min(Math.max(width, height), 2048);
      const scale2 = maxSideOrig / Math.max(width, height);
      const w2 = Math.round(width * scale2);
      const h2 = Math.round(height * scale2);
      canvas.width = w2;
      canvas.height = h2;
      ctx.drawImage(img as CanvasImageSource, 0, 0, w2, h2);
      const imageData2 = ctx.getImageData(0, 0, w2, h2);
      result = decodeQrFromImageData(imageData2);
    }

    if (result !== null) {
      return result;
    }
    throw new QrReadError();
  } catch (err) {
    if (err instanceof QrReadError) throw err;
    throw new QrReadError();
  } finally {
    if (img && 'close' in img && typeof (img as any).close === 'function') {
      (img as any).close();
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

export async function startCameraScan(video: HTMLVideoElement, onResult: (text: string) => void): Promise<{ stop: () => void }> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraUnavailableError();
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });
  } catch (err) {
    throw new CameraUnavailableError();
  }

  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  let animationFrameId: number;
  let lastDecodeTime = 0;
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(animationFrameId);
    if (video.srcObject) {
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  };

  const tick = (nowTime: number) => {
    if (stopped) return;
    animationFrameId = requestAnimationFrame(tick);

    if (nowTime - lastDecodeTime < 1000 / 8) {
      return;
    }

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      lastDecodeTime = nowTime;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const scale = vw > 640 ? 640 / vw : 1;
      const cw = Math.round(vw * scale);
      const ch = Math.round(vh * scale);

      canvas.width = cw;
      canvas.height = ch;
      ctx.drawImage(video, 0, 0, cw, ch);

      const imageData = ctx.getImageData(0, 0, cw, ch);
      const decodedText = decodeQrFromImageData(imageData);
      if (decodedText !== null) {
        stop();
        onResult(decodedText);
      }
    }
  };
  animationFrameId = requestAnimationFrame(tick);

  return { stop };
}

export async function generateQrPngDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 512, errorCorrectionLevel: 'M' });
}

export async function generateQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
}

export function svgToDataUrl(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
