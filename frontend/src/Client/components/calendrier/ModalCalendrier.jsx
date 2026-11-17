// Client/components/calendrier/ModalCalendrier.jsx
import { X } from "lucide-react";
import CalendrierDisponibilite from "./CalendrierDisponibilite";

export default function ModalCalendrier({ cible, periode, onFermer }) {
  if (!cible) return null;

  return (
    <dialog className="modal modal-open" onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="modal-box max-w-md">
        <button type="button" className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3" onClick={onFermer} aria-label="Fermer">
          <X className="size-4" />
        </button>
        <h3 className="pr-8 text-lg font-bold">Calendrier de disponibilité</h3>
        <p className="mb-4 text-sm text-base-content/60">{cible.titre}</p>
        <CalendrierDisponibilite
          identifiant={cible.code}
          chargerMois={cible.chargerMois}
          dateDebut={periode?.dateDebut}
          dateFin={periode?.dateFin}
        />
      </div>
    </dialog>
  );
}
