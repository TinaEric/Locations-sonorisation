import { httpGet, pick } from "./httpClient";

/**
 * Matériel à la carte.
 * Endpoints : GET /materiels?dateDebut&dateFin&categorie&marque&puissanceMax&prixMax&dispoSeulement
 *             GET /materiels/marques
 */
export function mapMateriel(m) {
  return {
    id: pick(m, "id", "idMateriel", "id_materiel"),
    designation: pick(m, "designation", "libelle"),
    categorie: pick(m, "categorie"),
    marque: pick(m, "marque"),
    modele: pick(m, "modele"),
    puissance: pick(m, "puissanceW", "puissance_w", "puissance"),
    photo: pick(m, "photo"),
    prix: pick(m, "prixLocationUnitaire", "prix_location_unitaire", "prix"),
    unite: pick(m, "uniteTarif", "unite_tarif") ?? "evenement",
    caution: pick(m, "cautionUnitaire", "caution_unitaire"),
    disponible: pick(m, "quantiteDisponible", "quantite_disponible"),
  };
}

export const MaterielService = {
  async getMateriels(filters = {}, signal) {
    const data = await httpGet("/materiels", { ...filters, louableSeul: true, statut: "actif" }, signal);
    return (Array.isArray(data) ? data : data?.content ?? []).map(mapMateriel);
  },
  async getMarques(signal) {
    const data = await httpGet("/materiels/marques", undefined, signal);
    return Array.isArray(data) ? data : [];
  },
};
