/**
 * 30-day session expiry rule (PRD Section 5, IMPLEMENTATION_PLAN T-AUTH-3).
 * Any saved session created or last signed in over 30 days ago is expired.
 */
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

export function isSessionExpired(sessionCreatedAtTimestampSeconds: number): boolean {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return nowSeconds - sessionCreatedAtTimestampSeconds > THIRTY_DAYS_SECONDS;
}
