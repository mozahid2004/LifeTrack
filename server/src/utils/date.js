
import { isValid, parseISO, format } from 'date-fns';

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;

  const d = parseISO(value);

  return isValid(d) && format(d, 'yyyy-MM-dd') === value;
}

export function monthOf(date) {
  return date.slice(0, 7);
}

export function monthRange(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Month must be YYYY-MM');
  }

  const [y, m] = month.split('-').map(Number);

  const start = `${month}-01`;
  const end = new Date(y, m, 0).toISOString().slice(0, 10);

  return { start, end };
}

export function scoreEntry(e) {
  if (!e) return 0;

  const groups = [];

  if (e.fitness?.length) {
    groups.push(
      e.fitness.filter(x => x.done).length / e.fitness.length
    );
  }

  groups.push(
    Object.values(e.namaz || {}).filter(Boolean).length / 5
  );

  for (const key of ['work', 'skills']) {
    if (e[key]?.length) {
      groups.push(
        e[key].reduce(
          (s, x) => s + (x.target ? Math.min(x.completed / x.target, 1) : 0),
          0
        ) / e[key].length
      );
    }
  }

  if (e.self?.length) {
    groups.push(
      e.self.filter(x => x.kind === 'avoid' ? !x.done : x.done).length /
      e.self.length
    );
  }

  return groups.length
    ? Math.round(groups.reduce((a, b) => a + b, 0) / groups.length * 100)
    : 0;
}
