// data/CatalogueService.js
// Appels publics du catalogue (arborescence catégories → matériels).
// Les disponibilités par période sont dans reservationService.js (materielDispo, packsDisponibles).
import { api } from "./Api";
import { verifierReponse } from "./verifierReponse";

export const CatalogueService = {
  arborescence: async () => await verifierReponse(() => api.get("/categorie/arborescence")),
};
