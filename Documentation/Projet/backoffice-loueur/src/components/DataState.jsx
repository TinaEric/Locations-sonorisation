import { AlertCircle, Inbox } from "lucide-react";

/** Affiche chargement / erreur / vide, sinon les enfants. */
export default function DataState({ loading, error, empty, onRetry, children }) {
  if (loading)
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  if (error)
    return (
      <div role="alert" className="alert alert-error">
        <AlertCircle size={18} />
        <span>{error}</span>
        {onRetry && (
          <button className="btn btn-sm" onClick={onRetry}>
            Réessayer
          </button>
        )}
      </div>
    );
  if (empty)
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-base-content/50">
        <Inbox size={40} />
        <p>Aucun élément à afficher</p>
      </div>
    );
  return children;
}
