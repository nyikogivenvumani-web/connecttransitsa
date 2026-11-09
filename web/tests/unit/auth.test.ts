/** T-A7-1 (API layer) and the route guard rules */
import { signInAdmin, homePathForRole, routeDecision } from '../../lib/api/auth';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { signInWithPassword: jest.fn(), signOut: jest.fn() }, from: jest.fn() },
}));
const s = supabase as unknown as { auth: Record<string, jest.Mock>; from: jest.Mock };
const roleIs = (role: string | null) =>
  s.from.mockReturnValue({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: role ? { role } : null, error: null }) }) }) });

beforeEach(() => jest.resetAllMocks());

it('returns the role for an admin', async () => {
  s.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u' } }, error: null });
  roleIs('transport_admin');
  expect(await signInAdmin('a@b.co', 'pw')).toEqual({ role: 'transport_admin' });
});

it('rejects a commuter and signs them out', async () => {
  s.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u' } }, error: null });
  roleIs('commuter');
  await expect(signInAdmin('a@b.co', 'pw')).rejects.toThrow('This account cannot use the web dashboard.');
  expect(s.auth.signOut).toHaveBeenCalled();
});

it('maps a failed sign-in to the wrong-password message', async () => {
  s.auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid login credentials' } });
  await expect(signInAdmin('a@b.co', 'x')).rejects.toThrow('Incorrect email or password.');
});

it('maps roles to home paths', () => {
  expect(homePathForRole('transport_admin')).toBe('/admin');
  expect(homePathForRole('saps')).toBe('/saps');
  expect(homePathForRole('system_admin')).toBe('/system');
});

describe('routeDecision (middleware guard)', () => {
  it('sends signed-out users to /login', () => expect(routeDecision('/admin', null)).toBe('/login'));
  it('lets a transport admin into /admin only', () => {
    expect(routeDecision('/admin/cases/1', 'transport_admin')).toBeNull();
    expect(routeDecision('/saps', 'transport_admin')).toBe('/admin');
    expect(routeDecision('/system', 'transport_admin')).toBe('/admin');
  });
  it('rejects commuters', () => expect(routeDecision('/admin', 'commuter')).toBe('/login'));
  it('leaves /login and public pages alone', () => {
    expect(routeDecision('/login', null)).toBeNull();
    expect(routeDecision('/sos/abc', null)).toBeNull();
  });
});
