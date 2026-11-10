import { submitReport } from '../../lib/api/reports';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn(), storage: { from: jest.fn() } } }));

const base = { id: 'r1', organizationId: 'o', vehiclePlate: 'CA 1', category: 'Overcharging', description: 'x', incidentAt: 'now' };
const upload = jest.fn();
const mediaInsert = jest.fn();
let reportResult: any;

beforeEach(() => {
  jest.resetAllMocks();
  (globalThis as any).fetch = jest.fn().mockResolvedValue({ blob: () => Promise.resolve('blob') });
  upload.mockResolvedValue({ error: null });
  mediaInsert.mockResolvedValue({ error: null });
  reportResult = { data: { case_ref: 'TC-2026-0001' }, error: null };
  (supabase.storage.from as jest.Mock).mockReturnValue({ upload });
  (supabase.from as jest.Mock).mockImplementation((t: string) =>
    t === 'reports'
      ? { insert: () => ({ select: () => ({ single: () => Promise.resolve(reportResult) }) }) }
      : { insert: mediaInsert });
});

it('inserts the report before uploading and uses {report_id}/ paths', async () => {
  const r = await submitReport({ ...base, photos: [{ uri: 'a.jpg', size: 10 }], audio: { uri: 'a.m4a', size: 5, durationSeconds: 12 } });
  expect(r).toEqual({ case_ref: 'TC-2026-0001' });
  expect(upload.mock.calls[0][0]).toMatch(/^r1\/photo-/);
  expect(upload.mock.calls[1][0]).toMatch(/^r1\/audio-/);
  expect(mediaInsert).toHaveBeenCalledWith(expect.objectContaining({ kind: 'audio', duration_seconds: 12 }));
  // The database rejects a duration on photos (photo_has_duration).
  expect(mediaInsert).toHaveBeenCalledWith(expect.objectContaining({ kind: 'photo', duration_seconds: null }));
});

it('uploads nothing when the report insert fails', async () => {
  reportResult = { data: null, error: { message: 'rate_limit_reports' } };
  await expect(submitReport({ ...base, photos: [{ uri: 'a.jpg', size: 10 }] }))
    .rejects.toThrow("You're sending reports too quickly. Try again later.");
  expect(upload).not.toHaveBeenCalled();
});

it('keeps the report and flags mediaFailed when an upload fails', async () => {
  upload.mockResolvedValue({ error: { message: 'boom' } });
  const r = await submitReport({ ...base, photos: [{ uri: 'a.jpg', size: 10 }] });
  expect(r).toEqual({ case_ref: 'TC-2026-0001', mediaFailed: true });
});

it('T-EDGE-5 turns an expired login into "Please log in again."', async () => {
  reportResult = { data: null, error: { status: 401, message: 'JWT expired' } };
  await expect(submitReport(base)).rejects.toThrow('Please log in again.');
});
