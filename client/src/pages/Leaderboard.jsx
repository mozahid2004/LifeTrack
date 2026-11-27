
import { useCallback, useEffect, useState } from 'react';
import {
  Award,
  Crown,
  Medal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Users
} from 'lucide-react';
import api from '../lib/api';

const periods = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This week' },
  { id: 'monthly', label: 'This month' },
  { id: 'all', label: 'All time' }
];

function medal(rank) {
  if (rank === 1) {
    return <Crown size={19} className="text-amber-500" />;
  }

  if (rank === 2) {
    return <Medal size={19} className="text-slate-400" />;
  }

  if (rank === 3) {
    return <Medal size={19} className="text-orange-600" />;
  }

  return (
    <span className="text-sm font-extrabold text-slate-400">
      #{rank}
    </span>
  );
}

export default function Leaderboard() {
  const [period, setPeriod] = useState('weekly');
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [board, me] = await Promise.all([
        api.get(`/leaderboard?period=${period}`),
        api.get('/profile')
      ]);

      setData(board.data);
      setProfile(me.data);
    } catch (e) {
      setError(
        e.response?.data?.message ||
        'Could not load the leaderboard. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleParticipation = async () => {
    if (!profile) return;

    setSaving(true);
    setError('');

    try {
      const next = !profile.leaderboardOptIn;

      const result = await api.put('/profile', {
        leaderboardOptIn: next
      });

      setProfile(result.data);

      const board = await api.get(`/leaderboard?period=${period}`);
      setData(board.data);
    } catch (e) {
      setError(
        e.response?.data?.message ||
        'Could not update your leaderboard preference.'
      );
    } finally {
      setSaving(false);
    }
  };

  const rankings = data?.rankings || [];
  const topThree = rankings.slice(0, 3);
  const me = rankings.find(row => row.isYou);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold tracking-wider text-slate-400">
            CONSISTENCY, NOT COMPETITION
          </div>

          <h1 className="section-title text-3xl mt-1">
            Leaderboard
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            See how opted-in LifeTrack members are staying consistent.
          </p>
        </div>

        <button
          onClick={load}
          className="btn btn-soft flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw
            size={15}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      <section className="main-card p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-3 items-start">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center shrink-0">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h2 className="font-extrabold">
              Your privacy, your choice
            </h2>

            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Joining is optional. Other members can see only your name and completion score.
              Your email, individual habits and task titles are never shown.
            </p>
          </div>
        </div>

        <button
          onClick={toggleParticipation}
          disabled={saving || !profile}
          className={
            'btn shrink-0 ' +
            (profile?.leaderboardOptIn ? 'btn-soft' : 'btn-primary')
          }
        >
          {saving
            ? 'Saving…'
            : profile?.leaderboardOptIn
              ? 'Leave leaderboard'
              : 'Join leaderboard'}
        </button>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={
                'rounded-xl px-4 py-2 text-xs font-bold transition ' +
                (
                  period === p.id
                    ? 'bg-[#172d42] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-500 hover:border-emerald-300'
                )
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {data?.label && (
          <span className="text-xs text-slate-400">
            {data.label}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="main-card p-12 text-center text-slate-400">
          Loading rankings…
        </div>
      ) : (
        <>
          {topThree.length > 0 && (
            <section className="grid md:grid-cols-3 gap-3 items-end">
              {[topThree[1], topThree[0], topThree[2]]
                .filter(Boolean)
                .map((row, i) => {
                  const first = row.rank === 1;

                  return (
                    <div
                      key={row.userId}
                      className={
                        'main-card p-5 text-center ' +
                        (
                          first
                            ? 'md:py-8 border-amber-200 bg-gradient-to-b from-amber-50/70 to-white'
                            : ''
                        )
                      }
                    >
                      <div
                        className={
                          'w-14 h-14 rounded-full mx-auto grid place-items-center text-lg font-extrabold ' +
                          (
                            first
                              ? 'bg-amber-100 text-amber-700'
                              : row.rank === 2
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-orange-50 text-orange-700'
                          )
                        }
                      >
                        <UserRound size={24} />
                      </div>

                      <div className="flex justify-center items-center gap-1 mt-3">
                        {medal(row.rank)}

                        <span className="text-[10px] uppercase tracking-wider text-slate-400">
                          {row.rank === 1
                            ? 'Top performer'
                            : `Rank ${row.rank}`}
                        </span>
                      </div>

                      <div className="font-extrabold mt-2 truncate">
                        {row.name}
                        {row.isYou ? ' (You)' : ''}
                      </div>

                      <div className="metric text-3xl font-extrabold mt-1">
                        {row.score}%
                      </div>

                      <div className="text-xs text-slate-400 mt-1">
                        {row.completed} of {row.total} completed
                      </div>
                    </div>
                  );
                })}
            </section>
          )}

          <section className="main-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold">
                  Member rankings
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Ranked by completion percentage
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Users size={15} />
                {rankings.length} members
              </div>
            </div>

            {rankings.length ? (
              <div className="divide-y divide-slate-100">
                {rankings.map(row => (
                  <div
                    key={row.userId}
                    className={
                      'px-5 py-4 flex items-center gap-3 ' +
                      (row.isYou ? 'bg-emerald-50/60' : '')
                    }
                  >
                    <div className="w-8 flex justify-center">
                      {medal(row.rank)}
                    </div>

                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-extrabold grid place-items-center">
                      {row.name?.[0]?.toUpperCase() || '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">
                        {row.name}

                        {row.isYou && (
                          <span className="ml-2 text-[10px] text-emerald-700 font-extrabold">
                            YOU
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1">
                        {row.completed} completed · {row.total} tracked
                      </div>
                    </div>

                    <div className="w-24 sm:w-36">
                      <div className="text-right text-sm font-extrabold mb-1">
                        {row.score}%
                      </div>

                      <div className="progress">
                        <span style={{ width: `${row.score}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 mx-auto grid place-items-center">
                  <Trophy size={25} />
                </div>

                <h3 className="font-extrabold mt-4">
                  No rankings yet
                </h3>

                <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  {data?.message ||
                    'Join the leaderboard and invite other LifeTrack members to participate.'}
                </p>

                {!profile?.leaderboardOptIn && (
                  <button
                    onClick={toggleParticipation}
                    disabled={saving}
                    className="btn btn-primary mt-4"
                  >
                    {saving ? 'Joining…' : 'Be the first to join'}
                  </button>
                )}
              </div>
            )}
          </section>

          {me && (
            <div className="rounded-2xl bg-[#172d42] text-white p-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center">
                  <Award size={21} />
                </div>

                <div>
                  <div className="text-sm font-bold">
                    Your position
                  </div>

                  <div className="text-xs text-slate-300 mt-1">
                    Keep building consistency, one day at a time.
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-extrabold">
                  #{me.rank}
                </div>

                <div className="text-xs text-slate-300">
                  {me.score}% score
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-[11px] text-slate-400 flex items-center gap-2">
        <Sparkles size={13} />
        Scores compare completed habits and daily tasks against tracked opportunities in the selected period. Only members who opt in appear.
      </p>
    </div>
  );
}
