
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  CalendarDays,
  Clock3,
  Pencil,
  Check,
  X
} from 'lucide-react';
import api from '../lib/api';

const today = format(new Date(), 'yyyy-MM-dd');

export default function DailyTasks() {
  const [date, setDate] = useState(today),
    [tasks, setTasks] = useState([]),
    [form, setForm] = useState({
      title: '',
      category: 'work',
      dueTime: '',
      priority: 'medium',
      notes: ''
    }),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(null),
    [editForm, setEditForm] = useState({
      title: '',
      category: 'work',
      dueTime: '',
      priority: 'medium',
      notes: ''
    });

  const load = () =>
    api.get(`/tracking/daily-tasks?date=${date}`)
      .then(r => setTasks(r.data))
      .catch(e => setError(e.response?.data?.message || 'Could not load tasks'));

  useEffect(() => {
    load();
  }, [date]);

  const add = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      await api.post('/tracking/daily-tasks', { ...form, date });

      setForm({
        title: '',
        category: 'work',
        dueTime: '',
        priority: 'medium',
        notes: ''
      });

      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not create task');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async t => {
    setTasks(xs =>
      xs.map(x =>
        x._id === t._id
          ? { ...x, completed: !x.completed }
          : x
      )
    );

    try {
      await api.put(`/tracking/daily-tasks/${t._id}`, {
        completed: !t.completed
      });
    } catch {
      load();
    }
  };

  const startEdit = t => {
    setEditing(t._id);

    setEditForm({
      title: t.title,
      category: t.category,
      dueTime: t.dueTime || '',
      priority: t.priority || 'medium',
      notes: t.notes || ''
    });
  };

  const saveEdit = async id => {
    try {
      await api.put(`/tracking/daily-tasks/${id}`, editForm);
      setEditing(null);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not update task');
    }
  };

  const remove = async id => {
    if (!confirm('Delete this task?')) return;

    try {
      await api.delete(`/tracking/daily-tasks/${id}`);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not delete task');
    }
  };

  const done = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <div className="text-xs text-slate-400">
            DATE-SPECIFIC ACTIONS
          </div>

          <h1 className="section-title text-3xl mt-1">
            Daily tasks
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Add work, learning and personal tasks for a particular day.
          </p>
        </div>

        <input
          aria-label="Task date"
          type="date"
          className="field !w-auto"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      <div className="main-card p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
          <CalendarDays />
        </div>

        <div className="flex-1">
          <b className="text-sm">
            {format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
          </b>

          <p className="text-xs text-slate-400 mt-1">
            {done} of {tasks.length} tasks completed
          </p>
        </div>

        <div className="text-xl font-extrabold">
          {tasks.length ? Math.round(done / tasks.length * 100) : 0}%
        </div>
      </div>

      <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-5">
        <form onSubmit={add} className="main-card p-5 h-fit">
          <h2 className="font-extrabold text-lg">
            Add a task
          </h2>

          {error && (
            <p className="text-xs text-red-600 mt-3">
              {error}
            </p>
          )}

          <div className="space-y-3 mt-4">
            <label className="block text-xs font-bold text-slate-500">
              Task title

              <input
                className="field mt-1"
                placeholder="e.g. Finish client website"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
                maxLength={160}
              />
            </label>

            <label className="block text-xs font-bold text-slate-500">
              Category

              <select
                className="field mt-1"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                <option value="work">Work</option>
                <option value="skills">Skills / Studies</option>
                <option value="personal">Personal To-Do</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-bold text-slate-500">
                Time (optional)

                <input
                  className="field mt-1"
                  type="time"
                  value={form.dueTime}
                  onChange={e => setForm({ ...form, dueTime: e.target.value })}
                />
              </label>

              <label className="text-xs font-bold text-slate-500">
                Priority

                <select
                  className="field mt-1"
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>

            <label className="block text-xs font-bold text-slate-500">
              Notes (optional)

              <textarea
                className="field mt-1"
                rows="3"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Add a little detail…"
              />
            </label>

            <button
              disabled={busy}
              className="btn btn-primary w-full flex justify-center items-center gap-2"
            >
              <Plus size={16} />
              {busy ? 'Saving…' : 'Add to this day'}
            </button>
          </div>
        </form>

        <section className="main-card p-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-extrabold text-lg">
                Your task list
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Mark each task complete when finished.
              </p>
            </div>

            <span className="pill bg-slate-100 text-slate-600">
              {tasks.length} tasks
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {tasks.map(t => (
              <div
                key={t._id}
                className="py-4 flex items-start gap-3"
              >
                <button
                  className={'mt-0.5 ' + (t.completed ? 'text-emerald-600' : 'text-slate-300')}
                  onClick={() => toggle(t)}
                >
                  {t.completed
                    ? <CheckCircle2 size={21} />
                    : <Circle size={21} />
                  }
                </button>

                <div className="flex-1 min-w-0">
                  {editing === t._id ? (
                    <div className="space-y-2">
                      <input
                        className="field"
                        value={editForm.title}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          className="field"
                          value={editForm.category}
                          onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                        >
                          <option value="work">Work</option>
                          <option value="skills">Skills / Studies</option>
                          <option value="personal">Personal</option>
                        </select>

                        <input
                          className="field"
                          type="time"
                          value={editForm.dueTime}
                          onChange={e => setEditForm({ ...editForm, dueTime: e.target.value })}
                        />
                      </div>

                      <textarea
                        className="field"
                        rows="2"
                        value={editForm.notes}
                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(t._id)}
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
                    <>
                      <div
                        className={
                          'text-sm font-semibold ' +
                          (t.completed ? 'line-through text-slate-400' : '')
                        }
                      >
                        {t.title}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-slate-400">
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
                    </>
                  )}
                </div>

                {editing !== t._id && (
                  <>
                    <button
                      onClick={() => startEdit(t)}
                      title="Edit task"
                      className="text-slate-300 hover:text-blue-600 p-1"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      onClick={() => remove(t._id)}
                      title="Delete task"
                      className="text-slate-300 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            ))}

            {!tasks.length && (
              <div className="text-center py-14">
                <CalendarDays
                  className="mx-auto text-slate-300"
                  size={28}
                />

                <p className="text-sm font-semibold mt-3">
                  Nothing planned for this date
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Create a task using the form.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
