/** T-NFR-1 – every logged-in screen shows the offline banner; saving is disabled where it cannot work offline */
import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/index';
import TrackScreen from '../../app/(tabs)/track';
import SettingsScreen from '../../app/(tabs)/settings';
import ReportIncidentScreen from '../../app/report/new';
import * as cases from '../../lib/api/cases';
import * as reports from '../../lib/api/reports';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }), useLocalSearchParams: () => ({}) }));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    useNetInfo: () => ({ isConnected: false }),
    addEventListener: jest.fn((cb: (s: { isConnected: boolean }) => void) => { cb({ isConnected: false }); return jest.fn(); }),
    fetch: jest.fn(() => Promise.resolve({ isConnected: false })),
  },
  useNetInfo: () => ({ isConnected: false }),
  addEventListener: jest.fn((cb: (s: { isConnected: boolean }) => void) => { cb({ isConnected: false }); return jest.fn(); }),
}));
jest.mock('../../lib/api/cases', () => ({ ...jest.requireActual('../../lib/api/cases'), fetchAllMyCases: jest.fn(), fetchCaseByRef: jest.fn(), searchByPlate: jest.fn() }));
jest.mock('../../lib/api/reports');
jest.mock('../../lib/db/drafts');
jest.mock('../../lib/offlineQueue', () => ({ retryPendingDrafts: jest.fn().mockResolvedValue(0) }));
jest.mock('../../lib/sosSession', () => ({ sosSession: { start: jest.fn(), onReconnect: jest.fn() } }));
jest.mock('../../lib/supabase', () => ({ supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) }, from: jest.fn() } }));
jest.mock('../../lib/biometric', () => ({
  checkBiometricAvailability: jest.fn().mockResolvedValue(true), getBiometricPreference: jest.fn().mockResolvedValue(false),
  setBiometricPreference: jest.fn(), authenticateWithBiometrics: jest.fn(),
}));
jest.mock('expo-location', () => ({ requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }) }));
jest.mock('expo-image-picker', () => ({}));

beforeEach(() => {
  (cases.fetchAllMyCases as jest.Mock).mockRejectedValue(new Error('Network request failed'));
  (reports.fetchMyCases as jest.Mock).mockRejectedValue(new Error('Network request failed'));
  (reports.fetchOrganizations as jest.Mock).mockResolvedValue([]);
});

describe('T-NFR-1 offline banner on every logged-in screen', () => {
  it('S2 Home', async () => { expect((await render(<HomeScreen />)).getByTestId('offline-banner')).toBeTruthy(); });
  it('S4 Track', async () => { expect((await render(<TrackScreen />)).getByTestId('offline-banner')).toBeTruthy(); });
  it('S5 Settings', async () => { expect((await render(<SettingsScreen />)).getByTestId('offline-banner')).toBeTruthy(); });
  it('S3 Report', async () => { expect((await render(<ReportIncidentScreen />)).getByText('Network connection lost. Your report draft has been saved locally.')).toBeTruthy(); });

  it('Settings disables account deletion while offline', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('settings-delete-account-btn').props.accessibilityState?.disabled ?? getByTestId('settings-delete-account-btn').props.disabled).toBeTruthy();
  });
});
