import { Router } from 'express';
import { z } from 'zod';
import { Game } from '../models.js';
import { questions } from '../questions.js';
import { requireAuth, wrap, validate, fail } from '../middleware/common.js';

const router = Router();
router.use(requireAuth);

const publicQuestion = (game) => {
  const question = questions[game.subject][game.index];
  return {
    id: game.id,
    index: game.index,
    total: questions[game.subject].length,
    q: question.q,
    o: question.o,
    deadline: new Date(game.started).getTime() + 20000,
  };
};

router.post('/start', validate(z.object({
  subject: z.string().refine((subject) => Object.hasOwn(questions, subject)),
})), wrap(async (req, res) => {
  const game = await Game.create({ user: req.uid, subject: req.body.subject, started: new Date() });
  res.json(publicQuestion(game));
}));

router.post('/answer', validate(z.object({
  id: z.string(),
  index: z.number().int().min(0),
  choice: z.number().int().min(-1).max(3),
})), wrap(async (req, res) => {
  const { id, index, choice } = req.body;
  const game = await Game.findOne({ _id: id, user: req.uid, finished: false, index, started: { $ne: null } });
  if (!game) return fail(res, 'Question expired or already submitted');

  const question = questions[game.subject][index];
  const elapsed = Date.now() - game.started.getTime();
  const correct = elapsed <= 20500 && choice === question.a;
  const score = game.score + (correct ? (elapsed < 10000 ? 10 : 8) : 0);
  const finished = index + 1 === questions[game.subject].length;
  const next = await Game.findOneAndUpdate(
    { _id: id, user: req.uid, index, finished: false },
    { index: index + 1, score, finished, started: null },
    { new: true },
  );
  if (!next) return fail(res, 'Already submitted');

  res.json({
    correct,
    answer: question.a,
    explanation: question.e,
    score,
    finished,
    next: finished ? null : { id: next.id, index: next.index },
  });
}));

router.post('/next', validate(z.object({
  id: z.string(),
  index: z.number().int().min(0),
})), wrap(async (req, res) => {
  const game = await Game.findOneAndUpdate(
    { _id: req.body.id, user: req.uid, index: req.body.index, finished: false, started: null },
    { started: new Date() },
    { new: true },
  );
  if (!game) return fail(res, 'Question unavailable');
  res.json(publicQuestion(game));
}));

export default router;
