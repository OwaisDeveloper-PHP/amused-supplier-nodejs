import nodemailer from 'nodemailer';

const hasSmtp = Boolean(process.env.MAIL_HOST);

export const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT ?? 587),
      auth: process.env.MAIL_USER
        ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
        : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

export const mailDriverLabel = hasSmtp ? 'smtp' : 'log';

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  fromName?: string | null;
  fromEmail?: string | null;
}) {
  const from = options.fromEmail
    ? `"${options.fromName ?? 'Amused'}" <${options.fromEmail}>`
    : `"${process.env.MAIL_FROM_NAME ?? 'Amused'}" <${process.env.MAIL_FROM_ADDRESS ?? 'concierge@amusedco.com'}>`;

  const info = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  if (!hasSmtp) {
    // eslint-disable-next-line no-console
    console.log('[mail:log]', (info as { message?: Buffer | string }).message?.toString());
  }
}
