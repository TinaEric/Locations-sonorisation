import { Users, MapPin, Zap, Music } from "lucide-react";
import { ImageUrl } from "../../../../components/ImageURL";
import { IMAGES_URL } from "../../../../data/Api";
import {BadgeEtatPack} from "./utils/responce";
import { LABELS_CATEGORIE, LABELS_TYPE_LIEU } from "./utils/packHelpers";

export default function PackIdentiteCard({ pack }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <ImageUrl
        src={`${IMAGES_URL}/${pack.photos}`}
        alt={pack.libelle}
        className="h-40 w-full object-cover sm:h-48"
      />
      <div className="space-y-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold sm:text-xl">{pack.libelle}</h1>
          <span className="badge badge-outline badge-xs uppercase">
            {pack.codePack}
          </span>
          {pack.etatPack && <BadgeEtatPack etatPack={pack.etatPack} />}
        </div>

        {pack.categoriePack && (
          <span className="badge badge-outline badge-sm">
            {LABELS_CATEGORIE[pack.categoriePack] ?? pack.categoriePack}
          </span>
        )}

        <p className="text-sm opacity-80">
          {pack.description || "Description non disponible"}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {(pack.capaciteMin != null || pack.capaciteMax != null) && (
            <span className="badge badge-ghost badge-sm gap-1">
              <Users size={12} /> {pack.capaciteMin ?? "?"}–
              {pack.capaciteMax ?? "?"} pers.
            </span>
          )}
          {pack.typeLieu && (
            <span className="badge badge-ghost badge-sm gap-1">
              <MapPin size={12} />
              {LABELS_TYPE_LIEU[pack.typeLieu] ?? pack.typeLieu}
            </span>
          )}
          {pack.puissanceTotal != null && (
            <span className="badge badge-ghost badge-sm gap-1">
              <Zap size={12} /> {pack.puissanceTotal} W
            </span>
          )}
        </div>

        {Array.isArray(pack.usages) && pack.usages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pack.usages.map((u) => (
              <span
                key={u}
                className="badge badge-primary badge-outline badge-sm gap-1"
              >
                <Music size={10} /> {u}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}