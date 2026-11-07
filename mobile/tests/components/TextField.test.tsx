/**
 * T-C-2: TextField component tests.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TextField } from '../../components/TextField';
import { tokens } from '../../theme/tokens';

describe('T-C-2: TextField', () => {
  it('renders without error by default', () => {
    render(<TextField label="Email" value="" onChangeText={() => {}} />);
    expect(screen.queryByTestId('field-error')).toBeNull();
  });

  it('shows 2px primary border when focused', () => {
    render(<TextField label="Email" value="" onChangeText={() => {}} testID="email-field" />);
    const input = screen.getByTestId('email-field-input');
    fireEvent(input, 'focus');
    const container = screen.getByTestId('email-field-container');
    const flat = StyleSheet.flatten(container.props.style);
    expect(flat.borderWidth).toBe(2);
    expect(flat.borderColor).toBe(tokens.color.primary);
  });

  it('shows 2px red border and 12px caption on error', () => {
    render(
      <TextField
        label="Email"
        value=""
        onChangeText={() => {}}
        error="Invalid email"
        testID="error-field"
      />,
    );
    const container = screen.getByTestId('error-field-container');
    const flat = StyleSheet.flatten(container.props.style);
    expect(flat.borderWidth).toBe(2);
    expect(flat.borderColor).toBe(tokens.color.danger);

    const caption = screen.getByTestId('field-error');
    const flatCaption = StyleSheet.flatten(caption.props.style);
    expect(flatCaption.fontSize).toBe(12);
    expect(caption.props.children).toBe('Invalid email');
  });

  it('password eye toggle changes secureTextEntry', () => {
    render(
      <TextField
        label="Password"
        value="secret"
        onChangeText={() => {}}
        secureTextEntry
        testID="pass-field"
      />,
    );
    const input = screen.getByTestId('pass-field-input');
    expect(input.props.secureTextEntry).toBe(true);

    const eye = screen.getByTestId('pass-field-eye');
    fireEvent.press(eye);
    expect(input.props.secureTextEntry).toBe(false);

    fireEvent.press(eye);
    expect(input.props.secureTextEntry).toBe(true);
  });
});
