// Client/utils/construireReservation.js
import {
  MODES_RETRAIT_VALIDES,
  MODE_RETRAIT_DEFAUT,
} from "./constantes";

function normaliserModeRetrait(valeur) {
  return MODES_RETRAIT_VALIDES.includes(valeur) ? valeur : MODE_RETRAIT_DEFAUT;
}

function isoDepuisDate(valeur, finDeJournee = false) {
  if (!valeur) return null;
  const brut = valeur instanceof Date ? valeur : new Date(valeur);
  if (isNaN(brut.getTime())) return null;
  if (finDeJournee) brut.setHours(23, 59, 59, 999);
  else brut.setHours(0, 0, 0, 0);
  return brut.toISOString();
}

function versLigneDto(ligne) {
  const codeMateriel =
    ligne.codeMateriel ?? ligne.code ?? ligne.materiel?.codeMateriel;
  if (!codeMateriel) {
    throw new Error(
      `Ligne sans codeMateriel (matériel : ${ligne.designation ?? ligne.id ?? "?"}).`,
    );
  }
  const quantite = Number(ligne.quantite);
  if (!Number.isInteger(quantite) || quantite < 1) {
    throw new Error(`Quantité invalide pour ${codeMateriel}.`);
  }
  const dto = { codeMateriel, quantite };
  const tarif = ligne.prixUnitaire ?? ligne.tarifApplique ?? ligne.tarif;
  if (tarif != null) dto.tarifApplique = Number(tarif);
  return dto;
}

export const construireReservation = ({
  idUser,
  lignes,
  periode,
  formulaire,
  actionLocataire: actionForcee,
}) => {
  // --- dates ---
  const dateDebutPrevue = isoDepuisDate(
    periode?.dateDebut ?? periode?.debut,
    false,
  );
  const dateFinPrevue = isoDepuisDate(periode?.dateFin ?? periode?.fin, true);
  if (!dateDebutPrevue || !dateFinPrevue) {
    throw new Error("Période de réservation invalide.");
  }

  // --- modeRetrait ---
  const modeRetrait = normaliserModeRetrait(formulaire?.modeRetrait);

  // --- base commune ---
  const base = {
    idUser,
    dateDebutPrevue,
    dateFinPrevue,
    lieuEvenement: formulaire?.lieuEvenement?.trim() || undefined,
    remarques: formulaire?.remarques?.trim() || undefined,
    modeRetrait,
    fraisLivraison:
      modeRetrait === "LIVRAISON"
        ? Number(formulaire?.fraisLivraison) || 0
        : 0,
  };

  if (!Array.isArray(lignes) || lignes.length === 0) {
    throw new Error("Le panier est vide.");
  }

  // --- séparation pack / matériels ---
  const lignesPack = lignes.filter((l) => l.type === "pack");
  const lignesMateriel = lignes.filter((l) => l.type !== "pack");

  if (lignesPack.length > 1) {
    throw new Error(
      "Un seul pack par réservation. Retirez les packs en trop du panier.",
    );
  }

  const pack = lignesPack[0] ?? null;

  // --- détermination de l'action ---
  let action = actionForcee;
  if (!action) {
    if (pack && lignesMateriel.length === 0) action = "pack";
    else if (pack && lignesMateriel.length > 0) action = "personnalise";
    else action = "materiel";
  }

  // ============================================================
  // CAS 1 — PACK SEUL : lignes = composants du pack × quantité
  // ============================================================
  if (action === "pack") {
    if (!pack) throw new Error("Aucun pack dans le panier.");

    const codePack = pack.codePack ?? pack.code;
    if (!codePack) throw new Error("Pack détecté mais codePack manquant.");

    const quantitePack = Number(pack.quantite) || 1;
    const composants = pack.composants ?? [];
    if (composants.length === 0) {
      throw new Error(
        `Le pack ${codePack} n'a aucun composant. Impossible de réserver.`,
      );
    }

    const lignesEclatees = composants.map((c) => {
      const codeMateriel = c.codeMateriel ?? c.materiel?.codeMateriel;
      if (!codeMateriel) {
        throw new Error(`Composant du pack ${codePack} sans codeMateriel.`);
      }
      return {
        codeMateriel,
        quantite: Number(c.quantite) * quantitePack,
      };
    });

    return {
      ...base,
      actionLocataire: "pack",
      codePack,
      quantitePack,
      lignes: lignesEclatees,
    };
  }

  // ============================================================
  // CAS 2 — PERSONNALISÉ : pack + matériels indépendants
  // - codePack + quantitePack renseignés
  // - lignes = composants du pack × quantité + matériels indépendants
  // ============================================================
  if (action === "personnalise") {
    if (!pack) throw new Error("Aucun pack détecté pour 'personnalise'.");

    const codePack = pack.codePack ?? pack.code;
    if (!codePack) throw new Error("Pack détecté mais codePack manquant.");

    const quantitePack = Number(pack.quantite) || 1;
    const composants = pack.composants ?? [];
    if (composants.length === 0) {
      throw new Error(
        `Le pack ${codePack} n'a aucun composant. Impossible de réserver.`,
      );
    }

    // Composants du pack × quantité
    const lignesComposants = composants.map((c) => {
      const codeMateriel = c.codeMateriel ?? c.materiel?.codeMateriel;
      if (!codeMateriel) {
        throw new Error(`Composant du pack ${codePack} sans codeMateriel.`);
      }
      return {
        codeMateriel,
        quantite: Number(c.quantite) * quantitePack,
      };
    });

    // Matériels indépendants ajoutés au panier
    const lignesIndependantes = lignesMateriel.map(versLigneDto);

    return {
      ...base,
      actionLocataire: "personnalise",
      codePack,
      quantitePack,
      lignes: [...lignesComposants, ...lignesIndependantes],
    };
  }

  // ============================================================
  // CAS 3 — MATÉRIEL SEUL
  // ============================================================
  return {
    ...base,
    actionLocataire: "materiel",
    lignes: lignesMateriel.map(versLigneDto),
  };
};

