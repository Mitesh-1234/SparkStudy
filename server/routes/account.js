import { Router } from 'express';
import { z } from 'zod';
import { User, Task, Session, Game, Note } from '../models.js';
import { requireAuth, wrap, validate, fail } from '../middleware/common.js';

const router = Router();
router.use(requireAuth);

router.get('/data', wrap(async (req, res) => {
  const [account, tasks, sessions, games, notes] = await Promise.all([
    User.findById(req.uid).select('name subscription'),
    Task.find({ user: req.uid }).select('title subject due minutes priority done completedAt').lean(),
    Session.find({ user: req.uid }).select('seconds observed clear events createdAt').sort('-createdAt').limit(100).lean(),
    Game.find({ user: req.uid, finished: true }).select('subject score createdAt').sort('-createdAt').limit(100).lean(),
    Note.find({ user: req.uid }).select('topic body createdAt').sort('-createdAt').lean(),
  ]);
  res.json({
    name: account?.name || '',
    subscription: account?.subscription?.plan || 'Free',
    tasks,
    sessions,
    games,
    notes,
  });
}));

router.put('/subscription', validate(z.object({
  plan: z.enum(['Free', 'Plus', 'Pro']),
})), wrap(async (req, res) => {
  const account = await User.findByIdAndUpdate(
    req.uid,
    { subscription: { plan: req.body.plan, updatedAt: new Date() } },
    { new: true, select: 'subscription' },
  );
  res.json({ subscription: account.subscription.plan });
}));

export default router;
