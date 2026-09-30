// Vendor logo tile with a glossy 3D look. Inline styles only, so it renders the same in the console, RakshaPay and the
// Auditor portal (each has its own Tailwind build). Zomato and BigBasket use their Simple Icons marks; the rest are
// designed brand-colour glyph tiles (demo only, not affiliated).
import { siBigbasket, siZomato } from 'simple-icons';

type Glyph = { bg: string; fg?: string; text?: string; italic?: boolean; serif?: boolean; path?: string; smile?: boolean; grad?: [string, string] };

const LOGOS: Record<string, Glyph> = {
  amazon: { bg: '#131921', fg: '#ffffff', text: 'a', smile: true },
  flipkart: { bg: '#2874F0', fg: '#FFE500', text: 'F', italic: true },
  myntra: { bg: '#ffffff', text: 'M', grad: ['#ff3f6c', '#f7a531'] },
  zomato: { bg: `#${siZomato.hex}`, fg: '#ffffff', text: 'z', italic: true }, // its Simple Icons mark is a wordmark, unreadable at pin size
  nykaa: { bg: '#FC2779', fg: '#ffffff', text: 'N', italic: true, serif: true },
  'reliance-digital': { bg: '#E42529', fg: '#ffffff', text: 'rd' },
  bigbasket: { bg: `#${siBigbasket.hex}`, path: siBigbasket.path },
  'amaz0n-mega-sale': { bg: '#F97316', fg: '#111827', text: 'a0', smile: true },
  'flipkart-refund-desk': { bg: '#1D4ED8', fg: '#FDE047', text: 'FR', italic: true },
};

function initials(name: string) {
  const w = name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? '?') + (w[1]?.[0] ?? '')).toUpperCase();
}

export function VendorLogo({ v, size = 44, ring }: { v: { id: string; name: string; brandColor: string }; size?: number; ring?: string }) {
  const g: Glyph = LOGOS[v.id] ?? { bg: v.brandColor, fg: '#fff', text: initials(v.name) };
  const light = g.bg.toLowerCase() === '#ffffff';
  const gid = `lg-${v.id}`;
  const len = g.text?.length ?? 1;
  return (
    <div role="img" aria-label={`${v.name} logo`} style={{
      width: size, height: size, borderRadius: size * 0.28, background: g.bg, flexShrink: 0, position: 'relative', overflow: 'hidden',
      boxShadow: `0 ${size * 0.12}px ${size * 0.28}px -${size * 0.08}px ${light ? '#0f172a33' : g.bg + '88'}, inset 0 -${size * 0.07}px 0 rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.5)${ring ? `, 0 0 0 3px ${ring}` : ''}`,
      border: light ? '1px solid #e2e8f0' : 'none',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,.38) 0%, rgba(255,255,255,0) 48%)' }} />
      <svg viewBox="0 0 48 48" width={size} height={size} style={{ position: 'relative', display: 'block' }} aria-hidden>
        {g.grad && <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={g.grad[0]} /><stop offset="1" stopColor={g.grad[1]} /></linearGradient></defs>}
        {g.path ? (
          <g transform="translate(10 10) scale(1.1667)"><path d={g.path} fill="#fff" /></g>
        ) : (
          <text x="24" y={g.smile ? 28 : 32} textAnchor="middle" fontSize={len > 1 ? 21 : 29} fontWeight={800}
            fontStyle={g.italic ? 'italic' : 'normal'} fontFamily={g.serif ? 'Georgia, serif' : 'Inter, Arial, sans-serif'}
            fill={g.grad ? `url(#${gid})` : g.fg} letterSpacing={len > 1 ? -1 : 0}>{g.text}</text>
        )}
        {g.smile && <path d="M13 33 Q24 40 35 33" stroke="#FF9900" strokeWidth="3" fill="none" strokeLinecap="round" />}
        {g.smile && <path d="M32 31 L35.5 33 L33 36" stroke="#FF9900" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </div>
  );
}
