const STYLES = {
  disponible: ["Disponible", "bg-emerald-50 text-emerald-700 ring-emerald-600/20"],
  stock_limite: ["Stock limité", "bg-amber-50 text-amber-700 ring-amber-600/20"],
  indisponible: ["Indisponible", "bg-slate-100 text-slate-600 ring-slate-500/20"],
  hors_delai: ["Hors délai", "bg-slate-100 text-slate-600 ring-slate-500/20"],
  inconnue: ["Dates à saisir", "bg-slate-50 text-slate-500 ring-slate-400/20"],
};

export const isOrderable = (status) => status === "disponible" || status === "stock_limite" || status === "inconnue";

export default function AvailabilityBadge({ status = "inconnue", label }) {
  const [defaut, cls] = STYLES[status] ?? STYLES.inconnue;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {label ?? defaut}
    </span>
  );
}
