import { useEffect } from 'react';
import { usePayStore } from '../store/payStore';
import { heartbeat } from '../lib/link';

export function useLinkHeartbeat(intervalMs = 3000): void {
  useEffect(() => {
    let mounted = true;

    const tick = async () => {
      const deviceName = usePayStore.getState().deviceName;
      try {
        const { ok, target } = await heartbeat(deviceName);
        if (!mounted) return;

        const previous = usePayStore.getState().link.lastSeen;
        usePayStore.getState().setLink({
          online: ok,
          lastSeen: ok ? new Date().toISOString() : previous,
          target
        });
      } catch (e) {
        if (!mounted) return;
        const previous = usePayStore.getState().link.lastSeen;
        usePayStore.getState().setLink({
          online: false,
          lastSeen: previous,
          target: null
        });
      }
    };

    tick();
    const timer = setInterval(tick, intervalMs);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [intervalMs]);
}
