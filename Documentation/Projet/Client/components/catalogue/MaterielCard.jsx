// src/Client/components/catalogue/MaterielCard.jsx
import { ShoppingCart, Package, ShieldCheck, ImageOff } from "lucide-react";
import { ImageUrl } from "../../../components/ImageURL";
import { formatMoney } from "../../../utils/format";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../../contexts/ToastContext";

export default function MaterielCard({ materiel, dateDebut, dateFin }) {
  const { addItem, items, hasPack } = useCart();
  const toast = useToast();

  const {
    CodeMateriel,
    designation,
    marque,
    imageURL,
    prixLocation,
    prixCaution,
    quantiteDisponible = 0,
    categorie,
  } = materiel;

  const dispo = Number(quantiteDisponible) > 0;
  const dejaDansPanier = items.some(
    (i) => i.type === "MATERIEL" && i.code === CodeMateriel
  );

  const ajouter = () => {
    if (!dateDebut || !dateFin) {
      toast.warning("Sélectionnez vos dates avant d'ajouter").bottom();
      return;
    }
    if (hasPack) {
      toast
        .warning("Un pack est dans votre panier. Videz-le pour ajouter du matériel.")
        .bottom();
      return;
    }
    if (dejaDansPanier) {
      toast.warning("Ce matériel est déjà dans votre panier").bottom();
      return;
    }

    const ok = addItem(
      {
        code: CodeMateriel,
        designation,
        marque,
        photos: imageURL,
        imageUrl: imageURL, // compat
        tarifJournalier: Number(prixLocation),
        prixLocation: Number(prixLocation),
        prixCaution: Number(prixCaution),
        dateDebut,
        dateFin,
        quantiteDisponible: Number(quantiteDisponible),
      },
      "MATERIEL"
    );

    if (ok) {
      toast.success(`« ${designation} » ajouté au panier`).bottom();
    } else {
      toast.warning("Impossible d'ajouter ce matériel").bottom();
    }
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-base-200">
        {imageURL ? (
          <img
            src={imageURL}
            alt={designation}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="grid h-full place-items-center text-base-content/30">
            <ImageOff size={40} />
          </div>
        )}

        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            dispo ? "bg-success/90 text-white" : "bg-base-content/70 text-white"
          }`}
        >
          {dispo ? `${quantiteDisponible} dispo` : "Indisponible"}
        </span>

        {categorie?.libelle && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-base-content shadow-sm">
            {categorie.libelle}
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold leading-tight text-base-content line-clamp-2">
          {designation}
        </h3>
        {marque && (
          <p className="mt-0.5 text-xs text-base-content/60">{marque}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-base-content/60">
          <span className="inline-flex items-center gap-1">
            <Package className="size-3.5" />
            {CodeMateriel}
          </span>
          {Number(prixCaution) > 0 && (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              {formatMoney(prixCaution)} Ar
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-xs text-base-content/60">Tarif / jour</p>
            <p className="text-lg font-extrabold text-primary">
              {formatMoney(prixLocation)} Ar
            </p>
          </div>

          <button
            type="button"
            onClick={ajouter}
            disabled={!dispo || dejaDansPanier}
            className={`btn btn-sm gap-1 ${
              dejaDansPanier ? "btn-success text-white" : "btn-accent"
            }`}
          >
            <ShoppingCart size={14} />
            {dejaDansPanier ? "Ajouté" : dispo ? "Ajouter" : "Indispo"}
          </button>
        </div>
      </div>
    </article>
  );
}