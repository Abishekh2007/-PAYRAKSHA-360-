import { describe, it, expect, vi } from 'vitest';
import { analyzeLocal } from '../../src/engine';
import {
  paymentView,
  withContext,
  RECEIVE_CONTEXT_MESSAGE,
} from '../../pay/src/lib/payView';
import { scanCheck, sendDecision, heartbeat } from '../../pay/src/lib/link';

const UTIL_QR =
  'PAYRAKSHA://demo-payment\nrecipient=unknown-electricity@demo\namount=1999\nmerchant=Electricity Board Demo\nsource=WhatsApp Demo\nurgency=true\nrecipientVerified=false\nscenario=utility_scam';
const LEGIT_QR =
  'PAYRAKSHA://demo-payment\nrecipient=merchant@demo\namount=450\nmerchant=Demo Kirana Store\nsource=Known Merchant Demo\nscenario=legit_merchant';
const UPI_QR = 'upi://pay?pa=shop@okaxis&pn=Shop&am=100';

describe('paymentView', () => {
  it('should handle UTIL_QR - demo-pay mode with HIGH_CAUTION', () => {
    const input = { qrText: UTIL_QR };
    const report = analyzeLocal(input);
    const view = paymentView(report);

    expect(view.mode).toBe('demo-pay');
    expect(view.payee.name).toBe('Electricity Board Demo');
    expect(view.payee.vpa).toBe('unknown-electricity@demo');
    expect(view.payee.displayVpa).toBe('unknown-electricity@demo');
    expect(view.payee.verified).toBe(false);
    expect(view.amount).toBe(1999);
    expect(view.score).toBe(70);
    expect(view.level).toBe('HIGH_CAUTION');
    expect(view.levelShort).toBe('HIGH CAUTION');
    expect(view.tone).toBe('orange');
    expect(view.primary).toBe('cancel');
    expect(view.payLabel).toBe('Pay ₹1,999 (demo)');
    expect(view.holdToConfirm).toBe(true);
  });

  it('should handle UTIL_QR with screenShare - HIGH risk', () => {
    const input = {
      qrText: UTIL_QR,
      behaviour: { screenShare: true },
    };
    const report = analyzeLocal(input);
    const view = paymentView(report);

    expect(view.mode).toBe('demo-pay');
    expect(view.payee.name).toBe('Electricity Board Demo');
    expect(view.amount).toBe(1999);
    expect(view.score).toBe(83);
    expect(view.level).toBe('HIGH');
    expect(view.levelShort).toBe('HIGH RISK');
    expect(view.tone).toBe('red');
    expect(view.primary).toBe('cancel');
    expect(view.payLabel).toBe('Pay ₹1,999 (demo)');
    expect(view.holdToConfirm).toBe(true);
  });

  it('should handle LEGIT_QR - legit merchant demo-pay mode', () => {
    const input = { qrText: LEGIT_QR };
    const report = analyzeLocal(input);
    const view = paymentView(report);

    expect(view.mode).toBe('demo-pay');
    expect(view.payee.name).toBe('Demo Kirana Store');
    expect(view.payee.vpa).toBe('merchant@demo');
    expect(view.payee.displayVpa).toBe('merchant@demo');
    expect(view.payee.verified).toBe(true);
    expect(view.amount).toBe(450);
    expect(view.score).toBe(13);
    expect(view.level).toBe('LOW');
    expect(view.levelShort).toBe('LOW RISK');
    expect(view.tone).toBe('green');
    expect(view.primary).toBe('pay');
    expect(view.payLabel).toBe('Pay ₹450 (demo)');
    expect(view.holdToConfirm).toBe(false);
  });

  it('should handle UPI_QR - analysis-only mode with masked VPA', () => {
    const input = { qrText: UPI_QR };
    const report = analyzeLocal(input);
    const view = paymentView(report);

    expect(view.mode).toBe('analysis-only');
    expect(view.payee.name).toBe('Shop');
    expect(view.payee.vpa).toBe('shop@okaxis');
    expect(view.payee.displayVpa).toBe('sh•••@okaxis');
    expect(view.payee.verified).toBe(false);
    expect(view.amount).toBe(100);
    expect(view.score).toBe(37);
    expect(view.level).toBe('CAUTION');
    expect(view.levelShort).toBe('CAUTION');
    expect(view.tone).toBe('amber');
    expect(view.primary).toBe('verify');
    expect(view.payLabel).toBe(null);
    expect(view.holdToConfirm).toBe(false);
  });

  it('should handle URL QR - not-payment mode', () => {
    const input = { qrText: 'https://example.com/pay' };
    const report = analyzeLocal(input);
    const view = paymentView(report);

    expect(view.mode).toBe('not-payment');
    expect(view.payee.name).toBe('Unknown payee');
    expect(view.payee.vpa).toBe(null);
    expect(view.payee.displayVpa).toBe(null);
    expect(view.payee.verified).toBe(false);
    expect(view.amount).toBe(null);
    expect(view.score).toBe(15);
    expect(view.level).toBe('LOW');
    expect(view.levelShort).toBe('LOW RISK');
    expect(view.tone).toBe('green');
    expect(view.primary).toBe('verify');
    expect(view.payLabel).toBe(null);
    expect(view.holdToConfirm).toBe(false);
  });

  it('should extract headline from report', () => {
    const input = { qrText: UTIL_QR };
    const report = analyzeLocal(input);
    const view = paymentView(report);

    expect(view.headline).toBe('Potentially risky payment situation');
  });

  it('should extract headline for screenShare scenario', () => {
    const input = {
      qrText: UTIL_QR,
      behaviour: { screenShare: true },
    };
    const report = analyzeLocal(input);
    const view = paymentView(report);

    expect(view.headline).toBe('Multiple warning signals detected');
  });

  it('should extract payee initial', () => {
    const utilInput = { qrText: UTIL_QR };
    const utilReport = analyzeLocal(utilInput);
    const utilView = paymentView(utilReport);
    expect(utilView.payee.initial).toBe('E');

    const legitInput = { qrText: LEGIT_QR };
    const legitReport = analyzeLocal(legitInput);
    const legitView = paymentView(legitReport);
    expect(legitView.payee.initial).toBe('D');
  });

  it('should extract reasons without point suffixes', () => {
    const input = { qrText: UTIL_QR };
    const report = analyzeLocal(input);
    const view = paymentView(report);

    expect(view.reasons.length).toBeLessThanOrEqual(3);
    expect(view.reasons[0]).toBe(
      'You have never paid unknown-electricity@demo before.'
    );
    view.reasons.forEach((reason) => {
      expect(reason).not.toMatch(/\(\+\d+\)\s*$/);
    });
  });

  it('should handle direct payment input', () => {
    const input = {
      payment: {
        recipient: 'asha@demo',
        amount: 500,
      },
    };
    const report = analyzeLocal(input);
    const view = paymentView(report);

    expect(view.mode).toBe('demo-pay');
    expect(view.amount).toBe(500);
    expect(view.level).toBe('CAUTION');
    expect(view.primary).toBe('verify');
    expect(view.payLabel).toBe('Pay ₹500 (demo)');
    expect(view.holdToConfirm).toBe(false);
  });
});

