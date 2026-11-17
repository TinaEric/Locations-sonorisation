export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

export const formatMoney = (n) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(n) || 0) + " Ar";

// Reservation.statutLocation
export const STATUT_LOCATION = {
  en_attente: { label: "En attente", cls: "badge-warning" },
  confirmee: { label: "Confirmée", cls: "badge-info" },
  en_cours: { label: "En cours", cls: "badge-primary" },
  terminee: { label: "Terminée", cls: "badge-success" },
  refusee: { label: "Refusée", cls: "badge-error" },
  annulee: { label: "Annulée", cls: "badge-neutral" },
};

// Item.statutItem
export const STATUT_ITEM = {
  disponible: { label: "Disponible", cls: "badge-success" },
  loue: { label: "Loué", cls: "badge-primary" },
  maintenance: { label: "Maintenance", cls: "badge-warning" },
  hors_service: { label: "Hors service", cls: "badge-error" },
};

// Item.etatItem, Mouvement.etatDepart / etatRetour
export const ETAT_ITEM = {
  neuf: { label: "Neuf", cls: "badge-success" },
  bon: { label: "Bon état", cls: "badge-success" },
  use: { label: "Usure normale", cls: "badge-warning" },
  endommage: { label: "Endommagé", cls: "badge-error" },
  perdu: { label: "Perdu / manquant", cls: "badge-error" },
};
export const ETATS_DEPART = ["neuf", "bon", "use"];
export const ETATS_RETOUR = ["bon", "use", "endommage", "perdu"];
export const ETATS_PROBLEME = ["endommage", "perdu"];

// Categorie.statutCategorie
export const STATUT_CATEGORIE = {
  actif: { label: "Actif", cls: "badge-success" },
  inactif: { label: "Inactif", cls: "badge-ghost" },
};

// Paiement
export const STATUT_PAIEMENT = {
  en_attente: { label: "En attente", cls: "badge-warning" },
  valide: { label: "Validé", cls: "badge-success" },
  annule: { label: "Annulé", cls: "badge-neutral" },
};
export const TYPES_PAIEMENT = [
  { value: "acompte", label: "Acompte" },
  { value: "solde", label: "Solde" },
  { value: "caution", label: "Caution" },
  { value: "penalite", label: "Pénalité" },
];
export const MODES_PAIEMENT = [
  { value: "especes", label: "Espèces" },
  { value: "mvola", label: "MVola" },
  { value: "orange_money", label: "Orange Money" },
  { value: "airtel_money", label: "Airtel Money" },
  { value: "virement", label: "Virement" },
  { value: "carte", label: "Carte bancaire" },
];
export const labelOf = (list, value) => list.find((x) => x.value === value)?.label || value || "—";

export const MODES_RETRAIT = {
  sur_place: "Retrait sur place",
  livraison: "Livraison",
};
