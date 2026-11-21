export function FullScreenLoader({ label = 'Загрузка модуля…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-slate-400"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
      <span className="text-xs">{label}</span>
    </div>
  );
}
