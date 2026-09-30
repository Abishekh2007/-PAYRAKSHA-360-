// Stylised India map (simplified outline, equirectangular) with vendor pins. DEMO visual, not survey-accurate.
import { motion } from 'framer-motion';
import type { BankVendor } from '../../services/bank';
import { scoreColor } from '../../services/bank';

// [lng, lat] points tracing a simplified outline of mainland India.
const OUTLINE: [number, number][] = [
  [74.6, 37.0], [77.8, 35.5], [79.3, 32.5], [78.8, 31.0], [81.1, 30.2], [83.9, 28.8], [88.1, 27.9], [88.8, 27.1],
  [89.8, 26.7], [92.0, 26.9], [94.2, 27.6], [96.1, 29.4], [97.4, 28.2], [95.8, 26.4], [94.6, 24.6], [93.4, 23.9],
  [92.6, 22.1], [91.8, 23.3], [91.2, 23.8], [90.5, 22.0], [89.1, 21.7], [88.2, 21.6], [86.9, 21.2], [85.1, 19.6],
  [84.0, 18.3], [82.3, 16.6], [80.3, 15.7], [80.2, 13.5], [79.9, 11.2], [79.3, 10.3], [78.2, 8.9], [77.5, 8.1],
  [76.6, 8.9], [76.2, 10.2], [75.4, 11.9], [74.7, 13.9], [73.9, 15.6], [73.2, 17.9], [72.8, 19.4], [72.7, 21.0],
  [72.3, 21.9], [70.3, 20.9], [69.1, 22.4], [68.2, 23.6], [70.0, 24.3], [71.1, 24.4], [70.6, 25.7], [69.6, 27.2],
  [71.2, 28.0], [72.9, 29.9], [74.5, 31.0], [74.6, 32.5], [73.9, 34.6], [74.6, 37.0],
];
const W = 600, H = 660, LNG0 = 67.5, LNG1 = 98, LAT0 = 6.5, LAT1 = 37.5;
const px = (lng: number) => ((lng - LNG0) / (LNG1 - LNG0)) * W;
const py = (lat: number) => ((LAT1 - lat) / (LAT1 - LAT0)) * H;
const PATH = OUTLINE.map(([x, y], i) => `${i ? 'L' : 'M'}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(' ') + 'Z';

export interface IndiaMapProps {
  vendors: BankVendor[];
  selectedId: string | null;
  pulseId?: string | null;
  onSelect: (id: string) => void;
}

export function IndiaMap({ vendors, selectedId, pulseId, onSelect }: IndiaMapProps) {
  const sel = vendors.find((v) => v.id === selectedId);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Map of India with demo vendor locations">
      <defs>
        <linearGradient id="landFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="glow"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" /></radialGradient>
        <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#6366f1" opacity="0.18" /></pattern>
      </defs>
      <ellipse cx={W * 0.45} cy={H * 0.5} rx={W * 0.5} ry={H * 0.45} fill="url(#glow)" />
      <path d={PATH} fill="url(#landFill)" stroke="#6366f1" strokeOpacity="0.55" strokeWidth="2" strokeLinejoin="round" />
      <path d={PATH} fill="url(#dots)" />
      {/* bank hub (Mumbai HQ, demo) with links to each vendor */}
      {vendors.map((v) => (
        <line key={`l-${v.id}`} x1={px(72.88)} y1={py(19.07)} x2={px(v.lng)} y2={py(v.lat)}
          stroke={v.id === selectedId ? v.brandColor : '#6366f1'} strokeOpacity={v.id === selectedId ? 0.9 : 0.12}
          strokeWidth={v.id === selectedId ? 2 : 1} strokeDasharray="4 5" />
      ))}
      <g transform={`translate(${px(72.88)},${py(19.07)})`}>
        <rect x={-11} y={-11} width={22} height={22} rx={7} fill="#4f46e5" stroke="#a5b4fc" strokeWidth="1.5" />
        <text textAnchor="middle" y={4.5} fontSize="12" fontWeight="700" fill="white">B</text>
      </g>
      {vendors.map((v) => {
        const x = px(v.lng), y = py(v.lat), active = v.id === selectedId, risk = v.latestAudit?.score;
        return (
          <g key={v.id} transform={`translate(${x},${y})`} className="cursor-pointer" onClick={() => onSelect(v.id)}
            role="button" aria-label={`${v.name}, ${v.city}`} tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(v.id); }}>
            {(active || v.id === pulseId) && (
              <motion.circle r={14} fill="none" stroke={v.id === pulseId ? scoreColor(risk) : v.brandColor} strokeWidth="2"
                initial={{ r: 10, opacity: 0.9 }} animate={{ r: 30, opacity: 0 }} transition={{ duration: 1.6, repeat: Infinity }} />
            )}
            <circle r={active ? 12 : 9} fill={v.brandColor} stroke={active ? '#fff' : '#0b1020'} strokeWidth={active ? 3 : 2} />
            <text textAnchor="middle" y={active ? 4.5 : 3.8} fontSize={active ? 11 : 9} fontWeight="800" fill="#fff">{v.name[0]}</text>
            {risk != null && <circle cx={8} cy={-8} r={4.5} fill={scoreColor(risk)} stroke="#0b1020" strokeWidth="1.5" />}
          </g>
        );
      })}
      {sel && (
        <g transform={`translate(${Math.min(px(sel.lng) + 16, W - 170)},${Math.max(py(sel.lat) - 44, 8)})`} pointerEvents="none">
          <rect width="160" height="36" rx="10" fill="#0b1020" fillOpacity="0.92" stroke={sel.brandColor} strokeOpacity="0.7" />
          <text x="10" y="15" fontSize="12" fontWeight="700" fill="#fff">{sel.name.slice(0, 22)}</text>
          <text x="10" y="29" fontSize="10" fill="#94a3b8">{sel.city} · {sel.category}</text>
        </g>
      )}
    </svg>
  );
}
