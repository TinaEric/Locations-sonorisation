// Client/pages/ProfilClient.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { ReservationService } from "../../data/reservationService";
import Chargement from "../components/commun/Chargement";
import EtatVide from "../components/commun/EtatVide";
import MessageErreur from "../components/commun/MessageErreur";
import { extraireMessageErreur } from "../utils/erreurs";
import { formaterDate, formaterPrix } from "../utils/formatage";
import { userService } from "../../data/UserService";

export default function ProfilClient() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [profil, setProfil] = useState(user);

  // useEffect(() => {
  //   let annule = false;
  //   ReservationService.list({ idprofil:profil?.idprofil })
  //     .then((liste) => !annule && setReservations(Array.isArray(liste) ? liste : (liste?.data ?? [])))
  //     .catch((e) => !annule && setErreur(extraireMessageErreur(e, "Impossible de charger vos réservations.")))
  //     .finally(() => !annule && setChargement(false));
  //   return () => {
  //     annule = true;
  //   };
  // }, [profil?.idprofil]);

  const fecthData = async () => {
    setChargement(true);
    try {
      const result = await userService.detail(user.idUser);
      console.log("proifllll: ", result);
      if (result) {
        setProfil(result);
        setReservations(result.reservations);
      } else {
        setProfil(user);
        setReservations(user.reservations);
      }
      setChargement(false);
    } catch (e) {
      setErreur(
        extraireMessageErreur(e, "Impossible de charger vos réservations.")
      );
      console.log("Erreur: ", e);
    }
    setChargement(false);
  };

  useEffect(() => {
    fecthData();
  }, []);

  console.log("CLIENT: ", profil);

  const enAttentePaiement = (r) =>
    String(r.statutLocation ?? "")
      .toLowerCase()
      .includes("attente");

  const versPaiement = (num) => {
    navigate("/paiement", {
      state: {
        numReservation: num,
        telephone: user.telephone
      },
    });
  };
  return (
    <div className="space-y-6">
      <section className="card card-border bg-base-100">
        <div className="card-body gap-1">
          <h1 className="card-title">Mon profil</h1>
          <p className="font-medium">
            {[profil.nomComplet].filter(Boolean).join(" ") || profil?.email}
          </p>
          <p className="text-sm text-base-content/60">{profil?.email}</p>
          {profil?.telephone && (
            <p className="text-sm text-base-content/60">{profil.telephone}</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Mes réservations</h2>
        <MessageErreur message={erreur} />
        {chargement && <Chargement />}
        {!chargement && !erreur && reservations.length === 0 && (
          <EtatVide
            Icone={ClipboardList}
            titre="Aucune réservation"
            message="Vos réservations apparaîtront ici."
          >
            <Link to="/catalogue" className="btn btn-primary btn-sm">
              Voir le catalogue
            </Link>
          </EtatVide>
        )}
        {reservations.length > 0 && (
          <div className="overflow-x-auto rounded-box bg-base-100">
            <table className="table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Période</th>
                  <th>Lieu</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.numReservation ?? r.id}>
                    <td className="font-medium">{r.numReservation ?? r.id}</td>
                    <td className="whitespace-nowrap">
                      {formaterDate(r.dateDebutPrevue)} →{" "}
                      {formaterDate(r.dateFinPrevue)}
                    </td>
                    <td>{r.lieuEvenement ?? "—"}</td>
                    <td>
                      {r.montantTotal != null
                        ? formaterPrix(r.montantTotal)
                        : "—"}
                    </td>
                    <td>
                      <span className="badge badge-ghost capitalize">
                        {r.statutLocation ?? "—"}
                      </span>
                    </td>
                    <td>
                      {enAttentePaiement(r) && (
                        <button
                          onClick={() => versPaiement(r.numReservation)}
                          className="btn btn-primary btn-xs"
                        >
                          Payer l'acompte
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
