import { NextFunction, Request, Response } from 'express';

export function flashLocals(req: Request, res: Response, next: NextFunction) {
  const flash = req.session.flash || {};
  res.locals.status = flash.status ?? null;
  res.locals.error = flash.error ?? null;
  res.locals.errors = flash.errors ?? [];
  res.locals.old = flash.old ?? {};
  delete req.session.flash;
  next();
}

export function setFlash(
  req: Request,
  data: { status?: string; error?: string; errors?: string[]; old?: Record<string, unknown> }
) {
  req.session.flash = data;
}
