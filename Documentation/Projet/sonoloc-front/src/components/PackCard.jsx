import { Link } from "react-router-dom";
import AvailabilityBadge, { isOrderable } from "./AvailabilityBadge";
import { LIBELLE_CATEGORIE, LIBELLE_LIEU, formatAr } from "../utils/format";

export default function PackCard({ pack, hasDates, comparing, onToggleCompare, onChoose }) {
  const status = hasDates ? pack.disponibilite : "inconnue";
  const orderable = isOrderable(status);
  const prix = hasDates && pack.prix_pour_dates != null ? pack.prix_pour_dates : pack.prix_a_partir_de;

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${orderable ? "border-slate-200" : "border-slate-200 opacity-75"}`}>
      <div className="relative aspect-[16/10] bg-slate-100">
        {pack.photo_principale ? (
          <img src={pack.photo_principale} alt={pack.nom} loading="lazy" className={`h-full w-full object-cover ${orderable ? "" : "grayscale"}`} />
        ) : (
          <div className="grid h-full place-items-center text-4xl text-slate-300">♪</div>
        )}
        <div className="absolute left-3 top-3">
          <AvailabilityBadge status={status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          {LIBELLE_CATEGORIE[pack.categorie] ?? pack.categorie}
        </p>
        <h3 className="mt-1 text-lg font-bold text-slate-900">{pack.nom}</h3>
        <p className="mt-1 text-sm text-slate-600">{pack.description_courte}</p>

        <dl className="mt-3 space-y-1 text-sm text-slate-600">
          <div className="flex gap-2">
            <dt className="font-medium text-slate-700">Capacité</dt>
            <dd>{pack.capacite_min} à {pack.capacite_max} personnes</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-slate-700">Lieu</dt>
            <dd>{LIBELLE_LIEU[pack.type_lieu] ?? pack.type_lieu}</dd>
          </div>
        </dl>

        {pack.composition?.length > 0 && (
          <p className="mt-3 text-sm text-slate-500">
            {pack.composition.map((c) => `${c.quantite} ${c.designation.toLowerCase()}`).join(" · ")}
          </p>
        )}

        {pack.services?.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {pack.services.map((s) => (
              <li key={s.libelle} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {s.libelle} {s.inclus ? "incluse" : "en option"}
              </li>
            ))}
          </ul>
        )}

        {!orderable && pack.raison_indisponibilite && (
          <p className="mt-3 rounded-md bg-slate-50 p-2 text-xs text-slate-600">{pack.raison_indisponibilite}</p>
        )}

        <div className="mt-auto pt-4">
          <p className="text-xl font-bold text-slate-900">
            {!hasDates && <span className="mr-1 text-sm font-normal text-slate-500">à partir de</span>}
            {formatAr(prix)}
          </p>
          {hasDates && pack.majoration && (
            <p className="text-xs font-medium text-amber-700">{pack.majoration.libelle} : {pack.majoration.valeur}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Caution : {formatAr(pack.caution_montant)} <span className="italic">(remboursable, hors prix)</span>
          </p>

          <div className="mt-4 flex items-center gap-2">
            <Link to={`/packs/${pack.id_pack}`} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Voir le pack
            </Link>
            <button
              type="button"
              disabled={!orderable}
              onClick={() => onChoose?.(pack)}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Choisir
            </button>
          </div>
          {onToggleCompare && (
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={comparing} onChange={() => onToggleCompare(pack)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              Comparer
            </label>
          )}
        </div>
      </div>
    </article>
  );
}
