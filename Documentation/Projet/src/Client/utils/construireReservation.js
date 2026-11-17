// Client/utils/construireReservation.js
// Construit le corps de POST /reservation (CreateReservationDto) à partir du panier.
// Le panier est soit un pack (actionLocataire = "pack"), soit une liste de matériels ("materiel").

export const construireReservation = ({ idUser, lignes, periode, formulaire }) => {
  const base = {
    idUser,
    dateDebutPrevue: `${periode.dateDebut}T00:00:00.000Z`,
    dateFinPrevue: `${periode.dateFin}T00:00:00.000Z`,
    lieuEvenement: formulaire.lieuEvenement?.trim() || undefined,
    remarques: formulaire.remarques?.trim() || undefined,
    modeRetrait: formulaire.modeRetrait || undefined,
  };

  const pack = lignes.find((ligne) => ligne.type === "pack");
  if (pack) {
    return { ...base, actionLocataire: "pack", codePack: pack.code, quantitePack: pack.quantite };
  }

  return {
    ...base,
    actionLocataire: "materiel",
    materiels: lignes.map((ligne) => ({ codeMateriel: ligne.code, quantite: ligne.quantite })),
  };
};
