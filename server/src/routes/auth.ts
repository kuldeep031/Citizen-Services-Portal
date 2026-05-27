import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { loginSchema, registerSchema } from '../utils/validators.js';
import { AppError, formatZodError } from '../utils/errors.js';
import { authenticate, type AuthPayload } from '../middleware/auth.js';

const router = Router();

function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, formatZodError(parsed.error));
    }

    const { name, email, password, phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone, role: 'citizen' },
    });

    const tokenPayload: AuthPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, formatZodError(parsed.error));
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid email or password');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new AppError(401, 'Invalid email or password');
    }

    const tokenPayload: AuthPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId ?? undefined,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.departmentId,
        phone: user.phone,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError(400, 'Refresh token required');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const user = storedToken.user;
    if (!user.isActive) {
      throw new AppError(401, 'Account is deactivated');
    }

    // Revoke old token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const tokenPayload: AuthPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId ?? undefined,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId: req.user!.sub },
        data: { revokedAt: new Date() },
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        departmentId: true,
        department: { select: { name: true, code: true } },
      },
    });
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
