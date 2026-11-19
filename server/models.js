import mongoose from 'mongoose';

const { Schema, Types } = mongoose;

export const User = mongoose.model('User', new Schema({
  name: { type: String, trim: true, maxlength: 40, required: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  subscription: {
    plan: { type: String, enum: ['Free', 'Plus', 'Pro'], default: 'Free' },
    updatedAt: Date,
  },
}));

export const Task = mongoose.model('Task', new Schema({
  user: Types.ObjectId,
  title: String,
  subject: String,
  due: String,
  minutes: Number,
  priority: Number,
  done: { type: Boolean, default: false },
  completedAt: Date,
}, { timestamps: true }));
Task.schema.index({ user: 1, done: 1, due: 1 });

export const Session = mongoose.model('Session', new Schema({
  user: Types.ObjectId,
  seconds: Number,
  observed: Number,
  clear: Number,
  events: Number,
}, { timestamps: true }));
Session.schema.index({ user: 1, createdAt: -1 });

export const Game = mongoose.model('Game', new Schema({
  user: Types.ObjectId,
  subject: String,
  index: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  started: Date,
  finished: { type: Boolean, default: false },
}, { timestamps: true }));
Game.schema.index({ user: 1, finished: 1, score: -1 });

export const ArenaRoom = mongoose.model('ArenaRoom', new Schema({
  code: { type: String, unique: true, required: true },
  subject: { type: String, required: true },
  owner: Types.ObjectId,
  players: [{ type: Types.ObjectId, ref: 'User' }],
}, { timestamps: true }));

export const Note = mongoose.model('Note', new Schema({
  user: Types.ObjectId,
  topic: String,
  body: String,
}, { timestamps: true }));
Note.schema.index({ user: 1, createdAt: -1 });
