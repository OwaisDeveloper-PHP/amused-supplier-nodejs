import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function apiKey() {
  return 'sk_live_' + crypto.randomBytes(16).toString('hex');
}

function iban() {
  return 'SA' + (10 + Math.floor(Math.random() * 89)) + '0'.repeat(18);
}

async function seedAdmin() {
  const password = await bcrypt.hash('password', 12);
  await prisma.user.upsert({
    where: { email: 'admin@amusedco.com' },
    update: { name: 'Amused Admin', password },
    create: { name: 'Amused Admin', email: 'admin@amusedco.com', password },
  });
}

async function seedSuppliers() {
  const suppliers = [
    {
      name: 'Maison Dior — Consignment Partner',
      contactName: 'Amélie Laurent',
      email: 'partners@dior-consign.example',
      countryCode: '+33',
      phone: '1 40 73 73 73',
      country: 'France',
      city: 'Paris',
      platform: 'graphql',
      apiBaseUrl: 'https://api.amusedco.com',
      apiEndpoint: '/v1/suppliers/dior/products.sync',
      status: 'active',
      productsSynced: 128,
      lastSyncedAt: new Date(Date.now() - 6 * 3600 * 1000),
      notes: 'Bags & small leather goods. Nightly catalogue sync at 02:00 GST.',
    },
    {
      name: 'Rolex Certified Pre-Owned',
      contactName: 'Daniel Meyer',
      email: 'cpo@rolex-supply.example',
      countryCode: '+41',
      phone: '22 302 22 00',
      country: 'Switzerland',
      city: 'Geneva',
      platform: 'rest',
      apiBaseUrl: 'https://api.amusedco.com',
      apiEndpoint: '/v1/suppliers/rolex/products.sync',
      status: 'active',
      productsSynced: 47,
      lastSyncedAt: new Date(Date.now() - 24 * 3600 * 1000),
      notes: 'Watches only. Each item requires serial verification before publish.',
    },
    {
      name: 'Chanel Resale Atelier',
      contactName: 'Sofia Haddad',
      email: 'atelier@chanel-resale.example',
      countryCode: '+966',
      phone: '11 200 4000',
      country: 'Saudi Arabia',
      city: 'Riyadh',
      platform: 'shopify',
      apiBaseUrl: 'https://api.amusedco.com',
      apiEndpoint: '/v1/suppliers/chanel/products.sync',
      status: 'active',
      productsSynced: 92,
      lastSyncedAt: new Date(Date.now() - 30 * 3600 * 1000),
      notes: 'Regional partner. Handles authentication & drop-off in KSA.',
    },
    {
      name: 'Gucci House Supply',
      contactName: 'Marco Bianchi',
      email: 'supply@gucci-house.example',
      countryCode: '+39',
      phone: '055 75921',
      country: 'Italy',
      city: 'Florence',
      platform: 'rest',
      apiBaseUrl: 'https://api.amusedco.com',
      apiEndpoint: '/v1/suppliers/gucci/products.sync',
      status: 'inactive',
      productsSynced: 0,
      lastSyncedAt: null,
      notes: 'Onboarding in progress — API credentials pending.',
    },
  ];

  for (const s of suppliers) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    if (existing) {
      await prisma.supplier.update({ where: { id: existing.id }, data: s });
    } else {
      await prisma.supplier.create({ data: { ...s, iban: iban(), apiKey: apiKey() } });
    }
  }
}

async function seedEmailTemplate() {
  const body = `<p>Dear {{first_name}},</p>

<p>Wonderful news — after review by our authentication team, your item has been
<strong>approved</strong> to be listed with <strong>Amused</strong>.</p>

<table style="width:100%;border-collapse:collapse;margin:20px 0;">
  <tr><td style="padding:6px 0;color:#6b7280;">Reference</td><td style="padding:6px 0;font-weight:600;">{{reference}}</td></tr>
  <tr><td style="padding:6px 0;color:#6b7280;">Item</td><td style="padding:6px 0;font-weight:600;">{{brand}} — {{category}}</td></tr>
  <tr><td style="padding:6px 0;color:#6b7280;">Minimum price accepted</td><td style="padding:6px 0;font-weight:600;">SAR {{minimum_price}}</td></tr>
</table>

<p>Our concierge team in {{city}} will be in touch shortly to arrange collection and
authentication of your piece. Once verified, it will be published to our marketplace.</p>

<p>Thank you for choosing Amused.</p>

<p style="margin-top:28px;">With appreciation,<br><strong>The Amused Team</strong></p>`;

  await prisma.emailTemplate.upsert({
    where: { key: 'submission_approved' },
    update: {},
    create: {
      key: 'submission_approved',
      name: 'Submission Approved',
      subject: 'Your {{brand}} item has been approved — {{reference}}',
      body,
      fromName: 'Amused',
      fromEmail: 'concierge@amusedco.com',
      isActive: true,
    },
  });
}

