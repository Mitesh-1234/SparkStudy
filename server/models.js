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

export const Session = mongoose.model('Session', new Schema({
  user: Types.ObjectId,
  seconds: Number,
  observed: Number,
  clear: Number,
  events: Number,
}, { timestamps: true }));

export const Game = mongoose.model('Game', new Schema({
  user: Types.ObjectId,
  subject: String,
  index: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  started: Date,
  finished: { type: Boolean, default: false },
}, { timestamps: true }));

export const Note = mongoose.model('Note', new Schema({
  user: Types.ObjectId,
  topic: String,
  body: String,
}, { timestamps: true }));
