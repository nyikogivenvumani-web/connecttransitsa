/** BR11 rules for the Silent SOS. */
export const SOS_TAP_WINDOW_MS = 2500;
export const SOS_REQUIRED_TAPS = 3;
export const SOS_LOCATION_INTERVAL_MS = 10_000;
export const SOS_STOP_HOLD_MS = 3000;

/** Counts taps that all fall inside the 2.5 s window ending at the latest tap. */
export function createTapCounter() {
  let taps: number[] = [];
  return {
    tap(now: number): { count: number; triggered: boolean } {
      taps = taps.filter((t) => now - t < SOS_TAP_WINDOW_MS);
      taps.push(now);
      if (taps.length >= SOS_REQUIRED_TAPS) {
        taps = [];
        return { count: SOS_REQUIRED_TAPS, triggered: true };
      }
      return { count: taps.length, triggered: false };
    },
    reset() { taps = []; },
  };
}
