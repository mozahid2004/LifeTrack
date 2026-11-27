
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Download, Archive, TrendingUp, CalendarDays } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';
import api from '../lib/api';

export default function Reports() {
    const current = format(new Date(), 'yyyy-MM');

    const [month, setMonth] = useState(current),
        [report, setReport] = useState(null),
        [archives, setArchives] = useState([]);

    const load = () => api.get(`/reports/monthly/${month}`).then(r => setReport(r.data));

    useEffect(() => {
        load();
        api.get('/archives').then(r => setArchives(r.data));
    }, [month]);

    const download = async () => {
        const r = await api.get(`/reports/monthly/${month}/pdf`, {
            responseType: 'blob'
        });

        const url = URL.createObjectURL(r.data),
            a = document.createElement('a');

        a.href = url;
        a.download = `lifetrack-${month}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="text-xs text-slate-400">
                        REFLECT & IMPROVE
                    </div>

                    <h1 className="section-title text-3xl mt-1">
                        Reports & archives
                    </h1>

                    <p className="text-sm text-slate-400 mt-2">
                        Understand your patterns, not just your score.
                    </p>
                </div>

                <div className="flex gap-2">
                    <input
                        className="field !w-auto"
                        type="month"
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                    />

                    <button
                        onClick={download}
                        className="btn btn-primary flex gap-2 items-center"
                    >
                        <Download size={15} />
                        Monthly PDF
                    </button>
                </div>
            </div>

            {report && (
                <>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="main-card p-5">
                            <div className="text-xs text-slate-400 font-bold">
                                MONTHLY AVERAGE
                            </div>

                            <div className="metric text-4xl font-extrabold mt-2">
                                {report.average}%
                            </div>

                            <div className="progress mt-3">
                                <span style={{ width: `${report.average}%` }} />
                            </div>
                        </div>

                        <div className="main-card p-5">
                            <div className="text-xs text-slate-400 font-bold">
                                TRACKED DAYS
                            </div>

                            <div className="metric text-4xl font-extrabold mt-2">
                                {report.trackedDays}
                                <span className="text-lg text-slate-400">
                                    {' '}/ {report.daysInMonth}
                                </span>
                            </div>

                            <p className="text-xs text-slate-400 mt-2">
                                Days with saved entries
                            </p>
                        </div>

                        <div className="main-card p-5">
                            <div className="text-xs text-slate-400 font-bold">
                                MONTH STATUS
                            </div>

                            <div className="mt-3 font-bold">
                                {report.archived ? 'Archived month' : 'Current / available month'}
                            </div>

                            <p className="text-xs text-slate-400 mt-2">
                                Previous data remains preserved.
                            </p>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-5">
                        <section className="main-card p-5">
                            <h2 className="font-extrabold">
                                Category performance
                            </h2>

                            <p className="text-xs text-slate-400 mt-1">
                                Average completion for tracked days
                            </p>

                            <div className="h-64 mt-5">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={Object.entries(report.category).map(([name, value]) => ({
                                            name,
                                            value
                                        }))}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11 }}
                                        />

                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{ fontSize: 11 }}
                                        />

                                        <Tooltip />

                                        <Bar
                                            dataKey="value"
                                            fill="#43b98b"
                                            radius={[6, 6, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section className="main-card p-5">
                            <h2 className="font-extrabold">
                                Weekly review prompts
                            </h2>

                            <p className="text-xs text-slate-400 mt-1">
                                Use these to decide your next improvement.
                            </p>

                            <div className="space-y-4 mt-5">
                                {[
                                    ['Great job', 'Which action made the biggest difference?'],
                                    ['Improve', 'Which category was consistently neglected?'],
                                    ['Next month', 'What is one realistic change to make?']
                                ].map(([a, b]) => (
                                    <div key={a}>
                                        <div className="text-sm font-bold">
                                            {a}
                                        </div>

                                        <p className="text-xs text-slate-400 mt-1">
                                            {b}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <section className="main-card p-5">
                        <h2 className="font-extrabold">
                            Daily completion
                        </h2>

                        <div className="grid grid-cols-7 gap-2 mt-4">
                            {report.daily.map(d => (
                                <div key={d.date} className="calendar-day">
                                    <div className="text-[10px] text-slate-400">
                                        {d.date.slice(-2)}
                                    </div>

                                    <div className="font-bold text-sm mt-1">
                                        {d.hasEntry ? `${d.score}%` : '—'}
                                    </div>

                                    <div className="progress mt-2">
                                        <span style={{ width: `${d.score}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            )}

            <section className="main-card p-5">
                <div className="flex items-center gap-2">
                    <Archive size={18} className="text-emerald-700" />
                    <h2 className="font-extrabold">
                        Monthly archive
                    </h2>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                    Your previous months are retained and can be reviewed anytime.
                </p>

                <div className="mt-4 space-y-2">
                    {archives.map(a => (
                        <button
                            key={a.month}
                            onClick={() => setMonth(a.month)}
                            className="w-full rounded-xl bg-slate-50 hover:bg-emerald-50 p-3 flex justify-between text-sm"
                        >
                            <b>{a.month}</b>

                            <span className="text-slate-500">
                                {a.summary?.average || 0}% average →
                            </span>
                        </button>
                    ))}

                    {!archives.length && (
                        <p className="text-xs text-slate-400 py-4">
                            No archived months yet. Your first archive is created at the start of next month.
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}
