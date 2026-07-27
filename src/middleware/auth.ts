import { NextFunction, Request, Response } from 'express';
import { prisma } from '../db';

export async function loadUser(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
    res.locals.currentUser = user ?? null;
  } else {
    res.locals.currentUser = null;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
}

declare module 'express-session' {
  interface SessionData {
    returnTo?: string;
  }
}
