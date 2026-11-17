// Client/hooks/useDisponibilites.js
// Disponibilité de tous les matériels et packs sur une période donnée.
import { useCallback, useEffect, useState } from "react";
import { materielDispo, packsDisponibles } from "../../data/reservationService";
import { STATUT_DISPONIBILITE as STATUT } from "../utils/constantes";
import { normaliserDisponibilites } from "../utils/disponibilite";
import { extraireMessageErreur } from "../utils/erreurs";
import { nombreDeJours } from "../utils/formatage";

const ETAT_VIDE = { materiels: null, packs: null, chargement: false, erreur: null };

export default function useDisponibilites({ dateDebut, dateFin }) {
  const periodeValide = nombreDeJours(dateDebut, dateFin) > 0;
  const [etat, setEtat] = useState(ETAT_VIDE);

  const charger = useCallback(async () => {
    if (!periodeValide) {
      setEtat(ETAT_VIDE);
      return;
    }
    setEtat((prev) => ({ ...prev, chargement: true, erreur: null }));
    try {
      const [reponseMateriels, reponsePacks] = await Promise.all([
        materielDispo({ dateDebut, dateFin }),
        packsDisponibles({ dateDebut, dateFin }),
      ]);
      setEtat({
        materiels: normaliserDisponibilites(reponseMateriels, "materiel"),
        packs: normaliserDisponibilites(reponsePacks, "pack"),
        chargement: false,
        erreur: null,
      });
    } catch (e) {
      setEtat({ ...ETAT_VIDE, erreur: extraireMessageErreur(e, "Impossible de vérifier la disponibilité.") });
    }
  }, [dateDebut, dateFin, periodeValide]);

  useEffect(() => {
    charger();
  }, [charger]);

  // type : "materiel" | "pack"
  const obtenir = useCallback(
    (type, code) => {
      const table = type === "pack" ? etat.packs : etat.materiels;
      if (!table) return { statut: STATUT.INCONNUE, quantiteDisponible: null };
      const entree = table.get(code);
      if (!entree || !entree.disponible) return { statut: STATUT.INDISPONIBLE, quantiteDisponible: 0 };
      return { statut: STATUT.DISPONIBLE, quantiteDisponible: entree.quantiteDisponible };
    },
    [etat.materiels, etat.packs],
  );

  return { ...etat, periodeValide, obtenir, rafraichir: charger };
}
