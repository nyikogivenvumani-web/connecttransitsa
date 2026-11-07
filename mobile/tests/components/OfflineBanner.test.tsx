/**
 * T-C-7: OfflineBanner component tests.
 * On S3 (isReportScreen): "Network connection lost. Your report draft has been saved locally."
 * Elsewhere: "You're offline."
 * Visible when offline; hidden when online.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { OfflineBanner } from '../../components/OfflineBanner';
import { messages } from '../../constants/messages';

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: jest.fn(),
}));

import NetInfo from '@react-native-community/netinfo';
const mockUseNetInfo = NetInfo.useNetInfo as jest.Mock;

describe('T-C-7: OfflineBanner', () => {
  it('is hidden when online', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: true });
    const { queryByTestId } = render(<OfflineBanner />);
    expect(queryByTestId('offline-banner')).toBeNull();
  });

  it('shows general offline message when offline (not on report screen)', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: false });
    const { getByText } = render(<OfflineBanner />);
    expect(getByText(messages.offlineGeneral)).toBeTruthy();
  });

  it('shows report-draft message when offline on report screen', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: false });
    const { getByText } = render(<OfflineBanner isReportScreen />);
    expect(getByText(messages.offlineReport)).toBeTruthy();
  });

  it('renders banner container when offline', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: false });
    const { getByTestId } = render(<OfflineBanner />);
    expect(getByTestId('offline-banner')).toBeTruthy();
  });
});
