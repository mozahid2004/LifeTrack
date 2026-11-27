
import { Router } from 'express';
import auth from '../middleware/auth.js';
import Habit from '../models/Habit.js';
import HabitEntry from '../models/HabitEntry.js';
import DailyTask from '../models/DailyTask.js';
import LegacyTask from '../models/Task.js';
import LegacyEntry from '../models/DailyEntry.js';
import User from '../models/User.js';
import { validDate } from '../utils/date.js';

const r = Router();

r.use(auth);

const prayers = [
  ['Fajr', 'fajr'],
  ['Dhuhr', 'dhuhr'],
  ['Asr', 'asr'],
  ['Maghrib', 'maghrib'],
  ['Isha', 'isha']
];

async function ensurePrayerHabits(userId) {
  const legacy = await LegacyTask.find({
    userId,
    active: true,
    category: { $in: ['fitness', 'self'] }
  });

  for (const old of legacy) {
    await Habit.updateOne(
      {
        userId,
        category: old.category,
        title: old.title
      },
      {
        $setOnInsert: {
          userId,
          category: old.category,
          title: old.title,
          habitType: old.habitType || 'build',
          active: true
        }
      },
      { upsert: true }
    );
  }

  for (let i = 0; i < prayers.length; i++) {
    const [title] = prayers[i];

    await Habit.updateOne(
      {
        userId,
        category: 'namaz',
        title
      },
      {
        $setOnInsert: {
          userId,
          category: 'namaz',
          title,
          sortOrder: i,
          active: true
        }
      },
      { upsert: true }
    );
  }
}

r.get('/habits', async (req, res) => {
  await ensurePrayerHabits(req.userId);

  res.json(
    await Habit.find({
      userId: req.userId,
      active: true
    }).sort({ category: 1, sortOrder: 1, createdAt: 1 })
  );
});

r.post('/habits', async (req, res) => {
  const {
    title,
    category,
    habitType = 'build'
  } = req.body;

  if (!title?.trim() || !['fitness', 'self'].includes(category)) {
    return res.status(400).json({
      message: 'Enter a title and choose Fitness or Self Improvement'
    });
  }

  const doc = await Habit.create({
    userId: req.userId,
    title: title.trim(),
    category,
    habitType
  });

  res.status(201).json(doc);
});

r.put('/habits/:id', async (req, res) => {
  const update = {};

  for (const k of ['title', 'habitType', 'sortOrder']) {
    if (req.body[k] !== undefined) update[k] = req.body[k];
  }

  if (update.title !== undefined) {
    update.title = String(update.title).trim();
  }

  const doc = await Habit.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.userId,
      active: true
    },
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!doc) {
    return res.status(404).json({ message: 'Habit not found' });
  }

  res.json(doc);
});

r.delete('/habits/:id', async (req, res) => {
  const doc = await Habit.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.userId,
      category: { $ne: 'namaz' }
    },
    {
      $set: {
        active: false,
        archivedAt: new Date()
      }
    },
    { new: true }
  );

  if (!doc) {
    return res.status(404).json({
      message: 'Habit not found or cannot archive a default prayer'
    });
  }

  res.json({ message: 'Habit archived' });
});

r.get('/habits/entries', async (req, res) => {
  const { date } = req.query;

  if (!validDate(date)) {
    return res.status(400).json({ message: 'Valid date is required' });
  }

  await ensurePrayerHabits(req.userId);

  const habits = await Habit.find({
    userId: req.userId,
    active: true
  }).sort({ category: 1, sortOrder: 1, createdAt: 1 });

  const ids = habits.map(h => h._id);

  const entries = await HabitEntry.find({
    userId: req.userId,
    date,
    habitId: { $in: ids }
  });

  const map = new Map(
    entries.map(e => [String(e.habitId), e])
  );

  res.json(
    habits.map(h => ({
      habit: h,
      completed: map.get(String(h._id))?.completed || false,
      entryId: map.get(String(h._id))?._id || null
    }))
  );
});

