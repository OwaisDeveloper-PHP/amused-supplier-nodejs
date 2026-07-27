export function renderTemplate(value: string, data: Record<string, string | number | null | undefined>): string {
  let result = value;
  for (const [key, replacement] of Object.entries(data)) {
    result = result.split(`{{${key}}}`).join(String(replacement ?? ''));
  }
  return result;
}

export function availablePlaceholders(): Record<string, string> {
  return {
    first_name: 'Seller first name',
    last_name: 'Seller last name',
    reference: 'Submission reference (e.g. SWU-0007)',
    brand: 'Item brand',
    category: 'Item category',
    model: 'Item model',
    minimum_price: 'Minimum price accepted',
    city: 'Seller city',
  };
}
