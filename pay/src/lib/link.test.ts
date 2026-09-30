import { describe, it, expect, vi } from 'vitest';
import { scanCheck, sendDecision, heartbeat } from './link';
import { analyzeLocal } from '../../../src/engine';

const UTIL_QR =
  'PAYRAKSHA://demo-payment\nrecipient=unknown-electricity@demo\namount=1999\nmerchant=Electricity Board Demo\nsource=WhatsApp Demo\nurgency=true\nrecipientVerified=false\nscenario=utility_scam';

describe('scanCheck - additional cases', () => {
  it('falls back on timeout with fetchImpl that never settles', async () => {
    const fetchImpl = vi.fn(
      () =>
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000),
        ),
    );

    const start = Date.now();
    const result = await scanCheck(
      { qrText: UTIL_QR },
      { device: 'T', source: 'camera', fetchImpl, timeoutMs: 50 },
    );
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
    expect(result.engine).toBe('browser');
    expect(result.event).toBeNull();
    expect(result.ml).toBeNull();
    expect(result.report.score).toBe(70);
  });

  it('falls back on bad JSON shape (missing report.score)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ event: {}, report: { noScore: true }, ml: null }),
        { status: 200 },
      ),
    );

    const result = await scanCheck(
      { qrText: UTIL_QR },
      { device: 'T', source: 'camera', fetchImpl },
    );

    expect(result.engine).toBe('browser');
    expect(result.event).toBeNull();
    expect(result.report.score).toBe(70);
  });

  it('falls back on completely invalid JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response('not json at all', { status: 200 }),
    );

    const result = await scanCheck(
      { qrText: UTIL_QR },
      { device: 'T', source: 'camera', fetchImpl },
    );

    expect(result.engine).toBe('browser');
    expect(result.event).toBeNull();
  });

  it('falls back on network error', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await scanCheck(
      { qrText: UTIL_QR },
      { device: 'T', source: 'camera', fetchImpl },
    );

    expect(result.engine).toBe('browser');
    expect(result.event).toBeNull();
  });
});

describe('sendDecision - failure cases', () => {
  it('returns null on fetch rejection without throwing', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('Network error'));

    let result: unknown;
    expect(async () => {
      result = await sendDecision('lk_12345678', 'cancelled', { fetchImpl });
    }).not.toThrow();

    result = await sendDecision('lk_12345678', 'cancelled', { fetchImpl });
    expect(result).toBeNull();
  });

  it('returns null on non-2xx status', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response('Server Error', { status: 503 }),
    );

    const result = await sendDecision('lk_12345678', 'cancelled', { fetchImpl });
    expect(result).toBeNull();
  });

  it('returns null on bad JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response('not json', { status: 200 }),
    );

    const result = await sendDecision('lk_12345678', 'cancelled', { fetchImpl });
    expect(result).toBeNull();
  });
});

describe('heartbeat - failure cases', () => {
  it('returns ok:false on fetch rejection without throwing', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('Network error'));

    let result: unknown;
    expect(async () => {
      result = await heartbeat('T', { fetchImpl });
    }).not.toThrow();

    result = await heartbeat('T', { fetchImpl });
    expect((result as { ok: boolean }).ok).toBe(false);
    expect((result as { target: null }).target).toBeNull();
  });

  it('returns ok:false on non-2xx status', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response('Service Unavailable', { status: 503 }),
    );

    const result = await heartbeat('T', { fetchImpl });
    expect(result.ok).toBe(false);
    expect(result.target).toBeNull();
  });

  it('returns ok:false on bad JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response('bad json', { status: 200 }),
    );

    const result = await heartbeat('T', { fetchImpl });
    expect(result.ok).toBe(false);
    expect(result.target).toBeNull();
  });
});
