// Client/pages/DetailPack.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, ShoppingCart, Users, Zap } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { CalendrierService } from "../../data/CalendrierService";
import { PackService } from "../../data/PackService";
import CalendrierDisponibilite from "../components/calendrier/CalendrierDisponibilite";
import BadgeDisponibilite from "../components/catalogue/BadgeDisponibilite";
import SelecteurQuantite from "../components/catalogue/SelecteurQuantite";
import Chargement from "../components/commun/Chargement";
import EtatVide from "../components/commun/EtatVide";
import ImageProduit from "../components/commun/ImageProduit";
import MessageErreur from "../components/commun/MessageErreur";
import SelecteurPeriode from "../components/commun/SelecteurPeriode";
import { usePanier } from "../contexts/PanierContext";
import useDisponibilites from "../hooks/useDisponibilites";
import { STATUT_DISPONIBILITE as STATUT } from "../utils/constantes";
import { extraireMessageErreur } from "../utils/erreurs";
import { formaterPrix } from "../utils/formatage";

export default function DetailPack() {
  const { codePack } = useParams();
  const toast = useToast();
  const { periode, definirPeriode, ajouterPack } = usePanier();
  const disponibilites = useDisponibilites(periode);
  const [pack, setPack] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [quantite, setQuantite] = useState(1);

  useEffect(() => {
    let annule = false;
    setChargement(true);
    PackService.detail(codePack)
      .then((donnees) => !annule && setPack(donnees))
      .catch((e) => !annule && setErreur(extraireMessageErreur(e, "Pack introuvable.")))
      .finally(() => !annule && setChargement(false));
    return () => {
      annule = true;
    };
  }, [codePack]);

  if (chargement) return <Chargement />;
  if (!pack) {
    return (
      <EtatVide titre="Pack introuvable" message={erreur ?? "Ce pack n'existe pas ou n'est plus proposé."}>
        <Link to="/catalogue?onglet=packs" className="btn btn-primary btn-sm">Voir les packs</Link>
      </EtatVide>
    );
  }

  const disponibilite = disponibilites.obtenir("pack", codePack);
  const composants = pack.composants ?? [];
  const prixSepare = composants.reduce((s, c) => s + Number(c.materiel?.prixLocation ?? 0) * c.quantite, 0);
  const economie = prixSepare - Number(pack.tarifJournalier);

  const ajouterAuPanier = () => {
    const resultat = ajouterPack(pack, quantite);
    if (resultat.ok) toast.info(`${pack.libelle} ajouté au panier`);
    else toast.warning(resultat.raison);
  };

  return (
    <div className="space-y-8">
      <Link to="/catalogue?onglet=packs" className="btn btn-ghost btn-sm">
        <ArrowLeft className="size-4" /> Packs
      </Link>
      <MessageErreur message={erreur} />

      <div className="grid gap-8 lg:grid-cols-2">
        <ImageProduit nomFichier={pack.photos} alt={pack.libelle} className="aspect-video w-full rounded-box" />

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-secondary">Pack</span>
            <span className="badge badge-outline capitalize">{pack.categoriePack}</span>
            {(pack.usages ?? []).map((usage) => (
              <span key={usage} className="badge badge-ghost capitalize">{usage}</span>
            ))}
          </div>
          <h1 className="text-3xl font-bold">{pack.libelle}</h1>
          <p className="text-base-content/70">{pack.description}</p>

          <ul className="flex flex-wrap gap-4 text-sm text-base-content/70">
            <li className="flex items-center gap-1"><Users className="size-4" /> {pack.capaciteMin}–{pack.capaciteMax} personnes</li>
            <li className="flex items-center gap-1"><Zap className="size-4" /> {Number(pack.puissanceTotal)} W</li>
            <li className="flex items-center gap-1 capitalize"><MapPin className="size-4" /> {pack.typeLieu}</li>
          </ul>

          <div className="grid grid-cols-2 gap-4 rounded-box bg-base-100 p-4">
            <div>
              <p className="text-xs text-base-content/60">Tarif journalier</p>
              <p className="text-2xl font-bold text-primary">{formaterPrix(pack.tarifJournalier)}</p>
              {economie > 0 && (
                <p className="text-xs text-success">Économisez {formaterPrix(economie)} / jour vs. location séparée</p>
              )}
            </div>
            <div>
              <p className="text-xs text-base-content/60">Caution</p>
              <p className="text-2xl font-bold">{formaterPrix(pack.prixCaution)}</p>
            </div>
          </div>

          <SelecteurPeriode {...periode} onChange={definirPeriode} />
          <BadgeDisponibilite statut={disponibilite.statut} />

          <div className="flex flex-wrap items-center gap-4">
            <SelecteurQuantite valeur={quantite} onChange={setQuantite} />
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

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Matériel inclus ({composants.length})</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {composants.map((composant) => (
            <li key={composant.idComposant}>
              <Link
                to={`/materiel/${composant.materiel.CodeMateriel}`}
                className="card card-border card-side items-center bg-base-100 transition hover:shadow-md"
              >
                <ImageProduit nomFichier={composant.materiel.imageURL} alt={composant.materiel.designation} className="size-24 shrink-0 rounded-l-box" />
                <div className="card-body gap-1 p-4">
                  <p className="font-semibold">{composant.quantite} × {composant.materiel.designation}</p>
                  <p className="text-xs text-base-content/60">{composant.materiel.marque} — {composant.materiel.detailTechnique}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card card-border max-w-xl bg-base-100">
        <div className="card-body">
          <h2 className="card-title">Calendrier de disponibilité</h2>
          <CalendrierDisponibilite
            identifiant={codePack}
            chargerMois={CalendrierService.fabriquerChargeur("pack", codePack)}
            dateDebut={periode.dateDebut}
            dateFin={periode.dateFin}
          />
        </div>
      </section>
    </div>
  );
}
