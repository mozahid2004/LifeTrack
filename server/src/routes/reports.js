
import { Router } from 'express';
import PDFDocument from 'pdfkit';
import auth from '../middleware/auth.js';
import DailyEntry from '../models/DailyEntry.js';
import DailyPlan from '../models/DailyPlan.js';
import MonthlyArchive from '../models/MonthlyArchive.js';
import Habit from '../models/Habit.js';
import HabitEntry from '../models/HabitEntry.js';
import DailyTask from '../models/DailyTask.js';
import { monthRange, scoreEntry, validDate } from '../utils/date.js';
import {
  eachDayOfInterval,
  format,
  parseISO,
  startOfWeek,
  endOfWeek
} from 'date-fns';

const r = Router();

r.use(auth);

async function scoreForDate(userId, date) {
  const [habits, entries, tasks, legacy] = await Promise.all([
    Habit.find({
      userId,
      createdAt: {
        $lte: new Date(`${date}T23:59:59.999Z`)
      },
      $or: [
        { archivedAt: null },
        { archivedAt: { $gte: new Date(`${date}T00:00:00.000Z`) } }
      ]
    }),

    HabitEntry.find({ userId, date }),

    DailyTask.find({
      userId,
      date,
      $or: [
        { archivedAt: null },
        { archivedAt: { $gte: new Date(`${date}T00:00:00.000Z`) } }
      ]
    }),

    DailyEntry.findOne({ userId, date })
  ]);

  if (legacy && !habits.length) {
    return {
      score: scoreEntry(legacy),
      hasEntry: true,
      category: {
        fitness: legacy.fitness?.length
          ? Math.round(
              legacy.fitness.filter(x => x.done).length /
              legacy.fitness.length * 100
            )
          : 0,

        namaz: Math.round(
          Object.values(legacy.namaz || {}).filter(Boolean).length / 5 * 100
        ),

        self: legacy.self?.length
          ? Math.round(
              legacy.self.filter(x => x.kind === 'avoid' ? !x.done : x.done).length /
              legacy.self.length * 100
            )
          : 0,

        work: legacy.work?.length
          ? Math.round(
              legacy.work.reduce(
                (a, x) => a + (x.target ? Math.min(x.completed / x.target, 1) : 0),
                0
              ) / legacy.work.length * 100
            )
          : 0,

        skills: legacy.skills?.length
          ? Math.round(
              legacy.skills.reduce(
                (a, x) => a + (x.target ? Math.min(x.completed / x.target, 1) : 0),
                0
              ) / legacy.skills.length * 100
            )
          : 0,

        personal: 0
      }
    };
  }

  const entryMap = new Map(
    entries.map(e => [String(e.habitId), e.completed])
  );

  const values = habits.map(h => {
    const done = entryMap.get(String(h._id)) || false;
    return done;
  });

  const taskValues = tasks.map(t => !!t.completed);
  const all = [...values, ...taskValues];

  const score = all.length
    ? Math.round(all.filter(Boolean).length / all.length * 100)
    : 0;

  const categories = {
    fitness: [],
    namaz: [],
    self: [],
    work: [],
    skills: [],
    personal: []
  };

  habits.forEach(h => {
    const done = entryMap.get(String(h._id)) || false;
    categories[h.category].push(done ? 1 : 0);
  });

  tasks.forEach(t => categories[t.category].push(t.completed ? 1 : 0));

  const category = Object.fromEntries(
    Object.entries(categories).map(([k, v]) => [
      k,
      v.length
        ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 100)
        : 0
    ])
  );

  return {
    score,
    hasEntry: entries.length > 0 || tasks.length > 0,
    category
  };
}

async function monthSummary(userId, month) {
  const { start, end } = monthRange(month);

  const days = eachDayOfInterval({
    start: parseISO(start),
    end: parseISO(end)
  });

  const daily = [];

  const sums = {
    fitness: 0,
    namaz: 0,
    self: 0,
    work: 0,
    skills: 0,
    personal: 0
  };

  const counts = { ...sums };

  let tracked = 0;
  let total = 0;

  for (const d of days) {
    const date = format(d, 'yyyy-MM-dd');
    const result = await scoreForDate(userId, date);

    daily.push({
      date,
      score: result.score,
      hasEntry: result.hasEntry
    });

    if (result.hasEntry) {
      tracked++;
      total += result.score;

      for (const k of Object.keys(sums)) {
        if (result.category[k] > 0 || result.category[k] === 0) {
          const has = await hasCategoryData(userId, date, k);

          if (has) {
            sums[k] += result.category[k];
            counts[k]++;
          }
        }
      }
    }
  }

  const category = Object.fromEntries(
    Object.keys(sums).map(k => [
      k,
      counts[k] ? Math.round(sums[k] / counts[k]) : 0
    ])
  );

  const archive = await MonthlyArchive.findOne({ userId, month });

  return {
    month,
    daysInMonth: days.length,
    trackedDays: tracked,
    average: tracked ? Math.round(total / tracked) : 0,
    daily,
    category,
    archived: !!archive
  };
}

