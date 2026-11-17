import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Boxes,
  ShieldCheck,
  Truck,
  AlertTriangle,
  Package,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { IMAGES_URL } from "../../../data/Api";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export const formatAr = (value) =>
  Number(value ?? 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export const getImageUrl = (photos) => {
  if (!photos) return `${IMAGES_URL}/image.png`;
  if (/^https?:\/\//i.test(photos)) return photos;
  if (/^[a-zA-Z]:\\/.test(photos)) return `${IMAGES_URL}/image.png`;
  return `${IMAGES_URL}/${photos}`;
};

/* ------------------------------------------------------------------ */
/*  Badge disponibilité                                                */
/* ------------------------------------------------------------------ */

export function BadgeDisponibilite({ quantite }) {
  const q = Number(quantite ?? 0);
  if (q <= 0)
    return (
      <span className="badge badge-error badge-sm gap-1">
        <AlertTriangle size={12} /> Indisponible
      </span>
    );
  if (q === 1)
    return (
      <span className="badge badge-warning badge-sm gap-1">
        <AlertTriangle size={12} /> 1 restant
      </span>
    );
  return (
    <span className="badge badge-success badge-sm gap-1">
      <Truck size={12} /> {q} dispo.
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Badge état pack                                                    */
/* ------------------------------------------------------------------ */

export function BadgeEtatPack({ etatPack }) {
  if (etatPack === "indisponible")
    return (
      <span className="badge badge-error badge-sm gap-1">
        <XCircle size={12} /> Indisponible
      </span>
    );
  if (etatPack === "disponible")
    return (
      <span className="badge badge-success badge-sm gap-1">
        <CheckCircle size={12} /> Disponible
      </span>
    );
  return (
    <span className="badge badge-ghost badge-sm gap-1">
      <FileText size={12} /> Détail
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Carte pack (résumé + dépliage description)                         */
/* ------------------------------------------------------------------ */

export default function PackDetaillee({ pack }) {
  const [open, setOpen] = useState(false);

  const composants = pack.composants ?? [];
  const totalMateriel = composants.reduce(
    (acc, c) => acc + Number(c?.quantite ?? 0),
    0
  );
  const indisponible = pack.etatPack === "indisponible";

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md ${
        indisponible
          ? "border-error/30 bg-base-100/60 opacity-80"
          : "border-base-300 bg-base-100"
      }`}
    >
      {/* En-tête */}
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <img
          src={getImageUrl(pack.photos)}
          alt={pack.libelle}
          className="h-52 w-full rounded-xl object-cover sm:h-24 sm:w-32"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `${IMAGES_URL}/image.png`;
          }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">{pack.libelle}</h2>
            <span className="badge badge-outline badge-xs uppercase">
              {pack.codePack}
            </span>
            {pack.statutPack && (
              <span
                className={`badge badge-xs ${
                  pack.statutPack === "actif" ? "badge-success" : "badge-ghost"
                }`}
              >
                {pack.statutPack}
              </span>
            )}
            {/* Badge état global */}
            {pack.etatPack && <BadgeEtatPack etatPack={pack.etatPack} />}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge badge-accent badge-outline gap-1">
              <Boxes size={12} /> {composants.length} matériel(s) lié(s)
            </span>
            {pack.etatPack !== "detail" && (
                <BadgeDisponibilite quantite={pack.quantiteDisponible} />
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {pack.typeLieu && (
              <span className="badge badge-ghost">{pack.typeLieu}</span>
            )}
            {pack.usages?.map?.((u) => (
              <span key={u} className="badge badge-ghost">
                {u}
              </span>
            ))}
            {pack.capaciteMin && pack.capaciteMax && (
              <span className="badge badge-ghost">
                {pack.capaciteMin}–{pack.capaciteMax} pers.
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-xl font-bold text-accent">
              {formatAr(pack.tarifJournalier)} Ar
            </div>
            <div className="text-xs opacity-60">/ jour</div>
          </div>
          <div className="flex items-center gap-1 text-xs opacity-70">
            <ShieldCheck size={14} />
            Caution : {formatAr(pack.prixCaution)} Ar
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-base-200 px-4 py-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm gap-1"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {open ? "Voir moins" : "Voir plus"}
        </button>

        <div className="flex items-center gap-2">
          <Link
            to={`/packs/${pack.codePack}`}
            className="btn btn-ghost btn-sm"
          >
            Voir le détail
          </Link>
          <Link
            to={indisponible ? "#" : `/packs/${pack.codePack}/reserver`}
            className={`btn btn-sm ${
              indisponible ? "btn-disabled" : "btn-accent"
            }`}
            onClick={(e) => indisponible && e.preventDefault()}
            aria-disabled={indisponible}
          >
            {indisponible ? "Indisponible" : "Réserver"}
          </Link>
        </div>
      </div>

      {/* Description dépliable */}
      {open && (
        <div className="space-y-2 border-t border-base-200 bg-base-200/40 px-2 pt-2 pb-4">
          <div className="rounded-lg border border-base-200 bg-base-100 p-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <FileText size={16} className="text-accent" />
              Description du pack
            </h3>
            <p className="mt-2 text-sm opacity-80">
              {pack.description || "Description non disponible"}
            </p>
          </div>

          {/* Récap financier */}
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-base-100 p-3 text-sm sm:grid-cols-4">
            <div>
              <div className="text-xs opacity-60">Tarif journalier</div>
              <div className="font-semibold text-accent">
                {formatAr(pack.tarifJournalier)} Ar
              </div>
            </div>
            <div>
              <div className="text-xs opacity-60">Caution</div>
              <div className="font-semibold">
                {formatAr(pack.prixCaution)} Ar
              </div>
            </div>
            <div>
              <div className="text-xs opacity-60">Puissance totale</div>
              <div className="font-semibold">
                {pack.puissanceTotal ? `${pack.puissanceTotal} W` : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-60">Catégorie</div>
              <div className="font-semibold">
                {pack.categoriePack?.libelle ?? pack.categoriePack ?? "—"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
