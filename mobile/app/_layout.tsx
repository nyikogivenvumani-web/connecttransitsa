import { Stack, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (fontsLoaded && session !== undefined) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, session]);

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
