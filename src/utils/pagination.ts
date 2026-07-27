export function paginationMeta(total: number, page: number, perPage: number) {
  const lastPage = Math.max(Math.ceil(total / perPage), 1);
  const currentPage = Math.min(Math.max(page, 1), lastPage);
  return {
    total,
    perPage,
    currentPage,
    lastPage,
    from: total === 0 ? 0 : (currentPage - 1) * perPage + 1,
    to: Math.min(currentPage * perPage, total),
    pages: Array.from({ length: lastPage }, (_, i) => i + 1),
  };
}

export function queryStringWithout(query: Record<string, unknown>, keys: string[] = []): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (keys.includes(k) || v === undefined || v === null || v === '') continue;
    params.set(k, String(v));
  }
  return params.toString();
}
