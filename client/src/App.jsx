
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Tracker from './pages/Tracker';
import Planner from './pages/Planner';
import Tasks from './pages/Tasks';
import DailyTasks from './pages/DailyTasks';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Leaderboard from './pages/Leaderboard';

function Guard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-500">
        Loading LifeTrack…
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function RoutesView() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth register />} />

      <Route
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/habits" element={<Tasks />} />
        <Route
          path="/tasks"
          element={<Navigate to="/daily-tasks" replace />}
        />
        <Route path="/daily-tasks" element={<DailyTasks />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoutesView />
      </AuthProvider>
    </BrowserRouter>
  );
}
