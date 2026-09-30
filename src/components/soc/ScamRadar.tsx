// STUB: contract only. Builder task `radar-live` implements this file.
// The acceptance tests in test/acceptance/scam-radar.test.tsx are written from the comments below.
import type { SimEvent } from './simFeed';

/**
 * Normalised distance of a blip from the radar centre, in [0.08, 0.92]. Higher risk sits closer to the centre.
 *   radarDistance(s) = round to 3 decimals of (0.92 - 0.84 * clamp(s, 0, 100) / 100)
 * Examples: 0 → 0.92, 50 → 0.5, 92 → 0.147, 100 → 0.08, 150 → 0.08, -5 → 0.92.
 */
export function radarDistance(score: number): number {
  void score;
  return 0;
}

export interface ScamRadarProps {
  events: SimEvent[];
  activeId?: string | null;
  onSelect?: (event: SimEvent) => void;
  /** Rotating sweep beam. Default true. */
  sweep?: boolean;
  className?: string;
}

/**
 * SOC radar of simulated scam contacts.
 * Renders:
 *   - a wrapper with data-testid="scam-radar"
 *   - an <svg role="img" aria-label="Scam radar (simulation)"> with range rings and 8 channel sectors
 *     (labelled with the SimChannel names from simFeed), containing:
 *       - one blip per event: an SVG element with data-testid={`radar-blip-${event.id}`}, data-level={event.level},
 *         data-distance={String(radarDistance(event.score))}, and data-active="true" only on the event whose id === activeId
 *         (colour by level: HIGH red, HIGH_CAUTION orange, CAUTION amber, LOW green)
 *       - a sweep element with data-testid="radar-sweep", rendered only when sweep !== false
 *   - <ol aria-label="Radar contacts"> with one <li> per event, in the same order as `events`, each holding
 *     <button type="button" aria-pressed={event.id === activeId}> whose text includes event.time, event.channel,
 *     event.title, `RISK ${event.score}` and STATUS_LABEL[event.status]; clicking it calls onSelect(event)
 *   - events = [] → the list has no items and the text 'NO CONTACTS' is shown
 *   - the visible text 'SIMULATION'
 */
export function ScamRadar({ events, className = '' }: ScamRadarProps) {
  return (
    <div data-testid="scam-radar-stub" className={className}>
      Scam radar (not built yet): {events.length} contacts
    </div>
  );
}
