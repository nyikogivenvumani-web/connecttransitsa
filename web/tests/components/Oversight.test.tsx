/** T-US7-3, T-EDGE-6 (client side) */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Oversight } from '../../components/Oversight';
import * as system from '../../lib/api/system';
import { mkOrg, mkOversight } from './fixturesPhase7';

jest.mock('../../lib/api/system', () => ({
  ...jest.requireActual('../../lib/api/system'),
  fetchOversightCases: jest.fn(), fetchOrganizations: jest.fn(), tagOversightReport: jest.fn(),
}));
const api = system as jest.Mocked<typeof system>;
beforeEach(() => {
  jest.clearAllMocks();
  api.fetchOrganizations.mockResolvedValue([mkOrg(), mkOrg({ id: 'o2', name: 'Putco', type: 'Bus' }), mkOrg({ id: 'o9', name: 'Other/Unregistered', is_oversight: true })]);
  api.tagOversightReport.mockResolvedValue(undefined);
});

it('T-US7-3 lists oversight reports with the typed name', async () => {
  api.fetchOversightCases.mockResolvedValue([mkOversight()]);
  render(<Oversight />);
  expect(await screen.findByText('Khaya Shuttles')).toBeInTheDocument();
  expect(screen.getByText('TC-2026-0009')).toBeInTheDocument();
});

it('T-US7-3 tags a report to a real organization (never the oversight one) and reloads', async () => {
  api.fetchOversightCases.mockResolvedValueOnce([mkOversight()]).mockResolvedValueOnce([]);
  render(<Oversight />);
  await screen.findByText('Khaya Shuttles');
  const select = screen.getByTestId('tag-org-r9') as HTMLSelectElement;
  expect(Array.from(select.options).map((o) => o.text)).not.toContain('Other/Unregistered');
  fireEvent.change(select, { target: { value: 'o2' } });
  fireEvent.click(screen.getByTestId('tag-btn-r9'));
  await waitFor(() => expect(api.tagOversightReport).toHaveBeenCalledWith('r9', 'o2'));
  expect(await screen.findByTestId('oversight-empty')).toBeInTheDocument();
});

it('keeps Tag disabled until an organization is chosen', async () => {
  api.fetchOversightCases.mockResolvedValue([mkOversight()]);
  render(<Oversight />);
  await screen.findByText('Khaya Shuttles');
  expect(screen.getByTestId('tag-btn-r9')).toBeDisabled();
});

it('shows loading, error and offline states', async () => {
  api.fetchOversightCases.mockReturnValueOnce(new Promise(() => undefined));
  const a = render(<Oversight />);
  expect(screen.getByTestId('oversight-loading')).toBeInTheDocument();
  a.unmount();
  api.fetchOversightCases.mockRejectedValueOnce(new Error('Something went wrong. Try again.'));
  const b = render(<Oversight />);
  expect(await screen.findByTestId('oversight-error')).toBeInTheDocument();
  b.unmount();
  api.fetchOversightCases.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  render(<Oversight />);
  expect(await screen.findByTestId('offline-alert')).toBeInTheDocument();
});
