import {
  ShoppingCart,
  ImageOff,
  Boxes,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useCart } from "../../contexts/CartContext";


const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const formatPrice = (v) =>
  toNumber(v).toLocaleString("fr-FR", { maximumFractionDigits: 0 });

export default function MaterielCard({ materiel, dateDebut, dateFin }) {
  const toast = useToast();
  const { addItem, items, hasPack } = useCart();
  const dejaDansPanier = items.some((i) => i.code === materiel.CodeMateriel);

  const stock = toNumber(materiel.quantiteDisponible);
  const rupture = stock <= 0;
  const bloqueParPack = hasPack;

  const handleAdd = () => {
    if (!dateDebut || !dateFin) {
      toast.warning("Veuillez sélectionner vos dates avant d'ajouter").bottom();
      return;
    }
    if (rupture) {
      toast
        .warning("Ce matériel n'est pas disponible sur cette période")
        .bottom();
      return;
    }
    if (bloqueParPack) {
      toast
        .warning(
          "Un pack est déjà dans votre panier. Retirez-le pour ajouter des matériels."
        )
        .bottom();
      return;
    }
    if (dejaDansPanier) {
      toast.warning("Ce matériel est déjà dans votre panier").bottom();
      return;
    }

    const ok = addItem(
      {
        code: materiel.CodeMateriel,
        designation: materiel.designation,
        marque: materiel.marque,
        imageUrl: materiel.imageURL,
        prixLocation: toNumber(materiel.prixLocation),
        prixCaution: toNumber(materiel.prixCaution),
        dateDebut,
        dateFin,
        quantiteDisponible: stock,
      },
      "MATERIEL"
    );

    if (!ok) {
      toast
        .warning("Impossible d'ajouter (conflit avec le panier).")
        .bottom();
      return;
    }
    toast.success(`${materiel.designation} ajouté au panier`).bottom();
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {materiel.imageURL ? (
          <img
            src={materiel.imageURL}
            alt={materiel.designation}
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
        {materiel.categorie?.libelle && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
            {materiel.categorie.libelle}
          </span>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
            rupture
              ? "bg-error/90 text-white"
              : stock <= 2
              ? "bg-warning/90 text-white"
              : "bg-success/90 text-white"
          }`}
        >
          {rupture ? "Épuisé" : `${stock} dispo`}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-base font-bold text-slate-900">
          {materiel.designation}
        </h3>
        <p className="text-xs text-slate-500">
          {materiel.marque || "—"}
          <span className="mx-1">·</span>
          <span className="font-mono">{materiel.CodeMateriel}</span>
        </p>

        {materiel.detailTechnique && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
            {materiel.detailTechnique}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {toNumber(materiel.prixCaution) > 0 && (
            <span>Caution {formatPrice(materiel.prixCaution)} Ar</span>
          )}
          <span className="inline-flex items-center gap-1">
            <Boxes size={12} />
            Stock : {stock} / {toNumber(materiel.quantiteTotale)}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-xs text-slate-500">À partir de</p>
            <p className="text-lg font-extrabold text-slate-900">
              {formatPrice(materiel.prixLocation)} Ar
              <span className="text-xs font-medium text-slate-500"> / jour</span>
            </p>
          </div>
          <button
            className={`btn btn-sm ${
              rupture || dejaDansPanier || bloqueParPack
                ? "btn-disabled"
                : "btn-accent"
            }`}
            disabled={rupture || dejaDansPanier || bloqueParPack}
            onClick={handleAdd}
            title={
              bloqueParPack
                ? "Un pack est déjà dans le panier — retirez-le pour ajouter des matériels"
                : rupture
                ? "Aucun stock disponible sur cette période"
                : undefined
            }
          >
            {bloqueParPack ? (
              <>
                <AlertTriangle size={14} /> Pack en cours
              </>
            ) : rupture ? (
              <>
                <AlertTriangle size={14} /> Épuisé
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                {dejaDansPanier ? "Ajouté" : "Ajouter"}
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

// export default function MaterielCard({ materiel, dateDebut, dateFin }) {
//   const toast = useToast();
//   const { addItem, items } = useCart();
//   const dejaDansPanier = items.some((i) => i.code === materiel.CodeMateriel);

//   const stock = toNumber(materiel.quantiteDisponible);
//   const total = toNumber(materiel.quantiteTotale);
//   const rupture = stock <= 0;

//   const handleAdd = () => {
//     if (!dateDebut || !dateFin) {
//       toast.warning("Veuillez sélectionner vos dates avant d'ajouter").bottom();
//       return;
//     }
//     if (rupture) {
//       toast
//         .warning("Ce matériel n'est pas disponible sur cette période")
//         .bottom();
//       return;
//     }
//     if (dejaDansPanier) {
//       toast.warning("Ce matériel est déjà dans votre panier").bottom();
//       return;
//     }
//     addItem(
//       {
//         code: materiel.CodeMateriel,
//         designation: materiel.designation,
//         marque: materiel.marque,
//         imageUrl: materiel.imageURL,
//         prixLocation: toNumber(materiel.prixLocation),
//         prixCaution: toNumber(materiel.prixCaution),
//         dateDebut,
//         dateFin,
//         quantiteDisponible: stock,
//       },
//       "MATERIEL"
//     );
//     toast.success(`${materiel.designation} ajouté au panier`).bottom();
//   };

//   return (
//     <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
//       {/* Image + badges */}
//       <div className="relative aspect-square overflow-hidden bg-slate-100">
//         {materiel.imageURL ? (
//           <img
//             src={materiel.imageURL}
//             alt={materiel.designation}
//             loading="lazy"
//             className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
//             onError={(e) => {
//               e.currentTarget.style.display = "none";
//             }}
//           />
//         ) : (
//           <div className="grid h-full place-items-center text-slate-300">
//             <ImageOff size={40} />
//           </div>
//         )}

//         {materiel.categorie?.libelle && (
//           <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
//             {materiel.categorie.libelle}
//           </span>
//         )}

//         <span
//           className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
//             rupture
//               ? "bg-error/90 text-white"
//               : stock <= 2
//               ? "bg-warning/90 text-white"
//               : "bg-success/90 text-white"
//           }`}
//         >
//           {rupture ? "Épuisé" : `${stock} dispo`}
//         </span>
//       </div>

//       {/* Contenu */}
//       <div className="flex flex-1 flex-col p-4">
//         <h3 className="line-clamp-1 text-base font-bold text-slate-900">
//           {materiel.designation}
//         </h3>
//         <p className="text-xs text-slate-500">
//           {materiel.marque || "—"}
//           <span className="mx-1">·</span>
//           <span className="font-mono">{materiel.CodeMateriel}</span>
//         </p>

//         {materiel.detailTechnique && (
//           <p className="mt-2 line-clamp-2 text-sm text-slate-600">
//             {materiel.detailTechnique}
//           </p>
//         )}

//         <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
//           {toNumber(materiel.prixCaution) > 0 && (
//             <span>Caution {formatPrice(materiel.prixCaution)} Ar</span>
//           )}
//           <span className="inline-flex items-center gap-1">
//             <Boxes size={12} />
//             Stock : {stock} / {total}
//           </span>
//         </div>

//         {/* Prix + CTA */}
//         <div className="mt-auto flex items-end justify-between gap-3 pt-4">
//           <div>
//             <p className="text-xs text-slate-500">À partir de</p>
//             <p className="text-lg font-extrabold text-slate-900">
//               {formatPrice(materiel.prixLocation)} Ar
//               <span className="text-xs font-medium text-slate-500"> / jour</span>
//             </p>
//           </div>
//           <button
//             className={`btn btn-sm ${
//               rupture || dejaDansPanier ? "btn-disabled" : "btn-accent"
//             }`}
//             disabled={rupture || dejaDansPanier}
//             onClick={handleAdd}
//             title={
//               rupture ? "Aucun stock disponible sur cette période" : undefined
//             }
//           >
//             {rupture ? (
//               <>
//                 <AlertTriangle size={14} /> Épuisé
//               </>
//             ) : (
//               <>
//                 <ShoppingCart size={14} />
//                 {dejaDansPanier ? "Ajouté" : "Ajouter"}
//               </>
//             )}
//           </button>
//         </div>
//       </div>
//     </article>
//   );
// }
