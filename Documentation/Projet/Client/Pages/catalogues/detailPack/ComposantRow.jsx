import { Plus, Minus, Replace, Trash2, Sparkles } from "lucide-react";
import { ImageUrl } from "../../../../components/ImageURL";
import { formatMoney } from "../../../../utils/format";
import { IMAGES_URL } from "../../../../data/Api";
import { getMaterielIcon, toNumber } from "./utils/packHelpers";

export default function ComposantRow({
  composant,
  quantite,
  baseQuantite,
  onChangeQuantite,
  onRemplacer,
  onRetirer,
  peutRetirer,
  avecStock,
}) {
  const { materiel } = composant;
  const Icon = getMaterielIcon(materiel);
  const stock = toNumber(
    materiel?.quantiteDisponible ?? composant?.disponible
  );
  const indispo = avecStock && stock <= 0;
  const modifie = quantite !== baseQuantite;
  const prix = toNumber(materiel?.prixLocation);

  const peutAjouter = !avecStock || quantite < stock;
  const peutDiminuer = quantite > 1;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors sm:flex-nowrap sm:gap-3 sm:px-3 sm:py-2.5 ${
        indispo
          ? "border-error/30 bg-error/5"
          : modifie
          ? "border-accent/40 bg-accent/5"
          : "border-base-300 bg-base-100"
      }`}
    >
      <ImageUrl
        src={`${IMAGES_URL}/${materiel?.imageURL}`}
        alt={materiel?.designation}
        className="size-10 shrink-0 rounded-lg object-cover sm:size-11"
      />

      <div className="min-w-0 flex-1 basis-full sm:basis-auto">
        <div className="flex items-center gap-2">
          <Icon size={14} className="shrink-0 text-accent" />
          <span className="truncate text-sm font-medium">
            {materiel?.designation || "—"}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs opacity-70">
          <span>{materiel?.marque || "Marque inconnue"}</span>
          {materiel?.detailTechnique && (
            <span className="hidden truncate sm:inline">
              • {materiel.detailTechnique}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {avecStock ? (
            <span
              className={`badge badge-sm ${
                stock > 0 ? "badge-success" : "badge-error"
              }`}
            >
              {stock} dispo
            </span>
          ) : (
            <span className="badge badge-ghost badge-sm">stock n/a</span>
          )}
          {modifie && (
            <span className="badge badge-accent badge-outline badge-xs gap-1">
              <Sparkles size={10} /> modifié
            </span>
          )}
        </div>
      </div>

      <div className="hidden text-right sm:block">
        <div className="text-xs font-semibold text-accent">
          {formatMoney(prix)}
        </div>
        <div className="text-[10px] opacity-60">
          caution : {formatMoney(materiel?.prixCaution)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="join">
          <button
            type="button"
            className="btn btn-xs join-item"
            disabled={!peutDiminuer}
            onClick={() => onChangeQuantite(quantite - 1)}
          >
            <Minus size={12} />
          </button>
          <span
            className={`join-item flex min-w-9 items-center justify-center border border-base-300 px-2 text-sm sm:min-w-10 ${
              modifie ? "text-accent font-semibold" : ""
            }`}
          >
            {quantite}
          </span>
          <button
            type="button"
            className="btn btn-xs join-item"
            disabled={!peutAjouter}
            onClick={() => onChangeQuantite(quantite + 1)}
          >
            <Plus size={12} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square"
            title="Remplacer"
            onClick={onRemplacer}
            disabled={!avecStock}
          >
            <Replace size={14} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square text-error"
            title="Retirer"
            onClick={onRetirer}
            disabled={!peutRetirer}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}