/**
 * T-AUTH-1: Password complexity rule.
 * Requires:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 */
import { validatePassword } from '../../lib/rules/password';

describe('T-AUTH-1: validatePassword', () => {
  it('"Abcdefg1" passes', () => {
    expect(validatePassword('Abcdefg1')).toBe(true);
  });

  it('no uppercase fails', () => {
    expect(validatePassword('abcdefg1')).toBe(false);
  });

  it('no lowercase fails', () => {
    expect(validatePassword('ABCDEFG1')).toBe(false);
  });

  it('no digit fails', () => {
    expect(validatePassword('Abcdefgh')).toBe(false);
  });

  it('fewer than 8 characters fails', () => {
    expect(validatePassword('Abc1')).toBe(false);
  });
});
