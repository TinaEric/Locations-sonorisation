export const NOM_PLATEFORME = "SonoLocation";
export const DEVISE = "Ar";

export const TAUX_ACOMPTE = 0.3;

export const INTERVALLE_TEMPS_REEL_MS = 30000;


export const STATUT_DISPONIBILITE = {
  INCONNUE: "inconnue",
  DISPONIBLE: "disponible",
  INDISPONIBLE: "indisponible",
  INSUFFISANT: "insuffisant",
};

export const PIN_ECHEC_SIMULE = "0000";

export const MODES_RETRAIT = [
  { valeur: "SUR_PLACE", libelle: "Retrait sur place" },
  { valeur: "LIVRAISON", libelle: "Livraison à domicile" },
];

export const MODES_RETRAIT_VALIDES = MODES_RETRAIT.map((m) => m.valeur);

export const MODE_RETRAIT_DEFAUT = "SUR_PLACE";