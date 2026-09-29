import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-navy-950/50 py-12 text-center text-sm text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4">
        <div>
          <p className="font-bold text-white mb-1">PAYRAKSHA 360 — Think Before You Pay.</p>
          <p>An Explainable AI Pre-Payment Scam Defense System</p>
        </div>

        <div className="rounded-lg border border-brand-400/20 bg-brand-400/5 px-6 py-3">
          <p className="font-medium text-amber-500">Hackathon demonstration prototype. SIMULATION / DEMO: no real payments, no bank connections, no credentials.</p>
        </div>

        <nav aria-label="Footer links" className="flex flex-wrap justify-center gap-x-8 gap-y-4">
          <Link to="/privacy" className="hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded">Privacy</Link>
          <Link to="/technology" className="hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded">Technology</Link>
          <Link to="/demo-control" className="hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded">Demo Control</Link>
          <Link to="/judge" className="hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded">Judge Mode</Link>
        </nav>

        <div className="mt-8 border-t border-white/10 pt-8 w-full max-w-4xl text-xs text-slate-500 text-left">
          <p className="font-semibold mb-3 text-center uppercase tracking-wider text-slate-400">3D Model Credits</p>
          <div className="flex flex-col items-center">
            <ul className="space-y-2 list-none">
              <li>RobotExpressive.glb by Tomás Laulhé (Quaternius), modifications by Don McCurdy - CC0 1.0</li>
              <li>PrimaryIonDrive.glb by Mike Murdock - CC BY 4.0</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
