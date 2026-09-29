import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <PageShell
      title="Page not found"
      icon={<AlertTriangle className="h-8 w-8 md:h-12 md:w-12 text-risk-elevated" />}
      width="narrow"
      className="text-center flex flex-col items-center justify-center min-h-[50vh]"
    >
      <div className="flex flex-col items-center gap-8 py-8 glass p-8 md:p-12">
        <p className="text-xl text-slate-300">This page does not exist in the PAYRAKSHA 360 demo.</p>
        <Link
          to="/"
          className="btn-primary"
        >
          <Home className="h-5 w-5" />
          Back to home
        </Link>
      </div>
    </PageShell>
  );
}
