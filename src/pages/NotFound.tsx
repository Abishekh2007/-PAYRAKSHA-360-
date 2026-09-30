import { PageShell } from '../components/layout/PageShell';
import { AlertTriangle, Home } from 'lucide-react';
import { HudPanel } from '../components/soc';
import { ButtonLink } from '../components/ui';

export default function NotFound() {
  return (
    <PageShell
      title="Page not found"
      eyebrow="SYSTEM"
      icon={<AlertTriangle className="h-8 w-8 md:h-12 md:w-12 text-slate-500" />}
      width="wide"
      className="flex min-h-[50vh] flex-col items-center justify-center text-center"
    >
      <div className="mx-auto max-w-lg w-full">
        <HudPanel tone="red" className="p-8 md:p-12">
          <div className="flex flex-col items-center gap-8">
            <h1 className="hud-glow font-mono text-3xl md:text-5xl font-bold tracking-widest text-[#ef4444]">
              404 &middot; SIGNAL LOST
            </h1>
            <p className="font-mono text-sm tracking-wide text-slate-300">
              This console route does not exist.
            </p>
            <ButtonLink
              to="/"
              variant="primary"
            >
              <Home className="h-5 w-5 mr-2 inline-block" />
              RETURN TO CONSOLE
            </ButtonLink>
          </div>
        </HudPanel>
      </div>
    </PageShell>
  );
}
