/**
 * T-AUTH-3: 30-day session expiry rule.
 * A session older than 30 days must be signed out; a newer one is kept.
 */
import { isSessionExpired } from '../../lib/rules/session';

describe('T-AUTH-3: session expiry', () => {
  it('session created 29 days ago is not expired', () => {
    const twentyNineDaysAgo = Math.floor(Date.now() / 1000) - 29 * 24 * 60 * 60;
    expect(isSessionExpired(twentyNineDaysAgo)).toBe(false);
  });

  it('session created 31 days ago is expired', () => {
    const thirtyOneDaysAgo = Math.floor(Date.now() / 1000) - 31 * 24 * 60 * 60;
    expect(isSessionExpired(thirtyOneDaysAgo)).toBe(true);
  });
});
