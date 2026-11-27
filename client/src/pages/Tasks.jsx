
import { useEffect, useState } from 'react';
import {
    Plus,
    Archive,
    Heart,
    BookOpen,
    CheckCircle2,
    Pencil,
    Check,
    X
} from 'lucide-react';
import api from '../lib/api';

export default function Tasks() {
    const [habits, setHabits] = useState([]),
        [form, setForm] = useState({
            title: '',
            category: 'self',
            habitType: 'build'
        }),
        [editing, setEditing] = useState(null),
        [editForm, setEditForm] = useState({
            title: '',
            habitType: 'build'
        }),
        [busy, setBusy] = useState(false),
        [error, setError] = useState(''),
        [message, setMessage] = useState('');

    const load = () => api.get('/tracking/habits')
        .then(r => setHabits(r.data))
        .catch(e => setError(e.response?.data?.message || 'Could not load habits'));

    useEffect(() => {
        load();
    }, []);

    const add = async e => {
        e.preventDefault();
        setBusy(true);
        setError('');
        setMessage('');

        try {
            await api.post('/tracking/habits', form);
            setForm({ ...form, title: '' });
            setMessage('Habit added to your daily checklist.');
            load();
        } catch (e) {
            setError(e.response?.data?.message || 'Could not add habit');
        } finally {
            setBusy(false);
        }
    };

    const startEdit = h => {
        setEditing(h._id);
        setEditForm({
            title: h.title,
            habitType: h.habitType || 'build'
        });
    };

    const saveEdit = async id => {
        try {
            await api.put(`/tracking/habits/${id}`, editForm);
            setEditing(null);
            load();
        } catch (e) {
            setError(e.response?.data?.message || 'Could not update habit');
        }
    };

    const archive = async h => {
        if (!window.confirm(`Archive "${h.title}"? Past tracking records will be kept.`)) return;

        try {
            await api.delete(`/tracking/habits/${h._id}`);
            load();
        } catch (e) {
            setError(e.response?.data?.message || 'Could not archive habit');
        }
    };

    const section = (category, title, Icon) => {
        const items = habits.filter(h => h.category === category);

        return (
            <section className="main-card p-5" key={category}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
                        <Icon size={18} />
                    </div>

                    <div>
                        <h2 className="font-extrabold">{title}</h2>
                        <p className="text-xs text-slate-400">
                            {items.length} active habits
                        </p>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {items.map(h => (
                        <div key={h._id} className="py-3">
                            {editing === h._id ? (
                                <div className="space-y-2">
                                    <input
                                        className="field"
                                        value={editForm.title}
                                        onChange={e => setEditForm({
                                            ...editForm,
                                            title: e.target.value
                                        })}
                                    />

                                    {category === 'self' && (
                                        <select
                                            className="field"
                                            value={editForm.habitType}
                                            onChange={e => setEditForm({
                                                ...editForm,
                                                habitType: e.target.value
                                            })}
                                        >
                                            <option value="build">Build</option>
                                            <option value="avoid">Avoid</option>
                                        </select>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => saveEdit(h._id)}
                                            className="btn btn-primary flex gap-1 items-center"
                                        >
                                            <Check size={14} />
                                            Save
                                        </button>

                                        <button
                                            onClick={() => setEditing(null)}
                                            className="btn btn-soft flex gap-1 items-center"
                                        >
                                            <X size={14} />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <CheckCircle2
                                        size={17}
                                        className="text-emerald-500"
                                    />

                                    <div className="flex-1">
                                        <div className="text-sm font-semibold">
                                            {h.title}
                                        </div>

                                        {category === 'self' && (
                                            <div className="text-[10px] text-slate-400 uppercase mt-0.5">
                                                {h.habitType === 'avoid' ? 'Avoid' : 'Build'} habit
                                            </div>
                                        )}
                                    </div>

                                    {category !== 'namaz' && (
                                        <>
                                            <button
                                                onClick={() => startEdit(h)}
                                                className="text-slate-300 hover:text-blue-600 p-2"
                                                title="Edit habit"
                                            >
                                                <Pencil size={15} />
                                            </button>

                                            <button
                                                onClick={() => archive(h)}
                                                className="text-slate-300 hover:text-red-500 p-2"
                                                title="Archive habit"
                                            >
                                                <Archive size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {!items.length && (
                        <p className="text-xs text-slate-400 py-4">
                            No habits added yet.
                        </p>
                    )}
                </div>
            </section>
        );
    };

    return (
        <div className="space-y-5">
            <div>
                <div className="text-xs text-slate-400">
                    REUSABLE ROUTINES
                </div>

                <h1 className="section-title text-3xl mt-1">
                    Your habits
                </h1>

                <p className="text-sm text-slate-500 mt-2">
                    Create a habit once. It stays on your daily checklist until you archive it.
                </p>
            </div>

            <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-5">
                <form onSubmit={add} className="main-card p-5 h-fit">
                    <h2 className="font-extrabold text-lg">
                        Create a habit
                    </h2>

                    <p className="text-xs text-slate-400 mt-1">
                        Namaz is already set up as five separate prayers.
                    </p>

                    {error && (
                        <p className="text-xs text-red-600 mt-3">
                            {error}
                        </p>
                    )}

                    {message && (
                        <p className="text-xs text-emerald-700 mt-3">
                            {message}
                        </p>
                    )}

                    <div className="space-y-3 mt-4">
                        <label className="block text-xs font-bold text-slate-500">
                            Habit name
                            <input
                                className="field mt-1"
                                placeholder="e.g. Morning gym, Read 10 pages"
                                value={form.title}
                                onChange={e => setForm({
                                    ...form,
                                    title: e.target.value
                                })}
                                required
                                maxLength={100}
                            />
                        </label>

                        <label className="block text-xs font-bold text-slate-500">
                            Category
                            <select
                                className="field mt-1"
                                value={form.category}
                                onChange={e => setForm({
                                    ...form,
                                    category: e.target.value
                                })}
                            >
                                <option value="fitness">Fitness</option>
                                <option value="self">Self Improvement</option>
                            </select>
                        </label>

                        {form.category === 'self' && (
                            <label className="block text-xs font-bold text-slate-500">
                                Habit type
                                <select
                                    className="field mt-1"
                                    value={form.habitType}
                                    onChange={e => setForm({
                                        ...form,
                                        habitType: e.target.value
                                    })}
                                >
                                    <option value="build">
                                        Build a positive habit
                                    </option>
                                    <option value="avoid">
                                        Avoid a negative habit
                                    </option>
                                </select>
                            </label>
                        )}

                        <button
                            disabled={busy}
                            className="btn btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <Plus size={16} />
                            {busy ? 'Adding…' : 'Add habit'}
                        </button>
                    </div>
                </form>

                <div className="space-y-4">
                    {section('namaz', 'Namaz · 5 daily prayers', CheckCircle2)}
                    {section('fitness', 'Fitness', Heart)}
                    {section('self', 'Self Improvement', BookOpen)}
                </div>
            </div>
        </div>
    );
}
