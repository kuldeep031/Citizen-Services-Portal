import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { sendOTPEmail } from '../lib/mailer.js';

const router = Router();

const otpStore = new Map<string, { code: string; expiresAt: number }>();
const verifiedTokens = new Map<string, { email: string; expiresAt: number }>();

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateEmailToken(token: string): string | null {
  const entry = verifiedTokens.get(token);
  if (!entry || Date.now() > entry.expiresAt) {
    verifiedTokens.delete(token);
    return null;
  }
  verifiedTokens.delete(token);
  return entry.email;
}

// POST /api/otp/send-email
router.post('/send-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const otp = generateOTP();
    otpStore.set(email.toLowerCase(), {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendOTPEmail(email, otp);
    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    next(err);
  }
});

// POST /api/otp/verify-email
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const stored = otpStore.get(email.toLowerCase());
    if (!stored) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    otpStore.delete(email.toLowerCase());

    const token = generateVerificationToken();
    verifiedTokens.set(token, { email: email.toLowerCase(), expiresAt: Date.now() + 15 * 60 * 1000 });

    res.json({ verified: true, verificationToken: token });
  } catch (err) {
    next(err);
  }
});

export default router;
