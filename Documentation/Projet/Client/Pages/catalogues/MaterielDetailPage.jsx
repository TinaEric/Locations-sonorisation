import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck,
  PackageCheck,
  ShoppingCart,
} from "lucide-react";

import { useNavbar } from "../../contexts/NavbarContext";
import { useToast } from "../../../contexts/ToastContext";
import { ReservationService } from "../../../data/reservationService";
import { IMAGES_URL } from "../../../data/Api";

export default function MaterielDetailPage() {
  const { codeMateriel } = useParams();
  const { dateDebut, dateFin, datesCompletes } = useNavbar();
  const { showToast } = useToast();

  const [materiel, setMateriel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disponibiliteVerifiee, setDisponibiliteVerifiee] = useState(false);
  const [verificationEnCours, setVerificationEnCours] = useState(false);

  const chargerMateriel = async () => {
    setLoading(true);

    try {
      const response = await ReservationService.tousMateriel();
      const categories = response?.data ?? response ?? [];

      const materielTrouve = categories
        .flatMap((categorie) => categorie.materiels ?? [])
        .find((item) => item.CodeMateriel === codeMateriel);

      if (!materielTrouve) {
        throw new Error("Matériel introuvable.");
      }

      setMateriel(materielTrouve);
      setDisponibiliteVerifiee(datesCompletes);
    } catch (error) {
      showToast(
        error?.response?.data?.message ??
          error?.message ??
          "Impossible de charger ce matériel.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerMateriel();
  }, [codeMateriel, dateDebut, dateFin]);

  const verifierDisponibilite = async () => {
    setVerificationEnCours(true);

    try {
      const response = await ReservationService.materielDispibles({
        dateDebut,
        dateFin,
      });

      const categories = response?.data ?? response ?? [];

      const materielTrouve = categories
        .flatMap((categorie) => categorie.materiels ?? [])
        .find((item) => item.CodeMateriel === codeMateriel);

      if (!materielTrouve || materielTrouve.quantiteDisponible <= 0) {
        showToast(
          "Ce matériel n’est pas disponible pour les dates choisies.",
          "warning"
        );

        setDisponibiliteVerifiee(false);
        return;
      }

      setMateriel(materielTrouve);
      setDisponibiliteVerifiee(true);
      showToast("Matériel disponible pour les dates choisies.", "success");
    } catch (error) {
      showToast(
        error?.response?.data?.message ??
          "Impossible de vérifier la disponibilité.",
        "error"
      );
    } finally {
      setVerificationEnCours(false);
    }
  };

  const ajouterAuPanier = () => {
    if (!datesCompletes) {
      showToast(
        "Veuillez d’abord sélectionner les dates de location.",
        "warning"
      );
      return;
    }

    if (!disponibiliteVerifiee) {
      showToast(
        "Veuillez vérifier la disponibilité avant d’ajouter ce matériel.",
        "warning"
      );
      return;
    }

    // À connecter ensuite à votre CartContext
    console.log("Ajout du matériel au panier :", {
      type: "materiel",
      codeMateriel,
      dateDebut,
      dateFin,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/materiels" className="btn btn-ghost btn-sm">
        <ArrowLeft size={16} />
        Retour aux matériels
      </Link>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body lg:flex-row">
         
          <img
            src={`${IMAGES_URL}/${materiel.imageURL}`}
            alt={materiel.designation}
            className="h-64 w-full rounded-box object-cover lg:w-1/2"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `${IMAGES_URL}/image.png`;
            }}
          />
          <div className="flex-1 space-y-3">
            <h1 className="text-2xl font-bold">{materiel.designation}</h1>

            <div className="flex flex-wrap gap-2">
              <span className="badge badge-outline">{materiel.marque}</span>

              <span className="badge badge-outline">
                {materiel.CodeMateriel}
              </span>

              <span className="badge badge-success">
                {materiel.quantiteDisponible} disponible(s)
              </span>
            </div>

            <p className="text-sm opacity-70">{materiel.detailTechnique}</p>

            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Prix location</div>

                <div className="stat-value text-accent">
                  {Number(materiel.prixLocation).toLocaleString("fr-FR")} Ar
                </div>

                <div className="stat-desc">par jour</div>
              </div>

              <div className="stat">
                <div className="stat-title">Caution</div>

                <div className="stat-value text-lg">
                  {Number(materiel.prixCaution).toLocaleString("fr-FR")} Ar
                </div>
              </div>
            </div>

            <div className="card-actions justify-end">
              {!datesCompletes && (
                <div className="alert alert-warning">
                  Sélectionnez les dates dans la barre supérieure.
                </div>
              )}

              <button
                type="button"
                className="btn btn-outline"
                disabled={!datesCompletes || verificationEnCours}
                onClick={verifierDisponibilite}
              >
                {verificationEnCours ? (
                  <span className="loading loading-spinner" />
                ) : (
                  <>
                    <CalendarCheck size={16} />
                    Vérifier la disponibilité
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-accent"
                disabled={
                  !datesCompletes ||
                  !disponibiliteVerifiee ||
                  verificationEnCours
                }
                onClick={ajouterAuPanier}
              >
                <ShoppingCart size={16} />
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
