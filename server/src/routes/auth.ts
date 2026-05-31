import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { loginSchema } from '../utils/validators.js';
import { AppError, formatZodError } from '../utils/errors.js';
import { authenticate, type AuthPayload } from '../middleware/auth.js';
import { validateEmailToken } from './otp.js';
import { verifyFirebaseToken } from '../config/firebase-admin.js';

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
    const { name, email, password, phone, emailVerificationToken } = req.body;

    if (!name || !email || !password || !emailVerificationToken) {
      throw new AppError(400, 'Name, email, password, and email verification are required');
    }

    const verifiedEmail = validateEmailToken(emailVerificationToken);
    if (!verifiedEmail || verifiedEmail !== email.toLowerCase()) {
      throw new AppError(400, 'Email verification failed or expired. Please verify again.');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone: phone || null, role: 'citizen' },
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
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
    if (!user || !user.isActive || !user.passwordHash) {
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

// POST /api/auth/google — Google OAuth sign-in
router.post('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      throw new AppError(400, 'Google ID token is required');
    }

    let decoded;
    try {
      decoded = await verifyFirebaseToken(idToken);
    } catch (err: any) {
      console.error('[Google Auth] Token verification failed:', err.message);
      throw new AppError(500, 'Google sign-in failed. Server configuration error.');
    }

    const googleEmail = decoded.email;
    const googleName = decoded.name || decoded.email?.split('@')[0] || 'User';

    if (!googleEmail) {
      throw new AppError(400, 'Google account must have an email');
    }

    let user = await prisma.user.findUnique({ where: { email: googleEmail } });

    if (!user) {
      const randomHash = await bcrypt.hash(crypto.randomBytes(20).toString('hex'), 12);
      user = await prisma.user.create({
        data: {
          name: googleName,
          email: googleEmail,
          passwordHash: randomHash,
          role: 'citizen',
        },
      });
    }

    if (!user.isActive) {
      throw new AppError(401, 'Account is deactivated');
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
        phone: user.phone,
        department: user.departmentId,
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

// PATCH /api/auth/update-phone
router.patch('/update-phone', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, emailVerificationToken } = req.body;

    if (!phone || !emailVerificationToken) {
      throw new AppError(400, 'Phone and email verification token are required');
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const verifiedEmail = validateEmailToken(emailVerificationToken);
    if (!verifiedEmail || verifiedEmail !== user.email.toLowerCase()) {
      throw new AppError(400, 'Email verification failed or expired');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { phone },
    });

    res.json({ message: 'Phone number updated successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/change-password
router.post('/change-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, emailVerificationToken, newPassword } = req.body;

    if (!email || !emailVerificationToken || !newPassword) {
      throw new AppError(400, 'Email, verification token, and new password are required');
    }

    if (newPassword.length < 6) {
      throw new AppError(400, 'Password must be at least 6 characters');
    }

    const verifiedEmail = validateEmailToken(emailVerificationToken);
    if (!verifiedEmail || verifiedEmail !== email.toLowerCase()) {
      throw new AppError(400, 'Email verification failed or expired');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(404, 'No account found with this email');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
