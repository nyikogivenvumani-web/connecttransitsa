/**
 * Core of sos-start (OP12). Inserts the SOS event for the signed-in caller and returns the share token.
 * dispatch_ms = time the phone measured from the third tap until it sent the request + time spent in this function.
 * (Network travel time is not included; T-NFR-11 measures that by hand.) Repeating the same id returns the same event.
 */
export interface SosStartInput {
  id?: string;
  lat?: number | null;
  lng?: number | null;
  used_cached_location?: boolean;
  client_elapsed_ms?: number;
}

export interface SosStartDeps {
  userId(): Promise<string | null>;
  insert(row: Record<string, unknown>): Promise<{ id: string; share_token: string }>;
  findExisting?(id: string, userId: string): Promise<{ id: string; share_token: string } | null>;
  now(): number;
}

type Result = { status: number; body: { id?: string; share_token?: string; error?: string } };
const validCoord = (v: unknown, max: number) => v === null || v === undefined || (typeof v === 'number' && Math.abs(v) <= max);

export async function startSosEvent(input: SosStartInput, d: SosStartDeps): Promise<Result> {
  const began = d.now();
  const user = await d.userId();
  if (!user) return { status: 401, body: { error: 'Unauthorized' } };
  if (!input.id || typeof input.id !== 'string' || !validCoord(input.lat, 90) || !validCoord(input.lng, 180)) {
    return { status: 400, body: { error: 'invalid_input' } };
  }

  const clientMs = Math.max(0, Math.round(Number(input.client_elapsed_ms) || 0));
  const row = {
    id: input.id,
    user_id: user,
    last_lat: input.lat ?? null,
    last_lng: input.lng ?? null,
    last_recorded_at: input.lat != null ? new Date(began).toISOString() : null,
    used_cached_location: !!input.used_cached_location,
    dispatch_ms: clientMs + (d.now() - began),
  };
  try {
    const r = await d.insert(row);
    return { status: 200, body: { id: r.id, share_token: r.share_token } };
  } catch (e) {
    if ((e as { code?: string }).code === '23505' && d.findExisting) {
      const existing = await d.findExisting(input.id, user);
      if (existing) return { status: 200, body: { id: existing.id, share_token: existing.share_token } };
    }
    return { status: 500, body: { error: 'Something went wrong. Try again.' } };
  }
}
