/** Admin-side rules mirrored from the database constraints (BR5, BR10, evidence request length). */
export const REASON_MIN = 20;
export const DECISION_MAX = 200;
export const EVIDENCE_MIN = 20;
export const EVIDENCE_MAX = 500;
export const REASON_ERROR = 'A written reason of at least 20 characters is required.';
export const EVIDENCE_ERROR = 'Message must be 20 to 500 characters.';

export type DecisionErrors = { summary?: string; reasoning?: string };

export function validateDecision(status: string, summary: string, reasoning: string): DecisionErrors {
  const errors: DecisionErrors = {};
  if (status !== 'Resolved' && status !== 'Dismissed') return errors;
  if (reasoning.trim().length < REASON_MIN) errors.reasoning = REASON_ERROR;
  if (summary.trim().length === 0) errors.summary = 'A decision summary is required.';
  else if (summary.length > DECISION_MAX) errors.summary = 'Decision summary must be 200 characters or fewer.';
  return errors;
}

export function validateEvidenceMessage(message: string): string | null {
  const n = message.trim().length;
  return n >= EVIDENCE_MIN && message.length <= EVIDENCE_MAX ? null : EVIDENCE_ERROR;
}
