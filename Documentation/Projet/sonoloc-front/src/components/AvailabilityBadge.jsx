const STYLES = {
  disponible: { label: "Disponible", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  stock_limite: { label: "Stock limité", cls: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  indisponible: { label: "Indisponible", cls: "bg-slate-100 text-slate-600 ring-slate-500/20" },
  hors_delai: { label: "Hors délai", cls: "bg-slate-100 text-slate-600 ring-slate-500/20" },
  inconnue: { label: "Dates à saisir", cls: "bg-slate-50 text-slate-500 ring-slate-400/20" },
};

export default function AvailabilityBadge({ status = "inconnue", label }) {
  const s = STYLES[status] ?? STYLES.inconnue;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? s.label}
    </span>
  );
}

export const isOrderable = (status) => status === "disponible" || status === "stock_limite" || status === "inconnue";
