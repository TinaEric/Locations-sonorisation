// data/CalendrierService.js
// Calendrier de disponibilité par mois (temps réel via rafraîchissement périodique).
// Contrat backend attendu : voir docs/LISEZMOI_CLIENT.md (section « Endpoints à ajouter »).
import { api } from "./Api";
import { verifierReponse } from "./verifierReponse";

export const CalendrierService = {
  // mois au format "YYYY-MM"
  materiel: async (codeMateriel, mois) =>
    await verifierReponse(() => api.get(`/materiel/${codeMateriel}/calendrier`, { params: { mois } })),

  pack: async (codePack, mois) =>
    await verifierReponse(() => api.get(`/pack/${codePack}/calendrier`, { params: { mois } })),

  // Fabrique la fonction (mois) => Promise attendue par <CalendrierDisponibilite />
  fabriquerChargeur: (type, code) => (mois) =>
    type === "pack" ? CalendrierService.pack(code, mois) : CalendrierService.materiel(code, mois),
};
