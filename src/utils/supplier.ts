export function maskedApiKey(apiKey: string | null): string | null {
  if (!apiKey) return null;
  return apiKey.slice(0, 6) + '•'.repeat(18) + apiKey.slice(-4);
}
