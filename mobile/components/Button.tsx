import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { tokens } from '../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'sos';

interface ButtonProps {
  variant: ButtonVariant;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  variant,
  label,
  onPress,
  disabled = false,
  loading = false,
  testID,
  style,
}: ButtonProps) {
  const isBlocked = disabled || loading;

  const containerStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'outlined' && styles.outlined,
    variant === 'sos' && styles.sos,
    isBlocked && styles.blocked,
    style,
  ];

  const textStyle = [
    styles.label,
    variant === 'outlined' && styles.labelOutlined,
    variant === 'secondary' && styles.labelSecondary,
    variant === 'sos' && styles.labelSos,
  ];

  return (
    <TouchableOpacity
      testID={testID}
      style={containerStyle}
      onPress={isBlocked ? undefined : onPress}
      activeOpacity={isBlocked ? 1 : 0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked }}
    >
      {loading ? (
        <ActivityIndicator
          testID="button-spinner"
          color={variant === 'outlined' ? tokens.color.primary : tokens.color.surface}
          size="small"
        />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: tokens.size.button,
    borderRadius: tokens.radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.space[3],
    minWidth: tokens.size.touchMin,
  },
  primary: {
    backgroundColor: tokens.color.primary,
  },
  secondary: {
    backgroundColor: tokens.color.warning,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: tokens.color.primary,
  },
  sos: {
    height: tokens.size.sosButton,
    backgroundColor: tokens.color.danger,
    ...tokens.shadow.sos,
  },
  blocked: {
    opacity: 0.6,
  },
  label: {
    color: tokens.color.surface,
    fontSize: tokens.font.label.size,
    lineHeight: tokens.font.label.lineHeight,
    fontWeight: tokens.font.label.weight,
    fontFamily: tokens.font.family,
  },
  labelOutlined: {
    color: tokens.color.primary,
  },
  labelSecondary: {
    color: tokens.color.onWarning,
  },
  labelSos: {
    color: tokens.color.surface,
  },
});