describe('withContext', () => {
  it('should add onCall behaviour', () => {
    const input = { qrText: UTIL_QR };
    const result = withContext(input, { onCall: true });

    expect(result).toEqual({
      qrText: UTIL_QR,
      behaviour: { onCall: true },
    });
  });

  it('should not mutate original object', () => {
    const input = { qrText: UTIL_QR };
    const original = structuredClone(input);
    withContext(input, { onCall: true });

    expect(input).toEqual(original);
  });

  it('should handle empty context', () => {
    const input = { qrText: UTIL_QR };
    const result = withContext(input, {});

    expect(result).toEqual(input);
  });

  it('should merge existing behaviour keys', () => {
    const input = {
      qrText: UTIL_QR,
      behaviour: { onCall: true },
    };
    const result = withContext(input, { screenShare: true });

    expect(result.behaviour).toEqual({
      onCall: true,
      screenShare: true,
    });
  });

  it('should set screenShare to false', () => {
    const input = { qrText: UTIL_QR };
    const result = withContext(input, { screenShare: false });

    expect(result.behaviour).toEqual({ screenShare: false });
  });

  it('should add receive context to missing message', () => {
    const input = { qrText: UTIL_QR };
    const result = withContext(input, { scanToReceive: true });

    expect(result.message).toBe(RECEIVE_CONTEXT_MESSAGE);
  });

  it('should append receive context to existing message', () => {
    const input = { qrText: UTIL_QR, message: 'hello' };
    const result = withContext(input, { scanToReceive: true });

    expect(result.message).toContain('hello');
    expect(result.message).toContain(RECEIVE_CONTEXT_MESSAGE);
  });

  it('should not add receive context twice', () => {
    const input = { qrText: UTIL_QR, message: RECEIVE_CONTEXT_MESSAGE };
    const result = withContext(input, { scanToReceive: true });

    const count = (result.message as string).split(RECEIVE_CONTEXT_MESSAGE)
      .length - 1;
    expect(count).toBe(1);
  });

  it('should remove receive context when scanToReceive is false', () => {
    const input = {
      qrText: UTIL_QR,
      message: RECEIVE_CONTEXT_MESSAGE,
    };
    const result = withContext(input, { scanToReceive: false });

    expect(result.message).toBeFalsy();
  });

  it('should remove receive context from mixed message', () => {
    const input = {
      qrText: UTIL_QR,
      message: `hello ${RECEIVE_CONTEXT_MESSAGE} world`,
    };
    const result = withContext(input, { scanToReceive: false });

    expect(result.message).not.toContain(RECEIVE_CONTEXT_MESSAGE);
  });

  it('should produce HIGH score with onCall and screenShare', () => {
    const input = { qrText: UTIL_QR };
    const result = withContext(input, {
      onCall: true,
      screenShare: true,
    });
    const report = analyzeLocal(result);

    expect(report.score).toBe(88);
    expect(report.level).toBe('HIGH');
  });

  it('should produce HIGH level with scanToReceive', () => {
    const input = { qrText: UTIL_QR };
    const result = withContext(input, { scanToReceive: true });
    const report = analyzeLocal(result);

    expect(report.score).toBe(90);
    expect(report.level).toBe('HIGH');
  });
});

