/** Core of create-admin-user (OP24, SEC19). Only a System Admin may call it. */
export interface CreateAdminInput {
  email: string;
  full_name: string;
  role: string;
  organization_id?: string;
}

export interface CreateAdminDeps {
  callerRole(): Promise<string | null>;
  createUser(i: { email: string; full_name: string; role: 'transport_admin' | 'saps' }): Promise<{ id: string }>;
  addOrgAdmin(userId: string, organizationId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  sendInvite(email: string): Promise<void>;
}

type Result = { status: number; body: { id?: string; error?: string } };
const GENERIC = 'Something went wrong. Try again.';

export async function createAdminUser(input: CreateAdminInput, d: CreateAdminDeps): Promise<Result> {
  if ((await d.callerRole()) !== 'system_admin') return { status: 403, body: { error: 'not_authorized' } };

  const email = (input.email ?? '').trim().toLowerCase();
  const name = (input.full_name ?? '').trim();
  const role = input.role;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name || (role !== 'transport_admin' && role !== 'saps')
    || (role === 'transport_admin' && !input.organization_id)) {
    return { status: 400, body: { error: 'invalid_input' } };
  }

  let id: string;
  try {
    ({ id } = await d.createUser({ email, full_name: name, role }));
  } catch (e) {
    const already = /already|registered|exists/i.test(e instanceof Error ? e.message : '');
    return already ? { status: 409, body: { error: 'That email address already has an account.' } } : { status: 500, body: { error: GENERIC } };
  }

  try {
    if (role === 'transport_admin') await d.addOrgAdmin(id, input.organization_id!);
    await d.sendInvite(email);
  } catch {
    await d.deleteUser(id).catch(() => undefined);
    return { status: 500, body: { error: GENERIC } };
  }
  return { status: 200, body: { id } };
}
