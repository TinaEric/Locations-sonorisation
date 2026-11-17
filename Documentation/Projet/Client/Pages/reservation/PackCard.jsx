import { Link } from "react-router-dom";
import { Package, ShieldCheck } from "lucide-react";

// "195000.00" → 195000
const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatPrice = (value) =>
  toNumber(value).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export default function PackCard({ pack }) {
  const {
    codePack,
    libelle,
    description,
    imageUrl,
    tarifJournalier,
    prixCaution,
    statutPack,
    typesEvenement,
    composants = [],
    quantiteDisponible = 0,
  } = pack;

  const isActive = statutPack === "actif";
  const disponible = isActive && quantiteDisponible > 0;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
        disponible ? "border-slate-200" : "border-slate-200 opacity-60"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={libelle}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl text-slate-300">
            🔊
          </div>
        )}

        {/* Badge disponibilité */}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            disponible
              ? "bg-success/90 text-white"
              : "bg-slate-700/80 text-white"
          }`}
        >
          {disponible ? "Disponible" : "Indisponible"}
        </span>

        {/* Type d'événement */}
        {typesEvenement && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
            {typesEvenement}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-slate-900">{libelle}</h3>

        {description ? (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {description}
          </p>
        ) : (
          <p className="mt-1 text-sm italic text-slate-400">
            Aucune description
          </p>
        )}

        {/* Méta : nb de composants + caution */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Package className="size-3.5" />
            {composants.length} équipement{composants.length > 1 ? "s" : ""}
          </span>
          {toNumber(prixCaution) > 0 && (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              Caution {formatPrice(prixCaution)} Ar
            </span>
          )}
        </div>

        {/* Aperçu du matériel inclus */}
        {composants.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            {composants.slice(0, 3).map(({ idComposant, quantite, materiel }) => (
              <li key={idComposant} className="flex items-center gap-1 truncate">
                <span className="text-slate-400">•</span>
                <span className="truncate">
                  {quantite}× {materiel?.designation}
                  {materiel?.marque ? ` (${materiel.marque})` : ""}
                </span>
              </li>
            ))}
            {composants.length > 3 && (
              <li className="text-slate-400">
                + {composants.length - 3} autre
                {composants.length - 3 > 1 ? "s" : ""}…
              </li>
            )}
          </ul>
        )}

        {/* Prix + CTA */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-xs text-slate-500">À partir de</p>
            <p className="text-xl font-extrabold text-slate-900">
              {formatPrice(tarifJournalier)} Ar
              <span className="text-sm font-medium text-slate-500"> / jour</span>
            </p>
          </div>

          <Link
            to={disponible ? `/packs/${codePack}/configurer` : "#"}
            aria-disabled={!disponible}
            onClick={(e) => !disponible && e.preventDefault()}
            className={`btn btn-sm ${
              disponible ? "btn-accent" : "btn-disabled pointer-events-none"
            }`}
          >
            Personnaliser
          </Link>
        </div>
      </div>
    </article>
  );
}