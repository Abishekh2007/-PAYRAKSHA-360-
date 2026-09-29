import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { DemoBanner } from './DemoBanner';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useDemoStore } from '../../store/demoStore';

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      <p role="status" className="text-slate-400">Loading…</p>
    </div>
  );
}

export function AppLayout() {
  const location = useLocation();
  const elderMode = useDemoStore((s) => s.elderMode);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (elderMode) {
      document.documentElement.classList.add('elder');
    } else {
      document.documentElement.classList.remove('elder');
    }
    return () => {
      document.documentElement.classList.remove('elder');
    };
  }, [elderMode]);

  const variants = reducedMotion ? undefined : {
    initial: { opacity: 0 },
    in: { opacity: 1 }
  };

  return (
    <div className="flex min-h-screen flex-col font-sans relative">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded focus:bg-brand-400 focus:px-4 focus:py-2 focus:text-navy-950 focus:outline-none focus:ring-2 focus:ring-white">
        Skip to content
      </a>

      <DemoBanner />
      <Navbar />

      <main id="main" className="flex-1">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="in"
          variants={variants}
          transition={{ duration: 0.25 }}
          className="h-full"
        >
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
