// Offline map of India (no network): state outlines from @svg-maps/india (CC BY 4.0), merchants placed by lat/lng.
// `tilt` lays the map down in 3D with an extruded edge; pins stand upright on it.
import { useMemo, useState } from 'react';
import indiaMap from '@svg-maps/india';

const india = indiaMap as unknown as { locations: { id: string; name: string; path: string }[] };
import type { BankVendor } from '../../services/bank';
import { scoreColor } from '../../services/bank';
import { VendorLogo } from './VendorLogo';

const W = 612, H = 696;
// The source SVG is Mercator, spanning lng 68.1–97.4 and lat 37.1 (top) to 6.75 (bottom).
const K = W / (97.4 - 68.1);
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
export function project(lat: number, lng: number): [number, number] {
  return [(lng - 68.1) * K, (merc(37.1) - merc(lat)) * (180 / Math.PI) * K];
}

const HQ = project(19.07, 72.88);
const HUES = [262, 199, 152, 32, 340, 222, 174, 12, 286, 48];

/** Pins in the same city would overlap: fan them out in a ring around the city. */
function spread(vs: BankVendor[]): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>();
  const groups: { at: [number, number]; ids: string[] }[] = [];
  for (const v of vs) {
    const p = project(v.lat, v.lng);
    const g = groups.find((x) => Math.hypot(x.at[0] - p[0], x.at[1] - p[1]) < 34);
    if (g) g.ids.push(v.id); else groups.push({ at: p, ids: [v.id] });
  }
  for (const g of groups) {
    const r = g.ids.length > 1 ? 22 + g.ids.length * 5 : 0;
    g.ids.forEach((id, i) => {
      const a = (2 * Math.PI * i) / g.ids.length - Math.PI / 2;
      out.set(id, [g.at[0] + r * Math.cos(a), g.at[1] + r * Math.sin(a)]);
    });
  }
  return out;
}

export function IndiaMap3D({ vendors, selectedId, pulseId, onSelect, tilt }: {
  vendors: BankVendor[]; selectedId: string | null; pulseId?: string | null; onSelect: (id: string) => void; tilt: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const pos = useMemo(() => spread(vendors), [vendors]);
  const sel = selectedId ? pos.get(selectedId) : undefined;
  const upright = tilt ? 'rotateX(-52deg)' : 'none';

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ perspective: 1400 }}
      aria-label="Offline map of India with demo merchant locations">
      <div className="relative transition-transform duration-700 ease-out"
        style={{ height: tilt ? '118%' : '94%', aspectRatio: `${W} / ${H}`, transformStyle: 'preserve-3d',
          transform: tilt ? 'translateY(-6%) rotateX(52deg) rotateZ(-6deg)' : 'none' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible"
          style={{ filter: tilt
            ? 'drop-shadow(0 2px 0 rgb(var(--c-700))) drop-shadow(0 2px 0 rgb(var(--c-800))) drop-shadow(0 2px 0 rgb(var(--c-800))) drop-shadow(0 3px 0 rgb(var(--c-900))) drop-shadow(0 24px 22px rgba(15,23,42,.35))'
            : 'drop-shadow(0 10px 18px rgba(15,23,42,.18))' }}>
          <defs>
            <linearGradient id="india-sheen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {india.locations.map((s, i) => (
            <path key={s.id} d={s.path} onMouseEnter={() => setHover(s.name)} onMouseLeave={() => setHover(null)}
              fill={`hsl(${HUES[i % HUES.length]} 78% ${hover === s.name ? 70 : 82}%)`}
              stroke="#fff" strokeWidth={1.2} strokeLinejoin="round" style={{ transition: 'fill .2s' }} />
          ))}
          {sel && <line x1={HQ[0]} y1={HQ[1]} x2={sel[0]} y2={sel[1]} stroke="rgb(var(--c-600))" strokeWidth={3} strokeDasharray="7 8" strokeLinecap="round">
            <animate attributeName="stroke-dashoffset" from="30" to="0" dur="1s" repeatCount="indefinite" />
          </line>}
        </svg>

        <Pin at={HQ} upright={upright} title="Demo Bank HQ · Mumbai" z={5}>
          <div className="grid h-8 w-8 place-items-center rounded-xl border-2 border-white text-[13px] font-extrabold text-white shadow-lg" style={{ backgroundImage: 'var(--brand-gradient)' }}>B</div>
        </Pin>
        {vendors.map((v) => {
          const at = pos.get(v.id)!;
          const active = v.id === selectedId;
          const risk = v.latestAudit?.score;
          const size = active ? 44 : 32;
          return (
            <Pin key={v.id} at={at} upright={upright} title={`${v.name} · ${v.city} · ${v.category}`} z={active ? 20 : 10} onClick={() => onSelect(v.id)}>
              <div className="relative transition-transform hover:-translate-y-1" style={{ width: size }}>
                {(active || v.id === pulseId) && <span className="absolute inset-0 animate-ping rounded-[30%]" style={{ background: v.id === pulseId ? scoreColor(risk) : v.brandColor, opacity: 0.4 }} />}
                <VendorLogo v={v} size={size} ring={active ? '#ffffff' : undefined} />
                {risk != null && <span className="absolute -right-2 -top-2 min-w-[18px] rounded-full border-2 border-white px-1 text-center text-[10px] font-bold leading-[14px] text-white" style={{ background: scoreColor(risk) }}>{risk}</span>}
                {active && <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/85 px-2 py-0.5 text-[10px] font-semibold text-white">{v.name}</span>}
              </div>
            </Pin>
          );
        })}
      </div>
      {hover && <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow">{hover}</span>}
      <span className="absolute bottom-1 right-2 text-[10px] text-slate-400">Offline map · India outline © @svg-maps/india (CC BY 4.0)</span>
    </div>
  );
}

function Pin({ at, upright, title, z, onClick, children }: { at: [number, number]; upright: string; title: string; z: number; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick}
      className="absolute focus:outline-none"
      style={{ transformStyle: 'preserve-3d', transform: 'translate(-50%, -100%)', left: `${(at[0] / W) * 100}%`, top: `${(at[1] / H) * 100}%`, zIndex: z }}>
      <div style={{ transform: upright, transformOrigin: '50% 100%', transition: 'transform .7s' }}>{children}</div>
    </button>
  );
}
