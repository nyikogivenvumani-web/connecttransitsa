import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ResetPasswordScreen from '../../app/(auth)/reset-password';
import * as authApi from '../../lib/api/auth';

jest.mock('../../lib/api/auth');
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
  }),
}));

describe('ResetPasswordScreen (S6 - T-ACC-4)', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sends reset code on email submit', async () => {
    (authApi.resetPassword as jest.Mock).mockResolvedValue("If an account exists for this email, we've sent a reset code.");
    const { getByTestId, findByText, findByTestId } = render(<ResetPasswordScreen />);

    fireEvent.changeText(getByTestId('reset-email-input'), 'commuter@example.com');
    fireEvent.press(getByTestId('reset-submit-btn'));

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith('commuter@example.com');
    });

    const successMsg = await findByText("If an account exists for this email, we've sent a reset code.");
    expect(successMsg).toBeTruthy();
    expect(await findByTestId('reset-new-password-input')).toBeTruthy();
  });

  test('validates password requirements on new password entry', async () => {
    const actualAuth = jest.requireActual('../../lib/api/auth');
    (authApi.resetPassword as jest.Mock).mockResolvedValue("If an account exists for this email, we've sent a reset code.");
    (authApi.updatePassword as jest.Mock).mockImplementation(actualAuth.updatePassword);

    const { getByTestId, findByTestId, findByText } = render(<ResetPasswordScreen />);

    fireEvent.changeText(getByTestId('reset-email-input'), 'commuter@example.com');
    fireEvent.press(getByTestId('reset-submit-btn'));

    const newPassInput = await findByTestId('reset-new-password-input');
    fireEvent.changeText(getByTestId('otp-box-0'), '1');
    fireEvent.changeText(getByTestId('otp-box-1'), '2');
    fireEvent.changeText(getByTestId('otp-box-2'), '3');
    fireEvent.changeText(getByTestId('otp-box-3'), '4');
    fireEvent.changeText(getByTestId('otp-box-4'), '5');
    fireEvent.changeText(getByTestId('otp-box-5'), '6');

    fireEvent.changeText(newPassInput, 'weak');
    fireEvent.press(getByTestId('reset-submit-btn'));

    const passError = await findByText('Password must be at least 8 characters and include uppercase, lowercase, and a digit.');
    expect(passError).toBeTruthy();
  });
});
