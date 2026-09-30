// Real street map (Leaflet + OpenStreetMap/CARTO tiles) with vendor logo pins. Needs internet for the tiles.
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef } from 'react';
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

function FitAndFollow({ vendors, v }: { vendors: BankVendor[]; v?: BankVendor }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || vendors.length === 0) return;
    fitted.current = true;
    map.fitBounds(L.latLngBounds([HQ, ...vendors.map((x) => [x.lat, x.lng] as [number, number])]), { padding: [40, 40] });
  }, [vendors.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (v && fitted.current) map.panInside([v.lat, v.lng], { padding: [60, 60] }); }, [v?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function VendorMap({ vendors, selectedId, pulseId, onSelect }: { vendors: BankVendor[]; selectedId: string | null; pulseId?: string | null; onSelect: (id: string) => void }) {
  const sel = vendors.find((v) => v.id === selectedId);
  const icons = useMemo(() => new Map(vendors.map((v) => [v.id, pinIcon(v, v.id === selectedId, v.id === pulseId)])), [vendors, selectedId, pulseId]);
  return (
    <div className="relative z-0 h-[460px] overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer center={[22.8, 79.5]} zoom={5} minZoom={4} maxZoom={16} scrollWheelZoom style={{ height: '100%', width: '100%' }} aria-label="Map of India with demo merchant locations">
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'} />
        <Marker position={HQ} icon={HQ_ICON}><Tooltip direction="top">Demo Bank HQ · Mumbai</Tooltip></Marker>
        {sel && <Polyline positions={[HQ, [sel.lat, sel.lng]]} pathOptions={{ color: '#4f46e5', weight: 2.5, dashArray: '6 8', opacity: 0.8 }} />}
        {vendors.map((v) => (
          <Marker key={v.id} position={[v.lat, v.lng]} icon={icons.get(v.id)!} zIndexOffset={v.id === selectedId ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(v.id) }}>
            <Tooltip direction="top" offset={[0, -4]}><b>{v.name}</b><br />{v.city} · {v.category}</Tooltip>
          </Marker>
        ))}
        <FitAndFollow vendors={vendors} v={sel} />
      </MapContainer>
    </div>
  );
}
