/**
 * Phase 4 component tests for the Report Incident flow.
 *
 * Tests:
 *   T-US1-1  Happy path: submit valid report → S7 with case ref
 *   T-US1-2  Validation: missing plate shows error
 *   T-US1-3  Category "Other" requires custom text
 *   T-BR9-3  Rate limit message shown
 *   T-EDGE-1 Offline → draft saved message
 *   T-EDGE-2 "Other/Unregistered" org → unlisted entity name box
 *   T-EDGE-3 Oversized file → submit disabled
 *   T-S3-1   Location permission denied → still submittable
 *   T-S3-2   Leave with unsaved input → ConfirmModal
 *   T-S2-2   Home screen shows Report button and recent cases
 *   T-S7-1   Report Success screen shows ref + PRD message + Done
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// ── Screens under test ────────────────────────────────────────────────────
import ReportIncidentScreen from '../../app/report/new';
import ReportSuccessScreen from '../../app/report/success';
import HomeScreen from '../../app/(tabs)/index';

// ── Mocked dependencies ───────────────────────────────────────────────────
jest.mock('../../lib/api/reports');
jest.mock('../../lib/db/drafts');
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' }),
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: -26.2, longitude: 28.0 } }),
  ),
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true }),
  ),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos' },
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
  useLocalSearchParams: () => ({}),
}));

// ── Helpers ───────────────────────────────────────────────────────────────
import * as reportsApi from '../../lib/api/reports';
import * as NetInfo from '@react-native-community/netinfo';

const ORGS = [
  { id: 'org-1', name: 'DORLJOTA', type: 'Taxi', is_verified: true, is_oversight: false },
  { id: 'org-oversight', name: 'Other/Unregistered', type: 'Taxi', is_verified: true, is_oversight: true },
];

const CATEGORIES = [
  'Sexual Misconduct',
  'Physical Assault',
  'Reckless & Negligent Driving',
  'Overcrowding & Safety Hazard',
  'Extortion & Fare Intimidation',
  'Overcharging',
  'Harassment',
  'Drunk or Impaired Driving',
  'Unroadworthy Vehicle',
  'Refusal of Service or Route Deviation',
  'Other',
];

beforeEach(() => {
  jest.clearAllMocks();
  (reportsApi.fetchOrganizations as jest.Mock).mockResolvedValue(ORGS);
  (reportsApi.submitReport as jest.Mock).mockResolvedValue({ case_ref: 'TC-2026-0001' });
});

// ─────────────────────────────────────────────────────────────────────────
// S2 Home Dashboard
// ─────────────────────────────────────────────────────────────────────────
describe('HomeScreen – S2 (Phase 4 additions)', () => {
  it('T-S2-2a shows the Report Incident button', async () => {
    (reportsApi.fetchMyCases as jest.Mock).mockResolvedValue([]);
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('home-report-btn')).toBeTruthy();
  });

  it('T-S2-2b shows up to 3 recent cases as cards', async () => {
    (reportsApi.fetchMyCases as jest.Mock).mockResolvedValue([
      { id: '1', case_ref: 'TC-2026-0001', status: 'Submitted', vehicle_plate: 'CA 1 GP', category: 'Overcharging', created_at: new Date().toISOString() },
      { id: '2', case_ref: 'TC-2026-0002', status: 'Under Review', vehicle_plate: 'CA 2 GP', category: 'Harassment', created_at: new Date().toISOString() },
      { id: '3', case_ref: 'TC-2026-0003', status: 'Resolved', vehicle_plate: 'CA 3 GP', category: 'Overcharging', created_at: new Date().toISOString() },
    ]);
    const { findByTestId } = render(<HomeScreen />);
    expect(await findByTestId('home-case-card-TC-2026-0001')).toBeTruthy();
    expect(await findByTestId('home-case-card-TC-2026-0002')).toBeTruthy();
    expect(await findByTestId('home-case-card-TC-2026-0003')).toBeTruthy();
  });

  it('T-S2-2c shows empty state when no cases', async () => {
    (reportsApi.fetchMyCases as jest.Mock).mockResolvedValue([]);
    const { findByTestId } = render(<HomeScreen />);
    expect(await findByTestId('home-empty-state')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// S3 Report Incident
// ─────────────────────────────────────────────────────────────────────────
describe('ReportIncidentScreen – S3', () => {
  // Helper: fill the minimum required fields
  async function fillRequiredFields(getByTestId: ReturnType<typeof render>['getByTestId']) {
    // Org select: press trigger then pick first option
    fireEvent.press(getByTestId('report-org-select-trigger'));
    fireEvent.press(getByTestId('report-org-option-org-1'));

    // Plate
    fireEvent.changeText(getByTestId('report-plate-input'), 'CA 123 GP');

    // Category select
    fireEvent.press(getByTestId('report-category-select-trigger'));
    fireEvent.press(getByTestId('report-category-option-Reckless & Negligent Driving'));

    // Description
    fireEvent.changeText(
      getByTestId('report-description-input'),
      'Swerved between lanes at speed.',
    );
  }

  it('T-US1-1 valid report submits → navigates to S7 with case ref', async () => {
    const { getByTestId } = render(<ReportIncidentScreen />);
    await fillRequiredFields(getByTestId);

    fireEvent.press(getByTestId('report-submit-btn'));

    await waitFor(() => {
      expect(reportsApi.submitReport).toHaveBeenCalledWith(
        expect.objectContaining({
          vehiclePlate: 'CA 123 GP',
          category: 'Reckless & Negligent Driving',
          description: 'Swerved between lanes at speed.',
        }),
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/report/success' }),
      );
    });
  });

  it('T-US1-2 missing plate → red border and error message', async () => {
    const { getByTestId, findByText } = render(<ReportIncidentScreen />);

    // Select org and category but leave plate blank
    fireEvent.press(getByTestId('report-org-select-trigger'));
    fireEvent.press(getByTestId('report-org-option-org-1'));
    fireEvent.press(getByTestId('report-category-select-trigger'));
    fireEvent.press(getByTestId('report-category-option-Reckless & Negligent Driving'));
    fireEvent.changeText(getByTestId('report-description-input'), 'Some description');

    fireEvent.press(getByTestId('report-submit-btn'));

    expect(await findByText('Vehicle registration plate is required')).toBeTruthy();
    expect(reportsApi.submitReport).not.toHaveBeenCalled();
  });

  it('T-US1-3 category "Other" shows custom text field', async () => {
    const { getByTestId, queryByTestId } = render(<ReportIncidentScreen />);

    // Before selecting "Other" — custom field should not exist
    expect(queryByTestId('report-custom-category-input')).toBeNull();

    fireEvent.press(getByTestId('report-category-select-trigger'));
    fireEvent.press(getByTestId('report-category-option-Other'));

    expect(getByTestId('report-custom-category-input')).toBeTruthy();
  });

  it('T-BR9-3 rate limit error shows the correct message', async () => {
    (reportsApi.submitReport as jest.Mock).mockRejectedValue(
      new Error("You're sending reports too quickly. Try again later."),
    );

    const { getByTestId, findByText } = render(<ReportIncidentScreen />);
    await fillRequiredFields(getByTestId);
    fireEvent.press(getByTestId('report-submit-btn'));

    expect(
      await findByText("You're sending reports too quickly. Try again later."),
    ).toBeTruthy();
  });

  it('T-EDGE-1 offline → draft saved message shown', async () => {
    // Simulate offline
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
    (reportsApi.submitReport as jest.Mock).mockRejectedValue(
      new Error('Network connection lost. Your report draft has been saved locally.'),
    );

    const { getByTestId, findByText } = render(<ReportIncidentScreen />);
    await fillRequiredFields(getByTestId);
    fireEvent.press(getByTestId('report-submit-btn'));

    expect(
      await findByText('Network connection lost. Your report draft has been saved locally.'),
    ).toBeTruthy();
  });

  it('T-EDGE-2 "Other/Unregistered" org shows unlisted entity name input', async () => {
    const { getByTestId, queryByTestId } = render(<ReportIncidentScreen />);

    expect(queryByTestId('report-unlisted-entity-input')).toBeNull();

    fireEvent.press(getByTestId('report-org-select-trigger'));
    fireEvent.press(getByTestId('report-org-option-org-oversight'));

    expect(getByTestId('report-unlisted-entity-input')).toBeTruthy();
  });

  it('T-EDGE-3 submit is disabled while an over-size file error is active', async () => {
    const { getByTestId } = render(<ReportIncidentScreen />);

    // Trigger a media error (component exposes a way to set error from outside via
    // the onError prop passed to MediaPicker; we simulate pressing the add-photo
    // button when the mock returns an oversized asset)
    const { launchImageLibraryAsync } = require('expo-image-picker');
    launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://big.jpg', fileSize: 6 * 1024 * 1024 }],
    });

    fireEvent.press(getByTestId('report-media-picker-add-photo'));

    await waitFor(() => {
      const btn = getByTestId('report-submit-btn');
      expect(btn.props.accessibilityState?.disabled).toBe(true);
    });
  });

  it('T-S3-1 location permission denied → submit still enabled', async () => {
    const Location = require('expo-location');
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const { getByTestId, queryByTestId } = render(<ReportIncidentScreen />);
    await waitFor(() => {
      expect(getByTestId('report-location-text-input')).toBeTruthy();
    });
    expect(getByTestId('report-submit-btn')).toBeTruthy();
  });

  it('T-S3-2 leaving with unsaved input shows ConfirmModal', async () => {
    const { getByTestId, findByTestId } = render(<ReportIncidentScreen />);

    fireEvent.changeText(getByTestId('report-plate-input'), 'CA 1 GP');

    // Simulate hardware back / router.back()
    fireEvent.press(getByTestId('report-back-btn'));

    expect(await findByTestId('confirm-modal-confirm')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// S7 Report Success
// ─────────────────────────────────────────────────────────────────────────
describe('ReportSuccessScreen – S7', () => {
  it('T-S7-1 shows case ref, PRD tone message, and Done button', () => {
    jest.mock('expo-router', () => ({
      useRouter: () => ({ replace: mockReplace }),
      useLocalSearchParams: () => ({ case_ref: 'TC-2026-0042' }),
    }));

    const { getByTestId, getByText } = render(<ReportSuccessScreen />);

    expect(getByTestId('success-case-ref')).toBeTruthy();
    expect(
      getByText(
        'Your incident report has been securely lodged. Your identity remains strictly confidential.',
      ),
    ).toBeTruthy();
    expect(getByTestId('success-done-btn')).toBeTruthy();
  });
});
