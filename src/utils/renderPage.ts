import { Response } from 'express';
import { renderToHtml } from './renderView';

interface PageOptions {
  title: string;
  crumb?: string;
  topbarActions?: string;
  scripts?: string;
  [key: string]: unknown;
}

/** Renders a content view, then wraps it in the shared shell layout — a manual stand-in for Blade's @extends/@section. */
export async function renderPage(res: Response, view: string, options: PageOptions) {
  const { title, crumb = 'Amused', topbarActions = '', scripts = '', ...data } = options;
  const merged = { ...res.locals, ...data, title, crumb };
  const content = await renderToHtml(res.app, view, merged);
  res.render('layouts/app', { ...merged, topbarActions, scripts, content });
}
