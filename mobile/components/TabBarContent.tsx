/**
 * TabBarContent: standalone testable version of the tab bar UI.
 * The actual Expo Router tab layout lives in app/(tabs)/_layout.tsx.
 * T-C-13 tests this component.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export type TabName = 'home' | 'track' | 'settings';

const TABS: { name: TabName; label: string }[] = [
  { name: 'home', label: 'Home' },
  { name: 'track', label: 'Track' },
  { name: 'settings', label: 'Settings' },
];

interface TabBarContentProps {
  activeTab: TabName;
  onTabPress?: (tab: TabName) => void;
}

export function TabBarContent({ activeTab, onTabPress }: TabBarContentProps) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = tab.name === activeTab;
        return (
          <TouchableOpacity
            key={tab.name}
            testID={`tab-item-${tab.name}`}
            style={styles.tab}
            onPress={() => onTabPress?.(tab.name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: tokens.color.surface,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    height: tokens.size.row.single,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: tokens.size.touchMin,
  },
  label: {
    fontSize: tokens.font.caption.size,
    fontFamily: tokens.font.family,
  },
  labelActive: {
    color: tokens.color.primary,
    fontWeight: tokens.font.label.weight,
  },
  labelInactive: {
    color: tokens.color.textMuted,
  },
});
