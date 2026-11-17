import { Link } from "react-router-dom";
import {
  Package,
  ShieldCheck,
  ImageOff,
  Users,
  MapPin,
  Zap,
  Music,
} from "lucide-react";

const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const formatPrice = (v) =>
  toNumber(v).toLocaleString("fr-FR", { maximumFractionDigits: 0 });

const LABELS_CATEGORIE = {
  conference: "Conférence",
  soiree: "Soirée",
  mariage: "Mariage",
  concert: "Concert",
};

const LABELS_TYPE_LIEU = {
  interieur: "Intérieur",
  exterieur: "Extérieur",
  mixte: "Mixte",
};

export default function PackCard({ pack, dateDebut, dateFin }) {
  const {
    codePack,
    libelle,
    description,
    photos,
    tarifJournalier,
    prixCaution,
    statutPack,
    categoriePack,
    capaciteMin,
    capaciteMax,
    typeLieu,
    usages = [],
    puissanceTotal,
    composants = [],
    quantiteDisponible = 0,
  } = pack;

  const isActive = statutPack === "actif";
  const disponible = isActive && quantiteDisponible > 0;

  const aCapacite = capaciteMin != null || capaciteMax != null;
  const aPuissance = puissanceTotal != null && toNumber(puissanceTotal) > 0;
  const aUsages = Array.isArray(usages) && usages.length > 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {photos ? (
          <img
            src={photos}
            alt={libelle}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-300">
            <ImageOff size={40} />
          </div>
        )}

        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            disponible
              ? "bg-success/90 text-white"
              : "bg-slate-700/80 text-white"
          }`}
        >
          {disponible ? "Disponible" : "Indisponible"}
        </span>

        {categoriePack && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
            {LABELS_CATEGORIE[categoriePack] ?? categoriePack}
          </span>
        )}
      </div>

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

        {/* Caractéristiques du pack */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Package className="size-3.5" />
            {composants.length} équipement{composants.length > 1 ? "s" : ""}
          </span>

          {aCapacite && (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {capaciteMin ?? "?"}–{capaciteMax ?? "?"} pers.
            </span>
          )}

          {typeLieu && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {LABELS_TYPE_LIEU[typeLieu] ?? typeLieu}
            </span>
          )}

          {aPuissance && (
            <span className="inline-flex items-center gap-1">
              <Zap className="size-3.5" />
              {formatPrice(puissanceTotal)} W
            </span>
          )}

          {toNumber(prixCaution) > 0 && (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              Caution {formatPrice(prixCaution)} Ar
            </span>
          )}
        </div>

        {/* Usages */}
        {aUsages && (
          <div className="mt-2 flex flex-wrap gap-1">
            {usages.slice(0, 4).map((u) => (
              <span
                key={u}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
              >
                <Music className="size-3" />
                {u}
              </span>
            ))}
            {usages.length > 4 && (
              <span className="text-[10px] text-slate-400">
                +{usages.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Aperçu des composants */}
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

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-xs text-slate-500">À partir de</p>
            <p className="text-xl font-extrabold text-slate-900">
              {formatPrice(tarifJournalier)} Ar
              <span className="text-sm font-medium text-slate-500"> / jour</span>
            </p>
          </div>

          {disponible ? (
            <Link
              to={`/packs/${codePack}/detail-public`}
              state={{ dateDebut, dateFin }}
              className="btn btn-sm btn-accent"
            >
              Voir détail
            </Link>
          ) : (
            <button className="btn btn-sm btn-disabled" disabled>
              Indisponible
            </button>
          )}
        </div>
      </div>
    </article>
  );
}