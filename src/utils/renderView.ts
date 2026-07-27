import { Application } from 'express';

/** Render a view to an HTML string without the default layout wrapper. */
export function renderToHtml(app: Application, view: string, data: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    app.render(view, { ...data, layout: false }, (err, html) => {
      if (err) return reject(err);
      resolve(html as string);
    });
  });
}
