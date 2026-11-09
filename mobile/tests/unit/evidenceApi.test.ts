/** OP27–OP29 client side: answer an evidence request */
import { answerEvidenceRequest } from '../../lib/api/evidence';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({ supabase: { rpc: jest.fn(), storage: { from: jest.fn() } } }));
const upload = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn().mockResolvedValue({ blob: () => Promise.resolve('blob') });
  upload.mockResolvedValue({ error: null });
  (supabase.storage.from as jest.Mock).mockReturnValue({ upload });
  (supabase.rpc as jest.Mock).mockResolvedValue({ error: null });
});

it('uploads under {report_id}/ then calls answer_evidence_request with the media list', async () => {
  await answerEvidenceRequest({ requestId: 'q1', reportId: 'r1', note: 'Here you go', photos: [{ uri: 'a.jpg', size: 9 }], videos: [], audio: null });
  expect(upload.mock.calls[0][0]).toMatch(/^r1\//);
  const [fn, args] = (supabase.rpc as jest.Mock).mock.calls[0];
  expect(fn).toBe('answer_evidence_request');
  expect(args.p_request_id).toBe('q1');
  expect(args.p_note).toBe('Here you go');
  expect(args.p_media).toEqual([expect.objectContaining({ kind: 'photo', size_bytes: 9, duration_seconds: null, storage_path: expect.stringMatching(/^r1\//) })]);
});

it('sends no media when none is attached', async () => {
  await answerEvidenceRequest({ requestId: 'q1', reportId: 'r1', note: 'Note only' });
  expect(upload).not.toHaveBeenCalled();
  expect((supabase.rpc as jest.Mock).mock.calls[0][1].p_media).toEqual([]);
});

it('does not call the function when an upload fails', async () => {
  upload.mockResolvedValue({ error: { message: 'boom' } });
  await expect(answerEvidenceRequest({ requestId: 'q1', reportId: 'r1', note: 'x', photos: [{ uri: 'a.jpg', size: 9 }] })).rejects.toThrow('Something went wrong. Try again.');
  expect(supabase.rpc).not.toHaveBeenCalled();
});

it('maps a closed request to a friendly message', async () => {
  (supabase.rpc as jest.Mock).mockResolvedValue({ error: { message: 'request_not_open' } });
  await expect(answerEvidenceRequest({ requestId: 'q1', reportId: 'r1', note: 'x' })).rejects.toThrow('This request is no longer open.');
});
