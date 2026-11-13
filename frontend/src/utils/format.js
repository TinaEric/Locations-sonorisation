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
  