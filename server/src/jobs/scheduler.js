
import cron from 'node-cron';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import MonthlyArchive from '../models/MonthlyArchive.js';
import Habit from '../models/Habit.js';
import HabitEntry from '../models/HabitEntry.js';
import DailyTask from '../models/DailyTask.js';
import DailyEntry from '../models/DailyEntry.js';
import { format, subMonths } from 'date-fns';
import { scoreEntry } from '../utils/date.js';

export default function startScheduler() {
  cron.schedule(
    '* * * * *',
    async () => {
      try {
        const now = new Date();
        const users = await User.find({ 'reminder.enabled': true });

        for (const u of users) {
          const localTime = new Intl.DateTimeFormat('en-GB', {
            timeZone: u.timezone || 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
          }).format(now);

          const localDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: u.timezone || 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(now);

          const weekday = new Date(`${localDate}T12:00:00`).getDay();

          if (
            localTime === u.reminder.time &&
            u.reminder.days.includes(weekday)
          ) {
            const exists = await Notification.exists({
              userId: u._id,
              type: 'reminder',
              scheduledFor: {
                $gte: new Date(now.getTime() - 60000)
              }
            });

            if (!exists) {
              await Notification.create({
                userId: u._id,
                title: 'Daily LifeTrack check-in',
                message: 'Take a few minutes to review today and plan tomorrow.',
                type: 'reminder',
                scheduledFor: now
              });
            }
          }
        }
      } catch (e) {
        console.error('Reminder scheduler:', e.message);
      }
    },
    { timezone: 'UTC' }
  );

  cron.schedule(
    '5 0 1 * *',
    async () => {
      try {
        const month = format(subMonths(new Date(), 1), 'yyyy-MM');
        const start = `${month}-01`;
        const end = format(
          new Date(
            new Date(`${month}-01T12:00:00`).getFullYear(),
            new Date(`${month}-01T12:00:00`).getMonth() + 1,
            0
          ),
          'yyyy-MM-dd'
        );

        const users = await User.find({}, '_id');

        for (const u of users) {
          const [habits, entries, tasks, legacy] = await Promise.all([
            Habit.find({
              userId: u._id,
              createdAt: {
                $lte: new Date(`${end}T23:59:59.999Z`)
              },
              $or: [
                { archivedAt: null },
                {
                  archivedAt: {
                    $gte: new Date(`${start}T00:00:00.000Z`)
                  }
                }
              ]
            }),
            HabitEntry.find({
              userId: u._id,
              date: {
                $gte: start,
                $lte: end
              }
            }),
            DailyTask.find({
              userId: u._id,
              date: {
                $gte: start,
                $lte: end
              },
              $or: [
                { archivedAt: null },
                {
                  archivedAt: {
                    $gte: new Date(`${start}T00:00:00.000Z`)
                  }
                }
              ]
            }),
            DailyEntry.find({
              userId: u._id,
              date: {
                $gte: start,
                $lte: end
              }
            })
          ]);

          const dates = new Set([
            ...entries.map(x => x.date),
            ...tasks.map(x => x.date)
          ]);

          const byEntry = new Map();

          for (const x of entries) {
            const k = x.date;
            byEntry.set(k, (byEntry.get(k) || 0) + (x.completed ? 1 : 0));
          }

          const byTasks = new Map();

          for (const x of tasks) {
            const k = x.date;
            const a = byTasks.get(k) || { total: 0, done: 0 };

            a.total++;

            if (x.completed) a.done++;

            byTasks.set(k, a);
          }

          const scores = [];

          for (const date of dates) {
            const habitCount = habits.length;
            const task = byTasks.get(date) || { total: 0, done: 0 };
            const done = (byEntry.get(date) || 0) + task.done;
            const total = habitCount + task.total;

            if (total) {
              scores.push(Math.round(done / total * 100));
            }
          }

          if (!scores.length && legacy.length) {
            scores.push(...legacy.map(scoreEntry));
          }

          const summary = {
            trackedDays: dates.size || legacy.length,
            average: scores.length
              ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
              : 0,
            categoryTotals: {}
          };

          await MonthlyArchive.updateOne(
            {
              userId: u._id,
              month
            },
            {
              $setOnInsert: {
                userId: u._id,
                month,
                summary,
                closedAt: new Date()
              }
            },
            { upsert: true }
          );
        }
      } catch (e) {
        console.error('Monthly archive:', e.message);
      }
    },
    { timezone: 'UTC' }
  );
}
