import { Users, MapPin } from "lucide-react";
import AvailabilityBadge, { isOrderable } from "./AvailabilityBadge";
import { LIBELLE_LIEU, formatAr } from "./format";

export default function PackCard({ pack, hasDates, onChoose }) {
  const status = hasDates ? pack.disponibilite : "inconnue";
  const orderable = isOrderable(status);
  const prix = hasDates && pack.prix != null ? pack.prix : pack.prixAPartirDe;

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md ${orderable ? "" : "opacity-75"}`}>
      <div className="relative aspect-[16/10] bg-slate-100">
        {pack.photo && (
          <img src={pack.photo} alt={pack.nom} loading="lazy" className={`size-full object-cover ${orderable ? "" : "grayscale"}`} />
        )}
        <div className="absolute left-3 top-3">
          <AvailabilityBadge status={status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-bold text-slate-900">{pack.nom}</h3>
        {pack.description && <p className="mt-1 text-sm text-slate-600">{pack.description}</p>}

        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          {pack.capaciteMax != null && (
            <li className="flex items-center gap-2">
              <Users className="size-4 text-accent" aria-hidden="true" />
              {pack.capaciteMin} à {pack.capaciteMax} personnes
            </li>
          )}
          {pack.typeLieu && (
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-accent" aria-hidden="true" />
              {LIBELLE_LIEU[pack.typeLieu] ?? pack.typeLieu}
            </li>
          )}
        </ul>

        {pack.composition.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium text-accent">Voir la composition</summary>
            <ul className="mt-2 list-inside list-disc text-slate-600">
              {pack.composition.map((c) => (
                <li key={c.designation}>{c.quantite} × {c.designation}</li>
              ))}
            </ul>
          </details>
        )}

        {pack.services.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {pack.services.map((s) => (
              <li key={s.libelle} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {s.libelle} {s.inclus ? "incluse" : "en option"}
              </li>
            ))}
          </ul>
        )}

        {!orderable && pack.raison && <p className="mt-3 rounded-md bg-slate-50 p-2 text-xs text-slate-600">{pack.raison}</p>}

        <div className="mt-auto pt-4">
          <p className="text-xl font-bold text-slate-900">
            {!(hasDates && pack.prix != null) && <span className="mr-1 text-sm font-normal text-slate-500">à partir de</span>}
            {formatAr(prix)}
          </p>
          {hasDates && pack.majoration && (
            <p className="text-xs font-medium text-amber-700">{pack.majoration.libelle} : {pack.majoration.valeur}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Caution : {formatAr(pack.caution)} <span className="italic">(remboursable, hors prix)</span>
          </p>
          <button
            type="button"
            disabled={!orderable}
            onClick={() => onChoose(pack)}
            className="btn btn-accent mt-4 w-full disabled:cursor-not-allowed"
          >
            Choisir ce pack
          </button>
        </div>
      </div>
    </article>
  );
}
