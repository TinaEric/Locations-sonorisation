// Client/pages/FormulaireReservation.jsx
// Étape 2 : informations de l'événement, puis création de la réservation.
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Truck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { ReservationService } from "../../data/reservationService";
import EtapesReservation from "../components/commun/EtapesReservation";
import MessageErreur from "../components/commun/MessageErreur";
import ResumeTarif from "../components/panier/ResumeTarif";
import { usePanier } from "../contexts/PanierContext";
import useDisponibilites from "../hooks/useDisponibilites";
import { MODES_RETRAIT } from "../utils/constantes";
import { construireReservation } from "../utils/construireReservation";
import { evaluerLigne, ligneBloquante } from "../utils/disponibilite";
import { extraireMessageErreur } from "../utils/erreurs";
import { sauvegarderInfosPaiement } from "../utils/sessionPaiement";

export default function FormulaireReservation() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { lignes, periode, periodeValide, totaux, viderPanier } = usePanier();
  const disponibilites = useDisponibilites(periode);

  const [formulaire, setFormulaire] = useState({
    lieuEvenement: "",
    modeRetrait: MODES_RETRAIT[0].valeur,
    remarques: "",
    accepteConditions: false,
  });
  const [erreurs, setErreurs] = useState({});
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  if (lignes.length === 0 || !periodeValide) return <Navigate to="/panier" replace />;

  const modifier = (champ, valeur) => {
    setFormulaire((prev) => ({ ...prev, [champ]: valeur }));
    setErreurs((prev) => ({ ...prev, [champ]: undefined }));
  };

  const valider = () => {
    const resultat = {};
    if (!formulaire.lieuEvenement.trim()) resultat.lieuEvenement = "Indiquez le lieu de l'événement.";
    if (!formulaire.accepteConditions) resultat.accepteConditions = "Vous devez accepter les conditions de location.";
    setErreurs(resultat);
    return Object.keys(resultat).length === 0;
  };

  const soumettre = async (e) => {
    e.preventDefault();
    if (!valider()) return;
    if (lignes.some((l) => ligneBloquante(evaluerLigne(disponibilites.obtenir, l)))) {
      toast.error("Certains articles ne sont plus disponibles. Revenez au panier.");
      return;
    }

    setEnvoiEnCours(true);
    try {
      const reservation = await ReservationService.create(
        construireReservation({ idUser: user?.idUser, lignes, periode, formulaire }),
      );
      const numReservation = reservation?.numReservation ?? reservation?.id;
      viderPanier();

      if (!numReservation) {
        toast.info("Réservation enregistrée. Retrouvez-la dans votre profil.");
        navigate("/profil", { replace: true });
        return;
      }
      sauvegarderInfosPaiement(numReservation, {
        acompte: totaux.acompte,
        totalLocation: totaux.totalLocation,
        totalCaution: totaux.totalCaution,
      });
      toast.info("Réservation créée. Passez au paiement de l'acompte.");
      navigate(`/paiement/${numReservation}`, { replace: true });
    } catch (erreur) {
      toast.error(extraireMessageErreur(erreur, "La réservation n'a pas pu être créée."));
    } finally {
      setEnvoiEnCours(false);
    }
  };

  return (
    <div className="space-y-6">
      <EtapesReservation etapeActive={2} />
      <MessageErreur message={disponibilites.erreur} onReessayer={disponibilites.rafraichir} />

      <form onSubmit={soumettre} className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="card card-border bg-base-100">
          <div className="card-body gap-4">
            <h1 className="card-title">Votre événement</h1>

            <label className="form-control">
              <span className="mb-1 text-sm font-medium">Lieu de l'événement *</span>
              <input
                className={`input input-bordered w-full ${erreurs.lieuEvenement ? "input-error" : ""}`}
                placeholder="Ex : Salle des fêtes, Ivato"
                value={formulaire.lieuEvenement}
                onChange={(e) => modifier("lieuEvenement", e.target.value)}
              />
              {erreurs.lieuEvenement && <span className="mt-1 text-xs text-error">{erreurs.lieuEvenement}</span>}
            </label>

            <fieldset className="space-y-2">
              <legend className="mb-1 flex items-center gap-1 text-sm font-medium">
                <Truck className="size-4" /> Mode de récupération
              </legend>
              {MODES_RETRAIT.map((mode) => (
                <label key={mode.valeur} className="flex cursor-pointer items-center gap-3 rounded-box border border-base-300 p-3">
                  <input
                    type="radio"
                    name="modeRetrait"
                    className="radio radio-primary radio-sm"
                    checked={formulaire.modeRetrait === mode.valeur}
                    onChange={() => modifier("modeRetrait", mode.valeur)}
                  />
                  <span className="text-sm">{mode.libelle}</span>
                </label>
              ))}
            </fieldset>

            <label className="form-control">
              <span className="mb-1 text-sm font-medium">Remarques (facultatif)</span>
              <textarea
                className="textarea textarea-bordered h-24 w-full"
                placeholder="Horaires, contraintes d'installation…"
                value={formulaire.remarques}
                onChange={(e) => modifier("remarques", e.target.value)}
              />
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm mt-0.5"
                checked={formulaire.accepteConditions}
                onChange={(e) => modifier("accepteConditions", e.target.checked)}
              />
              <span className="text-sm">
                J'accepte les conditions de location et je m'engage à restituer le matériel en bon état
                (caution demandée à la remise).
              </span>
            </label>
            {erreurs.accepteConditions && <span className="text-xs text-error">{erreurs.accepteConditions}</span>}
          </div>
        </div>

        <ResumeTarif totaux={totaux} periode={periode}>
          <button type="submit" className="btn btn-primary btn-block" disabled={envoiEnCours}>
            {envoiEnCours && <span className="loading loading-spinner loading-sm" />}
            Confirmer et payer l'acompte
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate("/panier")}>
            Retour au panier
          </button>
        </ResumeTarif>
      </form>
    </div>
  );
}
