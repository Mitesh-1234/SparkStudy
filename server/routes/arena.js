import { Router } from 'express';
import { z } from 'zod';
import { randomInt } from 'node:crypto';
import { Game, ArenaRoom } from '../models.js';
import { questions } from '../questions.js';
import { requireAuth, wrap, validate, fail } from '../middleware/common.js';

const router = Router();
router.use(requireAuth);

router.get('/stats', wrap(async (req, res) => {
  const games = await Game.find({ user: req.uid, finished: true }).select('score');
  res.json({
    battles: games.length,
    best: games.reduce((highest, game) => Math.max(highest, game.score), 0),
    xp: games.reduce((total, game) => total + game.score, 0),
  });
}));

router.post('/room/create', validate(z.object({
  subject: z.string().refine((subject) => Object.hasOwn(questions, subject)),
})), wrap(async (req, res) => {
  let code;
  do {
    code = String(randomInt(100000, 1000000));
  } while (await ArenaRoom.exists({ code }));
  await ArenaRoom.create({ code, subject: req.body.subject, owner: req.uid, players: [req.uid] });
  res.json({ code });
}));

router.post('/room/join', validate(z.object({
  code: z.string().trim().regex(/^\d{6}$/),
})), wrap(async (req, res) => {
  const room = await ArenaRoom.findOne({ code: req.body.code });
  if (!room) return fail(res, 'Room code not found', 404);
  if (!room.players.some((player) => player.toString() === req.uid)) {
    if (room.players.length >= 8) return fail(res, 'This room is full', 409);
    room.players.push(req.uid);
    await room.save();
  }
  res.json({ code: room.code, subject: room.subject, players: room.players.length });
}));

router.get('/room/:code', wrap(async (req, res) => {
  const room = await ArenaRoom.findOne({ code: req.params.code })
    .populate('players', 'name');
  if (!room) return fail(res, 'Room code not found', 404);
  if (!room.players.some((player) => player.id === req.uid)) {
    return fail(res, 'Join this room before viewing it', 403);
  }
  const data = room.status === 'waiting' || room.status === 'finished'
    ? null
    : questions[room.subject][room.index];
  res.json({
    code: room.code,
    subject: room.subject,
    owner: room.owner.toString(),
    isOwner: room.owner.toString() === req.uid,
    status: room.status,
    index: room.index,
    startedAt: room.startedAt,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      score: room.scores?.get?.(player.id) || 0,
    })),
    question: data ? { q: data.q, o: data.o, total: questions[room.subject].length } : null,
  });
}));

router.post('/room/start', validate(z.object({
  code: z.string().trim().regex(/^\d{6}$/),
})), wrap(async (req, res) => {
  const room = await ArenaRoom.findOne({ code: req.body.code });
  if (!room) return fail(res, 'Room code not found', 404);
  if (room.owner.toString() !== req.uid) return fail(res, 'Only the room creator can start', 403);
  if (room.status === 'waiting') {
    room.status = 'playing';
    room.index = 0;
    room.startedAt = new Date();
    room.answered = new Map();
    await room.save();
  }
  res.json({ ok: true });
}));

router.post('/room/answer', validate(z.object({
  code: z.string().trim().regex(/^\d{6}$/),
  choice: z.number().int().min(-1).max(3),
})), wrap(async (req, res) => {
  const room = await ArenaRoom.findOne({ code: req.body.code });
  if (!room) return fail(res, 'Room code not found', 404);
  if (room.status !== 'playing') return fail(res, 'Battle is not active', 409);
  if (!room.players.some((player) => player.toString() === req.uid)) {
    return fail(res, 'Join this room before answering', 403);
  }
  const playerKey = String(req.uid);
  const answerKey = `${room.index}:${playerKey}`;
  if (room.answered?.get(answerKey)) return fail(res, 'Answer already submitted', 409);

  const question = questions[room.subject][room.index];
  const elapsed = Date.now() - new Date(room.startedAt).getTime();
  const correct = elapsed <= 20500 && req.body.choice === question.a;
  const points = correct ? (elapsed < 10000 ? 10 : 8) : 0;
  const nextScore = (room.scores?.get(playerKey) || 0) + points;
  room.scores.set(playerKey, nextScore);
  room.answered.set(answerKey, true);

  const finished = room.index + 1 === questions[room.subject].length
    && room.players.every((player) => room.answered?.get(`${room.index}:${player.toString()}`));
  if (room.players.every((player) => room.answered?.get(`${room.index}:${player.toString()}`))) {
    if (room.index + 1 < questions[room.subject].length) {
      room.index += 1;
      room.startedAt = new Date();
    } else {
      room.status = 'finished';
    }
  }
  await room.save();

  const personalGame = await Game.create({
    user: req.uid,
    subject: room.subject,
    index: finished ? questions[room.subject].length : room.index,
    score: nextScore,
    finished,
  });
  if (finished) await personalGame.save();
  res.json({
    correct,
    answer: question.a,
    explanation: question.e,
    score: nextScore,
    finished: room.status === 'finished',
  });
}));

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
