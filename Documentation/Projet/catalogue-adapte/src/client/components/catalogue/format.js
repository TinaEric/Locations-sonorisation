export const formatAr = (n) =>
  n === undefined || n === null ? "—" : `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} Ar`;

export const LIBELLE_LIEU = { interieur: "Intérieur", exterieur: "Extérieur", mixte: "Intérieur / extérieur" };

export const LIBELLE_UNITE = { evenement: "événement", jour: "jour", heure: "heure" };

export const LIBELLE_CATEGORIE = {
  enceinte: "Enceinte",
  caisson: "Caisson",
  console: "Console",
  micro: "Micro",
  pied: "Pied",
  cable: "Câble",
  retour: "Retour de scène",
  eclairage: "Éclairage",
  accessoire: "Accessoire",
};

export function nbJours(debut, fin) {
  if (!debut || !fin) return 0;
  return Math.round((new Date(`${fin}T00:00:00`) - new Date(`${debut}T00:00:00`)) / 86400000) + 1;
}
