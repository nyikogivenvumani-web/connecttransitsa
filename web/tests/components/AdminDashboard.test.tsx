/** T-US2-1, T-US2-2, T-A1-1 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminDashboard } from '../../components/AdminDashboard';
import { CaseDetail } from '../../components/CaseDetail';
import * as admin from '../../lib/api/admin';
import { mkCase } from './fixtures';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('../../lib/api/admin', () => ({
  ...jest.requireActual('../../lib/api/admin'),
  fetchAdminCases: jest.fn(), fetchAdminCase: jest.fn(), fetchCaseMedia: jest.fn(),
  updateCase: jest.fn(), requestEvidence: jest.fn(), cancelEvidenceRequest: jest.fn(),
}));
const api = admin as jest.Mocked<typeof admin>;

beforeEach(() => jest.clearAllMocks());

describe('A1 dashboard', () => {
  const rows = [
    mkCase({ id: '1', case_ref: 'TC-2026-0001', status: 'Submitted', created_at: '2026-11-01T08:00:00Z' }),
    mkCase({ id: '2', case_ref: 'TC-2026-0002', status: 'Escalated', is_escalated: true, created_at: '2026-11-03T08:00:00Z' }),
    mkCase({ id: '3', case_ref: 'TC-2026-0003', status: 'Resolved', created_at: '2026-11-02T08:00:00Z' }),
  ];

  it('T-US2-1 lists the cases the API returns and opens A2 on click', async () => {
    api.fetchAdminCases.mockResolvedValue(rows);
    render(<AdminDashboard />);
    fireEvent.click(await screen.findByText('TC-2026-0001'));
    expect(push).toHaveBeenCalledWith('/admin/cases/1');
  });

  it('T-A1-1 filters by status', async () => {
    api.fetchAdminCases.mockResolvedValue(rows);
    render(<AdminDashboard />);
    await screen.findByText('TC-2026-0001');
    fireEvent.change(screen.getByTestId('status-filter'), { target: { value: 'Resolved' } });
    expect(screen.queryByText('TC-2026-0001')).toBeNull();
    expect(screen.getByText('TC-2026-0003')).toBeInTheDocument();
  });

  it('T-A1-1 shows an Urgent chip on escalated cases only', async () => {
    api.fetchAdminCases.mockResolvedValue(rows);
    render(<AdminDashboard />);
    await screen.findByText('TC-2026-0002');
    expect(screen.getAllByText('Urgent')).toHaveLength(1);
  });

  it('T-A1-1 sorts by date when the Date header is clicked', async () => {
    api.fetchAdminCases.mockResolvedValue(rows);
    render(<AdminDashboard />);
    await screen.findByText('TC-2026-0001');
    fireEvent.click(screen.getByTestId('col-header-date'));
    const first = screen.getAllByTestId('cell-caseRef')[0];
    expect(first).toHaveTextContent('TC-2026-0001');
    fireEvent.click(screen.getByTestId('col-header-date'));
    expect(screen.getAllByTestId('cell-caseRef')[0]).toHaveTextContent('TC-2026-0002');
  });

  it('T-A1-1 shows loading, empty and error states', async () => {
    api.fetchAdminCases.mockReturnValueOnce(new Promise(() => undefined));
    const a = render(<AdminDashboard />);
    expect(screen.getByTestId('admin-loading')).toBeInTheDocument();
    a.unmount();
    api.fetchAdminCases.mockResolvedValueOnce([]);
    const b = render(<AdminDashboard />);
    expect(await screen.findByTestId('admin-empty')).toBeInTheDocument();
    b.unmount();
    api.fetchAdminCases.mockRejectedValueOnce(new Error('Something went wrong. Try again.'));
    render(<AdminDashboard />);
    expect(await screen.findByTestId('admin-error')).toBeInTheDocument();
  });

  it('T-US2-2 shows the offline alert when the network drops', async () => {
    api.fetchAdminCases.mockRejectedValue(new TypeError('Failed to fetch'));
    render(<AdminDashboard />);
    expect(await screen.findByTestId('offline-alert')).toBeInTheDocument();
  });
});

describe('A2 case detail', () => {
  it('T-US2-1 shows plate, time, signed media and only the anonymized commuter label', async () => {
    api.fetchAdminCase.mockResolvedValue(mkCase({ status: 'Under Review' }));
    api.fetchCaseMedia.mockResolvedValue([
      { id: 'm1', kind: 'photo', url: 'https://signed.example/p1.jpg', size_bytes: 10, duration_seconds: null, request_id: null },
      { id: 'm2', kind: 'audio', url: 'https://signed.example/a1.m4a', size_bytes: 10, duration_seconds: 12, request_id: null },
    ]);
    render(<CaseDetail reportId="r1" />);
    expect(await screen.findByText('CA 123 GP')).toBeInTheDocument();
    expect(screen.getByTestId('case-time')).toBeInTheDocument();
    expect(screen.getByTestId('media-photo-0')).toHaveAttribute('src', 'https://signed.example/p1.jpg');
    expect(screen.getByTestId('media-audio-0')).toHaveAttribute('src', 'https://signed.example/a1.m4a');
    expect(screen.getAllByText('Anonymized Commuter').length).toBeGreaterThan(0);
  });
});
