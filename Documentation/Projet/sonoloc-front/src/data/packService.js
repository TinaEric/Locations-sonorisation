import { apiGet } from "./apiClient";

/**
 * Service des packs.
 * Endpoints attendus côté backend :
 *   GET /packs?dateDebut&dateFin&categorie&typeLieu&usage&capacite&prixMax&dispoSeulement&tri
 *   GET /packs/:id?dateDebut&dateFin
 *
 * Réponse d'un pack (liste) :
 * {
 *   id_pack, code_pack, nom, categorie, description_courte, capacite_min, capacite_max,
 *   type_lieu, photo_principale, composition: [{ designation, quantite }],
 *   services: [{ libelle, inclus, prix }],
 *   prix_pour_dates, prix_a_partir_de, caution_montant,
 *   majoration: { libelle, valeur } | null,
 *   disponibilite: "disponible" | "stock_limite" | "indisponible" | "hors_delai",
 *   raison_indisponibilite?
 * }
 */
export const packService = {
  getPacks(filters = {}, signal) {
    return apiGet("/packs", filters, signal);
  },

  getPackById(id, { dateDebut, dateFin } = {}, signal) {
    return apiGet(`/packs/${id}`, { dateDebut, dateFin }, signal);
  },

  /** Packs mis en avant sur l'accueil (statut = actif), prix « à partir de ». */
  getPacksAccueil(signal) {
    return apiGet("/packs", { statut: "actif", accueil: true }, signal);
  },
};
