// Client/hooks/useDisponibilites.js
import { useCallback, useEffect, useState } from "react";
import { ReservationService } from "../../data/reservationService";
import { STATUT_DISPONIBILITE as STATUT } from "../utils/constantes";
import { normaliserDisponibilites } from "../utils/disponibilite";
import { extraireMessageErreur } from "../utils/erreurs";
import { nombreDeJours } from "../utils/formatage";

const ETAT_VIDE = {
  materiels: null,
  packs: null,
  chargement: false,
  erreur: null,
};

export default function useDisponibilites({ dateDebut, dateFin }) {
  const periodeValide = nombreDeJours(dateDebut, dateFin) > 0;
  const [etat, setEtat] = useState(ETAT_VIDE);

  const charger = useCallback(async () => {
    if (!periodeValide) {
      setEtat(ETAT_VIDE);
      return;
    }
    setEtat((prev) => ({ ...prev, chargement: true, erreur: null }));
    try {
      const [reponseMateriels, reponsePacks] = await Promise.all([
        ReservationService.materielDispo({ dateDebut, dateFin }),
        ReservationService.packsDisponibles({ dateDebut, dateFin }),
      ]);

        console.log("matériels bruts =", reponseMateriels);
        console.log("packs bruts =", reponsePacks);
      

      const tableMateriels = normaliserDisponibilites(reponseMateriels, "materiel");
      const tablePacks = normaliserDisponibilites(reponsePacks, "pack");

      if (import.meta.env.DEV) {
        console.debug("[useDisponibilites] map matériels =", [...tableMateriels.entries()]);
        console.debug("[useDisponibilites] map packs =", [...tablePacks.entries()]);
      }

      setEtat({
        materiels: tableMateriels,
        packs: tablePacks,
        chargement: false,
        erreur: null,
      });
    } catch (e) {
      setEtat({
        ...ETAT_VIDE,
        erreur: extraireMessageErreur(
          e,
          "Impossible de vérifier la disponibilité.",
        ),
      });
    }
  }, [dateDebut, dateFin, periodeValide]);

  useEffect(() => {
    charger();
  }, [charger]);

  const obtenir = useCallback(
    (type, code) => {
      const table = type === "pack" ? etat.packs : etat.materiels;
      if (!table) return { statut: STATUT.INCONNUE, quantiteDisponible: null };

      const entree = table.get(code);
      if (!entree) return { statut: STATUT.INDISPONIBLE, quantiteDisponible: 0 };

      // ✅ Packs : etatPack est la vérité
      if (type === "pack") {
        const quantite = Number(entree.quantiteDisponible ?? 0);
        const dispo = entree.etatPack === "disponible" && quantite > 0;
        return {
          statut: dispo ? STATUT.DISPONIBLE : STATUT.INDISPONIBLE,
          quantiteDisponible: quantite,
          etatPack: entree.etatPack,
        };
      }

      // ✅ Matériels : quantiteDisponible est la SEULE vérité
      const quantite = Number(entree.quantiteDisponible ?? 0);
      return {
        statut: quantite > 0 ? STATUT.DISPONIBLE : STATUT.INDISPONIBLE,
        quantiteDisponible: quantite,
      };
    },
    [etat.materiels, etat.packs],
  );

  return { ...etat, periodeValide, obtenir, rafraichir: charger };
}

// // Client/hooks/useDisponibilites.js
// // Disponibilité de tous les matériels et packs sur une période donnée.
// import { useCallback, useEffect, useState } from "react";
// import { ReservationService } from "../../data/reservationService";
// import { STATUT_DISPONIBILITE as STATUT } from "../utils/constantes";
// import { normaliserDisponibilites } from "../utils/disponibilite";
// import { extraireMessageErreur } from "../utils/erreurs";
// import { nombreDeJours } from "../utils/formatage";

// const ETAT_VIDE = {
//   materiels: null,
//   packs: null,
//   chargement: false,
//   erreur: null,
// };

// export default function useDisponibilites({ dateDebut, dateFin }) {
//   const periodeValide = nombreDeJours(dateDebut, dateFin) > 0;
//   const [etat, setEtat] = useState(ETAT_VIDE);

//   const charger = useCallback(async () => {
//     if (!periodeValide) {
//       setEtat(ETAT_VIDE);
//       return;
//     }
//     setEtat((prev) => ({ ...prev, chargement: true, erreur: null }));
//     try {
//       const [reponseMateriels, reponsePacks] = await Promise.all([
//         ReservationService.materielDispo({ dateDebut, dateFin }),
//         ReservationService.packsDisponibles({ dateDebut, dateFin }),
//       ]);

//       if (import.meta.env.DEV) {
//         console.debug("[useDisponibilites] packs bruts =", reponsePacks);
//       }

//       const tableMateriels = normaliserDisponibilites(reponseMateriels, "materiel");
//       const tablePacks = normaliserDisponibilites(reponsePacks, "pack");

//       if (import.meta.env.DEV) {
//         console.debug("[useDisponibilites] map packs =", [...tablePacks.entries()]);
//       }

//       setEtat({
//         materiels: tableMateriels,
//         packs: tablePacks,
//         chargement: false,
//         erreur: null,
//       });
//     } catch (e) {
//       setEtat({
//         ...ETAT_VIDE,
//         erreur: extraireMessageErreur(
//           e,
//           "Impossible de vérifier la disponibilité.",
//         ),
//       });
//     }
//   }, [dateDebut, dateFin, periodeValide]);

//   useEffect(() => {
//     charger();
//   }, [charger]);

//   const obtenir = useCallback(
//     (type, code) => {
//       const table = type === "pack" ? etat.packs : etat.materiels;
//       if (!table) return { statut: STATUT.INCONNUE, quantiteDisponible: null };

//       const entree = table.get(code);
//       if (!entree) return { statut: STATUT.INDISPONIBLE, quantiteDisponible: 0 };

//       // ✅ packs : se baser sur etatPack (nouveau contrat) ou disponible
//       if (type === "pack") {
//         const dispo =
//           (entree.etatPack === "disponible" || entree.disponible === true) &&
//           Number(entree.quantiteDisponible ?? 0) > 0;
//         return {
//           statut: dispo ? STATUT.DISPONIBLE : STATUT.INDISPONIBLE,
//           quantiteDisponible: Number(entree.quantiteDisponible ?? 0),
//           etatPack: entree.etatPack,
//         };
//       }

//       // matériels
//       const dispo =
//         entree.disponible === true &&
//         (entree.quantiteDisponible == null || entree.quantiteDisponible > 0);
//       return {
//         statut: dispo ? STATUT.DISPONIBLE : STATUT.INDISPONIBLE,
//         quantiteDisponible: entree.quantiteDisponible ?? 0,
//       };
//     },
//     [etat.materiels, etat.packs],
//   );

//   return { ...etat, periodeValide, obtenir, rafraichir: charger };
// }

