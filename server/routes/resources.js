import { Router } from 'express';
import { z } from 'zod';
import { Session, Note, Game } from '../models.js';
import { requireAuth, wrap, validate } from '../middleware/common.js';

const router = Router();
router.use(requireAuth);

router.post('/sessions', validate(z.object({
  seconds: z.number().int().min(0).max(86400),
  observed: z.number().int().min(0).max(86400),
  clear: z.number().int().min(0).max(86400),
  events: z.number().int().min(0).max(86400),
}).refine((value) => value.clear <= value.observed && value.observed <= value.seconds)), wrap(async (req, res) => {
  res.json(await Session.create({ user: req.uid, ...req.body }));
}));

router.post('/notes', validate(z.object({
  topic: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(5000),
})), wrap(async (req, res) => {
  res.json(await Note.create({ user: req.uid, ...req.body }));
}));

router.get('/leaderboard', wrap(async (_req, res) => {
  res.json(await Game.aggregate([
    { $match: { finished: true } },
    { $group: { _id: '$user', score: { $max: '$score' } } },
    { $sort: { score: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'person' } },
    { $project: { _id: 0, score: 1, name: { $arrayElemAt: ['$person.name', 0] } } },
  ]));
}));

export default router;
