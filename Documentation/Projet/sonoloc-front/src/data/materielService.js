import { apiGet } from "./apiClient";

/**
 * Service du matériel à la carte.
 * Endpoints attendus :
 *   GET /materiels?dateDebut&dateFin&categorie&marque&puissanceMax&prixMax&dispoSeulement
 *   GET /materiels/:id?dateDebut&dateFin
 *
 * Réponse d'un matériel :
 * {
 *   id_materiel, designation, categorie, marque, modele, puissance_w, caracteristiques,
 *   photo, prix_location_unitaire, unite_tarif, caution_unitaire,
 *   quantite_disponible, louable_seul, statut
 * }
 */
export const materielService = {
  getMateriels(filters = {}, signal) {
    return apiGet("/materiels", { ...filters, louableSeul: true, statut: "actif" }, signal);
  },

  getMaterielById(id, { dateDebut, dateFin } = {}, signal) {
    return apiGet(`/materiels/${id}`, { dateDebut, dateFin }, signal);
  },

  getMarques(signal) {
    return apiGet("/materiels/marques", undefined, signal);
  },
};
