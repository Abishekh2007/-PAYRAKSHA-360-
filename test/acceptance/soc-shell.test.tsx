import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, within, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '../../src/components/layout/AppLayout';
import { useDemoStore } from '../../src/store/demoStore';
import { runScenarioLocal, DISCLAIMER } from '../../src/engine';
import { NAV_SECTIONS, ROUTES } from '../../src/routes';

function renderShell(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="*" element={<div data-testid="child">child</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  act(() => { useDemoStore.getState().resetDemo(); });
});

afterEach(() => {
  document.documentElement.classList.remove('elder');
});

describe('SOC Shell Acceptance Tests', () => {
  it('1. shows demo banner', () => {
    renderShell();
    expect(screen.getAllByText('DEMO ENVIRONMENT — NO REAL PAYMENTS').length).toBeGreaterThan(0);
  });

  it('2. has exactly one navigation landmark named Main', () => {
    renderShell();
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1);
  });

  it('3. renders section labels and links in order', () => {
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Main' });

    let prevElement: HTMLElement | null = null;
    for (const section of NAV_SECTIONS) {
      const labels = within(nav).getAllByText(section.label);
      expect(labels.length).toBeGreaterThan(0);

      const labelEl = labels[0];
      if (prevElement) {
        expect(prevElement.compareDocumentPosition(labelEl) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
      }
      prevElement = labelEl;
    }

    const links = within(nav).getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    const expectedHrefs = [
      '/', '/dashboard', '/vendors', '/link', '/live', '/simulation', '/qr', '/message', '/url', '/payment',
      '/threat-intel', '/dna', '/attack-chain', '/explain', '/signals', '/lab',
      '/what-if', '/counterfactual', '/qr-generator', '/trusted', '/elder',
      '/report', '/privacy', '/demo-control', '/technology'
    ];
    expect(hrefs).toEqual(expectedHrefs);

    const derivedHrefs = NAV_SECTIONS.flatMap((s) => ROUTES.filter((r) => r.section === s.id).map((r) => r.path));
    expect(hrefs).toEqual(derivedHrefs);

    const testPairs = [
      { label: 'Command Center', href: '/dashboard' },
      { label: 'Scan QR', href: '/qr' },
      { label: 'Signals Connected', href: '/signals' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Live Protection', href: '/live' },
      { label: 'Incident Report', href: '/report' }
    ];
    for (const pair of testPairs) {
      const link = within(nav).getByRole('link', { name: new RegExp(pair.label) });
      expect(link).toHaveAttribute('href', pair.href);
    }
  });

  it('4. no hidden links in Main', () => {
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const links = within(nav).getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).not.toContain('/judge');
    expect(hrefs).not.toContain('/technical');
  });

  it('5. sets aria-current only on active link', () => {
    cleanup();
    renderShell('/dashboard');
    let nav = screen.getByRole('navigation', { name: 'Main' });
    let currentLinks = within(nav).getAllByRole('link', { current: 'page' });
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAccessibleName(/Command Center/);

    cleanup();
    renderShell('/');
    nav = screen.getByRole('navigation', { name: 'Main' });
    currentLinks = within(nav).getAllByRole('link', { current: 'page' });
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAccessibleName(/Home/);
    // Home must match its path exactly in path matching logic, but here we just check it got aria-current="page" when route is '/'

    cleanup();
    renderShell('/qr');
    nav = screen.getByRole('navigation', { name: 'Main' });
    currentLinks = within(nav).getAllByRole('link', { current: 'page' });
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAccessibleName(/Scan QR/);
  });

  it('6. top bar contains threat readout which updates; only banner', () => {
    renderShell();
    const bar = screen.getByTestId('soc-topbar');
    expect(bar.tagName).toBe('HEADER');

    const banners = screen.getAllByRole('banner');
    expect(banners).toHaveLength(1);
    expect(banners[0]).toBe(bar);

    const threatLevel = within(bar).getByTestId('threat-level');
    expect(threatLevel).toHaveAttribute('data-level', 'NONE');
    expect(threatLevel).toHaveTextContent(/MONITORING/);

    const r = runScenarioLocal('utility_scam');
    act(() => {
      useDemoStore.getState().recordAnalysis({ label: 'x', input: r.input, report: r, source: 'browser' });
    });

    expect(threatLevel).toHaveAttribute('data-level', 'HIGH');
    expect(threatLevel).toHaveTextContent(/92\/100/);
  });

  it('7. soc-clock format', () => {
    renderShell();
    const bar = screen.getByTestId('soc-topbar');
    const clock = within(bar).getByTestId('soc-clock');
    expect(clock.textContent).toMatch(/^\d{2}:\d{2}:\d{2} IST$/);
  });

  it('8. top bar contains status pills', () => {
    renderShell();
    const bar = screen.getByTestId('soc-topbar');
    expect(bar).toHaveTextContent('ENGINE ONLINE');
    expect(bar).toHaveTextContent('SIMULATION MODE');
  });

  it('9. simulated alert ticker', () => {
    renderShell();
    const marquee = screen.getByRole('marquee', { name: 'Simulated alert ticker' });
    expect(marquee).toHaveTextContent(/SIMULATION/);
  });

  it('10. JUDGE MODE link in top bar', () => {
    renderShell();
    const bar = screen.getByTestId('soc-topbar');
    const judgeLink = within(bar).getByRole('link', { name: /JUDGE MODE/ });
    expect(judgeLink).toHaveAttribute('href', '/judge');
  });

  it('11. elder safety mode switch', async () => {
    const user = userEvent.setup();
    renderShell();
    const sw = screen.getAllByRole('switch', { name: 'Elder Safety Mode' })[0];

    expect(document.documentElement.classList.contains('elder')).toBe(false);

    await user.click(sw);
    expect(document.documentElement.classList.contains('elder')).toBe(true);
    expect(useDemoStore.getState().elderMode).toBe(true);

    await user.click(sw);
    expect(document.documentElement.classList.contains('elder')).toBe(false);
    expect(useDemoStore.getState().elderMode).toBe(false);
  });

  it('12. menu button sets aria-expanded and becomes Close menu', async () => {
    const user = userEvent.setup();
    renderShell();
    const btn = screen.getByRole('button', { name: 'Open menu' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
  });

  it('13. skip link and main structure', () => {
    renderShell();
    const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skipLink).toHaveAttribute('href', '#main');

    const main = document.getElementById('main');
    expect(main).not.toBeNull();
    expect(main?.tagName).toBe('MAIN');
    if (main) {
        expect(main).toContainElement(screen.getByTestId('child'));
    }
  });

  it('14. footer contains simulation info and disclaimer; only contentinfo', () => {
    renderShell();
    const footer = screen.getByTestId('soc-footer');
    expect(footer.tagName).toBe('FOOTER');

    const contentinfos = screen.getAllByRole('contentinfo');
    expect(contentinfos).toHaveLength(1);
    expect(contentinfos[0]).toBe(footer);

    expect(footer).toHaveTextContent(/SIMULATION/);
    expect(footer).toHaveTextContent(DISCLAIMER);
  });
});
