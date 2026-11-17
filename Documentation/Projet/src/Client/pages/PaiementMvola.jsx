// Client/pages/PaiementMvola.jsx
// Page de SIMULATION du paiement Mvola (aucune transaction réelle).
// Étapes : saisie du numéro → saisie du code secret → traitement → succès / échec.
// Astuce de test : le code secret 0000 simule un paiement refusé.
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Lock, ShieldCheck, Smartphone, XCircle } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { ReservationService } from "../../data/reservationService";
import EtapesReservation from "../components/commun/EtapesReservation";
import Chargement from "../components/commun/Chargement";
import { PIN_ECHEC_SIMULE } from "../utils/constantes";
import { extraireMessageErreur } from "../utils/erreurs";
import { formaterPrix } from "../utils/formatage";
import { lireInfosPaiement } from "../utils/sessionPaiement";
import { deduireAcompte } from "../utils/tarification";

const DUREE_TRAITEMENT_MS = 2500;
const REGEX_NUMERO_MVOLA = /^03[48]\d{7}$/; // 034 / 038 (Yas)
const attendre = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const genererReference = () => `MV${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;

export default function PaiementMvola() {
  const { numReservation } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [acompte, setAcompte] = useState(null);
  const [etape, setEtape] = useState("saisie"); // saisie | pin | traitement | echec
  const [numero, setNumero] = useState("");
  const [pin, setPin] = useState("");
  const [erreur, setErreur] = useState("");
  const montee = useRef(true);

  useEffect(() => {
    montee.current = true;
    return () => {
      montee.current = false;
    };
  }, []);

  useEffect(() => {
    const infos = lireInfosPaiement(numReservation);
    if (infos?.acompte) {
      setAcompte(infos.acompte);
      return;
    }
    ReservationService.detail(numReservation)
      .then((reservation) => setAcompte(deduireAcompte(reservation)))
      .catch((e) => {
        toast.error(extraireMessageErreur(e, "Réservation introuvable."));
        navigate("/profil", { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numReservation]);

  if (acompte === null) return <Chargement message="Chargement de votre réservation…" />;

  const numeroNettoye = numero.replace(/\s/g, "");

  const validerNumero = (e) => {
    e.preventDefault();
    if (!REGEX_NUMERO_MVOLA.test(numeroNettoye)) {
      setErreur("Numéro Mvola invalide (ex : 034 12 345 67 ou 038 12 345 67).");
      return;
    }
    setErreur("");
    setEtape("pin");
  };

  const confirmerPaiement = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setErreur("Le code secret comporte 4 chiffres.");
      return;
    }
    setErreur("");
    setEtape("traitement");
    await attendre(DUREE_TRAITEMENT_MS);
    if (!montee.current) return;

    if (pin === PIN_ECHEC_SIMULE) {
      setEtape("echec");
      return;
    }
    try {
      await ReservationService.ajouterPaiement(numReservation, {
        montant: acompte,
        modePaiement: "MVOLA",
        typePaiement: "ACOMPTE",
        numeroTelephone: numeroNettoye,
        referenceTransaction: genererReference(),
      });
      toast.info("Paiement de l'acompte reçu.");
      navigate(`/confirmation/${numReservation}`, { replace: true });
    } catch (erreurPaiement) {
      toast.error(extraireMessageErreur(erreurPaiement, "Le paiement n'a pas pu être enregistré."));
      if (montee.current) setEtape("echec");
    }
  };

  const recommencer = () => {
    setPin("");
    setErreur("");
    setEtape("saisie");
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <EtapesReservation etapeActive={3} />

      <div role="alert" className="alert alert-warning alert-soft text-sm">
        <ShieldCheck className="size-5" />
        <span>Page de simulation : aucun argent n'est réellement débité.</span>
      </div>

      <div className="overflow-hidden rounded-box bg-base-100 shadow-lg">
        <div className="bg-yellow-400 p-5 text-black">
          <p className="text-2xl font-extrabold tracking-tight">Mvola</p>
          <p className="text-xs">Paiement mobile (simulation)</p>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between rounded-box bg-base-200 p-4">
            <div>
              <p className="text-xs text-base-content/60">Réservation</p>
              <p className="font-semibold">{numReservation}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-base-content/60">Acompte à payer</p>
              <p className="text-xl font-bold">{formaterPrix(acompte)}</p>
            </div>
          </div>

          {etape === "saisie" && (
            <form onSubmit={validerNumero} className="space-y-4">
              <label className="form-control">
                <span className="mb-1 flex items-center gap-1 text-sm font-medium">
                  <Smartphone className="size-4" /> Votre numéro Mvola
                </span>
                <input
                  className={`input input-bordered w-full ${erreur ? "input-error" : ""}`}
                  inputMode="tel"
                  placeholder="034 12 345 67"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  autoFocus
                />
                {erreur && <span className="mt-1 text-xs text-error">{erreur}</span>}
              </label>
              <button type="submit" className="btn btn-block border-none bg-yellow-400 text-black hover:bg-yellow-300">
                Continuer
              </button>
            </form>
          )}

          {etape === "pin" && (
            <form onSubmit={confirmerPaiement} className="space-y-4">
              <p className="text-sm text-base-content/70">
                Validez le paiement de <strong>{formaterPrix(acompte)}</strong> depuis le{" "}
                <strong>{numeroNettoye}</strong> en saisissant votre code secret.
              </p>
              <label className="form-control">
                <span className="mb-1 flex items-center gap-1 text-sm font-medium">
                  <Lock className="size-4" /> Code secret (4 chiffres)
                </span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className={`input input-bordered w-full tracking-[0.5em] ${erreur ? "input-error" : ""}`}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                />
                {erreur && <span className="mt-1 text-xs text-error">{erreur}</span>}
              </label>
              <p className="text-xs text-base-content/50">Simulation : n'importe quel code est accepté, sauf {PIN_ECHEC_SIMULE} (refus).</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn btn-ghost" onClick={recommencer}>Retour</button>
                <button type="submit" className="btn border-none bg-yellow-400 text-black hover:bg-yellow-300">Payer</button>
              </div>
            </form>
          )}

          {etape === "traitement" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="loading loading-spinner loading-lg" />
              <p className="font-medium">Traitement du paiement…</p>
              <p className="text-xs text-base-content/60">Ne fermez pas cette page.</p>
            </div>
          )}

          {etape === "echec" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <XCircle className="size-12 text-error" />
              <p className="font-semibold">Paiement refusé</p>
              <p className="text-sm text-base-content/60">La transaction n'a pas abouti. Vous pouvez réessayer.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={recommencer}>Réessayer</button>
            </div>
          )}
        </div>
      </div>

      {etape === "saisie" && (
        <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={() => navigate("/profil")}>
          <CheckCircle className="size-4" /> Payer plus tard depuis mon profil
        </button>
      )}
    </div>
  );
}
