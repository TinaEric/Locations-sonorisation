// Client/components/catalogue/CarteMateriel.jsx
import { Link } from "react-router-dom";
import { CalendarDays, ShoppingCart } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { usePanier } from "../../contexts/PanierContext";
import { STATUT_DISPONIBILITE as STATUT } from "../../utils/constantes";
import { formaterPrix } from "../../utils/formatage";
import ImageProduit from "../commun/ImageProduit";
import BadgeDisponibilite from "./BadgeDisponibilite";

export default function CarteMateriel({ materiel, disponibilite, onVoirCalendrier }) {
  const toast = useToast();
  const { ajouterMateriel } = usePanier();
  const indisponible = disponibilite.statut === STATUT.INDISPONIBLE;

  const ajouterAuPanier = () => {
    const resultat = ajouterMateriel(materiel, 1);
    if (resultat.ok) toast.info(`${materiel.designation} ajouté au panier`);
    else toast.warning(resultat.raison);
  };

  return (
    <article className="card card-border bg-base-100 shadow-sm transition hover:shadow-md">
      <Link to={`/materiel/${materiel.CodeMateriel}`}>
        <ImageProduit nomFichier={materiel.imageURL} alt={materiel.designation} className="h-44 w-full rounded-t-box" />
      </Link>
      <div className="card-body gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="badge badge-outline badge-sm">{materiel.marque}</span>
          <BadgeDisponibilite statut={disponibilite.statut} quantiteDisponible={disponibilite.quantiteDisponible} />
        </div>
        <Link to={`/materiel/${materiel.CodeMateriel}`} className="line-clamp-2 font-semibold hover:text-primary">
          {materiel.designation}
        </Link>
        <p className="line-clamp-2 text-xs text-base-content/60">{materiel.detailTechnique}</p>
        <p className="mt-auto text-lg font-bold text-primary">
          {formaterPrix(materiel.prixLocation)} <span className="text-xs font-normal text-base-content/60">/ jour</span>
        </p>
        <div className="card-actions grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onVoirCalendrier(materiel)}>
            <CalendarDays className="size-4" /> Calendrier
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={indisponible} onClick={ajouterAuPanier}>
            <ShoppingCart className="size-4" /> Ajouter
          </button>
        </div>
      </div>
    </article>
  );
}
