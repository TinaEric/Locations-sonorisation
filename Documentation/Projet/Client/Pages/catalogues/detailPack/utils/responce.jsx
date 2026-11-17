import { CalendarX, CheckCircle, XCircle, FileText } from "lucide-react";

export  function PackDetailErreur({ message }) {
  return (
    <div className="alert alert-error m-4">
      <CalendarX size={18} /> {message}
    </div>
  );
}

export  function PackDetailLoading() {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <span className="loading loading-spinner loading-lg text-accent" />
      </div>
    );
  }

const LABELS_ETAT = {
  disponible: { label: "Disponible", cls: "badge-success", Icon: CheckCircle },
  indisponible: { label: "Indisponible", cls: "badge-error", Icon: XCircle },
  detail: { label: "Consultation", cls: "badge-ghost", Icon: FileText },
};

export  function BadgeEtatPack({ etatPack }) {
  const cfg = LABELS_ETAT[etatPack];
  if (!cfg) return null;
  const { label, cls, Icon } = cfg;
  return (
    <span className={`badge badge-sm gap-1 ${cls}`}>
      <Icon size={12} /> {label}
    </span>
  );
}