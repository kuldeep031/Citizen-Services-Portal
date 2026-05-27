import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';
import type { Role } from '@prisma/client';

export interface AuthPayload {
  sub: string;
  email: string;
  role: Role;
  departmentId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError(401, 'Access token required'));
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Access token expired'));
    } else {
      next(new AppError(401, 'Invalid access token'));
    }
  }
}

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Authentication required'));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, 'Insufficient permissions'));
      return;
    }
    next();
  };
}
