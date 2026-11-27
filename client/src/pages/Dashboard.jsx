
import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Activity,
  CheckCircle2,
  Circle,
  Plus,
  ArrowRight,
  Clock3,
  CalendarDays,
  Flame,
  BookOpen,
  BriefcaseBusiness,
  Heart,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const today = () => format(new Date(), 'yyyy-MM-dd');

const groups = [
  ['namaz', 'Namaz', 'Moon'],
  ['fitness', 'Fitness', 'Heart'],
  ['self', 'Self Improvement', 'Sparkles']
];

export default function Dashboard() {
  const [date, setDate] = useState(today()),
    [data, setData] = useState(null),
    [week, setWeek] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [d, w] = await Promise.all([
        api.get(`/tracking/dashboard?date=${date}`),
        api.get(`/reports/weekly?date=${date}`)
      ]);

      setData(d.data);
      setWeek(w.data);
    } catch (e) {
      setError(
        e.response?.data?.message ||
        'Could not load your day. Check the server connection.'
      );
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleHabit = async h => {
    const completed = !h.completed;

    setData(d => ({
      ...d,
      habits: d.habits.map(x =>
        x.id === h.id ? { ...x, completed } : x
      )
    }));

    try {
      await api.put(`/tracking/habits/${h.id}/entries`, {
        date,
        completed
      });
    } catch {
      load();
    }
  };

  const toggleTask = async t => {
    const completed = !t.completed;

    setData(d => ({
      ...d,
      tasks: d.tasks.map(x =>
        x._id === t._id ? { ...x, completed } : x
      ),
      stats: {
        ...d.stats,
        done: d.stats.done + (completed ? 1 : -1)
      }
    }));

    try {
      await api.put(`/tracking/daily-tasks/${t._id}`, {
        completed
      });
    } catch {
      load();
    }
  };

  const total =
    (data?.habits?.length || 0) +
    (data?.tasks?.length || 0);

  const done =
    (data?.habits || []).filter(h => h.completed).length +
    (data?.tasks || []).filter(t => t.completed).length;

  const stats = {
    total,
    done,
    pending: total - done,
    percentage: total ? Math.round(done / total * 100) : 0
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-slate-400">
            {format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
          </div>

          <h1 className="section-title text-3xl mt-1">
            Today at a glance
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Your habits and tasks, together in one place.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            aria-label="Dashboard date"
            type="date"
            className="field !w-auto"
            value={date}
            onChange={e => setDate(e.target.value)}
          />

          <button
            onClick={load}
            className="btn btn-soft"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>

          <Link
            to="/daily-tasks"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Add task
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 p-4 text-sm">
          {error}

          <button
            onClick={load}
            className="underline ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="main-card p-10 text-center text-slate-400">
          Loading your day…
        </div>
      ) : (
        data && (
          <>
            <section className="main-card p-5 md:p-6">
              <div className="flex flex-wrap justify-between gap-4 items-center">
                <div>
                  <div className="text-xs font-bold tracking-wider text-slate-400">
                    DAILY COMPLETION
                  </div>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="metric text-4xl md:text-5xl font-extrabold">
                      {stats.percentage}%
                    </span>

                    <span className="text-sm text-slate-400">
                      {stats.done} of {stats.total} completed
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    {stats.pending === 0 && stats.total > 0
                      ? 'Everything is checked off.'
                      : `${stats.pending} items remaining. Keep it realistic and steady.`}
                  </p>
                </div>

                <div
                  className="w-24 h-24 rounded-full grid place-items-center"
                  style={{
                    background: `conic-gradient(#10b981 ${stats.percentage}%,#edf2f7 0)`
                  }}
                >
                  <div className="w-[76px] h-[76px] rounded-full bg-white grid place-items-center">
                    <Activity
                      className="text-emerald-600"
                      size={27}
                    />
                  </div>
                </div>
              </div>

              <div className="progress mt-5 !h-2.5">
                <span style={{ width: `${stats.percentage}%` }} />
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-400">
                    Habits & tasks
                  </div>
                  <b className="text-xl">{stats.total}</b>
                </div>

                <div className="rounded-xl bg-emerald-50 p-3">
                  <div className="text-xs text-emerald-700">
                    Completed
                  </div>
                  <b className="text-xl text-emerald-800">
                    {stats.done}
                  </b>
                </div>

                <div className="rounded-xl bg-amber-50 p-3">
                  <div className="text-xs text-amber-700">
                    Remaining
                  </div>
                  <b className="text-xl text-amber-800">
                    {stats.pending}
                  </b>
                </div>
              </div>
            </section>

            <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-5">
              <section className="main-card p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="font-extrabold text-lg">
                      Permanent habits
                    </h2>

                    <p className="text-xs text-slate-400 mt-1">
                      Created once · checked every day
                    </p>
                  </div>

                  <Link
                    to="/habits"
                    className="text-xs text-emerald-700 font-bold"
                  >
                    Manage habits{' '}
                    <ArrowRight size={13} className="inline" />
                  </Link>
                </div>

                {groups.map(([key, label]) => {
                  const items = data.habits.filter(
                    h => h.category === key
                  );

                  if (!items.length) return null;

                  return (
                    <div
                      className="mb-5 last:mb-0"
                      key={key}
                    >
                      <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                        {label}{' '}
                        <span className="font-normal">
                          (
                          {
                            items.filter(h =>
                              h.habitType === 'avoid'
                                ? !h.completed
                                : h.completed
                            ).length
                          }
                          /{items.length})
                        </span>
                      </div>

                      <div className="space-y-2">
                        {items.map(h => (
                          <button
                            key={h.id}
                            onClick={() => toggleHabit(h)}
                            className={
                              'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ' +
                              (
                                h.completed
                                  ? 'border-emerald-100 bg-emerald-50/70'
                                  : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                              )
                            }
                          >
                            <span
                              className={
                                h.completed
                                  ? 'text-emerald-600'
                                  : 'text-slate-300'
                              }
                            >
                              {h.completed
                                ? <CheckCircle2 size={21} />
                                : <Circle size={21} />
                              }
                            </span>

                            <span
                              className={
                                'flex-1 text-sm font-semibold ' +
                                (
                                  h.completed
                                    ? 'text-slate-400 line-through'
                                    : 'text-slate-700'
                                )
                              }
                            >
                              {h.title}
                            </span>

                            {h.category === 'self' && (
                              <span className="text-[10px] text-slate-400 uppercase">
                                {h.habitType}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <Link
                  to="/habits"
                  className="btn btn-soft flex justify-center gap-2 mt-4"
                >
                  <Plus size={15} />
                  Add a habit
                </Link>
              </section>

              <section className="main-card p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="font-extrabold text-lg">
                      Today's tasks
                    </h2>

                    <p className="text-xs text-slate-400 mt-1">
                      Date-specific actions
                    </p>
                  </div>

                  <Link
                    to="/daily-tasks"
                    className="text-xs text-emerald-700 font-bold"
                  >
                    Manage{' '}
                    <ArrowRight size={13} className="inline" />
                  </Link>
                </div>

                {data.tasks.length ? (
                  <div className="space-y-2">
                    {data.tasks.map(t => (
                      <div
                        key={t._id}
                        className={
                          'flex items-start gap-3 p-3 rounded-xl border ' +
                          (
                            t.completed
                              ? 'bg-emerald-50/60 border-emerald-100'
                              : 'border-slate-100'
                          )
                        }
                      >
                        <button
                          onClick={() => toggleTask(t)}
                          className={
                            'mt-0.5 ' +
                            (
                              t.completed
                                ? 'text-emerald-600'
                                : 'text-slate-300'
                            )
                          }
                          aria-label={
                            t.completed
                              ? 'Mark incomplete'
                              : 'Mark complete'
                          }
                        >
                          {t.completed
                            ? <CheckCircle2 size={21} />
                            : <Circle size={21} />
                          }
                        </button>

                        <div className="flex-1 min-w-0">
                          <div
                            className={
                              'text-sm font-semibold ' +
                              (
                                t.completed
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-700'
                              )
                            }
                          >
                            {t.title}
                          </div>

                          <div className="flex flex-wrap gap-2 items-center mt-1 text-[11px] text-slate-400">
                            <span className="capitalize">
                              {t.category}
                            </span>

                            {t.dueTime && (
                              <span className="flex items-center gap-1">
                                <Clock3 size={11} />
                                {t.dueTime}
                              </span>
                            )}

                            <span className="capitalize">
                              {t.priority} priority
                            </span>
                          </div>

                          {t.notes && (
                            <p className="text-xs text-slate-400 mt-1">
                              {t.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 mx-auto grid place-items-center text-slate-400">
                      <CalendarDays />
                    </div>

                    <p className="text-sm font-semibold text-slate-600 mt-3">
                      No tasks for this day
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Add the actions you want to finish today.
                    </p>

                    <Link
                      to="/daily-tasks"
                      className="btn btn-primary inline-flex mt-4"
                    >
                      Create today's task
                    </Link>
                  </div>
                )}
              </section>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Link
                to="/tracker"
                className="main-card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
                  <CheckCircle2 />
                </div>

                <div>
                  <b className="text-sm">Daily tracker</b>
                  <p className="text-xs text-slate-400">
                    Review any date
                  </p>
                </div>
              </Link>

              <Link
                to="/planner"
                className="main-card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 grid place-items-center">
                  <CalendarDays />
                </div>

                <div>
                  <b className="text-sm">Plan tomorrow</b>
                  <p className="text-xs text-slate-400">
                    Make a simple schedule
                  </p>
                </div>
              </Link>

              <Link
                to="/reports"
                className="main-card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 grid place-items-center">
                  <Flame />
                </div>

                <div>
                  <b className="text-sm">Progress reports</b>
                  <p className="text-xs text-slate-400">
                    Review your consistency
                  </p>
                </div>
              </Link>
            </div>
          </>
        )
      )}
    </div>
  );
}
