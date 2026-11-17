// Client/contexts/PanierContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { nombreDeJours } from "../utils/formatage";
import { calculerTotaux } from "../utils/tarification";

const CLE_STOCKAGE = "panier_client";
const ETAT_INITIAL = { periode: { dateDebut: "", dateFin: "" }, lignes: [] };

const lireStockage = () => {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    return brut ? { ...ETAT_INITIAL, ...JSON.parse(brut) } : ETAT_INITIAL;
  } catch {
    return ETAT_INITIAL;
  }
};

const PanierContext = createContext(null);

export function PanierProvider({ children }) {
  const [etat, setEtat] = useState(lireStockage);
  const [ouvreDateModal, setOuvreDateModal] = useState(false);

  // ✅ action en attente : exécutée après validation des dates
  const actionEnAttente = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
    } catch {
      /* quota ou navigation privée */
    }
  }, [etat]);

  const modePanier = etat.lignes[0]?.type ?? null;

  const datesCompletes = Boolean(
    etat.periode.dateDebut && etat.periode.dateFin,
  );

  const definirPeriode = useCallback((periode) => {
    setEtat((prev) => ({
      ...prev,
      periode: { dateDebut: periode.dateDebut, dateFin: periode.dateFin },
    }));
  }, []);

  const ajouterLigne = useCallback(
    (nouvelleLigne, remplacerSiExiste = false) => {
      setEtat((prev) => {
        const existante = prev.lignes.find(
          (l) => l.code === nouvelleLigne.code,
        );
        const lignes = existante
          ? prev.lignes.map((l) =>
              l.code === nouvelleLigne.code
                ? {
                    ...l,
                    quantite: remplacerSiExiste
                      ? nouvelleLigne.quantite
                      : l.quantite + nouvelleLigne.quantite,
                  }
                : l,
            )
          : [...prev.lignes, nouvelleLigne];
        return { ...prev, lignes };
      });
    },
    [],
  );

  const ajouterMaterielBrut = useCallback(
    (materiel, quantite = 1) => {
      if (modePanier === "pack") {
        return {
          ok: false,
          raison:
            "Votre panier contient un pack. Videz-le pour réserver du matériel à l'unité.",
        };
      }
      ajouterLigne({
        type: "materiel",
        code: materiel.CodeMateriel,
        designation: materiel.designation,
        marque: materiel.marque,
        image: materiel.imageURL,
        prixUnitaire: Number(materiel.prixLocation),
        prixCaution: Number(materiel.prixCaution),
        quantite,
      });
      return { ok: true };
    },
    [modePanier, ajouterLigne],
  );

  const ajouterPackBrut = useCallback(
    (pack, quantite = 1) => {
      if (modePanier === "materiel") {
        return {
          ok: false,
          raison:
            "Votre panier contient du matériel. Videz-le pour réserver un pack.",
        };
      }

      const lignePack = {
        type: "pack",
        code: pack.codePack,
        codePack: pack.codePack,
        designation: pack.libelle,
        image: pack.photos,
        prixUnitaire: Number(pack.tarifJournalier),
        prixCaution: Number(pack.prixCaution),
        quantite,
        composants: Array.isArray(pack.composants)
          ? pack.composants.map((c) => ({
              codeMateriel:
                c.materiel?.codeMateriel ??
                c.codeMateriel ??
                c.materiel?.CodeMateriel,
              nomMateriel: c.materiel?.nomMateriel ?? c.nomMateriel,
              quantite: Number(c.quantite ?? c.quantiteRequise ?? 1),
            }))
          : [],
      };

      setEtat((prev) => ({ ...prev, lignes: [lignePack] }));
      return { ok: true };
    },
    [modePanier],
  );

  // ✅ ouvre le modal ET mémorise l'action à exécuter après validation
  const ajouterAvecDates = useCallback((action) => {
    actionEnAttente.current = action;
    setOuvreDateModal(true);
  }, []);

  const ajouterMateriel = useCallback(
    (materiel, quantite = 1) => {
      if (!datesCompletes) {
        ajouterAvecDates(() => ajouterMaterielBrut(materiel, quantite));
        return { ok: false, raison: "dates_requises" };
      }
      return ajouterMaterielBrut(materiel, quantite);
    },
    [datesCompletes, ajouterAvecDates, ajouterMaterielBrut],
  );

  const ajouterPack = useCallback(
    (pack, quantite = 1) => {
      if (!datesCompletes) {
        ajouterAvecDates(() => ajouterPackBrut(pack, quantite));
        return { ok: false, raison: "dates_requises" };
      }
      return ajouterPackBrut(pack, quantite);
    },
    [datesCompletes, ajouterAvecDates, ajouterPackBrut],
  );

  // ✅ appelé par DatesModal après validation des dates
  const finaliserDates = useCallback(
    (periode) => {
      setEtat((prev) => ({
        ...prev,
        periode: { dateDebut: periode.dateDebut, dateFin: periode.dateFin },
      }));

      const action = actionEnAttente.current;
      actionEnAttente.current = null;
      setOuvreDateModal(false);

      // On doit laisser le state se mettre à jour avant d'exécuter l'action
      if (action) queueMicrotask(() => action());
    },
    [],
  );

  // ✅ appelé quand l'utilisateur ferme le modal sans valider
  const annulerDates = useCallback(() => {
    actionEnAttente.current = null;
    setOuvreDateModal(false);
  }, []);

  const modifierQuantite = useCallback((code, quantite) => {
    const valeur = Math.max(1, Number(quantite) || 1);
    setEtat((prev) => ({
      ...prev,
      lignes: prev.lignes.map((l) =>
        l.code === code ? { ...l, quantite: valeur } : l,
      ),
    }));
  }, []);

  const retirerLigne = useCallback((code) => {
    setEtat((prev) => ({
      ...prev,
      lignes: prev.lignes.filter((l) => l.code !== code),
    }));
  }, []);

  const viderPanier = useCallback(() => {
    setEtat((prev) => ({ ...prev, lignes: [] }));
  }, []);

  const valeur = useMemo(() => {
    const nbJours = nombreDeJours(
      etat.periode.dateDebut,
      etat.periode.dateFin,
    );
    return {
      ouvreDateModal,
      lignes: etat.lignes,
      periode: etat.periode,
      periodeValide: nbJours > 0,
      datesCompletes,
      nbJours,
      modePanier,
      nombreArticles: etat.lignes.reduce(
        (somme, l) => somme + l.quantite,
        0,
      ),
      totaux: calculerTotaux(etat.lignes, nbJours),
      setOuvreDateModal,
      definirPeriode,
      ajouterMateriel,
      ajouterPack,
      modifierQuantite,
      retirerLigne,
      viderPanier,
      finaliserDates,
      annulerDates,
    };
  }, [
    etat,
    modePanier,
    ouvreDateModal,
    datesCompletes,
    definirPeriode,
    ajouterMateriel,
    ajouterPack,
    modifierQuantite,
    retirerLigne,
    viderPanier,
    finaliserDates,
    annulerDates,
  ]);

  return (
    <PanierContext.Provider value={valeur}>{children}</PanierContext.Provider>
  );
}

