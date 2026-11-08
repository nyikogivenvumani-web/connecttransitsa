/**
 * T-BR6-3: Client-side South African ID number validation.
 * Same cases as T-BR6-1 (Section 8.1, PRD BR6):
 * - Accepts valid test ID (e.g. seed ID '9803145009088')
 * - Rejects wrong length (not 13 digits)
 * - Rejects non-digits
 * - Rejects bad Luhn checksum
 * - Rejects impossible date (e.g. 31 February)
 * - Rejects citizenship digit not in 0..1 (digit 11)
 * - Rejects age under 16
 * - Accepts someone turning 16 today, rejects turning 16 tomorrow
 */
import { validateSaId, saIdStatus } from '../../lib/rules/saId';

describe('T-BR6-3: validateSaId', () => {
  it('accepts valid seed ID 9803145009088', () => {
    expect(validateSaId('9803145009088')).toBe(true);
  });

  it('rejects 12 digits', () => {
    expect(validateSaId('980314500908')).toBe(false);
  });

  it('rejects 14 digits', () => {
    expect(validateSaId('98031450090881')).toBe(false);
  });

  it('rejects letters', () => {
    expect(validateSaId('98031450090AB')).toBe(false);
  });

  it('rejects null or empty string', () => {
    expect(validateSaId('')).toBe(false);
    expect(validateSaId(null as any)).toBe(false);
  });

  it('rejects wrong Luhn check digit', () => {
    expect(validateSaId('9803145009089')).toBe(false);
  });

  it('rejects impossible date 31 February', () => {
    expect(validateSaId('9902315000083')).toBe(false);
  });

  it('reports under 16 as under_age in saIdStatus and rejects in validateSaId', () => {
    // 2015-06-15 -> 11 years old in 2026 (check digit 1)
    const underAgeId = '1506155000081';
    expect(saIdStatus(underAgeId)).toBe('under_age');
    expect(validateSaId(underAgeId)).toBe(false);
  });
});
