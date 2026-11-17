import { useState } from "react";
import AvailabilityBadge from "./AvailabilityBadge";
import { LIBELLE_CATEGORIE, LIBELLE_UNITE, formatAr } from "../utils/format";

export default function MaterielCard({ materiel, hasDates, onAdd }) {
  const [qte, setQte] = useState(1);
  const dispo = materiel.quantite_disponible;
  const status = !hasDates ? "inconnue" : dispo <= 0 ? "indisponible" : dispo === 1 ? "stock_limite" : "disponible";
  const label = !hasDates ? undefined : dispo <= 0 ? "Indisponible" : dispo === 1 ? "Plus que 1" : `${dispo} disponibles`;
  const max = hasDates ? Math.max(dispo, 0) : 99;
  const canAdd = !hasDates || dispo > 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[4/3] bg-slate-100">
        {materiel.photo ? (
          <img src={materiel.photo} alt={materiel.designation} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-4xl text-slate-300">🎤</div>
        )}
        <div className="absolute left-3 top-3">
          <AvailabilityBadge status={status} label={label} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          {LIBELLE_CATEGORIE[materiel.categorie] ?? materiel.categorie}
        </p>
        <h3 className="mt-1 font-bold text-slate-900">{materiel.designation}</h3>
        {(materiel.marque || materiel.modele) && (
          <p className="text-sm text-slate-500">{[materiel.marque, materiel.modele].filter(Boolean).join(" ")}</p>
        )}
        {materiel.puissance_w && <p className="mt-1 text-sm text-slate-600">{materiel.puissance_w} W</p>}

        <div className="mt-auto pt-4">
          <p className="text-lg font-bold text-slate-900">
            {formatAr(materiel.prix_location_unitaire)}
            <span className="text-sm font-normal text-slate-500"> / {LIBELLE_UNITE[materiel.unite_tarif] ?? "événement"}</span>
          </p>
          {materiel.caution_unitaire != null && (
            <p className="mt-1 text-xs text-slate-500">
              Caution : {formatAr(materiel.caution_unitaire)} <span className="italic">(remboursable)</span>
            </p>
          )}

          <div className="mt-4 flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-300">
              <button type="button" aria-label="Diminuer la quantité" disabled={qte <= 1} onClick={() => setQte((q) => q - 1)} className="px-3 py-2 text-slate-600 disabled:opacity-40">−</button>
              <span className="w-6 text-center text-sm font-semibold" aria-live="polite">{qte}</span>
              <button type="button" aria-label="Augmenter la quantité" disabled={qte >= max} onClick={() => setQte((q) => q + 1)} className="px-3 py-2 text-slate-600 disabled:opacity-40">+</button>
            </div>
            <button
              type="button"
              disabled={!canAdd}
              onClick={() => { onAdd(materiel, qte); setQte(1); }}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Ajouter à ma sélection
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