export function usePanier() {
  const contexte = useContext(PanierContext);
  if (!contexte)
    throw new Error(
      "usePanier doit être utilisé à l'intérieur d'un PanierProvider",
    );
  return contexte;
}

// // Client/contexts/PanierContext.jsx
// import {
//   createContext,
//   useCallback,
//   useContext,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { nombreDeJours } from "../utils/formatage";
// import { calculerTotaux } from "../utils/tarification";
// import { ReservationService } from "../../data/reservationService";
// import { extraireMessageErreur } from "../utils/erreurs";

// const CLE_STOCKAGE = "panier_client";
// const ETAT_INITIAL = { periode: { dateDebut: "", dateFin: "" }, lignes: [] };

// const lireStockage = () => {
//   try {
//     const brut = localStorage.getItem(CLE_STOCKAGE);
//     return brut ? { ...ETAT_INITIAL, ...JSON.parse(brut) } : ETAT_INITIAL;
//   } catch {
//     return ETAT_INITIAL;
//   }
// };

// const PanierContext = createContext(null);

// export function PanierProvider({ children }) {
//   const [etat, setEtat] = useState(lireStockage);
//   const [ouvreDateModal, setOuvreDateModal] = useState(false);

//   // { executer, article: { type, code, designation, quantite } }
//   const actionEnAttente = useRef(null);

//   useEffect(() => {
//     try {
//       localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
//     } catch {
//       /* quota ou navigation privée */
//     }
//   }, [etat]);

//   const modePanier = etat.lignes[0]?.type ?? null;
//   const datesCompletes = Boolean(
//     etat.periode.dateDebut && etat.periode.dateFin,
//   );

//   const definirPeriode = useCallback((periode) => {
//     setEtat((prev) => ({
//       ...prev,
//       periode: { dateDebut: periode.dateDebut, dateFin: periode.dateFin },
//     }));
//   }, []);

