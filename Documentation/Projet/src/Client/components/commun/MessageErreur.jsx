// Client/components/commun/MessageErreur.jsx
import { AlertTriangle } from "lucide-react";

export default function MessageErreur({ message, onReessayer }) {
  if (!message) return null;
  return (
    <div role="alert" className="alert alert-error alert-soft">
      <AlertTriangle className="size-5" />
      <span>{message}</span>
      {onReessayer && (
        <button type="button" className="btn btn-sm" onClick={onReessayer}>
          Réessayer
        </button>
      )}
    </div>
  );
}
