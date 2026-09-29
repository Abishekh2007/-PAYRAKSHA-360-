import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeRisk, analyzeUrlRisk, getBackendHealth, resetApiState, isBackendMarkedDown } from './api';
import { analyzeLocal, analyzeUrlLocal } from '../engine';

describe('api service', () => {
  let fetchSpy: any;

  beforeEach(() => {
    resetApiState();
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('analyzeRisk success -> source python-api, ml split out, report has no ml key', async () => {
    const input = { message: 'hello' };
    const mockReport = analyzeLocal(input);
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockReport, ml: { model: 'test', available: true } })
    });

    const res = await analyzeRisk(input);
    expect(res.source).toBe('python-api');
    expect(res.ml).toEqual({ model: 'test', available: true });
    expect((res.report as any).ml).toBeUndefined();
    expect(res.report.score).toBe(mockReport.score);
  });

  it('analyzeRisk rejected fetch -> source browser with score equal to analyzeLocal', async () => {
    const input = { message: 'hello' };
    fetchSpy.mockRejectedValueOnce(new Error('Network Error'));

    const res = await analyzeRisk(input);
    expect(res.source).toBe('browser');
    expect(res.report.score).toBe(analyzeLocal(input).score);
  });

  it('analyzeRisk non-2xx -> fallback', async () => {
    const input = { message: 'hello' };
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 500 });
    const res = await analyzeRisk(input);
    expect(res.source).toBe('browser');
  });

  it('a never-resolving fetch with timeoutMs 50 -> fallback in under 1 s', async () => {
    const input = { message: 'hello' };
    fetchSpy.mockImplementationOnce((url: string, init: any) => new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 3000);
      if (init?.signal) {
        init.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }
    }));
    const start = performance.now();
    const res = await analyzeRisk(input, { timeoutMs: 50 });
    const duration = performance.now() - start;
    expect(res.source).toBe('browser');
    expect(duration).toBeLessThan(1000);
  });

  it('after a failure the next call does not call fetch, and resetApiState restores it', async () => {
    const input = { message: 'hello' };
    fetchSpy.mockRejectedValueOnce(new Error('Fail'));
    await analyzeRisk(input);
    expect(isBackendMarkedDown()).toBe(true);

    const res2 = await analyzeRisk(input);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(res2.source).toBe('browser');

    resetApiState();
    expect(isBackendMarkedDown()).toBe(false);
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...analyzeLocal(input), ml: null })
    });
    const res3 = await analyzeRisk(input);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(res3.source).toBe('python-api');
  });

  it('preferLocal never calls fetch', async () => {
    const input = { message: 'hello' };
    const res = await analyzeRisk(input, { preferLocal: true });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.source).toBe('browser');
  });

  it('getBackendHealth returns null on failure and the object on success', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Fail'));
    expect(await getBackendHealth()).toBeNull();

    const okBody = { status: 'ok', simulation: true, engine: { name: 'e', version: '1', runtime: 'p' }, ml: { available: false, model: null } };
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => okBody
    });
    expect(await getBackendHealth()).toEqual(okBody);
  });
});
