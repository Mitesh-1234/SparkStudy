import jwt from 'jsonwebtoken';
import { z } from 'zod';

export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const fail = (res, message, status = 400) =>
  res.status(status).json({ error: message });

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return fail(res, 'Invalid request');
  req.body = result.data;
  next();
};

export function requireAuth(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const origin = req.headers.origin;
    if (process.env.NODE_ENV === 'production' && origin && origin !== process.env.APP_ORIGIN) {
      return fail(res, 'Invalid origin', 403);
    }
  }
  try {
    const token = req.cookies['spark-session'];
    if (!token) throw new Error('Missing session');
    req.uid = jwt.verify(token, process.env.JWT_SECRET).sub;
    next();
  } catch {
    return fail(res, 'Please sign in', 401);
  }
}

export function errorHandler(err, _req, res, _next) {
  console.error(err.message);
  fail(res, 'Request failed', err.code === 11000 ? 409 : 400);
}
