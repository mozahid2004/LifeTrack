
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const r = Router();

const tokenFor = id =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const safe = u => ({
  id: u._id,
  name: u.name,
  email: u.email,
  timezone: u.timezone,
  reminder: u.reminder,
  preferences: u.preferences,
  leaderboardOptIn: u.leaderboardOptIn
});

r.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({
        message: 'Name, valid email and password (8+ characters) are required'
      });
    }

    if (await User.exists({ email: email.toLowerCase() })) {
      return res.status(409).json({
        message: 'Email already registered'
      });
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12)
    });

    res.status(201).json({
      token: tokenFor(user.id),
      user: safe(user)
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

r.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email?.toLowerCase()
    }).select('+password');

    if (!user || !await bcrypt.compare(req.body.password || '', user.password)) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    res.json({
      token: tokenFor(user.id),
      user: safe(user)
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

r.get('/me', auth, async (req, res) => {
  const u = await User.findById(req.userId);

  if (!u) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  res.json({ user: safe(u) });
});

export default r;
