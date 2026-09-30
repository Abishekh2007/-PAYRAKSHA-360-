import { describe, it, expect } from 'vitest';
import { maskVpa, isDemoVpa, formatInr, withContext, RECEIVE_CONTEXT_MESSAGE, paymentView } from './payView';
import { analyzeLocal } from '../../../src/engine';

describe('maskVpa', () => {
  it('masks a standard UPI VPA', () => {
    expect(maskVpa('shop@okaxis')).toBe('sh•••@okaxis');
  });

  it('masks a short local part with one char', () => {
    expect(maskVpa('a@ybl')).toBe('a•••@ybl');
  });

  it('masks a VPA without @', () => {
    expect(maskVpa('noatsign')).toBe('no•••');
  });

  it('masks a two-char local part (keeps 1 char)', () => {
    expect(maskVpa('ab@upi')).toBe('a•••@upi');
  });
});

describe('isDemoVpa', () => {
  it('returns true for @demo handles', () => {
    expect(isDemoVpa('merchant@demo')).toBe(true);
    expect(isDemoVpa('unknown-electricity@demo')).toBe(true);
  });

  it('returns false for real UPI handles', () => {
    expect(isDemoVpa('shop@okaxis')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isDemoVpa(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isDemoVpa(undefined)).toBe(false);
  });
});

describe('formatInr', () => {
  it('formats thousands', () => {
    expect(formatInr(1999)).toBe('₹1,999');
  });

  it('formats lakhs', () => {
    expect(formatInr(100000)).toBe('₹1,00,000');
  });
});

describe('withContext - message handling', () => {
  const UTIL_QR =
    'PAYRAKSHA://demo-payment\nrecipient=unknown-electricity@demo\namount=1999\nmerchant=Electricity Board Demo\nsource=WhatsApp Demo\nurgency=true\nrecipientVerified=false\nscenario=utility_scam';

  it('adds RECEIVE_CONTEXT_MESSAGE to missing message', () => {
    const input = { qrText: UTIL_QR };
    const result = withContext(input, { scanToReceive: true });
    expect(result.message).toBe(RECEIVE_CONTEXT_MESSAGE);
  });

  it('appends RECEIVE_CONTEXT_MESSAGE to existing message', () => {
    const input = { qrText: UTIL_QR, message: 'hello' };
    const result = withContext(input, { scanToReceive: true });
    expect(result.message).toBe(`hello\n${RECEIVE_CONTEXT_MESSAGE}`);
  });

  it('does not add RECEIVE_CONTEXT_MESSAGE twice', () => {
    const input = { qrText: UTIL_QR, message: RECEIVE_CONTEXT_MESSAGE };
    const result = withContext(input, { scanToReceive: true });
    const count = (result.message as string).split(RECEIVE_CONTEXT_MESSAGE).length - 1;
    expect(count).toBe(1);
  });

  it('removes RECEIVE_CONTEXT_MESSAGE when scanToReceive is false', () => {
    const input = { qrText: UTIL_QR, message: RECEIVE_CONTEXT_MESSAGE };
    const result = withContext(input, { scanToReceive: false });
    expect(result.message).toBeFalsy();
  });

  it('removes RECEIVE_CONTEXT_MESSAGE from mixed message', () => {
    const input = { qrText: UTIL_QR, message: `hello\n${RECEIVE_CONTEXT_MESSAGE}` };
    const result = withContext(input, { scanToReceive: false });
    expect(result.message).not.toContain(RECEIVE_CONTEXT_MESSAGE);
    expect(result.message).toBe('hello');
  });

  it('does not mutate the original input', () => {
    const input = { qrText: UTIL_QR };
    const original = structuredClone(input);
    withContext(input, { onCall: true });
    expect(input).toEqual(original);
  });
});

describe('paymentView - edge cases', () => {
  it('handles LOW risk with demo-pay mode - primary is pay', () => {
    const LEGIT_QR =
      'PAYRAKSHA://demo-payment\nrecipient=merchant@demo\namount=450\nmerchant=Demo Kirana Store\nsource=Known Merchant Demo\nscenario=legit_merchant';
    const report = analyzeLocal({ qrText: LEGIT_QR });
    const view = paymentView(report);
    expect(view.level).toBe('LOW');
    expect(view.primary).toBe('pay');
    expect(view.holdToConfirm).toBe(false);
  });

  it('computes initial correctly', () => {
    const UTIL_QR =
      'PAYRAKSHA://demo-payment\nrecipient=unknown-electricity@demo\namount=1999\nmerchant=Electricity Board Demo\nsource=WhatsApp Demo\nurgency=true\nrecipientVerified=false\nscenario=utility_scam';
    const report = analyzeLocal({ qrText: UTIL_QR });
    const view = paymentView(report);
    expect(view.payee.initial).toBe('E');
  });
});
