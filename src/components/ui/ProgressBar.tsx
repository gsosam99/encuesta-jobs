interface Props {
  value: number; // 0..1
  label?: string;
}

export function ProgressBar({ value, label }: Props) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="w-full">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-slate-900 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {label ? (
        <p className="mt-1 text-xs text-slate-500">{label}</p>
      ) : null}
    </div>
  );
}
