import { BRAND } from './content.js';

const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export const formatMoney = (value) => `${number.format(Number(value) || 0)} ${BRAND.currency}`;

export const formatMoneyBack = (n) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(n) || 0) + " Ar";

export const formatDateBack = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export const rentalDays = (dateDebut, dateFin) =>
  Math.max(1, Math.ceil((new Date(dateFin) - new Date(dateDebut)) / 86_400_000));

export const plural = (n, singular, pluralForm) => (n > 1 ? pluralForm : singular);

export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

export const labelOf = (list, value) => list.find((x) => x.value === value)?.label || value || "—";
  
// new 
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
