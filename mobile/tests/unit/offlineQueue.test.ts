import { retryPendingDrafts } from '../../lib/offlineQueue';
import * as drafts from '../../lib/db/drafts';
import * as api from '../../lib/api/reports';

jest.mock('../../lib/db/drafts');
jest.mock('../../lib/api/reports');

const d = (id: string) => ({ id } as any);

beforeEach(() => jest.resetAllMocks());

it('sends drafts oldest first and deletes each after success', async () => {
  (drafts.listDrafts as jest.Mock).mockResolvedValue([d('a'), d('b')]);
  (api.submitDraft as jest.Mock).mockResolvedValue({ case_ref: 'TC-2026-0001' });
  expect(await retryPendingDrafts()).toBe(2);
  expect(drafts.deleteDraft).toHaveBeenNthCalledWith(1, 'a');
  expect(drafts.deleteDraft).toHaveBeenNthCalledWith(2, 'b');
});

it('keeps a draft and stops when sending fails', async () => {
  (drafts.listDrafts as jest.Mock).mockResolvedValue([d('a'), d('b')]);
  (api.submitDraft as jest.Mock).mockRejectedValue(new Error('network'));
  expect(await retryPendingDrafts()).toBe(0);
  expect(drafts.deleteDraft).not.toHaveBeenCalled();
  expect(api.submitDraft).toHaveBeenCalledTimes(1);
});
