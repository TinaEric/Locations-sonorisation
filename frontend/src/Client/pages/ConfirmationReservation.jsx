// Client/pages/ConfirmationReservation.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { ReservationService } from "../../data/reservationService";
import EtapesReservation from "../components/commun/EtapesReservation";
import { formaterDate } from "../utils/formatage";

export default function ConfirmationReservation() {
  const { numReservation } = useParams();
  const [reservation, setReservation] = useState(null);

  useEffect(() => {
    ReservationService.detail(numReservation)
      .then(setReservation)
      .catch(() => setReservation(null)); // la confirmation reste affichée même sans le détail
  }, [numReservation]);

  return (
    <div className="mx-auto space-y-6">
      <EtapesReservation etapeActive={4} />

      <div className="card card-border bg-base-100 text-center">
        <div className="card-body items-center gap-3">
          <CheckCircle className="size-16 text-success" />
          <h1 className="text-2xl font-bold">Réservation confirmée</h1>
          <p className="text-base-content/70">
            Votre acompte a bien été reçu. Notre équipe prépare votre matériel et vous tiendra informé
            des prochaines étapes par notification.
          </p>

          <dl className="mt-2 w-full space-y-2 rounded-box bg-base-200 p-4 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-base-content/60">N° de réservation</dt>
              <dd className="font-semibold">{numReservation}</dd>
            </div>
            {reservation?.dateDebutPrevue && (
              <div className="flex justify-between">
                <dt className="text-base-content/60">Période</dt>
                <dd className="font-medium">
                  {formaterDate(reservation.dateDebutPrevue)} → {formaterDate(reservation.dateFinPrevue)}
                </dd>
              </div>
            )}
            {reservation?.lieuEvenement && (
              <div className="flex justify-between">
                <dt className="text-base-content/60">Lieu</dt>
                <dd className="font-medium">{reservation.lieuEvenement}</dd>
              </div>
            )}
          </dl>

          <div className="card-actions mt-2">
            <Link to="/profil" className="btn btn-primary">Voir mes réservations</Link>
            <Link to="/catalogue" className="btn btn-ghost">Continuer mes recherches</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
