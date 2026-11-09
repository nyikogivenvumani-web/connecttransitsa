/** T-US5-1, T-BR5-2, T-BR10-2 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CaseResolution } from '../../components/CaseResolution';
import * as admin from '../../lib/api/admin';
import { mkCase } from './fixtures';

jest.mock('../../lib/api/admin', () => ({ ...jest.requireActual('../../lib/api/admin'), updateCase: jest.fn() }));
const updateCase = admin.updateCase as jest.Mock;
const onSaved = jest.fn();
beforeEach(() => { jest.clearAllMocks(); updateCase.mockResolvedValue(undefined); });

const type = (id: string, value: string) => fireEvent.change(screen.getByTestId(id), { target: { value } });

it('T-US5-1 moves Submitted to Under Review', async () => {
  render(<CaseResolution caseData={mkCase()} onSaved={onSaved} />);
  fireEvent.click(screen.getByTestId('status-option-Under Review'));
  fireEvent.click(screen.getByTestId('decision-save'));
  await waitFor(() => expect(updateCase).toHaveBeenCalledWith('r1', 'Under Review', null, null));
  expect(onSaved).toHaveBeenCalled();
});

it('T-US5-1 resolves with a summary and a 20+ character reason', async () => {
  render(<CaseResolution caseData={mkCase({ status: 'Under Review' })} onSaved={onSaved} />);
  fireEvent.click(screen.getByTestId('status-option-Resolved'));
  type('decision-summary', 'Operator warned');
  type('decision-reasoning', 'Evidence confirms the overcharge.');
  fireEvent.click(screen.getByTestId('decision-save'));
  await waitFor(() => expect(updateCase).toHaveBeenCalledWith('r1', 'Resolved', 'Operator warned', 'Evidence confirms the overcharge.'));
});

it('T-BR5-2 blocks Resolve or Dismiss with a short reason', () => {
  render(<CaseResolution caseData={mkCase({ status: 'Under Review' })} onSaved={onSaved} />);
  fireEvent.click(screen.getByTestId('status-option-Dismissed'));
  type('decision-summary', 'No breach');
  type('decision-reasoning', 'too short');
  expect(screen.getByText('A written reason of at least 20 characters is required.')).toBeInTheDocument();
  expect(screen.getByTestId('decision-save')).toBeDisabled();
  fireEvent.click(screen.getByTestId('decision-save'));
  expect(updateCase).not.toHaveBeenCalled();
});

it('T-BR10-2 a decided case is read-only', () => {
  render(<CaseResolution caseData={mkCase({ status: 'Resolved', admin_decision: 'Warned', decision_reasoning: 'Confirmed by evidence.' })} onSaved={onSaved} />);
  expect(screen.getByText('This case has already been decided.')).toBeInTheDocument();
  expect(screen.queryByTestId('decision-save')).toBeNull();
  expect(screen.getByText('Warned')).toBeInTheDocument();
});

it('shows a server error instead of failing silently', async () => {
  updateCase.mockRejectedValue(new Error('Something went wrong. Try again.'));
  render(<CaseResolution caseData={mkCase()} onSaved={onSaved} />);
  fireEvent.click(screen.getByTestId('status-option-Under Review'));
  fireEvent.click(screen.getByTestId('decision-save'));
  expect(await screen.findByText('Something went wrong. Try again.')).toBeInTheDocument();
});
