/** SEC20: dispatch-* functions accept only calls that carry the webhook secret (constant-time compare). */
export function isAuthorizedWebhook(header: string | null | undefined, secret: string | undefined): boolean {
  if (!secret || !header || header.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= header.charCodeAt(i) ^ secret.charCodeAt(i);
  return diff === 0;
}
