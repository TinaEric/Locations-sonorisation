const MS_JOUR = 24 * 60 * 60 * 1000;

export function formatAr(montant) {
  if (montant === undefined || montant === null) return "—";
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(montant))} Ar`;
}

export function toISODate(date) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${j}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function formatDateCourte(iso) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Nombre de jours (inclusif) entre deux dates ISO. */
export function nbJours(debut, fin) {
  if (!debut || !fin) return 0;
  const a = new Date(`${debut}T00:00:00`);
  const b = new Date(`${fin}T00:00:00`);
  return Math.round((b - a) / MS_JOUR) + 1;
}

/** 1 jour → soirée/journée · 2 à 3 → week-end · plus → semaine */
export function formuleParDuree(jours) {
  if (jours <= 1) return "soiree";
  if (jours <= 3) return "weekend";
  return "semaine";
}

export const LIBELLE_CATEGORIE = {
  conference: "Conférence",
  soiree: "Soirée",
  mariage: "Mariage",
  concert: "Concert",
  exterieur: "Extérieur",
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

export const LIBELLE_LIEU = { interieur: "Intérieur", exterieur: "Extérieur", mixte: "Intérieur / extérieur" };

export const LIBELLE_UNITE = { evenement: "événement", jour: "jour", heure: "heure" };
