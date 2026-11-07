/**
 * T-C-7: OfflineBanner component tests.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { OfflineBanner } from '../../components/OfflineBanner';
import { messages } from '../../constants/messages';

jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: jest.fn(),
}));

import NetInfo from '@react-native-community/netinfo';
const mockUseNetInfo = NetInfo.useNetInfo as jest.Mock;

describe('T-C-7: OfflineBanner', () => {
  it('is hidden when online', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: true });
    render(<OfflineBanner />);
    expect(screen.queryByTestId('offline-banner')).toBeNull();
  });

  it('shows general offline message when offline (not on report screen)', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: false });
    render(<OfflineBanner />);
    expect(screen.getByText(messages.offlineGeneral)).toBeTruthy();
  });

  it('shows report-draft message when offline on report screen', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: false });
    render(<OfflineBanner isReportScreen />);
    expect(screen.getByText(messages.offlineReport)).toBeTruthy();
  });

  it('renders banner container when offline', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: false });
    render(<OfflineBanner />);
    expect(screen.getByTestId('offline-banner')).toBeTruthy();
  });
});
