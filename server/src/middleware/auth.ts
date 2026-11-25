import type { NextFunction, Request, Response } from 'express';
import { verifySessionToken } from '../services/auth/authService';
import type { StoredUser } from '../config/store';
import type { UserRole } from '../../../src/types/jobshield';

export interface AuthenticatedRequest extends Request {
  authUser?: StoredUser;
  authJti?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = header.slice(7).trim();
  const verified = verifySessionToken(token);
  if (!verified) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  req.authUser = verified.user;
  req.authJti = verified.jti;
  next();
}

export function requireRole(role: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (req.authUser.role !== role) {
      res.status(403).json({ error: 'Access denied. Insufficient role permissions.' });
      return;
    }
    next();
  };
}

const rateMap = new Map<string, number[]>();

export function rateLimit(maxRequests: number, windowMs: number, keyPrefix: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const history = (rateMap.get(key) || []).filter((ts) => now - ts < windowMs);
    if (history.length >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.',
      });
      return;
    }
    history.push(now);
    rateMap.set(key, history);
    next();
  };
}
