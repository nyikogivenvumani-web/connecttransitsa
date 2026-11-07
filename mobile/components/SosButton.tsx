import React, { useRef, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { tokens } from '../theme/tokens';

const TAP_WINDOW_MS = 2500;
const REQUIRED_TAPS = 3;

interface SosButtonProps {
  onTrigger: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function SosButton({ onTrigger, testID, style }: SosButtonProps) {
  const taps = useRef<number[]>([]);

  const handlePress = useCallback(() => {
    const now = Date.now();
    // Remove taps older than the window
    taps.current = taps.current.filter((t) => now - t < TAP_WINDOW_MS);
    taps.current.push(now);

    if (taps.current.length >= REQUIRED_TAPS) {
      taps.current = [];
      onTrigger();
    }
  }, [onTrigger]);

  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="SOS – tap 3 times quickly to activate"
    >
      <Text style={styles.label}>SOS</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: tokens.size.sosButton,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.danger,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.space[3],
    ...tokens.shadow.sos,
  },
  label: {
    color: tokens.color.surface,
    fontSize: tokens.font.h3.size,
    fontWeight: tokens.font.h3.weight,
    letterSpacing: 2,
    fontFamily: tokens.font.family,
  },
});
