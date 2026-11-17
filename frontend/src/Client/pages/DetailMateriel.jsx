// Client/pages/DetailMateriel.jsx
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { CalendrierService } from "../../data/CalendrierService";
import CalendrierDisponibilite from "../components/calendrier/CalendrierDisponibilite";
import BadgeDisponibilite from "../components/catalogue/BadgeDisponibilite";
import CartePack from "../components/catalogue/CartePack";
import SelecteurQuantite from "../components/catalogue/SelecteurQuantite";
import Chargement from "../components/commun/Chargement";
import EtatVide from "../components/commun/EtatVide";
import ImageProduit from "../components/commun/ImageProduit";
import SelecteurPeriode from "../components/commun/SelecteurPeriode";
import { usePanier } from "../contexts/PanierContext";
import useCatalogue from "../hooks/useCatalogue";
import useDisponibilites from "../hooks/useDisponibilites";
import { STATUT_DISPONIBILITE as STATUT } from "../utils/constantes";
import { formaterPrix } from "../utils/formatage";

export default function DetailMateriel() {
  const { codeMateriel } = useParams();
  const toast = useToast();
  const { periode, definirPeriode, ajouterMateriel } = usePanier();
  const { materiels, packs, chargement } = useCatalogue();
  const disponibilites = useDisponibilites(periode);
  const [quantite, setQuantite] = useState(1);

  if (chargement) return <Chargement />;

  const materiel = materiels.find((m) => m.CodeMateriel === codeMateriel);
  if (!materiel) {
    return (
      <EtatVide titre="Matériel introuvable" message="Ce matériel n'existe pas ou n'est plus proposé.">
        <Link to="/catalogue" className="btn btn-primary btn-sm">Retour au catalogue</Link>
      </EtatVide>
    );
  }

  const disponibilite = disponibilites.obtenir("materiel", codeMateriel);
  const packsContenantLeMateriel = packs.filter((p) =>
    p.composants?.some((c) => c.materiel?.CodeMateriel === codeMateriel),
  );

  const ajouterAuPanier = () => {
    const resultat = ajouterMateriel(materiel, quantite);
    if (resultat.ok) toast.info(`${quantite} × ${materiel.designation} ajouté au panier`);
    else toast.warning(resultat.raison);
  };

  return (
    <div className="space-y-8">
      <Link to="/catalogue" className="btn btn-ghost btn-sm">
        <ArrowLeft className="size-4" /> Catalogue
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <ImageProduit nomFichier={materiel.imageURL} alt={materiel.designation} className="aspect-video w-full rounded-box" />

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-outline">{materiel.marque}</span>
            <span className="badge badge-ghost">{materiel.categorieLibelle}</span>
            <span className="text-xs text-base-content/50">{materiel.CodeMateriel}</span>
          </div>
          <h1 className="text-3xl font-bold">{materiel.designation}</h1>
          <p className="text-base-content/70">{materiel.detailTechnique}</p>

          <div className="grid grid-cols-2 gap-4 rounded-box bg-base-100 p-4">
            <div>
              <p className="text-xs text-base-content/60">Location</p>
              <p className="text-2xl font-bold text-primary">{formaterPrix(materiel.prixLocation)}</p>
              <p className="text-xs text-base-content/60">par jour</p>
            </div>
            <div>
              <p className="text-xs text-base-content/60">Caution</p>
              <p className="text-2xl font-bold">{formaterPrix(materiel.prixCaution)}</p>
              <p className="text-xs text-base-content/60">remboursable</p>
            </div>
          </div>

          <SelecteurPeriode {...periode} onChange={definirPeriode} />
          <BadgeDisponibilite statut={disponibilite.statut} quantiteDisponible={disponibilite.quantiteDisponible} />

          <div className="flex flex-wrap items-center gap-4">
            <SelecteurQuantite valeur={quantite} onChange={setQuantite} max={disponibilite.quantiteDisponible} />
            <button
              type="button"
              className="btn btn-primary"
              disabled={disponibilite.statut === STATUT.INDISPONIBLE}
              onClick={ajouterAuPanier}
            >
              <ShoppingCart className="size-4" /> Ajouter au panier
            </button>
          </div>
        </div>
      </div>

      <section className="card card-border max-w-xl bg-base-100">
        <div className="card-body">
          <h2 className="card-title">Calendrier de disponibilité</h2>
          <CalendrierDisponibilite
            identifiant={codeMateriel}
            chargerMois={CalendrierService.fabriquerChargeur("materiel", codeMateriel)}
            dateDebut={periode.dateDebut}
            dateFin={periode.dateFin}
          />
        </div>
      </section>

      {packsContenantLeMateriel.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Inclus dans ces packs</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packsContenantLeMateriel.map((pack) => (
              <CartePack
                key={pack.codePack}
                pack={pack}
                disponibilite={disponibilites.obtenir("pack", pack.codePack)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
