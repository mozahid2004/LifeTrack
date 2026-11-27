
import { Router } from 'express';
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Habit from '../models/Habit.js';
import HabitEntry from '../models/HabitEntry.js';
import DailyTask from '../models/DailyTask.js';

const r = Router();

r.use(auth);

function dateRange(period) {
  const today = new Date();
  const day = format(today, 'yyyy-MM-dd');

  if (period === 'daily') {
    return {
      start: day,
      end: day,
      days: 1,
      label: 'Today'
    };
  }

  if (period === 'monthly') {
    const start = format(startOfMonth(today), 'yyyy-MM-dd');
    const end = format(endOfMonth(today), 'yyyy-MM-dd');

    return {
      start,
      end: day,
      days: differenceInCalendarDays(today, startOfMonth(today)) + 1,
      label: format(today, 'MMMM yyyy')
    };
  }

  if (period === 'all') {
    return {
      start: '2000-01-01',
      end: day,
      days: differenceInCalendarDays(
        today,
        new Date('2000-01-01T00:00:00')
      ) + 1,
      label: 'All time'
    };
  }

  const startDate = startOfWeek(today, { weekStartsOn: 1 });

  return {
    start: format(startDate, 'yyyy-MM-dd'),
    end: day,
    days: differenceInCalendarDays(today, startDate) + 1,
    label: 'This week'
  };
}

r.get('/', async (req, res) => {
  try {
    const period = ['daily', 'weekly', 'monthly', 'all'].includes(req.query.period)
      ? req.query.period
      : 'weekly';

    const range = dateRange(period);

    const users = await User.find({ leaderboardOptIn: true })
      .select('_id name createdAt')
      .lean();

    if (!users.length) {
      return res.json({
        period,
        label: range.label,
        start: range.start,
        end: range.end,
        rankings: [],
        optedIn: false,
        message: 'No one has joined the leaderboard yet. Opt in to be the first.'
      });
    }

    const ids = users.map(u => u._id);

    const [habits, entries, tasks] = await Promise.all([
      Habit.find({
        userId: { $in: ids },
        createdAt: {
          $lte: new Date(`${range.end}T23:59:59.999Z`)
        },
        $or: [
          { archivedAt: null },
          {
            archivedAt: {
              $gte: new Date(`${range.start}T00:00:00.000Z`)
            }
          }
        ]
      })
        .select('userId createdAt archivedAt')
        .lean(),

      HabitEntry.find({
        userId: { $in: ids },
        date: {
          $gte: range.start,
          $lte: range.end
        },
        completed: true
      })
        .select('userId habitId date')
        .lean(),

      DailyTask.find({
        userId: { $in: ids },
        date: {
          $gte: range.start,
          $lte: range.end
        },
        archivedAt: null
      })
        .select('userId completed')
        .lean()
    ]);

    const rows = users.map(user => {
      const userId = String(user._id);

      const userHabits = habits.filter(
        h => String(h.userId) === userId
      );

      const userEntries = entries.filter(
        e => String(e.userId) === userId
      );

      const userTasks = tasks.filter(
        t => String(t.userId) === userId
      );

      let habitPossible = 0;

      for (const habit of userHabits) {
        const createdDay = format(
          new Date(habit.createdAt),
          'yyyy-MM-dd'
        );

        const activeFrom = createdDay > range.start
          ? createdDay
          : range.start;

        const archivedDay = habit.archivedAt
          ? format(new Date(habit.archivedAt), 'yyyy-MM-dd')
          : range.end;

        const activeThrough = archivedDay < range.end
          ? archivedDay
          : range.end;

        if (activeFrom <= activeThrough) {
          habitPossible += differenceInCalendarDays(
            new Date(`${activeThrough}T12:00:00`),
            new Date(`${activeFrom}T12:00:00`)
          ) + 1;
        }
      }

      const possible = habitPossible + userTasks.length;

      const completed = userEntries.length +
        userTasks.filter(t => t.completed).length;

      const score = possible
        ? Math.min(100, Math.round((completed / possible) * 100))
        : 0;

      return {
        userId,
        name: user.name,
        score,
        completed,
        total: possible,
        points: completed * 10 + score,
        isYou: userId === String(req.userId)
      };
    }).filter(row => row.total > 0);

    rows.sort(
      (a, b) =>
        b.score - a.score ||
        b.completed - a.completed ||
        a.name.localeCompare(b.name)
    );

    const rankings = rows.map((row, index) => ({
      ...row,
      rank: index + 1
    }));

    res.json({
      period,
      label: range.label,
      start: range.start,
      end: range.end,
      rankings,
      optedIn: rankings.some(row => row.isYou),
      message: rankings.length
        ? ''
        : 'No completed or scheduled activity in this period yet.'
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      message: 'Could not load leaderboard'
    });
  }
});

export default r;
