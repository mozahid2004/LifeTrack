
export default function Stat({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'green'
}) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700'
  };

  return (
    <div className="main-card p-5">
      <div className="flex justify-between items-start">
        <div className="text-xs font-bold text-slate-400">
          {label}
        </div>

        <div
          className={
            'w-9 h-9 rounded-xl grid place-items-center ' + tones[tone]
          }
        >
          {Icon && <Icon size={18} />}
        </div>
      </div>

      <div className="metric text-3xl font-extrabold text-slate-800 mt-3">
        {value}
      </div>

      <div className="text-xs text-slate-400 mt-1">
        {sub}
      </div>
    </div>
  );
}
