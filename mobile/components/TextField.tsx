import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { tokens } from '../theme/tokens';

interface TextFieldProps extends Omit<TextInputProps, 'onChangeText' | 'value' | 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  testID?: string;
}

export function TextField({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  testID,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  const containerStyle = [
    styles.container,
    focused && !error && styles.containerFocused,
    error ? styles.containerError : null,
  ];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View testID={testID ? `${testID}-container` : undefined} style={containerStyle}>
        <TextInput
          testID={testID ? `${testID}-input` : undefined}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={tokens.color.textMuted}
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity
            testID={testID ? `${testID}-eye` : undefined}
            onPress={() => setHidden((h) => !h)}
            style={styles.eye}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.eyeText}>{hidden ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text testID="field-error" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: tokens.space[2],
  },
  label: {
    fontSize: tokens.font.label.size,
    lineHeight: tokens.font.label.lineHeight,
    fontWeight: tokens.font.label.weight,
    color: tokens.color.text,
    marginBottom: tokens.space.tight,
    fontFamily: tokens.font.family,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: tokens.size.input,
    borderRadius: tokens.radius.input,
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
    paddingHorizontal: tokens.space[2],
  },
  containerFocused: {
    borderWidth: 2,
    borderColor: tokens.color.primary,
  },
  containerError: {
    borderWidth: 2,
    borderColor: tokens.color.danger,
  },
  input: {
    flex: 1,
    fontSize: tokens.font.body.size,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
  },
  eye: {
    padding: tokens.space.tight,
  },
  eyeText: {
    fontSize: 18,
  },
  error: {
    marginTop: tokens.space.tight,
    fontSize: tokens.font.caption.size,
    lineHeight: tokens.font.caption.lineHeight,
    color: tokens.color.danger,
    fontFamily: tokens.font.family,
  },
});
