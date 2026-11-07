import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, NativeSyntheticEvent } from 'react-native';
import { tokens } from '../theme/tokens';
import { messages } from '../constants/messages';

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onResend: () => void;
  resendCooldownSeconds: number;
}

export function OtpInput({ value, onChange, onResend, resendCooldownSeconds }: OtpInputProps) {
  const inputs = useRef<(any | null)[]>([]);
  const digits = value.padEnd(OTP_LENGTH, '').slice(0, OTP_LENGTH).split('');

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
      onChange(pasted);
      inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    const newDigits = [...digits];
    newDigits[index] = text.slice(-1);
    const next = newDigits.join('').replace(/\s/g, '');
    onChange(next);
    if (text && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<{ key: string }>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View>
      <View style={styles.row}>
        {Array.from({ length: OTP_LENGTH }).map((_, i) => (
          <TextInput
            key={i}
            ref={(r) => { inputs.current[i] = r; }}
            testID={`otp-box-${i}`}
            style={styles.box}
            value={digits[i] === ' ' ? '' : digits[i]}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            selectTextOnFocus
            textAlign="center"
          />
        ))}
      </View>
      <TouchableOpacity
        testID="otp-resend-btn"
        onPress={resendCooldownSeconds === 0 ? onResend : undefined}
        disabled={resendCooldownSeconds > 0}
        accessibilityState={{ disabled: resendCooldownSeconds > 0 }}
        style={styles.resendBtn}
      >
        <Text style={[styles.resendText, resendCooldownSeconds > 0 && styles.resendDisabled]}>
          {resendCooldownSeconds > 0
            ? messages.otpResendTimer(resendCooldownSeconds)
            : messages.otpResend}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: tokens.space[1],
  },
  box: {
    flex: 1,
    height: tokens.size.input,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.input,
    fontSize: 20,
    color: tokens.color.text,
    backgroundColor: tokens.color.surface,
    fontFamily: tokens.font.family,
  },
  resendBtn: {
    marginTop: tokens.space[2],
    minHeight: tokens.size.touchMin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: tokens.font.label.size,
    color: tokens.color.primary,
    fontWeight: tokens.font.label.weight,
    fontFamily: tokens.font.family,
  },
  resendDisabled: {
    color: tokens.color.textMuted,
  },
});
