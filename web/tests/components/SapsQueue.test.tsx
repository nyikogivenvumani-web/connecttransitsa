/** T-US6-1, T-US6-2 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SapsQueue } from '../../components/SapsQueue';
import * as saps from '../../lib/api/saps';
import { mkSaps } from './fixturesPhase7';

jest.mock('../../lib/api/saps', () => ({ ...jest.requireActual('../../lib/api/saps'), fetchSapsQueue: jest.fn(), acknowledgeEscalation: jest.fn() }));
const api = saps as jest.Mocked<typeof saps>;
beforeEach(() => { jest.clearAllMocks(); api.acknowledgeEscalation.mockResolvedValue(undefined); });

it('T-US6-1 shows the case details and the reporter name and ID number', async () => {
  api.fetchSapsQueue.mockResolvedValue([mkSaps()]);
  render(<SapsQueue />);
  for (const t of ['TC-2026-0007', 'CA 123 GP', 'Physical Assault', 'Driver hit a passenger', 'Bellville taxi rank', 'CAS 12/11/2026', 'Thabo Mokoena', '9803145009088']) {
    expect(await screen.findByText(new RegExp(t.replace('/', '\\/')))).toBeInTheDocument();
  }
});

it('T-US6-2 acknowledges an item', async () => {
  api.fetchSapsQueue.mockResolvedValueOnce([mkSaps()]).mockResolvedValueOnce([mkSaps({ status: 'acknowledged' })]);
  render(<SapsQueue />);
  fireEvent.click(await screen.findByTestId('saps-ack-q1'));
  await waitFor(() => expect(api.acknowledgeEscalation).toHaveBeenCalledWith('q1'));
  expect(await screen.findByText('Acknowledged')).toBeInTheDocument();
  expect(screen.queryByTestId('saps-ack-q1')).toBeNull();
});

it('shows a failed webhook delivery', async () => {
  api.fetchSapsQueue.mockResolvedValue([mkSaps({ webhook_status: 'failed' })]);
  render(<SapsQueue />);
  expect(await screen.findByText('Delivery to SAPS failed')).toBeInTheDocument();
});

it('T-US6-2 loading, empty, error and offline states', async () => {
  api.fetchSapsQueue.mockReturnValueOnce(new Promise(() => undefined));
  const a = render(<SapsQueue />);
  expect(screen.getByTestId('saps-loading')).toBeInTheDocument();
  a.unmount();
  api.fetchSapsQueue.mockResolvedValueOnce([]);
  const b = render(<SapsQueue />);
  expect(await screen.findByTestId('saps-empty')).toBeInTheDocument();
  b.unmount();
  api.fetchSapsQueue.mockRejectedValueOnce(new Error('Something went wrong. Try again.'));
  const c = render(<SapsQueue />);
  expect(await screen.findByTestId('saps-error')).toBeInTheDocument();
  c.unmount();
  api.fetchSapsQueue.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  render(<SapsQueue />);
  expect(await screen.findByTestId('offline-alert')).toBeInTheDocument();
});
