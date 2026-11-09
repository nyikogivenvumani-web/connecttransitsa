/** T-INT-11 (client side) and T-S4-2 (notification target) */
import { registerForPush, caseRefFromNotification } from '../../lib/push';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../lib/supabase';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock('expo-constants', () => ({ expoConfig: { extra: { eas: { projectId: 'pid' } } } }));
jest.mock('../../lib/supabase', () => ({ supabase: { rpc: jest.fn() } }));

const N = Notifications as jest.Mocked<typeof Notifications>;
beforeEach(() => jest.resetAllMocks());

it('registers the Expo token once through register_push_token', async () => {
  N.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as any);
  N.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
  N.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]' } as any);
  (supabase.rpc as jest.Mock).mockResolvedValue({ error: null });
  expect(await registerForPush()).toBe(true);
  expect(supabase.rpc).toHaveBeenCalledTimes(1);
  expect(supabase.rpc).toHaveBeenCalledWith('register_push_token', { p_token: 'ExponentPushToken[abc]' });
});

it('does nothing when permission is refused', async () => {
  N.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as any);
  N.requestPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);
  expect(await registerForPush()).toBe(false);
  expect(supabase.rpc).not.toHaveBeenCalled();
});

it('never throws when registration fails', async () => {
  N.getPermissionsAsync.mockRejectedValue(new Error('x'));
  expect(await registerForPush()).toBe(false);
});

it('reads the case reference from a notification response', () => {
  expect(caseRefFromNotification({ notification: { request: { content: { data: { case_ref: 'TC-2026-0042' } } } } } as any)).toBe('TC-2026-0042');
  expect(caseRefFromNotification({ notification: { request: { content: { data: {} } } } } as any)).toBeNull();
});
