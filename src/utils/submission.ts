type Photo = { url: string; name?: string; type?: string };

export function fullName(s: { firstName: string | null; lastName: string | null }): string {
  const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();
  return name || 'Unknown seller';
}

export function fullPhone(s: { countryCode: string | null; phone: string | null }): string {
  return `${s.countryCode ?? ''} ${s.phone ?? ''}`.trim();
}

/** Digits-only phone number (E.164-ish, no "+" or spaces) suitable for a wa.me WhatsApp link, or null if no phone is on file. */
export function whatsappNumber(s: { countryCode: string | null; phone: string | null }): string | null {
  const digits = fullPhone(s).replace(/[^0-9]/g, '');
  return digits || null;
}

export function allPhotos(s: { photos: unknown; extraPhotos: unknown }): Photo[] {
  const photos = Array.isArray(s.photos) ? (s.photos as Photo[]) : [];
  const extra = Array.isArray(s.extraPhotos) ? (s.extraPhotos as Photo[]) : [];
  return [...photos, ...extra];
}

export function visibleWearList(s: { visibleWear: unknown }): string[] {
  return Array.isArray(s.visibleWear) ? (s.visibleWear as string[]) : [];
}

export function isApproved(s: { status: string }): boolean {
  return s.status === 'approved';
}

export function statusColor(status: string): string {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  return 'warning';
}
