import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../context/SearchContext";
import { formuleParDuree, nbJours, todayISO } from "../utils/format";

const LIBELLE_FORMULE = { soiree: "soirée / journée", weekend: "week-end", semaine: "semaine" };

export default function DateSearchForm({ compact = false, redirectTo = "/packs", onSubmitted }) {
  const { dateDebut, dateFin, updateDates } = useSearch();
  const navigate = useNavigate();
  const [debut, setDebut] = useState(dateDebut);
  const [fin, setFin] = useState(dateFin);
  const [error, setError] = useState("");

  const today = todayISO();
  const jours = nbJours(debut, fin);

  function handleDebut(value) {
    setDebut(value);
    // Événement d'un jour : la fin est préremplie avec le début.
    if (!fin || fin < value) setFin(value);
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!debut || !fin) return setError("Veuillez saisir les deux dates.");
    if (debut < today) return setError("La date de début ne peut pas être dans le passé.");
    if (fin < debut) return setError("La date de fin doit être après la date de début.");
    updateDates({ dateDebut: debut, dateFin: fin });
    onSubmitted?.();
    navigate(redirectTo);
  }

  const inputCls =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30";

  return (
    <form onSubmit={handleSubmit} noValidate className={compact ? "" : "rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200 sm:p-6"}>
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-[1fr_1fr_auto] sm:items-end" : "sm:grid-cols-2"}`}>
        <label className="block text-sm font-medium text-slate-700">
          Début de l'événement
          <input type="date" min={today} value={debut} onChange={(e) => handleDebut(e.target.value)} className={inputCls} required />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Fin de l'événement
          <input type="date" min={debut || today} value={fin} onChange={(e) => { setFin(e.target.value); setError(""); }} className={inputCls} required />
        </label>
        {compact && (
          <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700">
            Modifier
          </button>
        )}
      </div>

      {jours > 0 && !error && (
        <p className="mt-3 text-sm text-slate-500">
          {jours} jour{jours > 1 ? "s" : ""} · formule : {LIBELLE_FORMULE[formuleParDuree(jours)]}
        </p>
      )}
      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      {!compact && (
        <>
          <button type="submit" className="mt-5 w-full rounded-lg bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700">
            Vérifier la disponibilité
          </button>
          <p className="mt-3 text-center text-sm">
            <a href="/assistant" className="font-medium text-indigo-600 hover:underline">
              Je ne sais pas quoi choisir → assistant
            </a>
          </p>
        </>
      )}
    </form>
  );
}
