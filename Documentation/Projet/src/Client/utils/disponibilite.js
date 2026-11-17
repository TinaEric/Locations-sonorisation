// Client/utils/disponibilite.js
// Normalise les réponses du backend pour que l'interface ne dépende pas de leur forme exacte.
import { STATUT_DISPONIBILITE as STATUT } from "./constantes";
import { remplirZero } from "./formatage";

const lireNombre = (valeur) =>
  valeur === undefined || valeur === null || valeur === "" ? null : Number(valeur);

const parcourir = (noeud, visiteur) => {
  if (Array.isArray(noeud)) {
    noeud.forEach((enfant) => parcourir(enfant, visiteur));
    return;
  }
  if (typeof noeud === "string") {
    visiteur(noeud);
    return;
  }
  if (!noeud || typeof noeud !== "object") return;
  visiteur(noeud);
  parcourir(noeud.enfants, visiteur);
  parcourir(noeud.materiels, visiteur);
};

/**
 * Transforme la réponse de /reservation/materiels-disponibles ou /pack/disponibles
 * en Map(code → { disponible, quantiteDisponible }).
 * Formes acceptées : liste de codes, liste d'objets (avec ou sans quantiteDisponible / disponible),
 * ou arborescence de catégories contenant des matériels.
 * Un code absent de la Map est considéré comme indisponible.
 */
export const normaliserDisponibilites = (reponse, type) => {
  const table = new Map();
  const cles = type === "pack" ? ["codePack", "CodePack"] : ["CodeMateriel", "codeMateriel"];
  const racine = Array.isArray(reponse)
    ? reponse
    : [reponse?.materiels, reponse?.packs, reponse?.data, reponse?.enfants].filter(Boolean);

  parcourir(racine, (element) => {
    if (typeof element === "string") {
      table.set(element, { disponible: true, quantiteDisponible: null });
      return;
    }
    const code = cles.map((cle) => element[cle]).find(Boolean);
    if (!code) return;
    const quantite = lireNombre(
      element.quantiteDisponible ?? element.stockDisponible ?? element.disponibles,
    );
    const disponible =
      typeof element.disponible === "boolean" ? element.disponible : quantite === null ? true : quantite > 0;
    table.set(code, { disponible, quantiteDisponible: quantite });
  });
  return table;
};

// Statut d'une ligne du panier en tenant compte de la quantité demandée
export const evaluerLigne = (obtenir, ligne) => {
  const etat = obtenir(ligne.type, ligne.code);
  if (
    etat.statut === STATUT.DISPONIBLE &&
    etat.quantiteDisponible !== null &&
    ligne.quantite > etat.quantiteDisponible
  ) {
    return { statut: STATUT.INSUFFISANT, quantiteDisponible: etat.quantiteDisponible };
  }
  return etat;
};

export const ligneBloquante = (etat) =>
  etat.statut === STATUT.INDISPONIBLE || etat.statut === STATUT.INSUFFISANT;

/**
 * Réponse attendue du calendrier :
 * { quantiteTotale: 4, jours: [{ date: "2026-11-20", quantiteDisponible: 1 }, ...] }
 * Les jours non listés sont considérés comme entièrement disponibles.
 */
export const normaliserCalendrier = (reponse) => ({
  quantiteTotale: lireNombre(reponse?.quantiteTotale),
  jours: new Map((reponse?.jours ?? []).map((jour) => [jour.date, lireNombre(jour.quantiteDisponible)])),
});

export const dateISO = (annee, indexMois, jour) =>
  `${annee}-${remplirZero(indexMois + 1)}-${remplirZero(jour)}`;
