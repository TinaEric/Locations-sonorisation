// Client/pages/Panier.jsx
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, RefreshCw, ShoppingCart, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import BadgeDisponibilite from "../components/catalogue/BadgeDisponibilite";
import SelecteurQuantite from "../components/catalogue/SelecteurQuantite";
import EtatVide from "../components/commun/EtatVide";
import EtapesReservation from "../components/commun/EtapesReservation";
import ImageProduit from "../components/commun/ImageProduit";
import MessageErreur from "../components/commun/MessageErreur";
import SelecteurPeriode from "../components/commun/SelecteurPeriode";
import ResumeTarif from "../components/panier/ResumeTarif";
import { useFilter } from "../contexts/FilterContext";
import { usePanier } from "../contexts/PanierContext";
import useDisponibilites from "../hooks/useDisponibilites";
import { evaluerLigne, ligneBloquante } from "../utils/disponibilite";
import { formaterPrix } from "../utils/formatage";
import { useToast } from "../../contexts/ToastContext";

export default function Panier() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const { periode, definirPeriode, periodeValide } = useFilter();
  const {
    lignes,
    totaux,
    modifierQuantite,
    retirerLigne,
    viderPanier,
  } = usePanier();
  const disponibilites = useDisponibilites(periode);

  if (lignes.length === 0) {
    return (
      <EtatVide
        Icone={ShoppingCart}
        titre="Votre panier est vide"
        message="Parcourez le catalogue pour ajouter du matériel ou un pack."
      >
        <Link to="/catalogue" className="btn btn-primary btn-sm">
          Voir le catalogue
        </Link>
      </EtatVide>
    );
  }

  const etats = Object.fromEntries(
    lignes.map((l) => [l.code, evaluerLigne(disponibilites.obtenir, l)]),
  );
  const nbBloquantes = lignes.filter((l) => ligneBloquante(etats[l.code])).length;

  const passerReservation = () => {
    if (!periodeValide) {
      toast.error("Choisissez vos dates de location avant de réserver.");
      return;
    }
    if (nbBloquantes > 0) {
      toast.error("Certains articles ne sont pas disponibles sur cette période.");
      return;
    }
    if (!isAuthenticated) {
      toast.info("Connectez-vous pour finaliser votre réservation.");
      navigate("/auth/login", { state: { from: "/reservation" } });
      return;
    }
    navigate("/reservation");
  };

  return (
    <div className="space-y-6">
      <EtapesReservation etapeActive={1} />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <div className="card card-border bg-base-100">
            <div className="card-body gap-3">
              <h2 className="card-title text-base">Dates de location</h2>
              <SelecteurPeriode {...periode} onChange={definirPeriode} />
              <div className="flex items-center justify-between">
                <p className="text-xs text-base-content/60">
                  La disponibilité est vérifiée sur la période choisie.
                </p>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={disponibilites.rafraichir}
                  disabled={!periodeValide}
                >
                  <RefreshCw
                    className={`size-3.5 ${
                      disponibilites.chargement ? "animate-spin" : ""
                    }`}
                  />{" "}
                  Vérifier
                </button>
              </div>
              <MessageErreur message={disponibilites.erreur} />
            </div>
          </div>

          <ul className="space-y-3">
            {totaux.detail.map((ligne) => (
              <li
                key={ligne.code}
                className="card card-border card-side items-center bg-base-100"
              >
                <ImageProduit
                  nomFichier={ligne.image}
                  alt={ligne.designation}
                  className="size-28 shrink-0 rounded-l-box"
                />
                <div className="card-body gap-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        to={
                          ligne.type === "pack"
                            ? `/pack/${ligne.code}`
                            : `/materiel/${ligne.code}`
                        }
                        className="font-semibold hover:text-primary"
                      >
                        {ligne.designation}
                      </Link>
                      <p className="text-xs text-base-content/60">
                        {ligne.type === "pack" ? "Pack" : ligne.marque} ·{" "}
                        {formaterPrix(ligne.prixUnitaire)} / jour
                      </p>
                    </div>
                    <BadgeDisponibilite {...etats[ligne.code]} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <SelecteurQuantite
                      taille="sm"
                      valeur={ligne.quantite}
                      max={etats[ligne.code].quantiteDisponible}
                      onChange={(q) => modifierQuantite(ligne.code, q)}
                    />
                    <p className="font-bold">
                      {formaterPrix(ligne.sousTotalLocation)}
                    </p>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-error"
                      onClick={() => retirerLigne(ligne.code)}
                    >
                      <Trash2 className="size-4" /> Retirer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={viderPanier}
          >
            Vider le panier
          </button>
        </div>

        <ResumeTarif totaux={totaux} periode={periode}>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={passerReservation}
          >
            Passer la réservation <ArrowRight className="size-4" />
          </button>
          {nbBloquantes > 0 && (
            <p className="text-center text-xs text-error">
              {nbBloquantes} article(s) indisponible(s) sur cette période.
            </p>
          )}
        </ResumeTarif>
      </div>
    </div>
  );
}