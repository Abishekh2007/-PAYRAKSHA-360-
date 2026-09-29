export function DemoBanner() {
  return (
    <div
      role="note"
      data-testid="demo-banner"
      className="sticky top-0 z-50 w-full overflow-hidden border-b border-white/10 bg-gradient-to-r from-risk-elevated to-risk-high px-4 py-2 text-center text-sm font-bold tracking-widest text-white shadow-md shadow-risk-high/20"
      style={{
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.15) 10px, rgba(0,0,0,0.15) 20px)'
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <span>DEMO ENVIRONMENT — NO REAL PAYMENTS</span>
        <span className="hidden opacity-80 lg:inline">(Simulation only)</span>
      </div>
    </div>
  );
}
