/** T-US8-1 (admin side), T-US8-2 (admin side), T-US8-3, T-US8-5 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EvidencePanel } from '../../components/EvidencePanel';
import * as admin from '../../lib/api/admin';
import { mkCase } from './fixtures';

jest.mock('../../lib/api/admin', () => ({ ...jest.requireActual('../../lib/api/admin'), requestEvidence: jest.fn(), cancelEvidenceRequest: jest.fn() }));
const requestEvidence = admin.requestEvidence as jest.Mock;
const cancel = admin.cancelEvidenceRequest as jest.Mock;
const onChanged = jest.fn();
const MSG = 'Please send a clearer photo of the vehicle plate.';
beforeEach(() => { jest.clearAllMocks(); requestEvidence.mockResolvedValue(undefined); cancel.mockResolvedValue(undefined); });

const type = (value: string) => fireEvent.change(screen.getByTestId('evidence-message'), { target: { value } });

it('T-US8-1 sends a valid request on an Under Review case', async () => {
  render(<EvidencePanel caseData={mkCase({ status: 'Under Review' })} media={[]} onChanged={onChanged} />);
  type(MSG);
  fireEvent.click(screen.getByTestId('evidence-send'));
  await waitFor(() => expect(requestEvidence).toHaveBeenCalledWith('r1', MSG));
  expect(onChanged).toHaveBeenCalled();
});

it('T-US8-3 disables Send and explains the 20–500 rule', () => {
  render(<EvidencePanel caseData={mkCase({ status: 'Under Review' })} media={[]} onChanged={onChanged} />);
  type('too short');
  expect(screen.getByTestId('evidence-send')).toBeDisabled();
  expect(screen.getByText('Message must be 20 to 500 characters.')).toBeInTheDocument();
  type('a'.repeat(501));
  expect(screen.getByTestId('evidence-send')).toBeDisabled();
});

it('T-US8-3 a second open request is not allowed', () => {
  render(<EvidencePanel caseData={mkCase({ status: 'Under Review', evidence_request_id: 'e1', evidence_request_status: 'open', evidence_request_message: MSG })} media={[]} onChanged={onChanged} />);
  expect(screen.getByText('A request is already open for this case.')).toBeInTheDocument();
  expect(screen.queryByTestId('evidence-send')).toBeNull();
});

it('T-US8-3 shows the limit message returned for a 4th request', async () => {
  requestEvidence.mockRejectedValue(new Error('This case has reached the limit of 3 evidence requests.'));
  render(<EvidencePanel caseData={mkCase({ status: 'Under Review' })} media={[]} onChanged={onChanged} />);
  type(MSG);
  fireEvent.click(screen.getByTestId('evidence-send'));
  expect(await screen.findByText('This case has reached the limit of 3 evidence requests.')).toBeInTheDocument();
});

it('only allows requests while the case is Under Review or Escalated', () => {
  render(<EvidencePanel caseData={mkCase({ status: 'Submitted' })} media={[]} onChanged={onChanged} />);
  expect(screen.getByText('Evidence can be requested once the case is Under Review.')).toBeInTheDocument();
  expect(screen.queryByTestId('evidence-send')).toBeNull();
});

it('T-US8-5 cancels an open request', async () => {
  render(<EvidencePanel caseData={mkCase({ status: 'Under Review', evidence_request_id: 'e1', evidence_request_status: 'open', evidence_request_message: MSG })} media={[]} onChanged={onChanged} />);
  fireEvent.click(screen.getByTestId('evidence-cancel'));
  await waitFor(() => expect(cancel).toHaveBeenCalledWith('e1'));
  expect(onChanged).toHaveBeenCalled();
});

it('T-US8-2 shows "Evidence received" with the reply note and new media, no commuter details', () => {
  render(<EvidencePanel
    caseData={mkCase({ status: 'Under Review', evidence_request_id: 'e1', evidence_request_status: 'answered', evidence_request_message: MSG, evidence_reply_note: 'Here is the plate.' })}
    media={[{ id: 'm9', kind: 'photo', url: 'https://signed.example/new.jpg', size_bytes: 5, duration_seconds: null, request_id: 'e1' }]}
    onChanged={onChanged} />);
  expect(screen.getByText('Evidence received')).toBeInTheDocument();
  expect(screen.getByText('Here is the plate.')).toBeInTheDocument();
  expect(screen.getByTestId('evidence-photo-0')).toHaveAttribute('src', 'https://signed.example/new.jpg');
  expect(screen.getAllByText('Anonymized Commuter').length).toBeGreaterThan(0);
});
