// Client/components/catalogue/CartePack.jsx
import { Link } from "react-router-dom";
import { CalendarDays, ShoppingCart, Users, Zap } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { usePanier } from "../../contexts/PanierContext";
import { formaterPrix } from "../../utils/formatage";
import { STATUT_DISPONIBILITE as STATUT } from "../../utils/constantes";
import ImageProduit from "../commun/ImageProduit";
import BadgeDisponibilite from "./BadgeDisponibilite";
import { useFilter } from "../../contexts/FilterContext";

export default function CartePack({ pack, disponibilite, onVoirCalendrier }) {
  const toast = useToast();

  const { ajouterPack , setOuvreDateModal, } = usePanier();
  const { datesCompletes} = useFilter();

  const quantiteDisponible = Number(disponibilite?.quantiteDisponible ?? 0);
  const indisponible =
      disponibilite?.statut === STATUT.INDISPONIBLE ||
      disponibilite?.etatPack === "indisponible" ||
      quantiteDisponible <= 0;

  const ajouterAuPanier = () => {
    const resultat = ajouterPack(pack, 1);
    if (!resultat.ok && resultat.raison === "dates_requises") return;
    if (resultat.ok) toast.info(`${pack.libelle} ajouté au panier`);
    else toast.warning(resultat.raison);
  };

  return (
    <article className="card card-border bg-base-100 shadow-sm transition hover:shadow-md">
      <Link to={`/pack/${pack.codePack}`} className="relative">
        <ImageProduit
          nomFichier={pack.photos}
          alt={pack.libelle}
          className="h-44 w-full rounded-t-box"
        />
        <span className="badge badge-secondary absolute left-3 top-3">
          Pack
        </span>
      </Link>
      <div className="card-body gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="badge badge-outline badge-sm capitalize">
            {pack.categoriePack}
          </span>
          <BadgeDisponibilite
            statut={disponibilite?.statut}
            quantiteDisponible={quantiteDisponible}
          />
        </div>
        <Link
          to={`/pack/${pack.codePack}`}
          className="line-clamp-2 font-semibold hover:text-primary"
        >
          {pack.libelle}
        </Link>
        <p className="line-clamp-2 text-xs text-base-content/60">
          {pack.description}
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-base-content/70">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {pack.capaciteMin}–{pack.capaciteMax}{" "}
            pers.
          </span>
          <span className="flex items-center gap-1">
            <Zap className="size-3.5" /> {Number(pack.puissanceTotal)} W
          </span>
        </div>
        <p className="mt-auto text-lg font-bold text-primary">
          {formaterPrix(pack.tarifJournalier)}{" "}
          <span className="text-xs font-normal text-base-content/60">
            / jour
          </span>
        </p>
        <div
          className={`card-actions grid gap-2 ${
            onVoirCalendrier ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {onVoirCalendrier && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onVoirCalendrier(pack)}
            >
              <CalendarDays className="size-4" /> Calendrier
            </button>
          )}
          {!datesCompletes ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setOuvreDateModal(true)}
            >
              <ShoppingCart className="size-4" /> Ajouter
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={indisponible}
              onClick={ajouterAuPanier}
            >
              <ShoppingCart className="size-4" /> Ajouter
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// // Client/components/catalogue/CartePack.jsx
// import { Link } from "react-router-dom";
// import { CalendarDays, ShoppingCart, Users, Zap } from "lucide-react";
// import { useToast } from "../../../contexts/ToastContext";
// import { usePanier } from "../../contexts/PanierContext";
// import { STATUT_DISPONIBILITE as STATUT } from "../../utils/constantes";
// import { formaterPrix } from "../../utils/formatage";
// import ImageProduit from "../commun/ImageProduit";
// import BadgeDisponibilite from "./BadgeDisponibilite";

// export default function CartePack({ pack, disponibilite, onVoirCalendrier }) {
//   const toast = useToast();
//   const { ajouterPack, datesCompletes, setOuvreDateModal } =
//     usePanier();

//   const quantiteDisponible = Number(disponibilite?.quantiteDisponible ?? 0);
//   const indisponible =
//     disponibilite?.statut === STATUT.INDISPONIBLE ||
//     disponibilite?.etatPack === "indisponible" ||
//     quantiteDisponible <= 0;

  
//   const ajouterAuPanier = () => {

//     const resultat = ajouterPack(pack, 1);
//     if (!resultat.ok && resultat.raison === "dates_requises") return;
//     if (resultat.ok) toast.info(`${pack.libelle} ajouté au panier`);
//     else toast.warning(resultat.raison);
//   };

//   return (
//     <article className="card card-border bg-base-100 shadow-sm transition hover:shadow-md">
//       <Link to={`/pack/${pack.codePack}`} className="relative">
//         <ImageProduit
//           nomFichier={pack.photos}
//           alt={pack.libelle}
//           className="h-44 w-full rounded-t-box"
//         />
//         <span className="badge badge-secondary absolute left-3 top-3">
//           Pack
//         </span>
//       </Link>
//       <div className="card-body gap-2 p-4">
//         <div className="flex items-start justify-between gap-2">
//           <span className="badge badge-outline badge-sm capitalize">
//             {pack.categoriePack}
//           </span>
//           <BadgeDisponibilite
//             statut={disponibilite?.statut}
//             quantiteDisponible={quantiteDisponible}
//           />
//         </div>
//         <Link
//           to={`/pack/${pack.codePack}`}
//           className="line-clamp-2 font-semibold hover:text-primary"
//         >
//           {pack.libelle}
//         </Link>
//         <p className="line-clamp-2 text-xs text-base-content/60">
//           {pack.description}
//         </p>
//         <div className="flex flex-wrap gap-3 text-xs text-base-content/70">
//           <span className="flex items-center gap-1">
//             <Users className="size-3.5" /> {pack.capaciteMin}–{pack.capaciteMax}{" "}
//             pers.
//           </span>
//           <span className="flex items-center gap-1">
//             <Zap className="size-3.5" /> {Number(pack.puissanceTotal)} W
//           </span>
//         </div>
//         <p className="mt-auto text-lg font-bold text-primary">
//           {formaterPrix(pack.tarifJournalier)}{" "}
//           <span className="text-xs font-normal text-base-content/60">
//             / jour
//           </span>
//         </p>
//         <div
//           className={`card-actions grid gap-2 ${
//             onVoirCalendrier ? "grid-cols-2" : "grid-cols-1"
//           }`}
//         >
//           {onVoirCalendrier && (
//             <button
//               type="button"
//               className="btn btn-outline btn-sm"
//               onClick={() => onVoirCalendrier(pack)}
//             >
//               <CalendarDays className="size-4" /> Calendrier
//             </button>
//           )}
//           {!datesCompletes ? (
//             <button
//               type="button"
//               className="btn btn-primary btn-sm"
//               onClick={() => setOuvreDateModal(true)}
//             >
//               <ShoppingCart className="size-4" /> Ajouter
//             </button>
//           ) : (
//             <button
//               type="button"
//               className="btn btn-primary btn-sm"
//               disabled={indisponible}
//               onClick={ajouterAuPanier}
//             >
//               <ShoppingCart className="size-4" /> Ajouter
//             </button>
//           )}
//         </div>
//       </div>
//     </article>
//   );
// }
