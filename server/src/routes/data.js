
import { Router } from 'express';
import auth from '../middleware/auth.js';
import DailyPlan from '../models/DailyPlan.js';
import DailyEntry from '../models/DailyEntry.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { validDate } from '../utils/date.js';

const r = Router();

r.use(auth);

r.get('/plans/:date', async (req, res) => {
  if (!validDate(req.params.date)) {
    return res.status(400).json({ message: 'Invalid date' });
  }

  res.json(
    await DailyPlan.findOne({
      userId: req.userId,
      date: req.params.date
    }) || {
      date: req.params.date,
      items: []
    }
  );
});

r.put('/plans/:date', async (req, res) => {
  if (!validDate(req.params.date)) {
    return res.status(400).json({ message: 'Invalid date' });
  }

  const items = Array.isArray(req.body.items) ? req.body.items : [];

  const doc = await DailyPlan.findOneAndUpdate(
    {
      userId: req.userId,
      date: req.params.date
    },
    {
      items,
      reflection: req.body.reflection || ''
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  res.json(doc);
});

r.get('/entries/:date', async (req, res) => {
  if (!validDate(req.params.date)) {
    return res.status(400).json({ message: 'Invalid date' });
  }

  res.json(
    await DailyEntry.findOne({
      userId: req.userId,
      date: req.params.date
    }) || {
      date: req.params.date,
      fitness: [],
      namaz: {
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false
      },
      work: [],
      skills: [],
      self: [],
      reflection: {}
    }
  );
});

r.put('/entries/:date', async (req, res) => {
  if (!validDate(req.params.date)) {
    return res.status(400).json({ message: 'Invalid date' });
  }

  const allowed = [
    'fitness',
    'namaz',
    'work',
    'skills',
    'self',
    'reflection',
    'notes'
  ];

  const update = {};

  for (const k of allowed) {
    if (req.body[k] !== undefined) update[k] = req.body[k];
  }

  const doc = await DailyEntry.findOneAndUpdate(
    {
      userId: req.userId,
      date: req.params.date
    },
    { $set: update },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  res.json(doc);
});

r.get('/tasks', async (req, res) =>
  res.json(
    await Task.find({
      userId: req.userId,
      active: true
    }).sort({ createdAt: 1 })
  )
);

r.post('/tasks', async (req, res) => {
  const { title, category, kind, target, unit } = req.body;

  if (!title || !['fitness', 'work', 'skills', 'self'].includes(category)) {
    return res.status(400).json({
      message: 'Title and valid category required'
    });
  }

  res.status(201).json(
    await Task.create({
      userId: req.userId,
      title,
      category,
      kind: kind || 'yesno',
      target: target || 1,
      unit
    })
  );
});

r.put('/tasks/:id', async (req, res) => {
  const doc = await Task.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.userId
    },
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!doc) {
    return res.status(404).json({ message: 'Task not found' });
  }

  res.json(doc);
});

r.delete('/tasks/:id', async (req, res) => {
  const doc = await Task.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.userId
    },
    { active: false },
    { new: true }
  );

  if (!doc) {
    return res.status(404).json({ message: 'Task not found' });
  }

  res.json({ message: 'Task archived' });
});

r.get('/profile', async (req, res) => {
  const u = await User.findById(req.userId);

  res.json({
    name: u.name,
    email: u.email,
    timezone: u.timezone,
    reminder: u.reminder,
    preferences: u.preferences,
    leaderboardOptIn: u.leaderboardOptIn
  });
});

r.put('/profile', async (req, res) => {
  const update = {};

  for (const k of [
    'name',
    'timezone',
    'reminder',
    'preferences',
    'leaderboardOptIn'
  ]) {
    if (req.body[k] !== undefined) update[k] = req.body[k];
  }

  const u = await User.findByIdAndUpdate(
    req.userId,
    update,
    {
      new: true,
      runValidators: true
    }
  );

  res.json({
    name: u.name,
    email: u.email,
    timezone: u.timezone,
    reminder: u.reminder,
    preferences: u.preferences,
    leaderboardOptIn: u.leaderboardOptIn
  });
});

r.get('/reminders', async (req, res) => {
  const u = await User.findById(req.userId);

  res.json(u.reminder);
});

r.put('/reminders', async (req, res) => {
  const u = await User.findByIdAndUpdate(
    req.userId,
    { $set: { reminder: req.body } },
    {
      new: true,
      runValidators: true
    }
  );

  res.json(u.reminder);
});

r.get('/notifications', async (req, res) =>
  res.json(
    await Notification.find({
      userId: req.userId
    })
      .sort({ createdAt: -1 })
      .limit(50)
  )
);

r.patch('/notifications/:id/read', async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.userId
    },
    { read: true },
    { new: true }
  );

  if (!n) {
    return res.status(404).json({
      message: 'Notification not found'
    });
  }

  res.json(n);
});

export default r;
