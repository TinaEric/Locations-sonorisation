import { useState } from "react";
import { Minus, Plus, Mic2 } from "lucide-react";
import AvailabilityBadge from "./AvailabilityBadge";
import { LIBELLE_CATEGORIE, LIBELLE_UNITE, formatAr } from "./format";

export default function MaterielCard({ materiel, hasDates, onAdd }) {
  const [qte, setQte] = useState(1);
  const dispo = materiel.disponible;
  const connu = hasDates && dispo != null;
  const status = !connu ? "inconnue" : dispo <= 0 ? "indisponible" : dispo === 1 ? "stock_limite" : "disponible";
  const label = !connu ? undefined : dispo <= 0 ? "Indisponible" : dispo === 1 ? "Plus que 1" : `${dispo} disponibles`;
  const max = connu ? Math.max(dispo, 0) : 99;
  const canAdd = !connu || dispo > 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[4/3] bg-slate-100">
        {materiel.photo ? (
          <img src={materiel.photo} alt={materiel.designation} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-slate-300"><Mic2 className="size-10" aria-hidden="true" /></div>
        )}
        <div className="absolute left-3 top-3">
          <AvailabilityBadge status={status} label={label} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {materiel.categorie && (
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            {LIBELLE_CATEGORIE[materiel.categorie] ?? materiel.categorie}
          </p>
        )}
        <h3 className="mt-1 font-bold text-slate-900">{materiel.designation}</h3>
        {(materiel.marque || materiel.modele) && (
          <p className="text-sm text-slate-500">{[materiel.marque, materiel.modele].filter(Boolean).join(" ")}</p>
        )}
        {materiel.puissance && <p className="mt-1 text-sm text-slate-600">{materiel.puissance} W</p>}

        <div className="mt-auto pt-4">
          <p className="text-lg font-bold text-slate-900">
            {formatAr(materiel.prix)}
            <span className="text-sm font-normal text-slate-500"> / {LIBELLE_UNITE[materiel.unite] ?? "événement"}</span>
          </p>
          {materiel.caution != null && (
            <p className="mt-1 text-xs text-slate-500">
              Caution : {formatAr(materiel.caution)} <span className="italic">(remboursable)</span>
            </p>
          )}

          <div className="mt-4 flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-300">
              <button type="button" aria-label="Diminuer la quantité" disabled={qte <= 1} onClick={() => setQte((q) => q - 1)} className="p-2 text-slate-600 disabled:opacity-40">
                <Minus className="size-4" />
              </button>
              <span className="w-6 text-center text-sm font-semibold" aria-live="polite">{qte}</span>
              <button type="button" aria-label="Augmenter la quantité" disabled={qte >= max} onClick={() => setQte((q) => q + 1)} className="p-2 text-slate-600 disabled:opacity-40">
                <Plus className="size-4" />
              </button>
            </div>
            <button
              type="button"
              disabled={!canAdd}
              onClick={() => { onAdd(materiel, qte); setQte(1); }}
              className="btn btn-accent flex-1"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
