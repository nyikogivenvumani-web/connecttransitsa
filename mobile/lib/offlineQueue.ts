/**
 * lib/offlineQueue.ts
 * T-EDGE-1: on reconnect, send drafts saved while offline (oldest first).
 * A draft is removed only after the server accepted the report.
 */
import { listDrafts, deleteDraft } from './db/drafts';
import { submitDraft } from './api/reports';

/** Returns the number of drafts successfully sent. */
export async function retryPendingDrafts(): Promise<number> {
  const drafts = await listDrafts();
  let sent = 0;
  for (const d of drafts) {
    try {
      await submitDraft(d);
      await deleteDraft(d.id);
      sent++;
    } catch {
      // Keep the draft; stop on first failure (likely still offline).
      break;
    }
  }
  return sent;
}
