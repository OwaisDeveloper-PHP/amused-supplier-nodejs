import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { prisma } from '../db';
import { setFlash } from '../middleware/flash';

export async function showLogin(req: Request, res: Response) {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('auth/login', { title: 'Sign in' });
}

export async function login(req: Request, res: Response) {
  const email = String(req.body.email ?? '').trim();
  const password = String(req.body.password ?? '');

  if (!email || !password) {
    setFlash(req, { errors: ['Email and password are required.'], old: { email } });
    return res.redirect('/login');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !valid) {
    setFlash(req, { errors: ['Those credentials do not match our records.'], old: { email } });
    return res.redirect('/login');
  }

  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.userId = user.id;
    const returnTo = req.session.returnTo ?? '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
  });
}

export function logout(req: Request, res: Response) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}
