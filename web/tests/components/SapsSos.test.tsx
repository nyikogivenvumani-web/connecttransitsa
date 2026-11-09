/** T-US4-5 – A4 SAPS live SOS */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SapsSos } from '../../components/SapsSos';
import * as saps from '../../lib/api/saps';

jest.mock('../../components/LiveMap', () => ({ LiveMap: ({ points }: { points: unknown[] }) => <div data-testid="live-map">{points.length} markers</div> }));
jest.mock('../../lib/api/saps', () => ({ ...jest.requireActual('../../lib/api/saps'), fetchActiveSos: jest.fn() }));
const api = saps as jest.Mocked<typeof saps>;

const ev = (over = {}) => ({ id: 'e1', name: 'Thabo Mokoena', lat: -33.92, lng: 18.42, last_recorded_at: new Date(Date.now() - 45_000).toISOString(), started_at: new Date(Date.now() - 600_000).toISOString(), used_cached_location: false, ...over });
beforeEach(() => jest.clearAllMocks());

it('lists active SOS events with the name, a map and time since the last update', async () => {
  api.fetchActiveSos.mockResolvedValue([ev()]);
  render(<SapsSos />);
  expect(await screen.findByText('Thabo Mokoena')).toBeInTheDocument();
  expect(screen.getByTestId('live-map')).toHaveTextContent('1 markers');
  expect(screen.getByText(/Last update 45 s ago|Last update 4\d s ago|Last update 4[5-9] s ago/)).toBeInTheDocument();
});

it('warns when a cached position was used', async () => {
  api.fetchActiveSos.mockResolvedValue([ev({ used_cached_location: true })]);
  render(<SapsSos />);
  expect(await screen.findByText('Last known position (location was off)')).toBeInTheDocument();
});

it('shows loading, empty, error and offline states', async () => {
  api.fetchActiveSos.mockReturnValueOnce(new Promise(() => undefined));
  const a = render(<SapsSos />);
  expect(screen.getByTestId('sos-loading')).toBeInTheDocument();
  a.unmount();
  api.fetchActiveSos.mockResolvedValueOnce([]);
  const b = render(<SapsSos />);
  expect(await screen.findByTestId('sos-empty')).toBeInTheDocument();
  b.unmount();
  api.fetchActiveSos.mockRejectedValueOnce(new Error('Something went wrong. Try again.'));
  const c = render(<SapsSos />);
  expect(await screen.findByTestId('sos-error')).toBeInTheDocument();
  c.unmount();
  api.fetchActiveSos.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  render(<SapsSos />);
  expect(await screen.findByTestId('offline-alert')).toBeInTheDocument();
});
