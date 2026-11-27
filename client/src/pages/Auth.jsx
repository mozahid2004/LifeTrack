
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Auth({ register = false }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { login } = useAuth(),
    nav = useNavigate();

  const change = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      await login(form, register ? '/auth/register' : '/auth/login');
      nav('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-white">
      <div className="hidden md:flex bg-[#101827] text-white p-14 flex-col justify-between">
        <div className="flex items-center gap-3">
          <Activity className="text-emerald-400" />
          <b className="text-xl">LifeTrack</b>
        </div>

        <div>
          <div className="text-emerald-300 text-xs tracking-[.2em] font-bold">
            YOUR PERSONAL OPERATING SYSTEM
          </div>

          <h1
            className="text-5xl font-extrabold mt-5 leading-tight"
            style={{ fontFamily: 'Manrope' }}
          >
            Make your days
            <br />
            count. Build a
            <br />
            <span className="text-emerald-400">
              life you respect.
            </span>
          </h1>

          <p className="text-slate-400 mt-6 max-w-sm">
            One clear plan. Five areas of growth. Honest progress, every day.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          LIFETRACK · CONSISTENCY OVER PERFECTION
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-2 mb-12">
            <Activity className="text-emerald-600" />
            <b>LifeTrack</b>
          </div>

          <div className="text-xs text-emerald-700 font-bold tracking-widest">
            WELCOME TO LIFETRACK
          </div>

          <h2 className="section-title text-3xl mt-3">
            {register ? 'Create your account' : 'Welcome back'}
          </h2>

          <p className="text-sm text-slate-400 mt-2">
            {register
              ? 'Start building your personal progress system.'
              : 'Sign in to continue your journey.'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mt-5">
              {error}
            </div>
          )}

          <div className="space-y-4 mt-8">
            {register && (
              <input
                className="field"
                name="name"
                placeholder="Full name"
                value={form.name}
                onChange={change}
                required
              />
            )}

            <input
              className="field"
              type="email"
              name="email"
              placeholder="Email address"
              value={form.email}
              onChange={change}
              required
            />

            <input
              className="field"
              type="password"
              name="password"
              placeholder="Password (minimum 8 characters)"
              value={form.password}
              onChange={change}
              minLength={8}
              required
            />

            <button
              disabled={busy}
              className="btn btn-primary w-full flex justify-center items-center gap-2 py-3"
            >
              {busy
                ? 'Please wait…'
                : register
                  ? 'Create account'
                  : 'Sign in'}
              <ArrowRight size={16} />
            </button>
          </div>

          <p className="text-sm text-slate-500 mt-6">
            {register
              ? 'Already have an account? '
              : 'New to LifeTrack? '}

            <Link
              className="text-emerald-700 font-bold"
              to={register ? '/login' : '/register'}
            >
              {register ? 'Sign in' : 'Create account'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
