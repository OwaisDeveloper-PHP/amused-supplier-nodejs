import crypto from 'crypto';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db';
import { extractContactPayload } from '../../utils/contactPayload';

const REQUIRED_FIELDS = ['First_Name', 'Last_Name', 'Selected_Category', 'Selected_Brand'];

const PHOTO_FIELDS: { key: string; label: string }[] = [
  { key: 'Photo_Front_URL', label: 'Front' },
  { key: 'Photo_Back_URL', label: 'Back' },
  { key: 'Photo_Sides_URL', label: 'Sides' },
  { key: 'Photo_Hardware_URL', label: 'Hardware' },
  { key: 'Photo_Interior_URL', label: 'Interior' },
  { key: 'Photo_Serial_Code_URL', label: 'Serial Code' },
  { key: 'Photo_Inclusions_URL', label: 'Inclusions' },
  { key: 'Photo_Wear_Marks_URL', label: 'Wear Marks' },
  { key: 'Photo_Strap_URL', label: 'Strap' },
];

const EXTRA_PHOTO_FIELDS: { key: string; label: string }[] = [{ key: 'Photo_Extra_URL', label: 'Extra' }];

function buildPhotos(contact: Record<string, string>, fields: { key: string; label: string }[]) {
  return fields
    .filter((field) => contact[field.key]?.trim())
    .map((field) => ({ url: contact[field.key].trim(), name: field.label }));
}

/** Splits a comma-separated multi-select field (e.g. "Scratches, Stains, Odour") into a clean string array. */
function splitMultiValue(raw: string | undefined): string[] | typeof Prisma.JsonNull {
  if (!raw?.trim()) return Prisma.JsonNull;
  const values = raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  return values.length > 0 ? values : Prisma.JsonNull;
}

function generateReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SWU-${stamp}${rand}`;
}

/** Verifies the hCaptcha token when HCAPTCHA_SECRET is configured; skipped otherwise (e.g. local/testing). */
async function verifyHCaptcha(token: string | undefined): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET;
  if (!secret) return true;
  if (!token) return false;

  try {
    const params = new URLSearchParams({ secret, response: token });
    const response = await fetch('https://hcaptcha.com/siteverify', { method: 'POST', body: params });
    const data = (await response.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function submit(req: Request, res: Response) {
  const body = (req.body ?? {}) as Record<string, unknown>;

  if (typeof body.form_type === 'string' && body.form_type !== 'contact') {
    return res.status(400).json({ success: false, message: `Unsupported form_type "${body.form_type}".` });
  }

  const contact = extractContactPayload(body);

  const missing = REQUIRED_FIELDS.filter((field) => !contact[field]?.trim());
  if (!contact.email?.trim() && !contact.Phone_Number?.trim()) {
    missing.push('email or Phone_Number');
  }
  if (missing.length > 0) {
    return res.status(422).json({ success: false, message: 'Missing required fields.', fields: missing });
  }

  const captchaToken = (body['h-captcha-response'] as string | undefined) ?? contact['h-captcha-response'];
  if (!(await verifyHCaptcha(captchaToken))) {
    return res.status(422).json({ success: false, message: 'hCaptcha verification failed.' });
  }

  const minimumPriceRaw = contact.Minimum_Price_Accepted?.trim();
  const minimumPrice =
    minimumPriceRaw && !Number.isNaN(Number(minimumPriceRaw)) ? Number(minimumPriceRaw) : null;

  const data = {
    category: contact.Selected_Category || null,
    brand: contact.Selected_Brand || null,
    condition: contact.Item_Condition || null,
    inclusions: contact.Item_Inclusions || null,
    model: contact.Item_Model || null,
    colour: contact.Item_Colour || null,
    size: contact.Item_Size || null,
    material: contact.Item_Material || null,
    yearPurchased: contact.Year_Purchased || null,
    wherePurchased: contact.Where_Purchased || null,
    notes: contact.Item_Notes || null,
    minimumPrice,
    photos: buildPhotos(contact, PHOTO_FIELDS),
    extraPhotos: buildPhotos(contact, EXTRA_PHOTO_FIELDS),
    walkthroughVideo: contact.Walkthrough_Video_URL || null,
    visibleWear: splitMultiValue(contact.Visible_Wear),
    repairs: contact.Repairs || null,
    preference: contact.Preference || null,
    additionalInfo: contact.Additional || null,
    firstName: contact.First_Name || null,
    lastName: contact.Last_Name || null,
    countryCode: contact.Country_Code || null,
    phone: contact.Phone_Number || null,
    email: contact.email || null,
    city: contact.City || null,
    iban: contact.IBAN || null,
    referralSource: contact.Referral_Source || null,
    status: 'pending',
  };

  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = generateReference();
    try {
      const submission = await prisma.sellWithUsSubmission.create({ data: { ...data, reference } });
      return res.status(201).json({
        success: true,
        message: 'Submission received.',
        reference: submission.reference,
        id: submission.id,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') continue; // reference collision, retry with a new one
      // eslint-disable-next-line no-console
      console.error('Failed to create sell-with-us submission', error);
      return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
  }

  return res.status(500).json({ success: false, message: 'Could not generate a unique reference. Please try again.' });
}
