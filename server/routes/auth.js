import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { User } from '../models.js';
import { wrap, fail, validate } from '../middleware/common.js';

const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Try again later.' },
});
const authSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1).max(40).optional(),
});

router.get('/signup-count', wrap(async (_req, res) => {
  res.json({ count: await User.countDocuments({}) });
}));

router.post('/logout', (_req, res) => {
  res.clearCookie('spark-session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.json({ ok: true });
});

router.post('/:mode', limiter, validate(authSchema), wrap(async (req, res) => {
  const { email, password, name } = req.body;
  let user = await User.findOne({ email }).select('+password');

  if (req.params.mode === 'register') {
    if (password.length < 12) return fail(res, 'Password must be at least 12 characters');
    if (user) return fail(res, 'Email already registered', 409);
    if (!name) return fail(res, 'Name is required');
    user = await User.create({ email, name, password: await bcrypt.hash(password, 12) });
  } else if (req.params.mode === 'login') {
    if (!user || !await bcrypt.compare(password, user.password)) {
      return fail(res, 'Invalid login', 401);
    }
  } else {
    return fail(res, 'Invalid authentication mode', 404);
  }

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '30m' });
  res.cookie('spark-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 60 * 1000,
    path: '/',
  });
  res.json({ name: user.name });
}));

export default router;
