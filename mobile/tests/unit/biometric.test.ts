/**
 * T-AUTH-7: Biometric availability rule.
 * Checks whether device supports hardware and has enrolled biometric records.
 */
import { checkBiometricAvailability } from '../../lib/biometric';
import * as LocalAuthentication from 'expo-local-authentication';

jest.mock('expo-local-authentication');

describe('T-AUTH-7: checkBiometricAvailability', () => {
  it('returns true when hardware is present and enrolled', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    const available = await checkBiometricAvailability();
    expect(available).toBe(true);
  });

  it('returns false when hardware is missing', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    const available = await checkBiometricAvailability();
    expect(available).toBe(false);
  });

  it('returns false when no records enrolled', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
    const available = await checkBiometricAvailability();
    expect(available).toBe(false);
  });
});
