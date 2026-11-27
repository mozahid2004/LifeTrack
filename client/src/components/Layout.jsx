
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  CalendarDays,
  ChartNoAxesCombined,
  CheckSquare,
  Home,
  LogOut,
  Settings,
  ClipboardList,
  ListTodo,
  Bell,
  Trophy,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const links = [
  ['/', 'Home', Home],
  ['/tracker', 'Daily tracker', CheckSquare],
  ['/habits', 'Habits', ClipboardList],
  ['/daily-tasks', 'Daily tasks', ListTodo],
  ['/planner', 'Planner', CalendarDays],
  ['/reports', 'Reports', ChartNoAxesCombined],
  ['/leaderboard', 'Leaderboard', Trophy],
  ['/settings', 'Settings', Settings]
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const navItems = links.map(([to, label, Icon]) => (
    <NavLink
      end={to === '/'}
      key={to}
      to={to}
      onClick={() => setOpen(false)}
      className={({ isActive }) => 'nav-link ' + (isActive ? 'active' : '')}
    >
      <Icon size={17} />
      {label}
    </NavLink>
  ));

  return (
    <div className="app-shell flex">
      <aside className="sidebar w-[250px] min-h-screen p-5 flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-400 text-ink grid place-items-center">
            <Activity size={22} />
          </div>

          <div>
            <div className="font-extrabold text-lg" style={{ fontFamily: 'Manrope' }}>
              LifeTrack
            </div>
            <div className="text-[10px] tracking-[.18em] text-slate-400">
              PERSONAL OS
            </div>
          </div>
        </div>

        <div className="text-[10px] font-bold tracking-[.16em] text-slate-500 px-3 mb-3">
          YOUR SPACE
        </div>

        <nav className="space-y-1">
          {navItems}
        </nav>

        <div className="mt-auto rounded-2xl bg-[#1b2a3d] p-4">
          <div className="text-xs font-bold text-white">
            Small steps. Every day.
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Consistency beats intensity. Keep showing up.
          </p>
        </div>

        <button
          onClick={() => {
            logout();
            nav('/login');
          }}
          className="nav-link mt-3"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </aside>

      <main className="ml-[250px] w-full min-h-screen content-wrap p-8 max-w-[1600px] mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs text-slate-400 font-semibold">
              YOUR PERSONAL PROGRESS SPACE
            </div>
            <div className="font-bold text-slate-800 mt-1">
              Good to see you, {user?.name?.split(' ')[0] || 'there'}{' '}
              <span className="text-emerald-600">✦</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => Notification.requestPermission?.()}
              title="Enable browser notifications"
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 grid place-items-center text-slate-500"
            >
              <Bell size={17} />
            </button>

            <div className="w-10 h-10 rounded-full bg-[#dff5eb] text-emerald-800 font-bold grid place-items-center">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <Outlet />
      </main>

      <div className="mobile-nav hidden fixed bottom-0 inset-x-0 bg-white border-t p-2 justify-around z-30">
        {links.map(([to, label, Icon]) => (
          <NavLink
            end={to === '/'}
            key={to}
            to={to}
            className={({ isActive }) =>
              'flex flex-col items-center text-[10px] gap-1 p-2 ' +
              (isActive ? 'text-emerald-700' : 'text-slate-400')
            }
          >
            <Icon size={18} />
            {({
              'Daily tracker': 'Track',
              'Daily tasks': 'Tasks',
              'Reports': 'Reports',
              'Leaderboard': 'Ranks',
              'Settings': 'Settings',
              'Planner': 'Plan',
              'Habits': 'Habits',
              'Home': 'Home'
            })[label]}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