const sampleImages: Record<string, { url: string; name: string }[]> = {
  Dior: [
    { url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800', name: 'dior_front.jpg' },
    { url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=800', name: 'dior_back.jpg' },
    { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800', name: 'dior_side.jpg' },
    { url: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&q=80&w=800', name: 'dior_detail.jpg' },
  ],
  Rolex: [
    { url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800', name: 'rolex_front.jpg' },
    { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800', name: 'rolex_back.jpg' },
    { url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800', name: 'rolex_side.jpg' },
  ],
  Chanel: [
    { url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800', name: 'chanel_front.jpg' },
    { url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=800', name: 'chanel_back.jpg' },
    { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800', name: 'chanel_side.jpg' },
  ],
  Gucci: [
    { url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=800', name: 'gucci_front.jpg' },
    { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800', name: 'gucci_back.jpg' },
  ],
};

const sellers = [
  { firstName: 'Sarah', lastName: 'Al-Otaibi', city: 'Riyadh', countryCode: '+966', phone: '55 123 4567', email: 'sarah.alotaibi@example.com' },
  { firstName: 'Layla', lastName: 'Haddad', city: 'Jeddah', countryCode: '+966', phone: '50 987 6543', email: 'layla.haddad@example.com' },
  { firstName: 'Noura', lastName: 'Al-Qahtani', city: 'Dammam', countryCode: '+966', phone: '54 222 3344', email: 'noura.alqahtani@example.com' },
  { firstName: 'Reem', lastName: 'Al-Farsi', city: 'Riyadh', countryCode: '+966', phone: '56 777 8899', email: 'reem.alfarsi@example.com' },
  { firstName: 'Hana', lastName: 'Zaidi', city: 'Khobar', countryCode: '+966', phone: '53 111 2233', email: 'hana.zaidi@example.com' },
  { firstName: 'Amal', lastName: 'Nasser', city: 'Jeddah', countryCode: '+966', phone: '59 444 5566', email: 'amal.nasser@example.com' },
  { firstName: 'Dana', lastName: 'Al-Sabah', city: 'Riyadh', countryCode: '+966', phone: '58 333 2211', email: 'dana.alsabah@example.com' },
  { firstName: 'Maha', lastName: 'Othman', city: 'Mecca', countryCode: '+966', phone: '57 666 7788', email: 'maha.othman@example.com' },
];

const brandDetails: Record<string, { category: string; models: string[]; minPrices: number[] }> = {
  Dior: { category: 'Bags & Small Leather Goods', models: ['Lady Dior', 'Saddle Bag'], minPrices: [3500, 4200] },
  Rolex: { category: 'Watches', models: ['Submariner', 'Datejust'], minPrices: [6800, 7500] },
  Chanel: { category: 'Bags & Small Leather Goods', models: ['Classic Flap', '2.55 Reissue'], minPrices: [5200, 5600] },
  Gucci: { category: 'Bags & Accessories', models: ['GG Marmont', 'Dionysus'], minPrices: [1500, 1900] },
};

async function seedSubmissions() {
  const rolex = await prisma.supplier.findFirst({ where: { name: { contains: 'Rolex' } } });
  const chanel = await prisma.supplier.findFirst({ where: { name: { contains: 'Chanel' } } });

  const brands = ['Dior', 'Rolex', 'Chanel', 'Gucci'];
  let i = 0;

  for (const brand of brands) {
    const details = brandDetails[brand];
    for (let j = 0; j < 2; j++) {
      i++;
      const seller = sellers[(i - 1) % sellers.length];
      const images = sampleImages[brand];
      const reference = `SWU-${String(i).padStart(4, '0')}`;

      const existing = await prisma.sellWithUsSubmission.findUnique({ where: { reference } });
      if (existing) continue;

      await prisma.sellWithUsSubmission.create({
        data: {
          reference,
          category: details.category,
          brand,
          condition: j === 0 ? 'Excellent' : 'Very good',
          inclusions: 'Original box, dust bag, authenticity card',
          model: details.models[j],
          colour: j === 0 ? 'Black' : 'Beige',
          size: brand === 'Rolex' ? '40mm' : 'Medium',
          material: brand === 'Rolex' ? 'Stainless steel' : 'Calfskin leather',
          yearPurchased: String(2019 + j),
          notes: 'Well maintained, stored in original packaging.',
          minimumPrice: details.minPrices[j],
          photos: images.slice(0, 3),
          extraPhotos: images.slice(3),
          walkthroughVideo:
            brand === 'Dior' && j === 0
              ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
              : null,
          firstName: seller.firstName,
          lastName: seller.lastName,
          countryCode: seller.countryCode,
          phone: seller.phone,
          email: seller.email,
          city: seller.city,
          iban: iban(),
          referralSource: j === 0 ? 'Instagram' : 'Referral',
          status: 'pending',
        },
      });
    }
  }

  // Give the demo some already-processed entries so every status is visible.
  const firstRolex = await prisma.sellWithUsSubmission.findFirst({ where: { brand: 'Rolex' } });
  if (firstRolex) {
    await prisma.sellWithUsSubmission.update({
      where: { id: firstRolex.id },
      data: {
        status: 'approved',
        supplierId: rolex?.id ?? null,
        approvedAt: new Date(Date.now() - 3 * 86400 * 1000),
        emailSentAt: new Date(Date.now() - 3 * 86400 * 1000),
        pushedToShopifyAt: new Date(Date.now() - 2 * 86400 * 1000),
        adminNotes: 'Authenticated on-site. Listed on Shopify as pre-owned.',
      },
    });
  }

  const firstChanel = await prisma.sellWithUsSubmission.findFirst({ where: { brand: 'Chanel' } });
  if (firstChanel) {
    await prisma.sellWithUsSubmission.update({
      where: { id: firstChanel.id },
      data: {
        status: 'approved',
        supplierId: chanel?.id ?? null,
        approvedAt: new Date(Date.now() - 86400 * 1000),
        emailSentAt: new Date(Date.now() - 86400 * 1000),
        adminNotes: 'Approved — awaiting item drop-off before Shopify push.',
      },
    });
  }
}

async function main() {
  await seedAdmin();
  await seedSuppliers();
  await seedEmailTemplate();
  await seedSubmissions();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