//   console.log("OuvreModalDAte: ", ouvreDateModal, "DAte Complete: ", datesCompletes)
//   const ajouterLigne = useCallback(
//     (nouvelleLigne, remplacerSiExiste = false) => {
//       setEtat((prev) => {
//         const existante = prev.lignes.find(
//           (l) => l.code === nouvelleLigne.code,
//         );
//         const lignes = existante
//           ? prev.lignes.map((l) =>
//               l.code === nouvelleLigne.code
//                 ? {
//                     ...l,
//                     quantite: remplacerSiExiste
//                       ? nouvelleLigne.quantite
//                       : l.quantite + nouvelleLigne.quantite,
//                   }
//                 : l,
//             )
//           : [...prev.lignes, nouvelleLigne];
//         return { ...prev, lignes };
//       });
//     },
//     [],
//   );

//   const ajouterMaterielBrut = useCallback(
//     (materiel, quantite = 1) => {
//       if (modePanier === "pack") {
//         return {
//           ok: false,
//           raison:
//             "Votre panier contient un pack. Videz-le pour réserver du matériel à l'unité.",
//         };
//       }
//       ajouterLigne({
//         type: "materiel",
//         code: materiel.CodeMateriel,
//         designation: materiel.designation,
//         marque: materiel.marque,
//         image: materiel.imageURL,
//         prixUnitaire: Number(materiel.prixLocation),
//         prixCaution: Number(materiel.prixCaution),
//         quantite,
//       });
//       return { ok: true };
//     },
//     [modePanier, ajouterLigne],
//   );

//   const ajouterPackBrut = useCallback(
//     (pack, quantite = 1) => {
//       if (modePanier === "materiel") {
//         return {
//           ok: false,
//           raison:
//             "Votre panier contient du matériel. Videz-le pour réserver un pack.",
//         };
//       }

//       const lignePack = {
//         type: "pack",
//         code: pack.codePack,
//         codePack: pack.codePack,
//         designation: pack.libelle,
//         image: pack.photos,
//         prixUnitaire: Number(pack.tarifJournalier),
//         prixCaution: Number(pack.prixCaution),
//         quantite,
//         composants: Array.isArray(pack.composants)
//           ? pack.composants.map((c) => ({
//               codeMateriel:
//                 c.materiel?.codeMateriel ??
//                 c.codeMateriel ??
//                 c.materiel?.CodeMateriel,
//               nomMateriel: c.materiel?.nomMateriel ?? c.nomMateriel,
//               quantite: Number(c.quantite ?? c.quantiteRequise ?? 1),
//             }))
//           : [],
//       };

//       setEtat((prev) => ({ ...prev, lignes: [lignePack] }));
//       return { ok: true };
//     },
//     [modePanier],
//   );

//   const ajouterAvecDates = useCallback((action, article) => {
//     actionEnAttente.current = { executer: action, article };
//     setOuvreDateModal(true);
//   }, []);

//   const ajouterMateriel = useCallback(
//     (materiel, quantite = 1) => {
//       if (!datesCompletes) {
//         ajouterAvecDates(
//           () => ajouterMaterielBrut(materiel, quantite),
//           {
//             type: "materiel",
//             code: materiel.CodeMateriel,
//             designation: materiel.designation,
//             quantite,
//           },
//         );
//         return { ok: false, raison: "dates_requises" };
//       }
//       return ajouterMaterielBrut(materiel, quantite);
//     },
//     [datesCompletes, ajouterAvecDates, ajouterMaterielBrut],
//   );

//   const ajouterPack = useCallback(
//     (pack, quantite = 1) => {
//       if (!datesCompletes) {
//         ajouterAvecDates(
//           () => ajouterPackBrut(pack, quantite),
//           {
//             type: "pack",
//             code: pack.codePack,
//             designation: pack.libelle,
//             quantite,
//           },
//         );
//         return { ok: false, raison: "dates_requises" };
//       }
//       return ajouterPackBrut(pack, quantite);
//     },
//     [datesCompletes, ajouterAvecDates, ajouterPackBrut],
//   );

//   const finaliserDates = useCallback(async (periode) => {
//     const enAttente = actionEnAttente.current;
//     actionEnAttente.current = null;

//     setEtat((prev) => ({
//       ...prev,
//       periode: { dateDebut: periode.dateDebut, dateFin: periode.dateFin },
//     }));
//     setOuvreDateModal(false);

//     if (!enAttente) return { ok: true };

//     const { executer, article } = enAttente;

//     if (article) {
//       try {
//         const [reponseMateriels, reponsePacks] = await Promise.all([
//           ReservationService.materielDispo(periode),
//           ReservationService.packsDisponibles(periode),
//         ]);

//         // --- Extraire la dispo de l'article
//         let quantiteDisponible = 0;

