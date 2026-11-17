export function CardSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="aspect-[16/10] bg-slate-200" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-1/3 rounded bg-slate-200" />
            <div className="h-5 w-2/3 rounded bg-slate-200" />
            <div className="h-3 w-full rounded bg-slate-200" />
            <div className="h-8 w-1/2 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-lg font-semibold text-slate-800">{title}</p>
      {text && <p className="mt-2 text-sm text-slate-600">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-semibold text-red-800">Impossible de charger les données</p>
      <p className="mt-1 text-sm text-red-700">{error?.message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          Réessayer
        </button>
      )}
    </div>
  );
}
