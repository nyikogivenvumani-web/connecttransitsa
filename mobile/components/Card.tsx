import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { tokens } from '../theme/tokens';

export type CardAccent = 'verified' | 'investigating' | 'hazard' | 'none';

const ACCENT_COLOR: Record<CardAccent, string> = {
  verified: tokens.color.primary,
  investigating: tokens.color.warning,
  hazard: tokens.color.danger,
  none: 'transparent',
};

interface CardProps extends ViewProps {
  accent?: CardAccent;
  children: React.ReactNode;
  testID?: string;
}

export function Card({ accent = 'none', children, testID, style, ...rest }: CardProps) {
  return (
    <View testID={testID} style={[styles.card, style]} {...rest}>
      <View
        testID="card-accent"
        style={[styles.accent, { backgroundColor: ACCENT_COLOR[accent] }]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.color.border,
    overflow: 'hidden',
    ...tokens.shadow.card,
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: tokens.space[2],
  },
});
