import { Router } from 'express';
import { z } from 'zod';
import { Task } from '../models.js';
import { requireAuth, wrap, validate, fail } from '../middleware/common.js';

const router = Router();
router.use(requireAuth);

router.post('/', validate(z.object({
  title: z.string().trim().min(1).max(100),
  subject: z.string().trim().min(1).max(100),
  due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => Number.isFinite(Date.parse(value))),
  minutes: z.number().int().min(5).max(480),
  priority: z.number().int().min(1).max(3),
})), wrap(async (req, res) => {
  res.json(await Task.create({ user: req.uid, ...req.body }));
}));

router.patch('/:id', validate(z.object({ done: z.boolean() })), wrap(async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.uid },
    { done: req.body.done, completedAt: req.body.done ? new Date() : null },
    { new: true },
  );
  if (!task) return fail(res, 'Task not found', 404);
  res.json(task);
}));

router.delete('/:id', wrap(async (req, res) => {
  await Task.deleteOne({ _id: req.params.id, user: req.uid });
  res.json({ ok: true });
}));

export default router;
