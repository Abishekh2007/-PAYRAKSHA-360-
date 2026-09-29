// STUB: replaced by the layout task. Renders DemoBanner, Navbar, the routed page (Suspense + Outlet) and Footer.
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { DemoBanner } from './DemoBanner';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <DemoBanner />
      <Navbar />
      <main>
        <Suspense fallback={<div>Loading…</div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
