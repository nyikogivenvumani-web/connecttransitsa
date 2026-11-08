import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WelcomeScreen from '../../app/(auth)/welcome';
import * as authApi from '../../lib/api/auth';
import * as biometric from '../../lib/biometric';

jest.mock('../../lib/api/auth');
jest.mock('../../lib/biometric', () => ({
  checkBiometricAvailability: jest.fn(),
  getBiometricPreference: jest.fn(),
  setBiometricPreference: jest.fn(),
  authenticateWithBiometrics: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
}));

describe('WelcomeScreen (S1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (biometric.checkBiometricAvailability as jest.Mock).mockResolvedValue(false);
    (biometric.getBiometricPreference as jest.Mock).mockResolvedValue(false);
  });

  test('T-ACC-1 & T-ACC-2: renders Phone and Email tabs in signup mode', async () => {
    const { getByTestId, queryByTestId } = render(<WelcomeScreen />);

    fireEvent.press(getByTestId('auth-toggle-mode-btn')); // go to signup
    expect(getByTestId('auth-phone-tab')).toBeTruthy();
    expect(getByTestId('auth-email-tab')).toBeTruthy();

    fireEvent.press(getByTestId('auth-phone-tab'));
    expect(getByTestId('auth-phone-input')).toBeTruthy();
    expect(queryByTestId('auth-email-input')).toBeNull();

    fireEvent.press(getByTestId('auth-email-tab'));
    expect(getByTestId('auth-email-input')).toBeTruthy();
    expect(queryByTestId('auth-phone-input')).toBeNull();
  });

  test('T-ACC-1: validates SA ID and under-age error', async () => {
    const actualAuth = jest.requireActual('../../lib/api/auth');
    (authApi.signUpWithEmail as jest.Mock).mockImplementation(actualAuth.signUpWithEmail);

    const { getByTestId, findByText } = render(<WelcomeScreen />);

    fireEvent.press(getByTestId('auth-toggle-mode-btn')); // switch to Sign up
    expect(getByTestId('auth-id-input')).toBeTruthy();

    fireEvent.changeText(getByTestId('auth-id-input'), '1506155000081'); // Under 16
    fireEvent.changeText(getByTestId('auth-name-input'), 'Young Citizen');
    fireEvent.changeText(getByTestId('auth-email-input'), 'young@example.com');
    fireEvent.changeText(getByTestId('auth-signup-password-input'), 'SecurePass1');
    fireEvent(getByTestId('auth-privacy-switch'), 'valueChange', true);
    fireEvent.press(getByTestId('auth-submit-btn'));

    const error = await findByText('You must be 16 or older to use this app.');
    expect(error).toBeTruthy();
  });

  test('T-AUTH-2: handles sign-in flow', async () => {
    (authApi.signIn as jest.Mock).mockResolvedValue({});
    const { getByTestId } = render(<WelcomeScreen />);

    fireEvent.changeText(getByTestId('auth-identifier-input'), '0821234567');
    fireEvent.changeText(getByTestId('auth-password-input'), 'SecurePass1');
    fireEvent.press(getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(authApi.signIn).toHaveBeenCalledWith('0821234567', 'SecurePass1');
    });
  });

  test('T-AUTH-6 & T-AUTH-8: shows biometric sign-in button when available and enabled', async () => {
    (biometric.getBiometricPreference as jest.Mock).mockResolvedValue(true);
    const { findByTestId } = render(<WelcomeScreen />);

    const bioBtn = await findByTestId('auth-biometric-btn');
    expect(bioBtn).toBeTruthy();
  });
});
