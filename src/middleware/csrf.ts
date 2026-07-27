import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

/** Session-backed CSRF token, mirroring Laravel's @csrf token/verification. */
export function csrfToken(req: Request, res: Response, next: NextFunction) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

export function verifyCsrf(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const token = (req.body && req.body._token) || req.headers['x-csrf-token'];
    if (!token || token !== req.session.csrfToken) {
      return res.status(419).send('Page expired — please refresh and try again.');
    }
  }
  next();
}
