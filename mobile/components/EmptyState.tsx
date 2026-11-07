import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

interface EmptyStateProps {
  message: string;
  buttonLabel?: string;
  onButtonPress?: () => void;
}

export function EmptyState({ message, buttonLabel, onButtonPress }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {buttonLabel && onButtonPress ? (
        <TouchableOpacity testID="empty-state-btn" onPress={onButtonPress} style={styles.button}>
          <Text style={styles.buttonLabel}>{buttonLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.space[3],
  },
  message: {
    fontSize: tokens.font.body.size,
    lineHeight: tokens.font.body.lineHeight,
    color: tokens.color.textMuted,
    textAlign: 'center',
    fontFamily: tokens.font.family,
    marginBottom: tokens.space[2],
  },
  button: {
    height: tokens.size.button,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
    paddingHorizontal: tokens.space[3],
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: tokens.size.touchMin,
  },
  buttonLabel: {
    color: tokens.color.surface,
    fontSize: tokens.font.label.size,
    fontWeight: tokens.font.label.weight,
    fontFamily: tokens.font.family,
  },
});
