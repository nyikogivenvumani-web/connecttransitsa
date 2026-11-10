/**
 * Phase 5 – S4 Case Tracker: T-US3-1, T-US3-2, T-US3-4, T-US3-5, T-S4-1, T-S4-2
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TrackScreen from '../../app/(tabs)/track';
import * as casesApi from '../../lib/api/cases';
import { __resetCaseCache } from '../../lib/api/cases';

jest.mock('../../lib/api/cases', () => {
  const actual = jest.requireActual('../../lib/api/cases');
  return { ...actual, fetchAllMyCases: jest.fn(), fetchCaseByRef: jest.fn(), searchByPlate: jest.fn() };
});

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

let mockNetListener: ((s: { isConnected: boolean }) => void) | null = null;
jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => ({ isConnected: true }),
  addEventListener: jest.fn((cb) => { mockNetListener = cb; return jest.fn(); }),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

const mk = (ref: string, status: string, extra = {}) => ({
  id: ref, case_ref: ref, status, vehicle_plate: 'CA 123 GP', category: 'Overcharging',
  description: 'Charged double', organization_name: 'DORLJOTA', unlisted_entity_name: null,
  incident_at: '2026-11-01T08:00:00Z', created_at: '2026-11-02T08:00:00Z',
  admin_decision: null, decision_reasoning: null,
  evidence_request_id: null, evidence_request_status: null, evidence_request_message: null, evidence_reply_note: null, ...extra,
});
const api = casesApi as jest.Mocked<typeof casesApi>;

beforeEach(() => {
  jest.clearAllMocks();
  __resetCaseCache();
  mockParams = {};
  mockNetListener = null;
  api.fetchAllMyCases.mockResolvedValue([mk('TC-2026-0002', 'Resolved', { admin_decision: 'Warning issued', decision_reasoning: 'Evidence confirmed' }), mk('TC-2026-0001', 'Submitted')]);
});

describe('S4 My cases', () => {
  it('T-US3-1a lists my cases in the order returned (newest first)', async () => {
    const { findByTestId, getAllByTestId } = await render(<TrackScreen />);
    await findByTestId('track-case-TC-2026-0002');
    expect(getAllByTestId(/^track-case-/).map((n) => n.props.testID)).toEqual(['track-case-TC-2026-0002', 'track-case-TC-2026-0001']);
  });

  it('T-US3-1b valid own reference shows timeline and decision', async () => {
    api.fetchCaseByRef.mockResolvedValue(mk('TC-2026-0002', 'Resolved', { admin_decision: 'Warning issued', decision_reasoning: 'Evidence confirmed' }));
    const { getByTestId, findByTestId, findByText } = await render(<TrackScreen />);
    await fireEvent.press(getByTestId('track-mode-search'));
    await fireEvent.changeText(getByTestId('track-search-input'), 'TC-2026-0002');
    await fireEvent.press(getByTestId('track-search-btn'));
    expect(await findByTestId('track-detail')).toBeTruthy();
    expect(getByTestId('timeline-step-2')).toBeTruthy();
    expect(await findByText('Warning issued')).toBeTruthy();
    expect(await findByText('Evidence confirmed')).toBeTruthy();
  });

  it('T-US3-2 unknown reference shows the not-found message', async () => {
    api.fetchCaseByRef.mockResolvedValue(null);
    const { getByTestId, findByText } = await render(<TrackScreen />);
    await fireEvent.press(getByTestId('track-mode-search'));
    await fireEvent.changeText(getByTestId('track-search-input'), 'TC-2026-9999');
    await fireEvent.press(getByTestId('track-search-btn'));
    expect(await findByText('Case reference number not found. Please check and try again.')).toBeTruthy();
  });
});

describe('S4 plate search', () => {
  const open = async () => {
    const r = await render(<TrackScreen />);
    await fireEvent.press(r.getByTestId('track-mode-search'));
    return r;
  };

  it('T-US3-4 shows public fields and no reporter data', async () => {
    api.searchByPlate.mockResolvedValue([{
      category: 'Harassment', vehicle_plate: 'CA 123 GP', organization_name: 'DORLJOTA', status: 'Resolved',
      incident_at: '2026-11-01T08:00:00Z', description: 'Rude driver', admin_decision: 'Warning', decision_reasoning: 'Confirmed',
    }]);
    const r = await open();
    await fireEvent.changeText(r.getByTestId('track-search-input'), 'CA 123 GP');
    await fireEvent.press(r.getByTestId('track-search-btn'));
    const card = await r.findByTestId('track-plate-result-0');
    expect(card).toBeTruthy();
    for (const t of ['Harassment', 'CA 123 GP', 'DORLJOTA', 'Resolved', 'Rude driver', 'Warning', 'Confirmed']) {
      expect(r.getByText(new RegExp(t))).toBeTruthy();
    }
    expect(r.queryByText(/your report|is mine|reporter/i)).toBeNull();
  });

  it('T-US3-5a fewer than 3 characters shows nothing and does not search', async () => {
    const r = await open();
    await fireEvent.changeText(r.getByTestId('track-search-input'), 'CA');
    await fireEvent.press(r.getByTestId('track-search-btn'));
    expect(api.searchByPlate).not.toHaveBeenCalled();
    expect(r.queryByTestId('track-plate-result-0')).toBeNull();
  });

  it('T-US3-5b no matches shows the not-found message', async () => {
    api.searchByPlate.mockResolvedValue([]);
    const r = await open();
    await fireEvent.changeText(r.getByTestId('track-search-input'), 'ZZ 999 GP');
    await fireEvent.press(r.getByTestId('track-search-btn'));
    expect(await r.findByText('Case reference number not found. Please check and try again.')).toBeTruthy();
  });

  it('T-US3-5c rate limit shows the search message', async () => {
    api.searchByPlate.mockRejectedValue(new Error("You're searching too quickly. Try again later."));
    const r = await open();
    await fireEvent.changeText(r.getByTestId('track-search-input'), 'CA 123 GP');
    await fireEvent.press(r.getByTestId('track-search-btn'));
    expect(await r.findByText("You're searching too quickly. Try again later.")).toBeTruthy();
  });
});

describe('S4 states and deep link', () => {
  it('T-S4-1a shows a loading state first', async () => {
    api.fetchAllMyCases.mockReturnValue(new Promise(() => undefined));
    const { getByTestId } = await render(<TrackScreen />);
    expect(getByTestId('track-loading')).toBeTruthy();
  });

  it('T-S4-1b shows the empty state', async () => {
    api.fetchAllMyCases.mockResolvedValue([]);
    const { findByTestId } = await render(<TrackScreen />);
    expect(await findByTestId('track-empty')).toBeTruthy();
  });

  it('T-S4-1c shows an error with retry', async () => {
    api.fetchAllMyCases.mockRejectedValueOnce(new Error('Something went wrong. Try again.'));
    const { findByTestId, getByTestId } = await render(<TrackScreen />);
    expect(await findByTestId('track-error')).toBeTruthy();
    api.fetchAllMyCases.mockResolvedValueOnce([mk('TC-2026-0003', 'Submitted')]);
    await fireEvent.press(getByTestId('track-retry-btn'));
    expect(await findByTestId('track-case-TC-2026-0003')).toBeTruthy();
  });

  it('T-S4-1d offline shows the last loaded list', async () => {
    const first = await render(<TrackScreen />);
    await first.findByTestId('track-case-TC-2026-0001');
    first.unmount();
    api.fetchAllMyCases.mockRejectedValue(new Error('Network request failed'));
    const { findByTestId, getByTestId } = await render(<TrackScreen />);
    expect(await findByTestId('track-case-TC-2026-0001')).toBeTruthy();
    await waitFor(() => expect(getByTestId('track-offline')).toBeTruthy());
  });

  it('T-S4-2 opening from a notification shows that case', async () => {
    mockParams = { case_ref: 'TC-2026-0002' };
    api.fetchCaseByRef.mockResolvedValue(mk('TC-2026-0002', 'Resolved', { admin_decision: 'Warning issued' }));
    const { findByTestId } = await render(<TrackScreen />);
    expect(await findByTestId('track-detail')).toBeTruthy();
    expect(api.fetchCaseByRef).toHaveBeenCalledWith('TC-2026-0002');
  });
});
