import { validateDecision, validateEvidenceMessage, REASON_ERROR } from '../../lib/rules/case';

it('requires 20+ characters of reasoning to resolve or dismiss', () => {
  expect(validateDecision('Resolved', 'Warning', 'too short')).toEqual({ reasoning: REASON_ERROR });
  expect(validateDecision('Dismissed', 'x', 'a'.repeat(19))).toEqual({ reasoning: REASON_ERROR });
  expect(validateDecision('Resolved', 'Warning', 'a'.repeat(20))).toEqual({});
});
it('requires a decision summary of 1–200 characters to resolve or dismiss', () => {
  expect(validateDecision('Resolved', '', 'a'.repeat(20)).summary).toBeTruthy();
  expect(validateDecision('Resolved', 'x'.repeat(201), 'a'.repeat(20)).summary).toBeTruthy();
});
it('needs nothing extra for Under Review', () => {
  expect(validateDecision('Under Review', '', '')).toEqual({});
});
it('evidence message must be 20–500 characters', () => {
  expect(validateEvidenceMessage('short')).toBeTruthy();
  expect(validateEvidenceMessage('a'.repeat(20))).toBeNull();
  expect(validateEvidenceMessage('a'.repeat(501))).toBeTruthy();
});
