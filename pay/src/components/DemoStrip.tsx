// Permanent strip at the top of every RakshaPay screen (owned by the head).
export function DemoStrip() {
  return (
    <div
      data-testid="demo-strip"
      role="note"
      className="flex shrink-0 items-center justify-center gap-1.5 bg-[#fef7e0] px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[#8a4b00]"
    >
      <span aria-hidden="true">●</span>
      DEMO · SIMULATION — no real money moves
    </div>
  );
}

export default DemoStrip;
