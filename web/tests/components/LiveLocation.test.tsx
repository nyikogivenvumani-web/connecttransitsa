/** T-P1-1 – public live location page */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { LiveLocation } from '../../components/LiveLocation';
import * as sos from '../../lib/api/sos';

jest.mock('../../components/LiveMap', () => ({ LiveMap: () => <div data-testid="live-map" /> }));
jest.mock('../../lib/api/sos', () => ({ ...jest.requireActual('../../lib/api/sos'), fetchShared: jest.fn() }));
const fetchShared = sos.fetchShared as jest.Mock;
beforeEach(() => jest.clearAllMocks());

it('shows the current location while active, and nothing personal', async () => {
  fetchShared.mockResolvedValue({ status: 'active', lat: -33.92, lng: 18.42, recorded_at: new Date().toISOString() });
  const { container } = render(<LiveLocation token="tok" />);
  expect(await screen.findByTestId('live-map')).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/name|phone|\+27|@/i);
});

it('shows "This link is no longer active." after the SOS stopped', async () => {
  fetchShared.mockResolvedValue({ status: 'stopped', lat: null, lng: null, recorded_at: null });
  render(<LiveLocation token="tok" />);
  expect(await screen.findByText('This link is no longer active.')).toBeInTheDocument();
  expect(screen.queryByTestId('live-map')).toBeNull();
});

it('shows the same message for an unknown token', async () => {
  fetchShared.mockResolvedValue(null);
  render(<LiveLocation token="nope" />);
  expect(await screen.findByText('This link is no longer active.')).toBeInTheDocument();
});

it('shows the same message when the page is older than 24 hours', async () => {
  fetchShared.mockResolvedValue({ status: 'active', lat: -33.9, lng: 18.4, recorded_at: new Date(Date.now() - 25 * 3600_000).toISOString() });
  render(<LiveLocation token="tok" />);
  expect(await screen.findByText('This link is no longer active.')).toBeInTheDocument();
});
