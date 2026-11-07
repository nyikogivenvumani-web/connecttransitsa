/**
 * T-C-2: TextField component tests.
 * Focused shows 2px primary border; error shows 2px red border and 12px caption;
 * password eye toggles visibility.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TextField } from '../../components/TextField';
import { tokens } from '../../theme/tokens';

describe('T-C-2: TextField', () => {
  it('renders without error by default', () => {
    const { queryByTestId } = render(
      <TextField label="Email" value="" onChangeText={() => {}} />,
    );
    expect(queryByTestId('field-error')).toBeNull();
  });

  it('shows 2px primary border when focused', () => {
    const { getByTestId } = render(
      <TextField label="Email" value="" onChangeText={() => {}} testID="email-field" />,
    );
    const input = getByTestId('email-field-input');
    fireEvent(input, 'focus');
    const container = getByTestId('email-field-container');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderWidth: 2,
          borderColor: tokens.color.primary,
        }),
      ]),
    );
  });

  it('shows 2px red border and 12px caption on error', () => {
    const { getByTestId } = render(
      <TextField
        label="Email"
        value=""
        onChangeText={() => {}}
        error="Invalid email"
        testID="error-field"
      />,
    );
    const container = getByTestId('error-field-container');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderWidth: 2,
          borderColor: tokens.color.danger,
        }),
      ]),
    );
    const caption = getByTestId('field-error');
    expect(caption.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontSize: 12 })]),
    );
    expect(caption.props.children).toBe('Invalid email');
  });

  it('password eye toggle changes secureTextEntry', () => {
    const { getByTestId } = render(
      <TextField
        label="Password"
        value="secret"
        onChangeText={() => {}}
        secureTextEntry
        testID="pass-field"
      />,
    );
    const input = getByTestId('pass-field-input');
    expect(input.props.secureTextEntry).toBe(true);

    const eye = getByTestId('pass-field-eye');
    fireEvent.press(eye);
    expect(input.props.secureTextEntry).toBe(false);

    fireEvent.press(eye);
    expect(input.props.secureTextEntry).toBe(true);
  });
});
