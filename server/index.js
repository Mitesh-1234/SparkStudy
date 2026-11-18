import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth.js';
import accountRouter from './routes/account.js';
import taskRouter from './routes/tasks.js';
import resourceRouter from './routes/resources.js';
import arenaRouter from './routes/arena.js';
import { errorHandler } from './middleware/common.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(dir, '.env') });

const app = express();
app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      workerSrc: ["'self'", 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      mediaSrc: ["'self'", 'blob:'],
      connectSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://storage.googleapis.com'],
    },
  },
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && origin === process.env.APP_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
}));

app.use('/api/auth', authRouter);
app.use('/api', accountRouter);
app.use('/api/tasks', taskRouter);
app.use('/api', resourceRouter);
app.use('/api/arena', arenaRouter);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(express.static(path.join(dir, '../client/dist')));
app.get('*', (_req, res) => res.sendFile(path.join(dir, '../client/dist/index.html')));
app.use(errorHandler);

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studyspark');
app.listen(process.env.PORT || 5000, () => console.log('StudySpark API ready'));
