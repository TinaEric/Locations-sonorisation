const DAY = 86400000;

export const clientNom = (r) => r?.utilisateur?.nomComplet ?? "—";
export const clientTel = (r) => r?.utilisateur?.telephone ?? "";

/** Nombre de jours de location (CalculerDuree) */
export const duree = (r) => {
  if (r?.duree) return r.duree;
  if (!r?.dateDebutPrevue || !r?.dateFinPrevue) return 1;
  return Math.max(1, Math.round((new Date(r.dateFinPrevue) - new Date(r.dateDebutPrevue)) / DAY));
};

/** LigneLocation.CalculSubTotal() — utilise sousTotal si fourni par l'API */
export const sousTotal = (ligne, r) =>
  ligne.sousTotal ?? Number(ligne.quantite) * Number(ligne.tarifApplique) * duree(r);

export const ligneLabel = (l) =>
  l.typeItem === "pack" ? `Pack ${l.pack?.nomPack ?? ""}` : l.materiel?.designation ?? "—";

/** Paiements de location (hors caution et pénalité) validés */
export const totalPaye = (r) =>
  (r?.paiements || [])
    .filter((p) => p.statutPaiement === "valide" && ["acompte", "solde"].includes(p.typePaiement))
    .reduce((s, p) => s + Number(p.montantPaye || 0), 0);

export const totalPenalites = (r) =>
  (r?.paiements || [])
    .filter((p) => p.typePaiement === "penalite" && p.statutPaiement !== "annule")
    .reduce((s, p) => s + Number(p.montantPaye || 0), 0);

export const mouvementsOf = (r) => (r?.lignes || []).flatMap((l) => l.mouvements || []);

export const isRetard = (r) => r?.dateFinPrevue && new Date(r.dateFinPrevue) < new Date();
