import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../app/(tabs)/settings';
import * as authApi from '../../lib/api/auth';
import * as biometric from '../../lib/biometric';

jest.mock('../../lib/api/auth');
jest.mock('../../lib/biometric', () => ({
  checkBiometricAvailability: jest.fn(),
  getBiometricPreference: jest.fn(),
  setBiometricPreference: jest.fn(),
  authenticateWithBiometrics: jest.fn(),
}));
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('SettingsScreen (S5 - T-AUTH-9, T-S5-1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (biometric.checkBiometricAvailability as jest.Mock).mockResolvedValue(true);
    (biometric.getBiometricPreference as jest.Mock).mockResolvedValue(true);
  });

  test('renders user profile section and options', () => {
    const { getByTestId } = render(<SettingsScreen />);

    expect(getByTestId('settings-profile-card')).toBeTruthy();
    expect(getByTestId('settings-logout-btn')).toBeTruthy();
    expect(getByTestId('settings-delete-account-btn')).toBeTruthy();
  });

  test('handles sign out confirmation', async () => {
    (authApi.signOut as jest.Mock).mockResolvedValue(undefined);
    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('settings-logout-btn'));
    fireEvent.press(getByTestId('confirm-modal-confirm'));

    await waitFor(() => {
      expect(authApi.signOut).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/welcome');
    });
  });

  test('opens delete account modal with warning', async () => {
    const { getByTestId, findByText } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('settings-delete-account-btn'));
    const deleteWarning = await findByText(/This cannot be undone/i);
    expect(deleteWarning).toBeTruthy();
  });
});
