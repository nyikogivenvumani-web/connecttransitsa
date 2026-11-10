/** T-BR11-3 hold to stop, T-US4-2 cached banner, T-US4-4 offline banner */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import SosActiveScreen from '../../app/sos/active';
import * as sos from '../../lib/sosSession';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('../../lib/sosSession', () => ({ useSos: jest.fn(), sosSession: { stop: jest.fn() } }));

const base = { status: 'active', eventId: 'e1', shareToken: 'tok', usedCached: false, noLocation: false, offline: false };
const useSos = sos.useSos as jest.Mock;
const stop = (sos.sosSession as unknown as { stop: jest.Mock }).stop;

beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); useSos.mockReturnValue(base); stop.mockResolvedValue(undefined); });
afterEach(() => jest.useRealTimers());

it('shows that sharing is active', async () => {
  const { getByText } = await render(<SosActiveScreen />);
  expect(getByText('Sharing your live location with SAPS')).toBeTruthy();
});

it('T-BR11-3 holding Stop for 3 seconds stops the SOS and returns to S2', async () => {
  const { getByTestId } = await render(<SosActiveScreen />);
  await fireEvent(getByTestId('sos-stop-btn'), 'pressIn');
  await act(async () => { jest.advanceTimersByTime(3000); });
  expect(stop).toHaveBeenCalledTimes(1);
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
});

it('T-BR11-3 a short press does not stop', async () => {
  const { getByTestId } = await render(<SosActiveScreen />);
  await fireEvent(getByTestId('sos-stop-btn'), 'pressIn');
  await act(async () => { jest.advanceTimersByTime(1000); });
  await fireEvent(getByTestId('sos-stop-btn'), 'pressOut');
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(stop).not.toHaveBeenCalled();
});

it('T-US4-2 warns when the last known position is used', async () => {
  useSos.mockReturnValue({ ...base, usedCached: true });
  const { getByTestId } = await render(<SosActiveScreen />);
  expect(getByTestId('sos-cached-banner')).toBeTruthy();
});

it('T-US4-4 shows the offline message', async () => {
  useSos.mockReturnValue({ ...base, status: 'queued', offline: true });
  const { getByText } = await render(<SosActiveScreen />);
  expect(getByText('SOS could not be sent. We will keep trying.')).toBeTruthy();
});