r.put('/habits/:id/entries', async (req, res) => {
  const { date, completed } = req.body;

  if (!validDate(date) || typeof completed !== 'boolean') {
    return res.status(400).json({
      message: 'Valid date and completed boolean are required'
    });
  }

  const habit = await Habit.findOne({
    _id: req.params.id,
    userId: req.userId,
    active: true
  });

  if (!habit) {
    return res.status(404).json({ message: 'Habit not found' });
  }

  const entry = await HabitEntry.findOneAndUpdate(
    {
      userId: req.userId,
      habitId: habit._id,
      date
    },
    { $set: { completed } },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  res.json(entry);
});

r.get('/daily-tasks', async (req, res) => {
  const date = req.query.date;

  if (date && !validDate(date)) {
    return res.status(400).json({ message: 'Invalid date' });
  }

  const filter = { userId: req.userId };

  if (date) filter.date = date;

  res.json(
    await DailyTask.find({
      ...filter,
      archivedAt: null
    }).sort({ date: 1, priority: -1, createdAt: 1 })
  );
});

r.post('/daily-tasks', async (req, res) => {
  const {
    title,
    date,
    category = 'personal',
    dueTime = '',
    notes = '',
    priority = 'medium'
  } = req.body;

  if (
    !title?.trim() ||
    !validDate(date) ||
    !['work', 'skills', 'personal'].includes(category)
  ) {
    return res.status(400).json({
      message: 'Title, valid date and category are required'
    });
  }

  const task = await DailyTask.create({
    userId: req.userId,
    title: title.trim(),
    date,
    category,
    dueTime,
    notes,
    priority
  });

  res.status(201).json(task);
});

r.put('/daily-tasks/:id', async (req, res) => {
  const update = {};

  for (const k of [
    'title',
    'date',
    'category',
    'dueTime',
    'notes',
    'priority',
    'completed'
  ]) {
    if (req.body[k] !== undefined) update[k] = req.body[k];
  }

  if (update.date && !validDate(update.date)) {
    return res.status(400).json({ message: 'Invalid date' });
  }

  if (update.completed !== undefined) {
    update.completedAt = update.completed ? new Date() : null;
  }

  const task = await DailyTask.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.userId
    },
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  res.json(task);
});

r.delete('/daily-tasks/:id', async (req, res) => {
  const task = await DailyTask.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.userId,
      archivedAt: null
    },
    {
      $set: { archivedAt: new Date() }
    },
    { new: true }
  );

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  res.json({ message: 'Task deleted' });
});

r.get('/dashboard', async (req, res) => {
  const date = req.query.date;

  if (!validDate(date)) {
    return res.status(400).json({ message: 'Valid date is required' });
  }

  await ensurePrayerHabits(req.userId);

  const habits = await Habit.find({
    userId: req.userId,
    active: true
  }).sort({ category: 1, sortOrder: 1, createdAt: 1 });

  const ids = habits.map(h => h._id);

  const [entries, tasks] = await Promise.all([
    HabitEntry.find({
      userId: req.userId,
      date,
      habitId: { $in: ids }
    }),

    DailyTask.find({
      userId: req.userId,
      date,
      archivedAt: null
    }).sort({ priority: -1, createdAt: 1 })
  ]);

  const status = new Map(
    entries.map(e => [String(e.habitId), e.completed])
  );

  const habitItems = habits.map(h => ({
    id: String(h._id),
    title: h.title,
    category: h.category,
    habitType: h.habitType,
    completed: status.get(String(h._id)) || false
  }));

  const completedHabits = habitItems.filter(h => h.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const total = habitItems.length + tasks.length;
  const done = completedHabits + completedTasks;

  res.json({
    date,
    habits: habitItems,
    tasks,
    stats: {
      total,
      done,
      pending: total - done,
      percentage: total ? Math.round(done / total * 100) : 0,
      prayers: habitItems.filter(
        h => h.category === 'namaz' && h.completed
      ).length,
      prayerTotal: 5
    }
  });
});

export default r;
