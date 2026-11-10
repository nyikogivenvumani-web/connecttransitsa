/** T-NFR-2 – every backend error code maps to a plain message; raw codes never show */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { friendlyMessage, isAuthError, isNetworkError, GENERIC_ERROR } from '../../lib/errors';

const migrations = path.resolve(__dirname, '../../../supabase/migrations');
const codes = [...new Set(fs.readdirSync(migrations).flatMap((f) =>
  [...fs.readFileSync(path.join(migrations, f), 'utf8').matchAll(/raise exception '([a-z_]+)'/g)].map((m) => m[1])))];

describe('T-NFR-2 error mapping', () => {
  it('finds the database error codes', () => expect(codes.length).toBeGreaterThan(15));

  it.each(codes)('code %s becomes a plain sentence', (code) => {
    const msg = friendlyMessage(new Error(code));
    expect(msg).not.toContain(code);
    expect(msg).not.toMatch(/^[a-z_]+$/);
    expect(msg).toMatch(/[.?]$/);
  });

  it('maps the PRD messages for the main situations', () => {
    expect(friendlyMessage({ message: 'rate_limit_reports' })).toBe("You're sending reports too quickly. Try again later.");
    expect(friendlyMessage({ message: 'rate_limit_search' })).toBe("You're searching too quickly. Try again later.");
    expect(friendlyMessage({ message: 'request_not_open' })).toBe('This request is no longer open.');
    expect(friendlyMessage({ message: 'case_already_decided' })).toBe('This case has already been decided.');
    expect(friendlyMessage({ message: 'under_age' })).toBe('You must be 16 or older to use this app.');
    expect(friendlyMessage({ message: 'invalid_sa_id' })).toBe('Enter a valid South African ID number.');
  });

  it('hides raw technical errors behind the generic message', () => {
    for (const raw of ['duplicate key value violates unique constraint "x"', 'PGRST116', 'TypeError: undefined is not a function', 'new row violates row-level security policy']) {
      expect(friendlyMessage(new Error(raw))).toBe(GENERIC_ERROR);
    }
  });

  it('keeps messages our own code already wrote for the person', () => {
    expect(friendlyMessage(new Error('That code is incorrect or has expired.'))).toBe('That code is incorrect or has expired.');
  });

  it('tells network and expired-login errors apart', () => {
    expect(isNetworkError(new Error('Network request failed'))).toBe(true);
    expect(isAuthError({ message: 'JWT expired' })).toBe(true);
    expect(isAuthError({ status: 401, message: 'x' })).toBe(true);
    expect(isAuthError(new Error('boom'))).toBe(false);
  });
});
