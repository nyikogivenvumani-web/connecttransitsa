/** T-US4-1 (app side), T-EDGE-7 */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/index';
import * as reports from '../../lib/api/reports';
import { sosSession } from '../../lib/sosSession';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@react-native-community/netinfo', () => ({ addEventListener: jest.fn(() => jest.fn()) }));
jest.mock('../../lib/api/reports');
jest.mock('../../lib/offlineQueue', () => ({ retryPendingDrafts: jest.fn().mockResolvedValue(0) }));
jest.mock('../../lib/sosSession', () => ({ sosSession: { start: jest.fn().mockResolvedValue(undefined) } }));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  (reports.fetchMyCases as jest.Mock).mockResolvedValue([]);
});
afterEach(() => jest.useRealTimers());

const tap = async (el: unknown, n: number) => { for (let i = 0; i < n; i++) await fireEvent.press(el as never); };

it('T-US4-1 three quick taps start the SOS and open S8', async () => {
  const { getByTestId } = await render(<HomeScreen />);
  await tap(getByTestId('home-sos-btn'), 3);
  expect(sosSession.start).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith('/sos/active');
});

it('T-EDGE-7 one or two taps send nothing and show a tap counter', async () => {
  const { getByTestId, getByText, queryByTestId } = await render(<HomeScreen />);
  expect(queryByTestId('sos-tap-counter')).toBeNull();
  await tap(getByTestId('home-sos-btn'), 1);
  expect(getByText('Tap 2 more times to activate SOS')).toBeTruthy();
  await tap(getByTestId('home-sos-btn'), 1);
  expect(getByText('Tap 1 more time to activate SOS')).toBeTruthy();
  expect(sosSession.start).not.toHaveBeenCalled();
  expect(mockPush).not.toHaveBeenCalled();
});

it('T-EDGE-7 the counter disappears when the window passes', async () => {
  const { getByTestId, queryByTestId } = await render(<HomeScreen />);
  await tap(getByTestId('home-sos-btn'), 1);
  await act(async () => { jest.advanceTimersByTime(2600); });
  expect(queryByTestId('sos-tap-counter')).toBeNull();
});