export default construireReservation;

// // Client/utils/construireReservation.js
// import {
//   MODES_RETRAIT_VALIDES,
//   MODE_RETRAIT_DEFAUT,
// } from "./constantes";

// function normaliserModeRetrait(valeur) {
//   return MODES_RETRAIT_VALIDES.includes(valeur) ? valeur : MODE_RETRAIT_DEFAUT;
// }

// function isoDepuisDate(valeur, finDeJournee = false) {
//   if (!valeur) return null;
//   const brut = valeur instanceof Date ? valeur : new Date(valeur);
//   if (isNaN(brut.getTime())) return null;
//   if (finDeJournee) brut.setHours(23, 59, 59, 999);
//   else brut.setHours(0, 0, 0, 0);
//   return brut.toISOString();
// }

// function versLigneDto(ligne) {
//   const codeMateriel =
//     ligne.codeMateriel ?? ligne.code ?? ligne.materiel?.codeMateriel;
//   if (!codeMateriel) {
//     throw new Error(
//       `Ligne sans codeMateriel (matériel : ${ligne.designation ?? ligne.id ?? "?"}).`,
//     );
//   }
//   const quantite = Number(ligne.quantite);
//   if (!Number.isInteger(quantite) || quantite < 1) {
//     throw new Error(`Quantité invalide pour ${codeMateriel}.`);
//   }
//   const dto = { codeMateriel, quantite };
//   const tarif = ligne.prixUnitaire ?? ligne.tarifApplique ?? ligne.tarif;
//   if (tarif != null) dto.tarifApplique = Number(tarif);
//   return dto;
// }

// export const construireReservation = ({
//   idUser,
//   lignes,
//   periode,
//   formulaire,
//   actionLocataire: actionForcee,
// }) => {
//   const dateDebutPrevue = isoDepuisDate(
//     periode?.dateDebut ?? periode?.debut,
//     false,
//   );
//   const dateFinPrevue = isoDepuisDate(periode?.dateFin ?? periode?.fin, true);
//   if (!dateDebutPrevue || !dateFinPrevue) {
//     throw new Error("Période de réservation invalide.");
//   }

//   const modeRetrait = normaliserModeRetrait(formulaire?.modeRetrait);

//   const base = {
//     idUser,
//     dateDebutPrevue,
//     dateFinPrevue,
//     lieuEvenement: formulaire?.lieuEvenement?.trim() || undefined,
//     remarques: formulaire?.remarques?.trim() || undefined,
//     modeRetrait,
//     fraisLivraison:
//       modeRetrait === "LIVRAISON"
//         ? Number(formulaire?.fraisLivraison) || 0
//         : 0,
//   };

//   if (!Array.isArray(lignes) || lignes.length === 0) {
//     throw new Error("Le panier est vide.");
//   }

//   const pack = lignes.find(
//     (l) => l.type === "pack" || l.codePack || l.code,
//   );

//   let action = actionForcee;
//   if (!action) {
//     if (pack && pack.type === "pack") action = "pack";
//     else action = "materiel";
//   }

//   // ✅ CAS PACK : éclater les composants
//   if (action === "pack") {
//     const codePack =
//       pack.codePack ?? pack.code ?? pack.pack?.code;
//     if (!codePack) throw new Error("Pack détecté mais codePack manquant.");

//     const quantitePack = Number(pack.quantite) || 1;
//     const composants = pack.composants ?? [];

//     if (composants.length === 0) {
//       throw new Error(
//         `Le pack ${codePack} n'a aucun composant. Videz le panier et ré-ajoutez le pack.`,
//       );
//     }

//     const lignesPack = composants.map((c) => {
//       const codeMateriel =
//         c.codeMateriel ?? c.materiel?.codeMateriel ?? c.materiel?.CodeMateriel;
//       if (!codeMateriel) {
//         throw new Error(`Composant du pack ${codePack} sans codeMateriel.`);
//       }
//       return {
//         codeMateriel,
//         quantite: Number(c.quantite) * quantitePack,
//       };
//     });

//     return {
//       ...base,
//       actionLocataire: "pack",
//       codePack,
//       quantitePack,
//       lignes: lignesPack, // ✅ composants, pas le code pack
//     };
//   }

//   return {
//     ...base,
//     actionLocataire: "materiel",
//     lignes: lignes.map(versLigneDto),
//   };
// };

// export default construireReservation;