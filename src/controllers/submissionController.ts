import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { setFlash } from '../middleware/flash';
import { renderTemplate } from '../utils/emailTemplate';
import { sendMail, mailDriverLabel } from '../services/mailer';
import { paginationMeta } from '../utils/pagination';
import { renderToHtml } from '../utils/renderView';
import { renderPage } from '../utils/renderPage';
import { allPhotos, fullName, fullPhone, isApproved, statusColor, visibleWearList, whatsappNumber } from '../utils/submission';

function decorate<T extends { firstName: string | null; lastName: string | null; countryCode: string | null; phone: string | null; photos: unknown; extraPhotos: unknown; visibleWear: unknown; status: string }>(
  s: T
) {
  return {
    ...s,
    fullName: fullName(s),
    fullPhone: fullPhone(s),
    whatsappNumber: whatsappNumber(s),
    allPhotos: allPhotos(s),
    visibleWearList: visibleWearList(s),
    isApproved: isApproved(s),
    statusColor: statusColor(s.status),
  };
}

const PER_PAGE = 9;

export async function index(req: Request, res: Response) {
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const brand = typeof req.query.brand === 'string' ? req.query.brand : '';
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const page = Math.max(Number(req.query.page ?? 1) || 1, 1);

  const where: Prisma.SellWithUsSubmissionWhereInput = {};
  if (status) where.status = status;
  if (brand) where.brand = brand;
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: 'insensitive' } },
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { model: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [total, submissions, brandRows] = await Promise.all([
    prisma.sellWithUsSubmission.count({ where }),
    prisma.sellWithUsSubmission.findMany({
      where,
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.sellWithUsSubmission.findMany({
      where: { brand: { not: null } },
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
      select: { brand: true },
    }),
  ]);

  const pagination = paginationMeta(total, page, PER_PAGE);
  const brands = brandRows.map((b) => b.brand).filter(Boolean) as string[];

  await renderPage(res, 'submissions/index', {
    title: 'Sell With Us Entries',
    crumb: 'Consignment',
    submissions: submissions.map(decorate),
    pagination,
    brands,
    query: req.query,
  });
}

export async function show(req: Request, res: Response) {
  const id = Number(req.params.id);
  const submission = await prisma.sellWithUsSubmission.findUnique({ where: { id }, include: { supplier: true } });
  if (!submission) return res.status(404).send('Submission not found');

  const [suppliers, template] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
    prisma.emailTemplate.findUnique({ where: { key: 'submission_approved' } }),
  ]);

  const decorated = decorate(submission);
  const photosJson = JSON.stringify(decorated.allPhotos).replace(/</g, '\\u003c');

  await renderPage(res, 'submissions/show', {
    title: submission.reference,
    crumb: 'Consignment · Sell With Us Entries',
    submission: decorated,
    suppliers,
    template,
    topbarActions: '<a href="/submissions" class="btn btn--ghost btn--sm">← Back to entries</a>',
    scripts: lightboxScript(photosJson),
  });
}

function lightboxScript(photosJson: string): string {
  return `
<div class="lightbox" id="lightbox" aria-hidden="true">
    <div class="lightbox__overlay" onclick="closeLightbox()"></div>
    <button class="lightbox__close" onclick="closeLightbox()" aria-label="Close lightbox">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
    <div class="lightbox__counter" id="lightboxCounter"></div>
    <button class="lightbox__nav lightbox__nav--prev" onclick="navLightbox(-1)" aria-label="Previous image">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <button class="lightbox__nav lightbox__nav--next" onclick="navLightbox(1)" aria-label="Next image">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
    </button>
    <div class="lightbox__stage">
        <img class="lightbox__img" id="lightboxImg" src="" alt="">
    </div>
</div>
<script>
(function () {
    const photos = ${photosJson};
    let current = 0;
    const box   = document.getElementById('lightbox');
    const img   = document.getElementById('lightboxImg');
    const ctr   = document.getElementById('lightboxCounter');

    function show(idx) {
        current = ((idx % photos.length) + photos.length) % photos.length;
        const photo = photos[current];
        img.src = photo.url;
        img.alt = photo.name || '';
        ctr.textContent = (current + 1) + ' / ' + photos.length;
    }

    window.openLightbox = function (idx) {
        show(idx);
        box.classList.add('lightbox--open');
        box.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    window.closeLightbox = function () {
        box.classList.remove('lightbox--open');
        box.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    window.navLightbox = function (dir) {
        show(current + dir);
    };

    document.addEventListener('keydown', function (e) {
        if (!box.classList.contains('lightbox--open')) return;
        if (e.key === 'Escape')      closeLightbox();
        if (e.key === 'ArrowLeft')   navLightbox(-1);
        if (e.key === 'ArrowRight')  navLightbox(1);
    });
})();
</script>`;
}

