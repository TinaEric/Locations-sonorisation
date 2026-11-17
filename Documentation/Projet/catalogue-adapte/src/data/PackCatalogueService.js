import { httpGet, pick } from "./httpClient";

/**
 * Catalogue des packs (liste filtrée par dates).
 * À fusionner dans votre PackService existant si vous le souhaitez ; fichier séparé pour ne rien écraser.
 *
 * Endpoint : GET /packs?dateDebut&dateFin&typeEvenement&capacite&typeLieu&prixMax&dispoSeulement&tri
 * Seule cette fonction `mapPack` connaît les noms de champs du backend.
 */
export function mapPack(p) {
  return {
    id: pick(p, "id", "idPack", "id_pack"),
    nom: pick(p, "nom", "libelle"),
    description: pick(p, "descriptionCourte", "description_courte", "description"),
    capaciteMin: pick(p, "capaciteMin", "capacite_min"),
    capaciteMax: pick(p, "capaciteMax", "capacite_max"),
    typeLieu: pick(p, "typeLieu", "type_lieu"),
    photo: pick(p, "photoPrincipale", "photo_principale", "photo"),
    composition: (pick(p, "composition") ?? []).map((c) => ({
      designation: pick(c, "designation", "libelle"),
      quantite: pick(c, "quantite") ?? 1,
    })),
    services: (pick(p, "services") ?? []).map((s) => ({
      libelle: pick(s, "libelle"),
      inclus: Boolean(pick(s, "inclus")),
    })),
    prix: pick(p, "prixPourDates", "prix_pour_dates"),
    prixAPartirDe: pick(p, "prixAPartirDe", "prix_a_partir_de", "prixBase", "prix_base"),
    majoration: pick(p, "majoration") ?? null, // { libelle, valeur }
    caution: pick(p, "cautionMontant", "caution_montant", "caution"),
    disponibilite: pick(p, "disponibilite") ?? "disponible", // disponible | stock_limite | indisponible | hors_delai
    raison: pick(p, "raisonIndisponibilite", "raison_indisponibilite"),
  };
}

export const PackCatalogueService = {
  async getPacks(filters = {}, signal) {
    const data = await httpGet("/packs", filters, signal);
    return (Array.isArray(data) ? data : data?.content ?? []).map(mapPack);
  },
};