describe('scanCheck', () => {
  const fakeEvent = {
    id: 'lk_12345678',
    seq: 1,
    at: new Date().toISOString(),
    device: 'T',
    source: 'camera' as const,
    input: { qrText: UTIL_QR },
    score: 70,
    level: 'HIGH_CAUTION' as const,
    levelLabel: 'HIGH CAUTION',
    patternName: 'utility_scam',
    recipient: 'unknown-electricity@demo',
    amount: 1999,
    headline: 'Potentially risky payment situation',
    decision: 'pending' as const,
    decidedAt: null,
    simulation: true,
  };

  const fakeReport = analyzeLocal({ qrText: UTIL_QR }) as any;

  it('should call fetch and return python-api result on success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          event: fakeEvent,
          report: fakeReport,
          ml: null,
          simulation: true,
        }),
        { status: 200 }
      )
    );

    const result = await scanCheck(
      { qrText: UTIL_QR },
      { device: 'T', source: 'camera', fetchImpl }
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toMatch(/\/api\/link\/scan$/);
    expect(fetchImpl.mock.calls[0][1]?.method).toBe('POST');

    const body = JSON.parse(fetchImpl.mock.calls[0][1]?.body as string);
    expect(body.device).toBe('T');
    expect(body.source).toBe('camera');
    expect(body.input).toEqual({ qrText: UTIL_QR });

    expect(result.engine).toBe('python-api');
    expect(result.event).toEqual(fakeEvent);
    expect(result.report).toEqual(fakeReport);
    expect(result.ml).toBeNull();
  });

  it('should include replaces parameter in scan request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          event: fakeEvent,
          report: fakeReport,
          ml: null,
          simulation: true,
        }),
        { status: 200 }
      )
    );

    await scanCheck(
      { qrText: UTIL_QR },
      { device: 'T', source: 'camera', replaces: 'lk_old', fetchImpl }
    );

    const body = JSON.parse(fetchImpl.mock.calls[0][1]?.body as string);
    expect(body.replaces).toBe('lk_old');
  });

  it('should fallback to browser engine on network error', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await scanCheck(
      { qrText: UTIL_QR },
      { device: 'T', source: 'camera', fetchImpl }
    );

    expect(result.engine).toBe('browser');
    expect(result.event).toBeNull();
    expect(result.ml).toBeNull();
    expect(result.report.score).toBe(70);
  });

  it('should fallback to browser engine on 500 status', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response('Internal Server Error', { status: 500 })
    );

    const result = await scanCheck(
      { qrText: UTIL_QR },
      { device: 'T', source: 'camera', fetchImpl }
    );

    expect(result.engine).toBe('browser');
    expect(result.event).toBeNull();
    expect(result.ml).toBeNull();
    expect(result.report.score).toBe(70);
  });

  it('should fallback to browser engine on invalid JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response('not json', { status: 200 })
    );

    const result = await scanCheck(
      { qrText: UTIL_QR },
      { device: 'T', source: 'camera', fetchImpl }
    );

    expect(result.engine).toBe('browser');
    expect(result.event).toBeNull();
    expect(result.ml).toBeNull();
    expect(result.report.score).toBe(70);
  });

  it('should timeout and fallback to browser engine', async () => {
    const fetchImpl = vi.fn(
      () =>
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
    );

    const start = Date.now();
    const result = await scanCheck(
      { qrText: UTIL_QR },
      { device: 'T', source: 'camera', fetchImpl, timeoutMs: 50 }
    );
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
    expect(result.engine).toBe('browser');
    expect(result.event).toBeNull();
    expect(result.ml).toBeNull();
    expect(result.report.score).toBe(70);
  });
});

