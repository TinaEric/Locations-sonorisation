import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Store, TriangleAlert, Truck } from 'lucide-react';
import { createReservation } from '../../../data/reservationService.js';
import { Dialog, formatDateFr, formatMoney, pluriel } from './reservationUi.jsx';

const MODES = [
  { value: 'sur_place', titre: 'Retrait sur place', texte: 'Vous récupérez le matériel chez le loueur.', Icone: Store },
  { value: 'livraison', titre: 'Livraison', texte: "Le matériel est livré sur le lieu de l'événement.", Icone: Truck },
];

/**
 * Corps de la requête POST /reservation/creer.
 * À adapter ici si votre API attend d'autres noms de champs.
 */
const construirePayload = ({ pack, filtres, lieuEvenement, modeRetrait, remarques }) => ({
  dateDebutPrevue: filtres.dateDebut,
  dateFinPrevue: filtres.dateFin,
  lieuEvenement: lieuEvenement.trim(),
  modeRetrait,
  remarques: remarques.trim(),
  lignes: [{ typeItem: 'pack', codePack: pack.codePack, quantite: 1 }],
});

/** Formulaire de réservation d'un pack pour la période choisie dans les filtres. */
export default function ReservationPackModal({ pack, filtres, onClose, onCree }) {
  const uid = useId();
  const [lieuEvenement, setLieuEvenement] = useState('');
  const [modeRetrait, setModeRetrait] = useState('sur_place');
  const [remarques, setRemarques] = useState('');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [resultat, setResultat] = useState(null); // réponse de l'API une fois la réservation créée

  const total = Number(pack.tarifJournalier || 0) * filtres.jours;

  const envoyer = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErreur(null);
    try {
      const resp = await createReservation(
        construirePayload({ pack, filtres, lieuEvenement, modeRetrait, remarques })
      );
      setResultat(resp ?? {});
      onCree?.();
    } catch (err) {
      setErreur(err?.message || "La réservation n'a pas pu être enregistrée. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------- Confirmation ------------------------- */
  if (resultat) {
    const numero = resultat.numReservation ?? resultat.reservation?.numReservation;
    return (
      <Dialog titre="Demande envoyée" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CircleCheck className="size-14 text-success" aria-hidden="true" />
          <p className="text-lg font-semibold">Votre demande de réservation est enregistrée.</p>
          {numero && (
            <p>
              Numéro de réservation : <span className="font-mono font-bold">{numero}</span>
            </p>
          )}
          <p className="text-sm text-base-content/70">
            « {pack.libelle} » du {formatDateFr(filtres.dateDebut)} au {formatDateFr(filtres.dateFin)}. Elle sera
            examinée puis confirmée par le loueur.
          </p>
        </div>
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Voir d'autres packs
          </button>
          <Link to="/" className="btn btn-accent">
            Retour à l'accueil
          </Link>
        </div>
      </Dialog>
    );
  }

  /* ------------------------- Formulaire ------------------------- */
  return (
    <Dialog titre="Réserver ce pack" onClose={onClose}>
      <form onSubmit={envoyer} className="space-y-5">
        <div className="rounded-sm border border-base-300 bg-base-200/50 p-4 text-sm">
          <p className="text-base font-semibold">{pack.libelle}</p>
          <p className="mt-1 text-base-content/70">
            Du {formatDateFr(filtres.dateDebut)} au {formatDateFr(filtres.dateFin)} · {pluriel(filtres.jours, 'jour')}
          </p>
          <div className="mt-3 flex flex-wrap justify-between gap-x-6 gap-y-1">
            <span>
              Total estimé : <b className="text-accent">{formatMoney(total)}</b>
            </span>
            <span>
              Caution : <b>{formatMoney(pack.prixCaution)}</b>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${uid}-lieu`} className="text-sm font-medium">
            Lieu de l'événement *
          </label>
          <input
            id={`${uid}-lieu`}
            required
            className="input w-full"
            placeholder="Salle, adresse, ville…"
            value={lieuEvenement}
            onChange={(e) => setLieuEvenement(e.target.value)}
          />
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">Mode de retrait</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODES.map(({ value, titre, texte, Icone }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3 rounded-sm border p-3 transition ${
                  modeRetrait === value ? 'border-accent bg-accent/10' : 'border-base-300 hover:bg-base-200/60'
                }`}
              >
                <input
                  type="radio"
                  name={`${uid}-mode`}
                  className="radio radio-accent radio-sm mt-1"
                  checked={modeRetrait === value}
                  onChange={() => setModeRetrait(value)}
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-medium">
                    <Icone className="size-4" aria-hidden="true" /> {titre}
                  </span>
                  <span className="block text-xs text-base-content/60">{texte}</span>
                </span>
              </label>
            ))}
          </div>
          {modeRetrait === 'livraison' && (
            <p className="mt-2 text-xs text-base-content/60">Les frais de livraison éventuels sont ajoutés par le loueur.</p>
          )}
        </fieldset>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${uid}-remarques`} className="text-sm font-medium">
            Remarques
          </label>
          <textarea
            id={`${uid}-remarques`}
            rows={3}
            className="textarea w-full"
            placeholder="Horaires, besoins particuliers…"
            value={remarques}
            onChange={(e) => setRemarques(e.target.value)}
          />
        </div>

        {erreur && (
          <div role="alert" className="alert alert-error alert-soft text-sm">
            <TriangleAlert className="size-4" aria-hidden="true" />
            <span>{erreur}</span>
          </div>
        )}

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Annuler
          </button>
          <button className="btn btn-accent" disabled={busy}>
            {busy && <span className="loading loading-spinner loading-sm" />}
            Confirmer la réservation
          </button>
        </div>
      </form>
    </Dialog>
  );
}
