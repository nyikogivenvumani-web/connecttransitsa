import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '../lib/supabase';
import { isSessionExpired } from '../lib/rules/session';
import { signOut } from '../lib/api/auth';
import '../lib/sosTask'; // registers the background location task
import * as Notifications from 'expo-notifications';
import { caseRefFromNotification } from '../lib/push';
import type { Session } from '@supabase/supabase-js';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [role, setRole] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Tapping a push notification opens S4 with that case (T-S4-2).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const ref = caseRefFromNotification(response);
      if (ref) router.push({ pathname: '/(tabs)/track', params: { case_ref: ref } });
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      handleSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      handleSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (s: Session | null) => {
    if (s) {
      const expiresAt = s.expires_at ?? Math.floor(Date.now() / 1000);
      const createdAt = (s as any).created_at ? Math.floor(new Date((s as any).created_at).getTime() / 1000) : (expiresAt - 3600);
      if (isSessionExpired(createdAt)) {
        await signOut();
        setSession(null);
        setRole(null);
        return;
      }

      // Check role
      const { data } = await supabase.from('users').select('role').eq('id', s.user.id).single();
      const userRole = data?.role ?? 'commuter';

      // Rule 37: Admin accounts on mobile are signed out
      if (userRole === 'transport_admin' || userRole === 'saps' || userRole === 'system_admin') {
        alert('Admin accounts use the web dashboard.');
        await signOut();
        setSession(null);
        setRole(null);
        return;
      }

      setRole(userRole);
      setSession(s);
    } else {
      setSession(null);
      setRole(null);
    }
  };

  useEffect(() => {
    if (fontsLoaded && session !== undefined) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, session]);

  useEffect(() => {
    if (session === undefined) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments]);

  if (!fontsLoaded || session === undefined) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="report/new" />
        <Stack.Screen name="report/success" />
      </Stack>
    </QueryClientProvider>
  );
}
