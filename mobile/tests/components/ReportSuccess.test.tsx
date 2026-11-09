/**
 * T-S7-1 – Report Success screen (S7)
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import ReportSuccessScreen from '../../app/report/success';

jest.mock('../../lib/push', () => ({ registerForPush: jest.fn(() => Promise.resolve(true)) }));
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({ case_ref: 'TC-2026-0042' }),
}));

describe('ReportSuccessScreen – S7', () => {
  beforeEach(() => jest.clearAllMocks());

  it('T-S7-1a renders the case reference number', () => {
    const { getByTestId } = render(<ReportSuccessScreen />);
    const ref = getByTestId('success-case-ref');
    expect(ref).toBeTruthy();
    // The reference should be displayed somewhere in the text
    expect(ref.props.children ?? ref.props.value ?? JSON.stringify(ref)).toMatch(/TC-2026-0042/);
  });

  it('T-S7-1b renders the PRD tone message verbatim', () => {
    const { getByText } = render(<ReportSuccessScreen />);
    expect(
      getByText(
        'Your incident report has been securely lodged. Your identity remains strictly confidential.',
      ),
    ).toBeTruthy();
  });

  it('T-S7-1c renders the Done button', () => {
    const { getByTestId } = render(<ReportSuccessScreen />);
    expect(getByTestId('success-done-btn')).toBeTruthy();
  });

  it('T-S7-1d Done button navigates back to S2', () => {
    const { getByTestId } = render(<ReportSuccessScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.press(getByTestId('success-done-btn'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
