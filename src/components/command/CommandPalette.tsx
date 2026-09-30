// Command palette (Ctrl/⌘+K), mounted once in AppLayout. STUB: the console-palette task implements it.

/** Window event that opens the palette; the top bar's search button dispatches it via openCommandPalette(). */
export const PALETTE_EVENT = 'payraksha:palette';

export function openCommandPalette(): void {
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT));
}

export function CommandPalette() {
  return null;
}

export default CommandPalette;
