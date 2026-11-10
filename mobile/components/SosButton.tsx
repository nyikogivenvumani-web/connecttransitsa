import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { messages } from '../constants/messages';
import { tokens } from '../theme/tokens';

import { SOS_TAP_WINDOW_MS, createTapCounter } from '../lib/rules/sos';

interface SosButtonProps {
  onTrigger: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/** Needs 3 taps within 2.5 s (BR11); shows a counter after the 1st and 2nd tap (T-EDGE-7). */
export function SosButton({ onTrigger, testID, style }: SosButtonProps) {
  const counter = useRef(createTapCounter());
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => () => { if (clearTimer.current) clearTimeout(clearTimer.current); }, []);

  const handlePress = useCallback(() => {
    const { count: n, triggered } = counter.current.tap(Date.now());
    if (clearTimer.current) clearTimeout(clearTimer.current);
    if (triggered) {
      setCount(0);
      onTrigger();
      return;
    }
    setCount(n);
    clearTimer.current = setTimeout(() => { counter.current.reset(); setCount(0); }, SOS_TAP_WINDOW_MS);
  }, [onTrigger]);

  return (
    <View>
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
      {count > 0 && (
        <Text testID="sos-tap-counter" style={styles.counter}>
          {count === 1 ? messages.sosTap1 : messages.sosTap2}
        </Text>
      )}
    </View>
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
  counter: { textAlign: 'center', color: tokens.color.danger, marginTop: tokens.space[1], fontFamily: tokens.font.family },
  label: {
    color: tokens.color.surface,
    fontSize: tokens.font.h3.size,
    fontWeight: tokens.font.h3.weight,
    letterSpacing: 2,
    fontFamily: tokens.font.family,
  },
});
