type Photo = { url: string; name?: string; type?: string };

export function fullName(s: { firstName: string | null; lastName: string | null }): string {
  const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();
  return name || 'Unknown seller';
}

export function fullPhone(s: { countryCode: string | null; phone: string | null }): string {
  return `${s.countryCode ?? ''} ${s.phone ?? ''}`.trim();
}

export function allPhotos(s: { photos: unknown; extraPhotos: unknown }): Photo[] {
  const photos = Array.isArray(s.photos) ? (s.photos as Photo[]) : [];
  const extra = Array.isArray(s.extraPhotos) ? (s.extraPhotos as Photo[]) : [];
  return [...photos, ...extra];
}

export function isApproved(s: { status: string }): boolean {
  return s.status === 'approved';
}

export function statusColor(status: string): string {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  return 'warning';
}
