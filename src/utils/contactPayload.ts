/**
 * The public "Sell With Us" storefront form submits fields using bracket
 * notation (e.g. "contact[First_Name]"), mirroring Shopify's native contact
 * form. Depending on how the client sends the request, Express may have
 * already nested these under `body.contact` (x-www-form-urlencoded, via the
 * `qs` parser) or left them as flat "contact[...]" keys (raw JSON body).
 * This normalizes both shapes into a single flat object.
 */
export function extractContactPayload(body: Record<string, unknown>): Record<string, string> {
  if (body && typeof body.contact === 'object' && body.contact !== null && !Array.isArray(body.contact)) {
    const nested: Record<string, string> = {};
    for (const [key, value] of Object.entries(body.contact as Record<string, unknown>)) {
      nested[key] = typeof value === 'string' ? value : String(value ?? '');
    }
    return nested;
  }

  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(body ?? {})) {
    const match = key.match(/^contact\[(.+)\]$/);
    if (match) {
      flat[match[1]] = typeof value === 'string' ? value : String(value ?? '');
    }
  }
  return flat;
}
