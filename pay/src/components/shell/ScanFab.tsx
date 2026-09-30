import { QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ScanFab() {
  return (
    <Link
      to="/scan"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 pill-primary shadow-float flex items-center gap-2 px-5 py-3 z-40 transition-transform active:scale-95"
      aria-label="Scan any QR code"
    >
      <QrCode size={22} className="stroke-2" />
      <span className="font-medium text-[15px] whitespace-nowrap">Scan any QR code</span>
    </Link>
  );
}