async function hasCategoryData(userId, date, category) {
  const legacy = await DailyEntry.findOne({ userId, date });

  if (legacy) {
    if (category === 'namaz') return true;
    if (category === 'fitness') return !!legacy.fitness?.length;
    if (category === 'self') return !!legacy.self?.length;
    if (category === 'work') return !!legacy.work?.length;
    if (category === 'skills') return !!legacy.skills?.length;
  }

  if (['fitness', 'namaz', 'self'].includes(category)) {
    const hs = await Habit.find({
      userId,
      category,
      createdAt: {
        $lte: new Date(`${date}T23:59:59.999Z`)
      },
      $or: [
        { archivedAt: null },
        { archivedAt: { $gte: new Date(`${date}T00:00:00.000Z`) } }
      ]
    }, '_id');

    return hs.length > 0;
  }

  return !!(
    await DailyTask.exists({
      userId,
      date,
      category,
      $or: [
        { archivedAt: null },
        { archivedAt: { $gte: new Date(`${date}T00:00:00.000Z`) } }
      ]
    })
  );
}

r.get('/weekly', async (req, res) => {
  const date = req.query.date;

  if (!validDate(date)) {
    return res.status(400).json({
      message: 'date=YYYY-MM-DD required'
    });
  }

  const d = parseISO(date);

  const from = format(
    startOfWeek(d, { weekStartsOn: 1 }),
    'yyyy-MM-dd'
  );

  const to = format(
    endOfWeek(d, { weekStartsOn: 1 }),
    'yyyy-MM-dd'
  );

  const days = eachDayOfInterval({
    start: parseISO(from),
    end: parseISO(to)
  });

  const daily = [];

  for (const day of days) {
    const key = format(day, 'yyyy-MM-dd');
    const x = await scoreForDate(req.userId, key);

    daily.push({
      date: key,
      score: x.score,
      hasEntry: x.hasEntry
    });
  }

  const tracked = daily.filter(x => x.hasEntry);

  res.json({
    from,
    to,
    daily,
    average: tracked.length
      ? Math.round(
          tracked.reduce((a, b) => a + b.score, 0) / tracked.length
        )
      : 0,
    trackedDays: tracked.length
  });
});

r.get('/monthly/:month', async (req, res) => {
  try {
    const summary = await monthSummary(req.userId, req.params.month);
    res.json(summary);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

r.get('/monthly/:month/pdf', async (req, res) => {
  try {
    const s = await monthSummary(req.userId, req.params.month);

    res.setHeader('Content-Type', 'application/pdf');

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=lifetrack-${s.month}.pdf`
    );

    const doc = new PDFDocument({ margin: 48 });

    doc.pipe(res);

    doc.fontSize(24).text('LifeTrack — Monthly Report');

    doc.moveDown(0.3)
      .fontSize(12)
      .fillColor('#666')
      .text(s.month);

    doc.moveDown()
      .fillColor('#111')
      .fontSize(16)
      .text(`Overall average: ${s.average}%`);

    doc.fontSize(11).text(
      `Tracked days: ${s.trackedDays} / ${s.daysInMonth}`
    );

    doc.moveDown()
      .fontSize(15)
      .text('Category performance');

    for (const [k, v] of Object.entries(s.category)) {
      doc.fontSize(11).text(
        `${k[0].toUpperCase() + k.slice(1)}: ${v}%`
      );
    }

    doc.moveDown()
      .fontSize(15)
      .text('Daily progress');

    s.daily.forEach(d => {
      doc.fontSize(9).text(
        `${d.date}    ${d.hasEntry ? d.score + '%' : 'Not tracked'}`
      );
    });

    doc.moveDown()
      .fontSize(12)
      .text('Reflection prompts');

    doc.fontSize(10).text(
      'What went well? __________________________________________'
    );

    doc.text(
      'What should improve? ______________________________________'
    );

    doc.text(
      'Priority for next month: ___________________________________'
    );

    doc.end();
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

r.get('/archives', async (req, res) =>
  res.json(
    await MonthlyArchive.find({ userId: req.userId }).sort({ month: -1 })
  )
);

r.get('/archives/:month', async (req, res) => {
  const a = await MonthlyArchive.findOne({
    userId: req.userId,
    month: req.params.month
  });

  if (!a) {
    return res.status(404).json({ message: 'Archive not found' });
  }

  res.json(a);
});

export default r;