export async function approve(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.sellWithUsSubmission.findUnique({ where: { id } });
  if (!existing) return res.status(404).send('Submission not found');

  const supplierId = req.body.supplier_id ? Number(req.body.supplier_id) : existing.supplierId;

  const submission = await prisma.sellWithUsSubmission.update({
    where: { id },
    data: { status: 'approved', approvedAt: new Date(), rejectedAt: null, supplierId },
  });
  setFlash(req, { status: `${submission.reference} approved.` });
  res.redirect(`/submissions/${id}`);
}

export async function reject(req: Request, res: Response) {
  const id = Number(req.params.id);
  const submission = await prisma.sellWithUsSubmission.update({
    where: { id },
    data: { status: 'rejected', rejectedAt: new Date(), approvedAt: null },
  });
  setFlash(req, { status: `${submission.reference} rejected.` });
  res.redirect(`/submissions/${id}`);
}

export async function sendEmail(req: Request, res: Response) {
  const id = Number(req.params.id);
  const submission = await prisma.sellWithUsSubmission.findUnique({ where: { id } });
  if (!submission) return res.status(404).send('Submission not found');

  const template = await prisma.emailTemplate.findUnique({ where: { key: 'submission_approved' } });
  if (!template) return res.status(404).send('Email template not found');

  if (!submission.email) {
    setFlash(req, { error: 'This submission has no e-mail address on file.' });
    return res.redirect(`/submissions/${id}`);
  }

  const data = {
    first_name: submission.firstName,
    last_name: submission.lastName,
    reference: submission.reference,
    brand: submission.brand,
    category: submission.category,
    model: submission.model,
    minimum_price: Number(submission.minimumPrice ?? 0).toFixed(2),
    city: submission.city,
  };

  const subject = renderTemplate(template.subject, data);
  const body = renderTemplate(template.body, data);
  const html = await renderToHtml(res.app, 'emails/wrapper', { body });

  await sendMail({ to: submission.email, subject, html, fromName: template.fromName, fromEmail: template.fromEmail });

  await prisma.sellWithUsSubmission.update({ where: { id }, data: { emailSentAt: new Date() } });

  setFlash(req, {
    status: `Approval e-mail sent to ${submission.email}. (Using the ${mailDriverLabel} mailer — swap to SendGrid once keys are added.)`,
  });
  res.redirect(`/submissions/${id}`);
}

export async function pushToShopify(req: Request, res: Response) {
  const id = Number(req.params.id);
  const submission = await prisma.sellWithUsSubmission.update({
    where: { id },
    data: { pushedToShopifyAt: new Date() },
  });

  if (submission.supplierId) {
    await prisma.supplier.update({
      where: { id: submission.supplierId },
      data: { productsSynced: { increment: 1 }, lastSyncedAt: new Date() },
    });
  }

  setFlash(req, { status: `${submission.reference} pushed to Shopify via supplier API.` });
  res.redirect(`/submissions/${id}`);
}

export async function updateNotes(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.sellWithUsSubmission.update({ where: { id }, data: { adminNotes: req.body.admin_notes ?? null } });
  setFlash(req, { status: 'Notes saved.' });
  res.redirect(`/submissions/${id}`);
}
