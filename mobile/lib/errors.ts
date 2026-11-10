/**
 * One place that turns backend errors into the messages in PRD Section 10.
 * Raw codes and technical messages never reach the screen.
 */
export const GENERIC_ERROR = 'Something went wrong. Try again.';
export const AUTH_EXPIRED_MESSAGE = 'Please log in again.';

const BY_CODE: Record<string, string> = {
  rate_limit_reports: "You're sending reports too quickly. Try again later.",
  rate_limit_search: "You're searching too quickly. Try again later.",
  case_already_decided: 'This case has already been decided.',
  invalid_status_change: 'That status change is not allowed.',
  request_not_open: 'This request is no longer open.',
  request_already_open: 'This case already has an open request.',
  request_limit: 'This case has reached the limit of 3 requests.',
  request_case_status: 'Evidence can be requested once the case is Under Review.',
  invalid_sa_id: 'Enter a valid South African ID number.',
  under_age: 'You must be 16 or older to use this app.',
  name_required: 'Enter your full name.',
  media_too_large: 'File too large. Please choose a smaller file.',
  media_too_long: 'That recording is too long. Please choose a shorter one.',
  photo_has_duration: GENERIC_ERROR,
  invalid_media_path: GENERIC_ERROR,
  invalid_organization: GENERIC_ERROR,
  invalid_push_token: GENERIC_ERROR,
  not_oversight_report: GENERIC_ERROR,
  not_authorized: 'You do not have access to this.',
};

const text = (e: unknown): string =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : String((e as { message?: unknown } | null)?.message ?? '');

export function isNetworkError(e: unknown): boolean {
  return /network request failed|failed to fetch|networkerror|network connection|timeout|offline/i.test(text(e));
}

/** The login has expired or is missing. */
export function isAuthError(e: unknown): boolean {
  const status = (e as { status?: number } | null)?.status;
  return status === 401 || /jwt expired|invalid jwt|not authenticated|refresh token/i.test(text(e));
}

/** A sentence we wrote ourselves: starts with a capital, ends with . or ?, has spaces. */
const looksWrittenForPeople = (m: string) => /^[A-Z"'][^_]*\s[^_]*[.?]$/.test(m) && !/\b(violates|constraint|undefined|TypeError|policy)\b/.test(m);

export function friendlyMessage(e: unknown): string {
  const m = text(e);
  for (const [code, message] of Object.entries(BY_CODE)) if (m.includes(code)) return message;
  if (looksWrittenForPeople(m)) return m;
  return GENERIC_ERROR;
}
