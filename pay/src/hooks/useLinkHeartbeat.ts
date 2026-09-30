// Keeps the phone's console-link status fresh. STUB: the pay-home task implements it.
// Contract: every 3000 ms (and once on mount) call heartbeat(deviceName) from ../lib/link and write
// { online: ok, lastSeen: ok ? new Date().toISOString() : previous, target } into usePayStore().setLink.
export function useLinkHeartbeat(_intervalMs = 3000): void {}
