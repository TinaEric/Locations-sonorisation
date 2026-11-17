import { STATUT_DISPONIBILITE as STATUT } from "./constantes";
import { remplirZero } from "./formatage";

const lireNombre = (valeur) =>
  valeur === undefined || valeur === null || valeur === ""
    ? null
    : Number(valeur);

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
  parcourir(noeud.packs, visiteur);
};

export const normaliserDisponibilites = (reponse, type) => {
  const table = new Map();
  const cles =
    type === "pack" ? ["codePack", "CodePack"] : ["CodeMateriel", "codeMateriel"];

  const racine = Array.isArray(reponse)
    ? reponse
    : [
        reponse?.materiels,
        reponse?.packs,
        reponse?.data,
        reponse?.enfants,
      ].filter(Boolean);

  parcourir(racine, (element) => {
    if (typeof element === "string") {
      table.set(element, {
        disponible: true,
        quantiteDisponible: null,
        etatPack: undefined,
      });
      return;
    }

    const code = cles.map((cle) => element[cle]).find(Boolean);
    if (!code) return;

    // ✅ Packs : uniquement les réponses de /packs/disponibles/confirmes
    //    (ignorer les packs catalogue dont etatPack vaut autre chose)
    if (type === "pack") {
      const etat = element.etatPack;
      // "detail" et autres états catalogue ne sont PAS des états de dispo
      const estEtatDispo = etat === "disponible" || etat === "indisponible";
      const quantite = lireNombre(element.quantiteDisponible) ?? 0;

      if (estEtatDispo) {
        const disponible = etat === "disponible" && quantite > 0;
        table.set(code, {
          disponible,
          quantiteDisponible: quantite,
          etatPack: etat,
          composants: element.composants,
        });
        return;
      }
      // Sinon (catalogue), on ignore : ne pas polluer la map
      return;
    }

    // ✅ Matériels : la vérité est quantiteDisponible
    const quantite = lireNombre(
      element.quantiteDisponible ?? element.stockDisponible ?? element.disponibles,
    );
    const disponible =
      typeof element.disponible === "boolean"
        ? element.disponible
        : quantite === null
          ? true
          : quantite > 0;

    table.set(code, {
      disponible,
      quantiteDisponible: quantite,
      etatPack: element.etatPack,
    });
  });

  return table;
};

export const evaluerLigne = (obtenir, ligne) => {
  const etat = obtenir(ligne.type, ligne.code);
  if (
    etat.statut === STATUT.DISPONIBLE &&
    etat.quantiteDisponible !== null &&
    ligne.quantite > etat.quantiteDisponible
  ) {
    return {
      statut: STATUT.INSUFFISANT,
      quantiteDisponible: etat.quantiteDisponible,
    };
  }
  return etat;
};

export const ligneBloquante = (etat) =>
  etat.statut === STATUT.INDISPONIBLE || etat.statut === STATUT.INSUFFISANT;

export const normaliserCalendrier = (reponse) => ({
  quantiteTotale: lireNombre(reponse?.quantiteTotale),
  jours: new Map(
    (reponse?.jours ?? []).map((jour) => [
      jour.date,
      lireNombre(jour.quantiteDisponible),
    ]),
  ),
});

export const dateISO = (annee, indexMois, jour) =>
  `${annee}-${remplirZero(indexMois + 1)}-${remplirZero(jour)}`;


// // Client/utils/disponibilite.js
// // Normalise les réponses du backend pour que l'interface ne dépende pas de leur forme exacte.
// import { STATUT_DISPONIBILITE as STATUT } from "./constantes";
// import { remplirZero } from "./formatage";

// const lireNombre = (valeur) =>
//   valeur === undefined || valeur === null || valeur === ""
//     ? null
//     : Number(valeur);

