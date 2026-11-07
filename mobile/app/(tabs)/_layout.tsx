import { Tabs } from 'expo-router';
import { tokens } from '../../theme/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.color.primary,
        tabBarInactiveTintColor: tokens.color.textMuted,
        tabBarStyle: {
          backgroundColor: tokens.color.surface,
          borderTopColor: tokens.color.border,
          height: tokens.size.row.single,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarTestID: 'tab-item-home' }} />
      <Tabs.Screen name="track" options={{ title: 'Track', tabBarTestID: 'tab-item-track' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarTestID: 'tab-item-settings' }} />
    </Tabs>
  );
}
