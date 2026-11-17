// Client/utils/constantes.js
export const NOM_PLATEFORME = "SonoLocation";
export const DEVISE = "Ar";

// Part du total de location à payer en acompte (à ajuster selon la règle métier)
export const TAUX_ACOMPTE = 0.3;

// Rafraîchissement du calendrier de disponibilité (temps réel simplifié)
export const INTERVALLE_TEMPS_REEL_MS = 30000;

// ⚠️ Les valeurs doivent correspondre à l'enum ModeRetrait du backend
export const MODES_RETRAIT = [
  { valeur: "retrait", libelle: "Retrait au dépôt" },
  { valeur: "livraison", libelle: "Livraison sur le lieu de l'événement" },
];

export const STATUT_DISPONIBILITE = {
  INCONNUE: "inconnue",
  DISPONIBLE: "disponible",
  INDISPONIBLE: "indisponible",
  INSUFFISANT: "insuffisant",
};

// Simulation Mvola : ce code PIN simule un paiement refusé
export const PIN_ECHEC_SIMULE = "0000";