describe('sendDecision', () => {
  it('should POST decision and return event', async () => {
    const fakeEvent = {
      id: 'lk_12345678',
      seq: 2,
      at: new Date().toISOString(),
      device: 'T',
      source: 'camera' as const,
      input: { qrText: UTIL_QR },
      score: 70,
      level: 'HIGH_CAUTION' as const,
      levelLabel: 'HIGH CAUTION',
      patternName: 'utility_scam',
      recipient: 'unknown-electricity@demo',
      amount: 1999,
      headline: 'Potentially risky payment situation',
      decision: 'cancelled' as const,
      decidedAt: new Date().toISOString(),
      simulation: true,
    } as const;

    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          event: fakeEvent,
          simulation: true,
        }),
        { status: 200 }
      )
    );

    const result = await sendDecision('lk_12345678', 'cancelled', {
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toMatch(/\/api\/link\/decision$/);
    expect(fetchImpl.mock.calls[0][1]?.method).toBe('POST');

    const body = JSON.parse(fetchImpl.mock.calls[0][1]?.body as string);
    expect(body.id).toBe('lk_12345678');
    expect(body.decision).toBe('cancelled');

    expect(result).toEqual(fakeEvent as any);
  });

  it('should return null when fetch rejects', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await sendDecision('lk_12345678', 'cancelled', {
      fetchImpl,
    });

    expect(result).toBeNull();
  });
});

describe('heartbeat', () => {
  const fakeTarget = {
    qrText: 'PAYRAKSHA://demo-payment',
    label: 'Demo Target',
    setAt: new Date().toISOString(),
  };

  it('should POST heartbeat and return target on success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          target: fakeTarget,
          simulation: true,
        }),
        { status: 200 }
      )
    );

    const result = await heartbeat('T', { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toMatch(/\/api\/link\/heartbeat$/);
    expect(fetchImpl.mock.calls[0][1]?.method).toBe('POST');

    const body = JSON.parse(fetchImpl.mock.calls[0][1]?.body as string);
    expect(body.device).toBe('T');

    expect(result.ok).toBe(true);
    expect(result.target).toEqual(fakeTarget as any);
  });

  it('should return ok:false on fetch rejection', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await heartbeat('T', { fetchImpl });

    expect(result.ok).toBe(false);
    expect(result.target).toBeNull();
  });
});
