// Full screen on a phone; a phone-sized frame on a desktop (owned by the head).
// The frame is transformed, so `fixed` children (bottom bars, sheets, the floating scan pill) pin to the frame, not the window.
import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { DemoStrip } from './DemoStrip';

export function PhoneFrame({ children }: { children: ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    scroller.current?.scrollTo?.({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center sm:py-6">
      <div
        data-testid="phone-frame"
        className="relative flex h-[100dvh] w-full transform-gpu flex-col overflow-hidden bg-gp-bg sm:h-[min(880px,calc(100dvh-48px))] sm:w-[400px] sm:rounded-[44px] sm:border-[10px] sm:border-[#1f1f1f] sm:shadow-2xl"
      >
        <DemoStrip />
        <div ref={scroller} data-testid="phone-scroll" className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

export default PhoneFrame;
