import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildIncidentReport, incidentReportToText, downloadIncidentReport, DEMO_REPORT_TITLE } from './report';
import { runScenarioLocal } from '../engine';

describe('report service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('for runScenarioLocal("utility_scam"): the title, score 92, amount ₹1,999 and 5 safe actions', () => {
    const report = runScenarioLocal('utility_scam');
    const doc = buildIncidentReport(report);

    expect(doc.title).toBe(DEMO_REPORT_TITLE);
    expect(doc.score).toBe(92);
    expect(doc.payment.amount).toBe('₹1,999');
    expect(doc.safeActions).toHaveLength(5);
  });

  it('legit_utility has 2 safe actions', () => {
    const report = runScenarioLocal('legit_utility');
    const doc = buildIncidentReport(report);
    expect(doc.safeActions).toHaveLength(2);
  });

  it('the text contains every heading and "Risk score: 92 / 100"', () => {
    const report = runScenarioLocal('utility_scam');
    const doc = buildIncidentReport(report);
    const text = incidentReportToText(doc);

    expect(text).toContain(DEMO_REPORT_TITLE);
    expect(text).toContain('Risk score: 92 / 100');
    expect(text).toContain('PAYMENT (DEMO DATA)');
    expect(text).toContain('WARNING SIGNALS');
    expect(text).toContain('SCAM DNA');
    expect(text).toContain('ATTACK CHAIN');
    expect(text).toContain('RECOMMENDATION:');
    expect(text).toContain('SAFE ACTIONS');
    expect(text).toContain('DISCLAIMER:');
  });

  it('download calls URL.createObjectURL and clicks an anchor with the download name', () => {
    const createObjectURLSpy = vi.fn(() => 'blob:test');
    const revokeObjectURLSpy = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLSpy;
    globalThis.URL.revokeObjectURL = revokeObjectURLSpy;

    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    let clickCalled = false;
    let anchorDl = '';
    const origCreateElement = document.createElement.bind(document);
    const posSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const actual = origCreateElement(tagName);
      if (tagName === 'a') {
        actual.click = () => {
          clickCalled = true;
          anchorDl = (actual as HTMLAnchorElement).download;
        };
      }
      return actual;
    });

    const report = runScenarioLocal('utility_scam');
    const doc = buildIncidentReport(report);

    vi.useFakeTimers({ shouldAdvanceTime: true });
    downloadIncidentReport(doc, 'txt');

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickCalled).toBe(true);
    expect(removeChildSpy).toHaveBeenCalled();
    expect(anchorDl).toBe(`payraksha-demo-report-${doc.reportId}.txt`);

    vi.runAllTimers();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test');

    vi.useRealTimers();
  });
});
