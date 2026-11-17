import { useState } from "react";
import { useSearch } from "../context/SearchContext";
import { formatDateCourte, nbJours } from "../utils/format";
import DateSearchForm from "./DateSearchForm";

/** Résumé « 15 déc. → 17 déc. 2026 [Modifier] » affiché en haut du catalogue. */
export default function SearchSummary() {
  const { dateDebut, dateFin, hasDates } = useSearch();
  const [editing, setEditing] = useState(!hasDates);
  const jours = nbJours(dateDebut, dateFin);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {editing ? (
        <DateSearchForm compact redirectTo={window.location.pathname} onSubmitted={() => setEditing(false)} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Dates :</span>{" "}
            {formatDateCourte(dateDebut)}
            {dateFin !== dateDebut && ` → ${formatDateCourte(dateFin)}`} · {jours} jour{jours > 1 ? "s" : ""}
          </p>
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-indigo-600 hover:underline">
            Modifier
          </button>
        </div>
      )}
      {!hasDates && (
        <p className="mt-3 text-sm text-slate-500">
          Saisissez vos dates pour voir uniquement ce qui est disponible. La disponibilité est confirmée après le choix des heures.
        </p>
      )}
    </div>
  );
}
