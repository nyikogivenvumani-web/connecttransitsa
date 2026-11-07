/**
 * T-C-15: DataTable component tests.
 * Sortable columns; row click.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from '../../components/DataTable';

const COLUMNS = [
  { key: 'caseRef', label: 'Case Ref', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'date', label: 'Date', sortable: false },
];

const ROWS = [
  { caseRef: 'TC-2026-0001', status: 'Submitted', date: '2026-11-01' },
  { caseRef: 'TC-2026-0002', status: 'Resolved', date: '2026-11-02' },
];

describe('T-C-15: DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} onRowClick={() => {}} />);
    expect(screen.getByText('Case Ref')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  it('renders all rows', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} onRowClick={() => {}} />);
    expect(screen.getByText('TC-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('TC-2026-0002')).toBeInTheDocument();
  });

  it('calls onRowClick with the row when a row is clicked', () => {
    const onRowClick = jest.fn();
    render(<DataTable columns={COLUMNS} rows={ROWS} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText('TC-2026-0001'));
    expect(onRowClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it('sorts ascending on first sortable column click', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} onRowClick={() => {}} />);
    const header = screen.getByTestId('col-header-caseRef');
    fireEvent.click(header);
    const cells = screen.getAllByTestId('cell-caseRef');
    expect(cells[0].textContent).toBe('TC-2026-0001');
    expect(cells[1].textContent).toBe('TC-2026-0002');
  });

  it('sorts descending on second click of sortable column', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} onRowClick={() => {}} />);
    const header = screen.getByTestId('col-header-caseRef');
    fireEvent.click(header); // ascending
    fireEvent.click(header); // descending
    const cells = screen.getAllByTestId('cell-caseRef');
    expect(cells[0].textContent).toBe('TC-2026-0002');
    expect(cells[1].textContent).toBe('TC-2026-0001');
  });

  it('does not show sort indicator for non-sortable columns', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} onRowClick={() => {}} />);
    const dateHeader = screen.getByTestId('col-header-date');
    expect(dateHeader.getAttribute('data-sortable')).toBe('false');
  });
});
