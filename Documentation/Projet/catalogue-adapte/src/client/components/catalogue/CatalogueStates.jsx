import { AlertTriangle, PackageOpen } from "lucide-react";

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

export function EmptyState({ title, text, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <PackageOpen className="mx-auto size-8 text-slate-400" aria-hidden="true" />
      <p className="mt-3 text-lg font-semibold text-slate-800">{title}</p>
      {text && <p className="mt-2 text-sm text-slate-600">{text}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <AlertTriangle className="mx-auto size-6 text-red-600" aria-hidden="true" />
      <p className="mt-2 font-semibold text-red-800">Impossible de charger les données</p>
      <p className="mt-1 text-sm text-red-700">{error?.message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-sm mt-4 border-red-600 bg-red-600 text-white hover:bg-red-700">
          Réessayer
        </button>
      )}
    </div>
  );
}
