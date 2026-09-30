// Vendor map: an offline 3D / 2D map of India by default, plus an optional online street map (OpenStreetMap tiles)
// that falls back to the offline map automatically when tiles can't load.
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Map as MapIcon, Globe2 } from 'lucide-react';
import { IndiaMap3D } from './IndiaMap3D';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { BankVendor } from '../../services/bank';
import { scoreColor } from '../../services/bank';
import { VendorLogo } from './VendorLogo';

const HQ: [number, number] = [19.07, 72.88]; // demo bank HQ, Mumbai

function pinIcon(v: BankVendor, active: boolean, pulse: boolean) {
  const size = active ? 46 : 34;
  const risk = v.latestAudit?.score;
  const html = renderToStaticMarkup(
    <div style={{ position: 'relative', width: size, height: size + 10 }}>
      {(active || pulse) && <span className="animate-ping" style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: size * 0.3, background: pulse ? scoreColor(risk) : v.brandColor, opacity: 0.35 }} />}
      <div style={{ transform: active ? 'translateY(-4px)' : undefined, transition: 'transform .2s' }}>
        <VendorLogo v={v} size={size} ring={active ? '#ffffff' : undefined} />
      </div>
      <span style={{ position: 'absolute', left: size / 2 - 5, top: size - 2, width: 10, height: 10, background: '#fff', transform: 'rotate(45deg)', boxShadow: '2px 2px 4px rgba(15,23,42,.2)' }} />
      {risk != null && <span style={{ position: 'absolute', right: -5, top: -5, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9, background: scoreColor(risk), color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: '18px', textAlign: 'center', border: '2px solid #fff', fontFamily: 'Inter, sans-serif' }}>{risk}</span>}
    </div>,
  );
  return L.divIcon({ html, className: '', iconSize: [size, size + 10], iconAnchor: [size / 2, size + 8], tooltipAnchor: [0, -size] });
}

const HQ_ICON = L.divIcon({
  className: '', iconSize: [34, 34], iconAnchor: [17, 17],
  html: '<div style="width:34px;height:34px;border-radius:12px;background:linear-gradient(135deg,#4f46e5,#0ea5e9);color:#fff;display:grid;place-items:center;font:800 13px Inter,sans-serif;box-shadow:0 6px 16px -4px #4f46e5aa;border:2px solid #fff">B</div>',
});

/** Vendors in the same city would stack on one spot: fan them out in a small ring so every logo is visible. */
function spread(vs: BankVendor[]): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>();
  const groups: BankVendor[][] = [];
  for (const v of vs) {
    const g = groups.find((x) => Math.abs(x[0].lat - v.lat) < 0.6 && Math.abs(x[0].lng - v.lng) < 0.6);
    if (g) g.push(v); else groups.push([v]);
  }
  for (const g of groups) {
    const r = g.length > 1 ? 0.45 + g.length * 0.05 : 0;
    g.forEach((v, i) => {
      const a = (2 * Math.PI * i) / g.length - Math.PI / 2;
      out.set(v.id, [g[0].lat + r * Math.sin(a), g[0].lng + r * Math.cos(a) * 1.1]);
    });
  }
  return out;
}

const INDIA_BOUNDS = L.latLngBounds([5.5, 66.5], [37.5, 98.5]);

function FitAndFollow({ points, v }: { points: [number, number][]; v?: [number, number] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || points.length === 0) return;
    fitted.current = true;
    map.fitBounds(L.latLngBounds([HQ, ...points]), { padding: [40, 40] });
  }, [points.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (v && fitted.current) map.panInside(v, { padding: [60, 60] }); }, [v?.[0], v?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

type Props = { vendors: BankVendor[]; selectedId: string | null; pulseId?: string | null; onSelect: (id: string) => void };
type Mode = '3d' | '2d' | 'street';

export function VendorMap(props: Props) {
  const [mode, setMode] = useState<Mode>('3d');
  const [note, setNote] = useState<string | null>(null);
  const opts: [Mode, string, typeof Box][] = [['3d', '3D India', Box], ['2d', '2D India', MapIcon], ['street', 'Street map (online)', Globe2]];
  return (
    <div className="relative z-0 h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-cyan-100">
      {mode === 'street'
        ? <StreetMap {...props} onTilesFailed={() => { setMode('3d'); setNote('Street map unavailable offline — showing the offline map.'); }} />
        : <IndiaMap3D {...props} tilt={mode === '3d'} />}
      <div role="group" aria-label="Map view" className="absolute right-3 top-3 z-[1000] flex gap-1 rounded-full bg-white/90 p-1 shadow-md backdrop-blur">
        {opts.map(([m, label, Icon]) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setNote(null); }}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${mode === m ? 'bg-cyan-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Icon size={14} /><span className={m === 'street' ? 'hidden sm:inline' : ''}>{label}</span>
          </button>
        ))}
      </div>
      {note && <p className="absolute left-3 bottom-3 z-[1000] rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 shadow">{note}</p>}
    </div>
  );
}

function StreetMap({ vendors, selectedId, pulseId, onSelect, onTilesFailed }: Props & { onTilesFailed: () => void }) {
  const fails = useRef(0);
  const sel = vendors.find((v) => v.id === selectedId);
  const pos = useMemo(() => spread(vendors), [vendors]);
  const selPos = sel ? pos.get(sel.id) : undefined;
  const icons = useMemo(() => new Map(vendors.map((v) => [v.id, pinIcon(v, v.id === selectedId, v.id === pulseId)])), [vendors, selectedId, pulseId]);
  return (
    <div className="h-full w-full">
      <MapContainer center={[22.8, 79.5]} zoom={5} minZoom={4} maxZoom={16} maxBounds={INDIA_BOUNDS} maxBoundsViscosity={0.8} scrollWheelZoom style={{ height: '100%', width: '100%' }} aria-label="Map of India with demo merchant locations">
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19}
          eventHandlers={{ tileerror: () => { if (++fails.current === 3) onTilesFailed(); } }}
          attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'} />
        <Marker position={HQ} icon={HQ_ICON}><Tooltip direction="top">Demo Bank HQ · Mumbai</Tooltip></Marker>
        {selPos && <Polyline positions={[HQ, selPos]} pathOptions={{ color: '#4f46e5', weight: 2.5, dashArray: '6 8', opacity: 0.8 }} />}
        {vendors.map((v) => (
          <Marker key={v.id} position={pos.get(v.id) ?? [v.lat, v.lng]} icon={icons.get(v.id)!} zIndexOffset={v.id === selectedId ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(v.id) }}>
            <Tooltip direction="top" offset={[0, -4]}><b>{v.name}</b><br />{v.city} · {v.category}</Tooltip>
          </Marker>
        ))}
        <FitAndFollow points={[...pos.values()]} v={selPos} />
      </MapContainer>
    </div>
  );
}
