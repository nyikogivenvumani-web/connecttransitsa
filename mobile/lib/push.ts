/**
 * lib/push.ts – Expo push registration (OP10) and notification deep link target.
 */
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/** Ask for permission and save the device token. Never throws. Returns true when a token was sent. */
export async function registerForPush(): Promise<boolean> {
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Case updates',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const { error } = await supabase.rpc('register_push_token', { p_token: token });
    return !error;
  } catch {
    return false;
  }
}

/** The case reference carried by a tapped notification, or null. */
export function caseRefFromNotification(response: Notifications.NotificationResponse): string | null {
  const ref = (response.notification.request.content.data as { case_ref?: unknown } | undefined)?.case_ref;
  return typeof ref === 'string' && ref.length > 0 ? ref : null;
}
