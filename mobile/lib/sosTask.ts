/**
 * Background location for an active SOS (expo-task-manager). Works only in a development or release build, not Expo Go.
 * The task sends each fix with the same call the foreground timer uses.
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { sendLocation } from './api/sos';
import { SOS_LOCATION_INTERVAL_MS } from './rules/sos';

export const SOS_TASK = 'sos-location-task';
let currentEventId: string | null = null;

export function setBackgroundEventId(id: string | null): void {
  currentEventId = id;
}

TaskManager.defineTask(SOS_TASK, async ({ data, error }) => {
  if (error || !currentEventId) return;
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations ?? [];
  const last = locations[locations.length - 1];
  if (last) {
    try { await sendLocation(currentEventId, last.coords.latitude, last.coords.longitude); } catch { /* the foreground queue resends */ }
  }
});

export const backgroundLocation = {
  async start(): Promise<void> {
    const perm = await Location.requestBackgroundPermissionsAsync();
    if (perm.status !== 'granted') return;
    await Location.startLocationUpdatesAsync(SOS_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: SOS_LOCATION_INTERVAL_MS,
      distanceInterval: 0,
      foregroundService: { notificationTitle: 'SOS active', notificationBody: 'Sharing your live location with SAPS' },
    });
  },
  async stop(): Promise<void> {
    currentEventId = null;
    if (await Location.hasStartedLocationUpdatesAsync(SOS_TASK)) await Location.stopLocationUpdatesAsync(SOS_TASK);
  },
};
