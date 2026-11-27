
import { useCallback, useEffect, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Circle,
    CalendarCheck
} from 'lucide-react';
import api from '../lib/api';

export default function Tracker() {
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd')),
        [data, setData] = useState(null),
        [error, setError] = useState('');

    const load = useCallback(() => api.get(`/tracking/dashboard?date=${date}`)
        .then(r => {
            setData(r.data);
            setError('');
        })
        .catch(e => setError(e.response?.data?.message || 'Unable to load tracker')),
        [date]
    );

    useEffect(() => {
        load();
    }, [load]);

    const toggleHabit = async h => {
        const completed = !h.completed;

        setData(d => ({
            ...d,
            habits: d.habits.map(x => x.id === h.id ? { ...x, completed } : x)
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
            tasks: d.tasks.map(x => x._id === t._id ? { ...x, completed } : x)
        }));

        try {
            await api.put(`/tracking/daily-tasks/${t._id}`, { completed });
        } catch {
            load();
        }
    };

    const changeDay = n => setDate(
        format(addDays(parseISO(date), n), 'yyyy-MM-dd')
    );

    const habits = data?.habits || [],
        tasks = data?.tasks || [];

    const total = habits.length + tasks.length,
        done = habits.filter(h => h.completed).length +
            tasks.filter(t => t.completed).length,
        stats = {
            percentage: total ? Math.round(done / total * 100) : 0,
            done,
            total
        };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="text-xs text-slate-400">
                        DAILY CHECK-IN
                    </div>

                    <h1 className="section-title text-3xl mt-1">
                        Daily tracker
                    </h1>

                    <p className="text-sm text-slate-500 mt-2">
                        Review and update habits and tasks for any date.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="btn btn-soft"
                        onClick={() => changeDay(-1)}
                        aria-label="Previous day"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <input
                        type="date"
                        className="field !w-auto"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />

                    <button
                        className="btn btn-soft"
                        onClick={() => changeDay(1)}
                        aria-label="Next day"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3">
                    {error}
                </div>
            )}

            {data && (
                <>
                    <section className="main-card p-5 flex flex-wrap items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
                            <CalendarCheck />
                        </div>

                        <div className="flex-1">
                            <b>
                                {format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
                            </b>

                            <p className="text-xs text-slate-400 mt-1">
                                {stats.done} / {stats.total} completed
                            </p>
                        </div>

                        <div className="text-3xl font-extrabold">
                            {stats.percentage}%
                        </div>

                        <div className="w-full progress">
                            <span style={{ width: `${stats.percentage}%` }} />
                        </div>
                    </section>

                    <div className="grid md:grid-cols-2 gap-5">
                        <section className="main-card p-5">
                            <h2 className="font-extrabold text-lg">
                                Permanent habits
                            </h2>

                            <p className="text-xs text-slate-400 mt-1 mb-4">
                                Your daily routines
                            </p>

                            {['namaz', 'fitness', 'self'].map(cat => {
                                const items = habits.filter(h => h.category === cat);

                                if (!items.length) return null;

                                return (
                                    <div key={cat} className="mb-5 last:mb-0">
                                        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                                            {cat === 'self' ? 'Self Improvement' : cat}
                                        </div>

                                        {items.map(h => (
                                            <button
                                                key={h.id}
                                                onClick={() => toggleHabit(h)}
                                                className="w-full flex items-center gap-3 py-3 border-b border-slate-100 text-left"
                                            >
                                                <span className={h.completed ? 'text-emerald-600' : 'text-slate-300'}>
                                                    {h.completed ? <CheckCircle2 /> : <Circle />}
                                                </span>

                                                <span className="flex-1 text-sm font-semibold">
                                                    {h.title}
                                                </span>

                                                <span className="text-[10px] text-slate-400">
                                                    {h.habitType === 'avoid' ? 'AVOID' : ''}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                        </section>

                        <section className="main-card p-5">
                            <h2 className="font-extrabold text-lg">
                                Date-specific tasks
                            </h2>

                            <p className="text-xs text-slate-400 mt-1 mb-4">
                                Work, skills and personal tasks
                            </p>

                            {tasks.map(t => (
                                <button
                                    key={t._id}
                                    onClick={() => toggleTask(t)}
                                    className="w-full flex items-start gap-3 py-3 border-b border-slate-100 text-left"
                                >
                                    <span className={t.completed ? 'text-emerald-600' : 'text-slate-300'}>
                                        {t.completed ? <CheckCircle2 /> : <Circle />}
                                    </span>

                                    <span className="flex-1">
                                        <span className={'block text-sm font-semibold ' + (t.completed ? 'line-through text-slate-400' : '')}>
                                            {t.title}
                                        </span>

                                        <span className="text-[11px] text-slate-400 capitalize">
                                            {t.category}{t.dueTime ? ` · ${t.dueTime}` : ''}
                                        </span>
                                    </span>
                                </button>
                            ))}

                            {!tasks.length && (
                                <p className="text-sm text-slate-400 py-8 text-center">
                                    No tasks for this date.
                                </p>
                            )}
                        </section>
                    </div>
                </>
            )}
        </div>
    );
}
