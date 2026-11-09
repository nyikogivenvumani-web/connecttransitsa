/** T-US7-2 server side, SEC19 */
import { createAdminUser, CreateAdminDeps } from '../../../supabase/functions/_shared/createAdmin';

function deps(over: Partial<CreateAdminDeps> = {}) {
  return {
    callerRole: jest.fn().mockResolvedValue('system_admin'),
    createUser: jest.fn().mockResolvedValue({ id: 'u1' }),
    addOrgAdmin: jest.fn().mockResolvedValue(undefined),
    deleteUser: jest.fn().mockResolvedValue(undefined),
    sendInvite: jest.fn().mockResolvedValue(undefined),
    ...over,
  } as CreateAdminDeps & Record<string, jest.Mock>;
}
const input = { email: 'Ayanda@Example.co.za', full_name: 'Ayanda Zulu', role: 'transport_admin', organization_id: 'o1' };

it('SEC19 rejects every caller that is not a System Admin', async () => {
  for (const role of ['commuter', 'transport_admin', 'saps', null]) {
    const d = deps({ callerRole: jest.fn().mockResolvedValue(role) });
    expect(await createAdminUser(input, d)).toMatchObject({ status: 403 });
    expect(d.createUser).not.toHaveBeenCalled();
  }
});

it('creates a Transport Admin linked to the organization and sends the invite', async () => {
  const d = deps();
  expect(await createAdminUser(input, d)).toEqual({ status: 200, body: { id: 'u1' } });
  expect(d.createUser).toHaveBeenCalledWith({ email: 'ayanda@example.co.za', full_name: 'Ayanda Zulu', role: 'transport_admin' });
  expect(d.addOrgAdmin).toHaveBeenCalledWith('u1', 'o1');
  expect(d.sendInvite).toHaveBeenCalledWith('ayanda@example.co.za');
});

it('creates a SAPS user without an organization', async () => {
  const d = deps();
  expect(await createAdminUser({ ...input, role: 'saps', organization_id: undefined }, d)).toMatchObject({ status: 200 });
  expect(d.addOrgAdmin).not.toHaveBeenCalled();
});

it('validates the input', async () => {
  for (const bad of [
    { ...input, email: 'nope' }, { ...input, full_name: ' ' }, { ...input, role: 'system_admin' },
    { ...input, role: 'commuter' }, { ...input, organization_id: undefined },
  ]) {
    const d = deps();
    expect(await createAdminUser(bad, d)).toMatchObject({ status: 400 });
    expect(d.createUser).not.toHaveBeenCalled();
  }
});

it('removes the new user when linking the organization fails', async () => {
  const d = deps({ addOrgAdmin: jest.fn().mockRejectedValue(new Error('fk')) });
  expect(await createAdminUser(input, d)).toMatchObject({ status: 500, body: { error: 'Something went wrong. Try again.' } });
  expect(d.deleteUser).toHaveBeenCalledWith('u1');
});

it('reports a duplicate email', async () => {
  const d = deps({ createUser: jest.fn().mockRejectedValue(new Error('User already registered')) });
  expect(await createAdminUser(input, d)).toMatchObject({ status: 409 });
});
