import { useEffect, useState } from 'react';
import { packsDisponibles } from '../../data/PackService.js';

const versListe = (reponse) => (Array.isArray(reponse) ? reponse : (reponse?.data ?? []));

/**
 * Packs disponibles pour une période et un type d'événement.
 * `loading` est calculé : tant que le résultat reçu ne correspond pas aux critères courants, on charge.
 */
export function usePacksDisponibles({ dateDebut, dateFin, type = '' }) {
  const [essai, setEssai] = useState(0);
  const [resultat, setResultat] = useState({ cle: null, packs: [], error: null });

  const actif = Boolean(dateDebut && dateFin);
  const cle = `${dateDebut}|${dateFin}|${type}|${essai}`;

  useEffect(() => {
    if (!actif) return undefined;
    let annule = false;

    packsDisponibles({ dateDebut, dateFin, ...(type ? { typeEvenement: type } : {}) })
      .then((reponse) => {
        if (!annule) setResultat({ cle, packs: versListe(reponse), error: null });
      })
      .catch((e) => {
        if (!annule) {
          setResultat({
            cle,
            packs: [],
            error: e?.message || 'Erreur lors du chargement des packs disponibles.',
          });
        }
      });

    return () => {
      annule = true;
    };
  }, [actif, dateDebut, dateFin, type, cle]);

  return {
    packs: actif ? resultat.packs : [],
    error: actif ? resultat.error : null,
    loading: actif && resultat.cle !== cle,
    reload: () => setEssai((n) => n + 1),
  };
}