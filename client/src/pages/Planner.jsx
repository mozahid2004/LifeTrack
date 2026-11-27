
import { useEffect, useState } from 'react';
import { addDays, format } from 'date-fns';
import { Plus, Trash2, Save, CalendarClock } from 'lucide-react';
import api from '../lib/api';

const cats = ['fitness', 'namaz', 'work', 'skills', 'self'];

export default function Planner() {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    const [date, setDate] = useState(tomorrow),
        [items, setItems] = useState([]),
        [reflection, setReflection] = useState(''),
        [saved, setSaved] = useState('');

    useEffect(() => {
        api.get(`/plans/${date}`).then(r => {
            setItems(r.data.items || []);
            setReflection(r.data.reflection || '');
        });
    }, [date]);

    const add = () => setItems([...items, {
        title: '',
        category: 'work',
        startTime: '',
        endTime: '',
        notes: ''
    }]);

    const update = (i, k, v) => setItems(
        items.map((x, j) => i === j ? { ...x, [k]: v } : x)
    );

    const save = async () => {
        await api.put(`/plans/${date}`, {
            items: items.filter(x => x.title.trim()),
            reflection
        });

        setSaved('Plan saved');
        setTimeout(() => setSaved(''), 2000);
    };

    return (
        <div className="space-y-5">
            <div>
                <div className="text-xs text-slate-400">
                    PLAN WITH INTENTION
                </div>

                <h1 className="section-title text-3xl mt-1">
                    Plan your day
                </h1>

                <p className="text-sm text-slate-400 mt-2">
                    Choose a date, set realistic tasks and give them a time.
                </p>
            </div>

            <section className="main-card p-5">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                        <h2 className="font-extrabold">Daily schedule</h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Plan date
                        </p>
                    </div>

                    <input
                        type="date"
                        className="field !w-auto"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                </div>

                <div className="mt-5 space-y-3">
                    {items.map((x, i) => (
                        <div
                            key={x._id || i}
                            className="rounded-xl border border-slate-100 p-4"
                        >
                            <div className="grid md:grid-cols-[1.4fr_130px_120px_120px_40px] gap-2 items-center">
                                <input
                                    className="field"
                                    placeholder="What needs to get done?"
                                    value={x.title}
                                    onChange={e => update(i, 'title', e.target.value)}
                                />

                                <select
                                    className="field"
                                    value={x.category}
                                    onChange={e => update(i, 'category', e.target.value)}
                                >
                                    {cats.map(c => (
                                        <option value={c} key={c}>
                                            {c[0].toUpperCase() + c.slice(1)}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    className="field"
                                    type="time"
                                    value={x.startTime || ''}
                                    onChange={e => update(i, 'startTime', e.target.value)}
                                />

                                <input
                                    className="field"
                                    type="time"
                                    value={x.endTime || ''}
                                    onChange={e => update(i, 'endTime', e.target.value)}
                                />

                                <button
                                    onClick={() => setItems(items.filter((_, j) => i !== j))}
                                    className="text-slate-400 hover:text-red-500"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>

                            <input
                                className="field mt-2 text-sm"
                                placeholder="Notes or details (optional)"
                                value={x.notes || ''}
                                onChange={e => update(i, 'notes', e.target.value)}
                            />
                        </div>
                    ))}

                    {!items.length && (
                        <div className="text-center py-12 text-sm text-slate-400">
                            <CalendarClock className="mx-auto mb-3" />
                            No tasks planned for this date. Add your first task.
                        </div>
                    )}
                </div>

                <button
                    onClick={add}
                    className="btn btn-soft mt-4 flex items-center gap-2"
                >
                    <Plus size={15} />
                    Add task
                </button>

                <div className="mt-5">
                    <label className="text-xs font-bold text-slate-500">
                        Daily intention / reminder
                        <textarea
                            className="field mt-2"
                            rows="2"
                            value={reflection}
                            onChange={e => setReflection(e.target.value)}
                            placeholder="What matters most today?"
                        />
                    </label>
                </div>

                <div className="flex justify-end items-center gap-3 mt-5">
                    <span className="text-xs text-emerald-700">
                        {saved}
                    </span>

                    <button
                        onClick={save}
                        className="btn btn-primary flex gap-2 items-center"
                    >
                        <Save size={15} />
                        Save plan
                    </button>
                </div>
            </section>
        </div>
    );
}
