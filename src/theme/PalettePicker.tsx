import { useState } from 'react';
import { Palette as PaletteIcon, Check } from 'lucide-react';
import { PALETTES, usePalette } from './palettes';

/** Colour palette switcher: a swatch button that opens a small menu of palettes. */
export function PalettePicker({ align = 'right' }: { align?: 'left' | 'right' }) {
  const [id, setId] = usePalette();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" aria-label="Colour palette" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-slate-500 shadow-sm hover:text-slate-800">
        <PaletteIcon size={16} />
        <span className="h-4 w-4 rounded-full" style={{ backgroundImage: 'var(--brand-gradient)' }} />
      </button>
      {open && (
        <div role="menu" className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl`}>
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Colour palette</p>
          {PALETTES.map((p) => (
            <button key={p.id} type="button" role="menuitemradio" aria-checked={p.id === id}
              onClick={() => { setId(p.id); setOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
              <span className="h-6 w-6 rounded-full shadow-inner"
                style={{ backgroundImage: `linear-gradient(135deg, ${p.gradient.join(', ')})` }} />
              <span className="flex-1">{p.name}</span>
              {p.id === id && <Check size={16} className="text-slate-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default PalettePicker;
