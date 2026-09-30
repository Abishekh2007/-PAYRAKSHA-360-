import { DISCLAIMER } from '../../engine';

export function Footer() {
  return (
    <footer
      data-testid="soc-footer"
      role="contentinfo"
      className="border-t border-cyan-400/15 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-600"
    >
      <p className="mb-1">
        SIMULATION · PAYRAKSHA 360 · HACKATHON PROTOTYPE
      </p>
      <p className="text-slate-700 normal-case text-[9px] tracking-normal">
        {DISCLAIMER}
      </p>
    </footer>
  );
}