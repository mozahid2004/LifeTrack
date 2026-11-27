
import { useEffect, useState } from 'react';
import { Bell, Save, ShieldCheck } from 'lucide-react';
import api from '../lib/api';

export default function Settings() {
    const [data, setData] = useState({
        timezone: 'Asia/Kolkata',
        reminder: {
            enabled: false,
            time: '21:00',
            days: [0, 1, 2, 3, 4, 5, 6]
        },
        preferences: {
            theme: 'hybrid'
        },
        leaderboardOptIn: false
    }),
        [notifications, setNotifications] = useState([]),
        [msg, setMsg] = useState('');

    useEffect(() => {
        api.get('/profile').then(r => setData(r.data));
        api.get('/notifications').then(r => setNotifications(r.data));
    }, []);

    const save = async () => {
        await api.put('/profile', data);
        setMsg('Settings saved');
        setTimeout(() => setMsg(''), 2500);
    };

    const reminder = {
        ...{
            enabled: false,
            time: '21:00',
            days: [0, 1, 2, 3, 4, 5, 6]
        },
        ...data.reminder
    };

    const toggleDay = d => setData({
        ...data,
        reminder: {
            ...reminder,
            days: reminder.days.includes(d)
                ? reminder.days.filter(x => x !== d)
                : [...reminder.days, d]
        }
    });

    return (
        <div className="space-y-5">
            <div>
                <div className="text-xs text-slate-400">
                    PERSONAL PREFERENCES
                </div>

                <h1 className="section-title text-3xl mt-1">
                    Settings
                </h1>

                <p className="text-sm text-slate-400 mt-2">
                    Control your reminders, timezone and app preferences.
                </p>
            </div>

            <section className="main-card p-5">
                <div className="flex items-center gap-2">
                    <Bell className="text-emerald-700" size={18} />
                    <h2 className="font-extrabold">Daily reminders</h2>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                    Receive an in-app check-in reminder at your chosen time.
                </p>

                <label className="flex items-center justify-between mt-5">
                    <span className="text-sm font-semibold">
                        Enable daily reminder
                    </span>

                    <input
                        type="checkbox"
                        checked={reminder.enabled}
                        onChange={e => setData({
                            ...data,
                            reminder: {
                                ...reminder,
                                enabled: e.target.checked
                            }
                        })}
                        className="w-5 h-5 accent-emerald-600"
                    />
                </label>

                <div className="grid md:grid-cols-2 gap-3 mt-4">
                    <label className="text-xs font-bold text-slate-500">
                        Reminder time
                        <input
                            type="time"
                            className="field mt-2"
                            value={reminder.time}
                            onChange={e => setData({
                                ...data,
                                reminder: {
                                    ...reminder,
                                    time: e.target.value
                                }
                            })}
                        />
                    </label>

                    <label className="text-xs font-bold text-slate-500">
                        Timezone
                        <select
                            className="field mt-2"
                            value={data.timezone}
                            onChange={e => setData({
                                ...data,
                                timezone: e.target.value,
                                reminder: { ...reminder }
                            })}
                        >
                            <option>Asia/Kolkata</option>
                            <option>Asia/Dubai</option>
                            <option>Europe/London</option>
                            <option>America/New_York</option>
                            <option>UTC</option>
                        </select>
                    </label>
                </div>

                <div className="mt-4">
                    <div className="text-xs font-bold text-slate-500 mb-2">
                        Repeat on
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                            <button
                                key={d}
                                onClick={() => toggleDay(i)}
                                className={
                                    'rounded-lg px-3 py-2 text-xs font-bold ' +
                                    (reminder.days.includes(i)
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-400')
                                }
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 text-blue-800 rounded-xl p-3 text-xs mt-4">
                    Browser notifications require permission and the app to be open. In-app notifications are saved to your account.
                </div>
            </section>

            <section className="main-card p-5">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="text-emerald-700" size={18} />
                    <h2 className="font-extrabold">Leaderboard privacy</h2>
                </div>

                <p className="text-xs text-slate-400 mt-2">
                    Joining is optional. Only your display name and activity score are shown. Your email, tasks and habit names stay private.
                </p>

                <label className="flex items-center justify-between gap-4 mt-4">
                    <span className="text-sm font-semibold">
                        Show me on the leaderboard
                    </span>

                    <input
                        type="checkbox"
                        checked={!!data.leaderboardOptIn}
                        onChange={e => setData({
                            ...data,
                            leaderboardOptIn: e.target.checked
                        })}
                        className="w-5 h-5 accent-emerald-600"
                    />
                </label>
            </section>

            <section className="main-card p-5">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="text-emerald-700" size={18} />
                    <h2 className="font-extrabold">Appearance</h2>
                </div>

                <label className="text-xs font-bold text-slate-500 block mt-4">
                    Theme
                    <select
                        className="field mt-2"
                        value={data.preferences?.theme || 'hybrid'}
                        onChange={e => setData({
                            ...data,
                            preferences: {
                                ...data.preferences,
                                theme: e.target.value
                            }
                        })}
                    >
                        <option value="hybrid">
                            Hybrid — dark sidebar, light workspace
                        </option>
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                    </select>
                </label>
            </section>

            <section className="main-card p-5">
                <h2 className="font-extrabold">
                    Recent notifications
                </h2>

                <div className="mt-3 space-y-2">
                    {notifications.map(n => (
                        <button
                            key={n._id}
                            onClick={() => api.patch(`/notifications/${n._id}/read`).then(() => setNotifications(ns => ns.map(x => x._id === n._id ? { ...x, read: true } : x)))}
                            className="w-full text-left p-3 rounded-xl bg-slate-50"
                        >
                            <div className="flex justify-between">
                                <b className="text-sm">{n.title}</b>

                                {!n.read && (
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                )}
                            </div>

                            <p className="text-xs text-slate-500 mt-1">
                                {n.message}
                            </p>
                        </button>
                    ))}

                    {!notifications.length && (
                        <p className="text-xs text-slate-400 py-3">
                            No notifications yet.
                        </p>
                    )}
                </div>
            </section>

            <div className="flex justify-end items-center gap-3">
                <span className="text-xs text-emerald-700">
                    {msg}
                </span>

                <button
                    onClick={save}
                    className="btn btn-primary flex gap-2 items-center"
                >
                    <Save size={15} />
                    Save settings
                </button>
            </div>
        </div>
    );
}