//         if (article.type === "pack") {
//           const pack = (reponsePacks ?? []).find(
//             (p) => p.codePack === article.code,
//           );
//           if (!pack) {
//             return {
//               ok: false,
//               raison: `Impossible de vérifier la disponibilité de ${article.designation}.`,
//             };
//           }
//           quantiteDisponible = Number(pack.quantiteDisponible ?? 0);
//           if (pack.etatPack !== "disponible" || quantiteDisponible <= 0) {
//             return {
//               ok: false,
//               raison: `${article.designation} n'est pas disponible sur ces dates.`,
//               quantiteDisponible: 0,
//             };
//           }
//         } else {
//           // matériel : arborescence → parcourir
//           const trouverMateriel = (noeud) => {
//             if (Array.isArray(noeud)) {
//               for (const enfant of noeud) {
//                 const trouve = trouverMateriel(enfant);
//                 if (trouve) return trouve;
//               }
//               return null;
//             }
//             if (!noeud || typeof noeud !== "object") return null;
//             if (
//               noeud.CodeMateriel === article.code ||
//               noeud.codeMateriel === article.code
//             ) {
//               return noeud;
//             }
//             return (
//               trouverMateriel(noeud.materiels) ??
//               trouverMateriel(noeud.enfants)
//             );
//           };

//           const mat = trouverMateriel(reponseMateriels);
//           if (!mat) {
//             return {
//               ok: false,
//               raison: `Impossible de vérifier la disponibilité de ${article.designation}.`,
//             };
//           }
//           quantiteDisponible = Number(mat.quantiteDisponible ?? 0);
//           if (quantiteDisponible <= 0) {
//             return {
//               ok: false,
//               raison: `${article.designation} n'est pas disponible sur ces dates.`,
//               quantiteDisponible: 0,
//             };
//           }
//         }

//         if (quantiteDisponible < article.quantite) {
//           return {
//             ok: false,
//             raison: `Seulement ${quantiteDisponible} ${article.designation} disponible(s) sur ces dates.`,
//             quantiteDisponible,
//           };
//         }
//       } catch (e) {
//         return {
//           ok: false,
//           raison: extraireMessageErreur(
//             e,
//             "Impossible de vérifier la disponibilité.",
//           ),
//         };
//       }
//     }

//     executer();
//     return { ok: true, article };
//   }, []);

//   const annulerDates = useCallback(() => {
//     actionEnAttente.current = null;
//     setOuvreDateModal(false);
//   }, []);

//   const modifierQuantite = useCallback((code, quantite) => {
//     const valeur = Math.max(1, Number(quantite) || 1);
//     setEtat((prev) => ({
//       ...prev,
//       lignes: prev.lignes.map((l) =>
//         l.code === code ? { ...l, quantite: valeur } : l,
//       ),
//     }));
//   }, []);

//   const retirerLigne = useCallback((code) => {
//     setEtat((prev) => ({
//       ...prev,
//       lignes: prev.lignes.filter((l) => l.code !== code),
//     }));
//   }, []);

//   const viderPanier = useCallback(() => {
//     setEtat((prev) => ({ ...prev, lignes: [] }));
//   }, []);

//   const valeur = useMemo(() => {
//     const nbJours = nombreDeJours(
//       etat.periode.dateDebut,
//       etat.periode.dateFin,
//     );
//     return {
//       ouvreDateModal,
//       lignes: etat.lignes,
//       periode: etat.periode,
//       periodeValide: nbJours > 0,
//       datesCompletes,
//       nbJours,
//       modePanier,
//       nombreArticles: etat.lignes.reduce(
//         (somme, l) => somme + l.quantite,
//         0,
//       ),
//       totaux: calculerTotaux(etat.lignes, nbJours),
//       setOuvreDateModal,
//       definirPeriode,
//       ajouterMateriel,
//       ajouterPack,
//       modifierQuantite,
//       retirerLigne,
//       viderPanier,
//       finaliserDates,
//       annulerDates,
//     };
//   }, [
//     etat,
//     modePanier,
//     ouvreDateModal,
//     datesCompletes,
//     definirPeriode,
//     ajouterMateriel,
//     ajouterPack,
//     modifierQuantite,
//     retirerLigne,
//     viderPanier,
//     finaliserDates,
//     annulerDates,
//   ]);

//   return (
//     <PanierContext.Provider value={valeur}>{children}</PanierContext.Provider>
//   );
// }

// export function usePanier() {
//   const contexte = useContext(PanierContext);
//   if (!contexte)
//     throw new Error(
//       "usePanier doit être utilisé à l'intérieur d'un PanierProvider",
//     );
//   return contexte;
// }