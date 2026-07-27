import { Request, Response } from 'express';
import { prisma } from '../db';
import { setFlash } from '../middleware/flash';
import { availablePlaceholders, renderTemplate } from '../utils/emailTemplate';
import { renderToHtml } from '../utils/renderView';
import { renderPage } from '../utils/renderPage';

export async function edit(req: Request, res: Response) {
  const id = Number(req.params.id);
  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!template) return res.status(404).send('Email template not found');

  const placeholders = availablePlaceholders();
  const sample =
    (await prisma.sellWithUsSubmission.findFirst({ where: { status: 'approved' } })) ??
    (await prisma.sellWithUsSubmission.findFirst());

  await renderPage(res, 'email-templates/edit', {
    title: 'Email Templates',
    crumb: 'Consignment · Notifications',
    template,
    placeholders,
    sample,
    scripts: previewScript(template.id, sample?.id ?? null),
  });
}

function previewScript(templateId: number, sampleId: number | null): string {
  return `
<script>
    const token = document.querySelector('meta[name=csrf-token]').content;
    const sampleId = ${JSON.stringify(sampleId)};
    const frame = document.getElementById('preview-frame');
    const subjEl = document.getElementById('preview-subject');
    let timer;

    async function refreshPreview() {
        const res = await fetch(${JSON.stringify(`/email-templates/${templateId}/preview`)}, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token, 'Accept': 'application/json' },
            body: JSON.stringify({
                subject: document.getElementById('f-subject').value,
                body: document.getElementById('f-body').value,
                sample_id: sampleId,
            }),
        });
        const data = await res.json();
        subjEl.textContent = data.subject;
        frame.srcdoc = data.body;
    }

    function debounced() { clearTimeout(timer); timer = setTimeout(refreshPreview, 350); }
    document.getElementById('f-subject').addEventListener('input', debounced);
    document.getElementById('f-body').addEventListener('input', debounced);

    function copyChip(el) {
        navigator.clipboard?.writeText(el.textContent);
        const old = el.textContent; el.textContent = 'copied!';
        setTimeout(() => el.textContent = old, 800);
    }

    refreshPreview();
</script>`;
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const name = String(req.body.name ?? '').trim();
  const subject = String(req.body.subject ?? '').trim();
  const body = String(req.body.body ?? '');

  if (!name || !subject || !body) {
    setFlash(req, { errors: ['Name, subject and body are required.'], old: req.body });
    return res.redirect(`/email-templates/${id}/edit`);
  }

  await prisma.emailTemplate.update({
    where: { id },
    data: {
      name,
      subject,
      body,
      fromName: req.body.from_name || null,
      fromEmail: req.body.from_email || null,
      sendgridTemplateId: req.body.sendgrid_template_id || null,
      isActive: req.body.is_active === '1' || req.body.is_active === 'on',
    },
  });

  setFlash(req, { status: 'Email template saved.' });
  res.redirect(`/email-templates/${id}/edit`);
}

export async function preview(req: Request, res: Response) {
  const id = Number(req.params.id);
  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const sampleId = req.body.sample_id ? Number(req.body.sample_id) : null;
  const sample =
    (sampleId ? await prisma.sellWithUsSubmission.findUnique({ where: { id: sampleId } }) : null) ??
    (await prisma.sellWithUsSubmission.findFirst());

  const data = {
    first_name: sample?.firstName ?? 'Sarah',
    last_name: sample?.lastName ?? 'Al-Otaibi',
    reference: sample?.reference ?? 'SWU-0001',
    brand: sample?.brand ?? 'Chanel',
    category: sample?.category ?? 'Bags & Small Leather Goods',
    model: sample?.model ?? 'Classic Flap',
    minimum_price: Number(sample?.minimumPrice ?? 0).toFixed(2),
    city: sample?.city ?? 'Riyadh',
  };

  const subject = renderTemplate(String(req.body.subject ?? template.subject), data);
  const bodyHtml = renderTemplate(String(req.body.body ?? template.body), data);
  const html = await renderToHtml(res.app, 'emails/wrapper', { body: bodyHtml });

  res.json({ subject, body: html });
}