// const parcourir = (noeud, visiteur) => {
//   if (Array.isArray(noeud)) {
//     noeud.forEach((enfant) => parcourir(enfant, visiteur));
//     return;
//   }
//   if (typeof noeud === "string") {
//     visiteur(noeud);
//     return;
//   }
//   if (!noeud || typeof noeud !== "object") return;
//   visiteur(noeud);
//   parcourir(noeud.enfants, visiteur);
//   parcourir(noeud.materiels, visiteur);
//   parcourir(noeud.packs, visiteur); // ✅ ajout : packs imbriqués
// };

// /**
//  * Transforme la réponse de /reservation/materiels-disponibles
//  * ou /pack/disponibles/confirmes en Map(code → { disponible, quantiteDisponible, etatPack? }).
//  *
//  * Formes acceptées :
//  * - liste de codes (string)
//  * - liste d'objets { codePack|CodePack, etatPack, quantiteDisponible, composants }
//  * - liste d'objets { codeMateriel|CodeMateriel, quantiteDisponible, disponible }
//  * - objet enveloppe { data: [...], packs: [...], materiels: [...] }
//  */
// export const normaliserDisponibilites = (reponse, type) => {
//   const table = new Map();
//   const cles =
//     type === "pack" ? ["codePack", "CodePack"] : ["codeMateriel", "CodeMateriel"];

//   const racine = Array.isArray(reponse)
//     ? reponse
//     : [
//         reponse?.materiels,
//         reponse?.packs,
//         reponse?.data,
//         reponse?.enfants,
//       ].filter(Boolean);

//   parcourir(racine, (element) => {
//     if (typeof element === "string") {
//       table.set(element, {
//         disponible: true,
//         quantiteDisponible: null,
//         etatPack: undefined,
//       });
//       return;
//     }

//     const code = cles.map((cle) => element[cle]).find(Boolean);
//     if (!code) return;

//     // ✅ Packs : priorité à etatPack (nouveau contrat back)
//     if (type === "pack" && element.etatPack !== undefined) {
//       const quantite = lireNombre(element.quantiteDisponible) ?? 0;
//       const disponible = element.etatPack === "disponible" && quantite > 0;
//       table.set(code, {
//         disponible,
//         quantiteDisponible: quantite,
//         etatPack: element.etatPack,
//         composants: element.composants,
//       });
//       return;
//     }

//     // Matériels / fallback
//     const quantite = lireNombre(
//       element.quantiteDisponible ?? element.stockDisponible ?? element.disponibles,
//     );
//     const disponible =
//       typeof element.disponible === "boolean"
//         ? element.disponible
//         : quantite === null
//           ? true
//           : quantite > 0;

//     table.set(code, {
//       disponible,
//       quantiteDisponible: quantite,
//       etatPack: element.etatPack,
//     });
//   });

//   return table;
// };

// // Statut d'une ligne du panier en tenant compte de la quantité demandée
// export const evaluerLigne = (obtenir, ligne) => {
//   const etat = obtenir(ligne.type, ligne.code);
//   if (
//     etat.statut === STATUT.DISPONIBLE &&
//     etat.quantiteDisponible !== null &&
//     ligne.quantite > etat.quantiteDisponible
//   ) {
//     return {
//       statut: STATUT.INSUFFISANT,
//       quantiteDisponible: etat.quantiteDisponible,
//     };
//   }
//   return etat;
// };

// export const ligneBloquante = (etat) =>
//   etat.statut === STATUT.INDISPONIBLE || etat.statut === STATUT.INSUFFISANT;

// export const normaliserCalendrier = (reponse) => ({
//   quantiteTotale: lireNombre(reponse?.quantiteTotale),
//   jours: new Map(
//     (reponse?.jours ?? []).map((jour) => [
//       jour.date,
//       lireNombre(jour.quantiteDisponible),
//     ]),
//   ),
// });

// export const dateISO = (annee, indexMois, jour) =>
//   `${annee}-${remplirZero(indexMois + 1)}-${remplirZero(jour)}`;

