import * as Location from 'expo-location';

export interface Position { lat: number; lng: number; cached: boolean }

/** Current position, or the last known one when permission is off or no fix arrives in 3 s. */
export async function getPosition(): Promise<Position | null> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status === 'granted') {
      const fix = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((r) => setTimeout(() => r(null), 3000)),
      ]);
      if (fix) return { lat: fix.coords.latitude, lng: fix.coords.longitude, cached: false };
    }
    const last = await Location.getLastKnownPositionAsync();
    return last ? { lat: last.coords.latitude, lng: last.coords.longitude, cached: true } : null;
  } catch {
    return null;
  }
}
