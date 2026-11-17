// Client/utils/tarification.js
import { TAUX_ACOMPTE } from "./constantes";

export const calculerTotaux = (lignes, nbJours) => {
  const detail = lignes.map((ligne) => ({
    ...ligne,
    sousTotalLocation: ligne.prixUnitaire * ligne.quantite * nbJours,
    sousTotalCaution: ligne.prixCaution * ligne.quantite,
  }));
  const totalLocation = detail.reduce((somme, l) => somme + l.sousTotalLocation, 0);
  const totalCaution = detail.reduce((somme, l) => somme + l.sousTotalCaution, 0);
  const acompte = Math.round(totalLocation * TAUX_ACOMPTE);

  return {
    detail,
    nbJours,
    totalLocation,
    totalCaution,
    acompte,
    resteAPayer: totalLocation - acompte,
  };
};

// Acompte d'une réservation déjà créée (champs backend tolérés)
export const deduireAcompte = (reservation) => {
  const direct = Number(reservation?.montantAcompte ?? reservation?.acompte);
  if (direct > 0) return direct;
  const total = Number(reservation?.montantTotal ?? reservation?.totalLocation ?? 0);
  return Math.round(total * TAUX_ACOMPTE);
};
