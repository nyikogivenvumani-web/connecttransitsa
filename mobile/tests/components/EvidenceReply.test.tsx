/** T-US8-1 (S4 side), T-US8-2 (commuter reply), T-US8-5 (cancelled request disappears) */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TrackScreen from '../../app/(tabs)/track';
import { EvidenceReply } from '../../components/EvidenceReply';
import * as casesApi from '../../lib/api/cases';
import * as evidenceApi from '../../lib/api/evidence';

jest.mock('../../lib/api/cases', () => ({
  ...jest.requireActual('../../lib/api/cases'),
  fetchAllMyCases: jest.fn(), fetchCaseByRef: jest.fn(), searchByPlate: jest.fn(),
}));
jest.mock('../../lib/api/evidence', () => ({ ...jest.requireActual('../../lib/api/evidence'), answerEvidenceRequest: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), useLocalSearchParams: () => ({}) }));
jest.mock('@react-native-community/netinfo', () => ({ addEventListener: jest.fn(() => jest.fn()) }));
jest.mock('../../components/MediaPicker', () => {
  const { TouchableOpacity, Text } = jest.requireActual('react-native');
  return {
    MediaPicker: ({ onAddPhoto, testID }: { onAddPhoto: (p: { uri: string; size: number }) => Promise<void>; testID?: string }) => (
      <TouchableOpacity testID={`${testID}-add-photo`} onPress={() => onAddPhoto({ uri: 'file:///p.jpg', size: 1000 })}><Text>add</Text></TouchableOpacity>
    ),
  };
});

const cases = casesApi as jest.Mocked<typeof casesApi>;
const answer = evidenceApi.answerEvidenceRequest as jest.Mock;
const base = {
  id: 'r1', case_ref: 'TC-2026-0001', status: 'Under Review', vehicle_plate: 'CA 1 GP', category: 'Overcharging', description: 'd',
  organization_name: 'DORLJOTA', unlisted_entity_name: null, incident_at: '2026-11-01T08:00:00Z', created_at: '2026-11-02T08:00:00Z',
  admin_decision: null, decision_reasoning: null,
  evidence_request_id: 'q1', evidence_request_status: 'open', evidence_request_message: 'Please send a clearer photo of the plate.', evidence_reply_note: null,
} as casesApi.CaseDetail;

beforeEach(() => { jest.clearAllMocks(); casesApi.__resetCaseCache(); answer.mockResolvedValue(undefined); });

it('T-US8-1 S4 tags a case with an open request and shows the admin message with a reply form', async () => {
  cases.fetchAllMyCases.mockResolvedValue([base]);
  cases.fetchCaseByRef.mockResolvedValue(base);
  const { findByTestId, getByTestId, findByText } = await render(<TrackScreen />);
  expect(await findByTestId('track-evidence-tag-TC-2026-0001')).toBeTruthy();
  await fireEvent.press(getByTestId('track-case-TC-2026-0001'));
  expect(await findByText('Please send a clearer photo of the plate.')).toBeTruthy();
  expect(getByTestId('evidence-reply-note')).toBeTruthy();
});

it('T-US8-5 a cancelled request shows no tag and no reply form', async () => {
  const cancelled = { ...base, evidence_request_status: 'cancelled' } as casesApi.CaseDetail;
  cases.fetchAllMyCases.mockResolvedValue([cancelled]);
  cases.fetchCaseByRef.mockResolvedValue(cancelled);
  const { findByTestId, queryByTestId, getByTestId } = await render(<TrackScreen />);
  await findByTestId('track-case-TC-2026-0001');
  expect(queryByTestId('track-evidence-tag-TC-2026-0001')).toBeNull();
  await fireEvent.press(getByTestId('track-case-TC-2026-0001'));
  await findByTestId('track-detail');
  expect(queryByTestId('evidence-reply-note')).toBeNull();
});

describe('EvidenceReply', () => {
  const props = { requestId: 'q1', reportId: 'r1', message: 'Please send a clearer photo of the plate.' };

  it('T-US8-2 sends the note and a photo, then reports done', async () => {
    const onDone = jest.fn();
    const { getByTestId } = await render(<EvidenceReply {...props} onDone={onDone} />);
    await fireEvent.changeText(getByTestId('evidence-reply-note'), 'Here is the plate.');
    await fireEvent.press(getByTestId('evidence-reply-media-add-photo'));
    await fireEvent.press(getByTestId('evidence-reply-submit'));
    await waitFor(() => expect(answer).toHaveBeenCalledWith(expect.objectContaining({
      requestId: 'q1', reportId: 'r1', note: 'Here is the plate.', photos: [{ uri: 'file:///p.jpg', size: 1000 }],
    })));
    expect(onDone).toHaveBeenCalled();
  });

  it('requires a note or at least one file', async () => {
    const { getByTestId } = await render(<EvidenceReply {...props} onDone={jest.fn()} />);
    await fireEvent.press(getByTestId('evidence-reply-submit'));
    expect(answer).not.toHaveBeenCalled();
  });

  it('limits the note to 500 characters', async () => {
    const { getByTestId } = await render(<EvidenceReply {...props} onDone={jest.fn()} />);
    expect(getByTestId('evidence-reply-note').props.maxLength).toBe(500);
  });

  it('shows the error from the server', async () => {
    answer.mockRejectedValue(new Error('This request is no longer open.'));
    const { getByTestId, findByText } = await render(<EvidenceReply {...props} onDone={jest.fn()} />);
    await fireEvent.changeText(getByTestId('evidence-reply-note'), 'note');
    await fireEvent.press(getByTestId('evidence-reply-submit'));
    expect(await findByText('This request is no longer open.')).toBeTruthy();
  });
});
