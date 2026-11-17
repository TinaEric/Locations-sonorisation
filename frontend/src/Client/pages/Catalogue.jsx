// Client/pages/Catalogue.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { ReservationService } from "../../data/reservationService";
import { CatalogueService } from "../../data/CatalogueService";
import { PackService } from "../../data/packService";
import { CalendrierService } from "../../data/CalendrierService";
import ModalCalendrier from "../components/calendrier/ModalCalendrier";
import BarreRecherche from "../components/catalogue/BarreRecherche";
import CarteMateriel from "../components/catalogue/CarteMateriel";
import CartePack from "../components/catalogue/CartePack";
import Chargement from "../components/commun/Chargement";
import EtatVide from "../components/commun/EtatVide";
import MessageErreur from "../components/commun/MessageErreur";
import { useFilter } from "../contexts/FilterContext";
import { STATUT_DISPONIBILITE as STATUT } from "../utils/constantes";
import { extraireMessageErreur } from "../utils/erreurs";
import { materielCorrespond, packCorrespond } from "../utils/recherche";

const PAS_AFFICHAGE = 12;

const ONGLETS = [
  { valeur: "tout", libelle: "Tout" },
  { valeur: "materiels", libelle: "Matériels" },
  { valeur: "packs", libelle: "Packs" },
];

const aplatirMateriels = (reponse) => {
  const resultat = [];
  const parcourir = (noeud) => {
    if (Array.isArray(noeud)) {
      noeud.forEach(parcourir);
      return;
    }
    if (!noeud || typeof noeud !== "object") return;
    if (noeud.CodeMateriel || noeud.codeMateriel) {
      resultat.push({
        ...noeud,
        CodeMateriel: noeud.CodeMateriel ?? noeud.codeMateriel,
        categorieIds: noeud.categorieIds ?? [],
        quantiteDisponible: Number(noeud.quantiteDisponible ?? 0),
      });
      return;
    }
    parcourir(noeud.materiels);
    parcourir(noeud.enfants);
  };
  parcourir(reponse);
  return resultat;
};

const normaliserPacks = (reponse) => {
  if (!Array.isArray(reponse)) return [];
  return reponse.map((p) => ({
    ...p,
    codePack: p.codePack ?? p.CodePack,
    quantiteDisponible: Number(p.quantiteDisponible ?? 0),
    composants: p.composants ?? [],
    etatPack:
      p.etatPack ??
      (Number(p.quantiteDisponible) > 0 ? "disponible" : "indisponible"),
  }));
};

const disponibiliteMateriel = (m, avecDates) => {
  if (!avecDates) return { statut: STATUT.INCONNUE, quantiteDisponible: null };
  const q = Number(m.quantiteDisponible ?? 0);
  return {
    statut: q > 0 ? STATUT.DISPONIBLE : STATUT.INDISPONIBLE,
    quantiteDisponible: q,
  };
};

const disponibilitePack = (p, avecDates) => {
  if (!avecDates) return { statut: STATUT.INCONNUE, quantiteDisponible: null };
  const q = Number(p.quantiteDisponible ?? 0);
  return {
    statut:
      p.etatPack === "disponible" && q > 0
        ? STATUT.DISPONIBLE
        : STATUT.INDISPONIBLE,
    quantiteDisponible: q,
    etatPack: p.etatPack,
  };
};

export default function Catalogue() {
  const {
    periode,
    periodeValide,
    definirPeriode,
    recherche,
    categorieId,
    setCategorieId,
    onglet,
    setOnglet,
    seulementDisponibles,
    setSeulementDisponibles,
  } = useFilter();

  const [materiels, setMateriels] = useState([]);
  const [packs, setPacks] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [limite, setLimite] = useState(PAS_AFFICHAGE);
  const [calendrierCible, setCalendrierCible] = useState(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      if (!periodeValide) {
        const [repArbo, repPacks] = await Promise.all([
          CatalogueService.arborescence(),
          PackService.list(),
        ]);
        setMateriels(aplatirMateriels(repArbo));
        setPacks(normaliserPacks(repPacks));
      } else {
        const [repMateriels, repPacks] = await Promise.all([
          ReservationService.materielDispo({
            dateDebut: periode.dateDebut,
            dateFin: periode.dateFin,
          }),
          ReservationService.packsDisponibles({
            dateDebut: periode.dateDebut,
            dateFin: periode.dateFin,
          }),
        ]);
        setMateriels(aplatirMateriels(repMateriels));
        setPacks(normaliserPacks(repPacks));
      }
    } catch (e) {
      console.error("[Catalogue] erreur chargement :", e);
      setErreur(
        extraireMessageErreur(e, "Impossible de charger le catalogue."),
      );
      setMateriels([]);
      setPacks([]);
    } finally {
      setChargement(false);
    }
  }, [periodeValide, periode.dateDebut, periode.dateFin]);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    setLimite(PAS_AFFICHAGE);
  }, [recherche, categorieId, onglet, seulementDisponibles]);

  const lancerRecherche = async ({ dateDebut, dateFin }) => {
    definirPeriode({ dateDebut, dateFin });
  };

  const chargerCalendrier = useCallback(async (type, code, moisISO) => {
    const result = CalendrierService.fabriquerChargeur(type, code)(moisISO);
    console.log('Calendar: ', result, "  Code: ",code)
    return result
  }, []);

  const materielsFiltres = useMemo(() => {
    return materiels.filter((m) => {
      if (seulementDisponibles && periodeValide) {
        if (Number(m.quantiteDisponible ?? 0) <= 0) return false;
      }
      if (recherche && !materielCorrespond(m, recherche)) return false;
      if (categorieId && !(m.categorieIds ?? []).includes(categorieId))
        return false;
      return true;
    });
  }, [materiels, recherche, categorieId, seulementDisponibles, periodeValide]);

  const packsFiltres = useMemo(() => {
    if (categorieId) return [];
    return packs.filter((p) => {
      if (seulementDisponibles && periodeValide) {
        if (p.etatPack !== "disponible") return false;
      }
      if (recherche && !packCorrespond(p, recherche)) return false;
      return true;
    });
  }, [packs, recherche, categorieId, seulementDisponibles, periodeValide]);

  const afficherPacks = onglet !== "materiels";
  const afficherMateriels = onglet !== "packs";
  const aucunResultat =
    !chargement &&
    (!afficherPacks || !packsFiltres.length) &&
    (!afficherMateriels || !materielsFiltres.length);

  const ouvrirCalendrier = (type, code, titre) =>
    setCalendrierCible({ code, titre, type });

  return (
    <div className="space-y-6">
      <BarreRecherche
        key={`${periode.dateDebut}|${periode.dateFin}`}
        termeInitial={recherche}
        periodeInitiale={periode}
        onRechercher={lancerRecherche}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="tabs tabs-box">
          {ONGLETS.map((o) => (
            <button
              key={o.valeur}
              type="button"
              role="tab"
              className={`tab ${onglet === o.valeur ? "tab-active" : ""}`}
              onClick={() => setOnglet(o.valeur)}
            >
              {o.libelle}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label
            className={`label cursor-pointer gap-2 text-sm ${
              periodeValide ? "" : "opacity-50"
            }`}
          >
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={seulementDisponibles}
              disabled={!periodeValide}
              onChange={(e) => setSeulementDisponibles(e.target.checked)}
            />
            Disponibles uniquement
          </label>
        </div>
      </div>

      <MessageErreur message={erreur} onReessayer={charger} />
      {chargement && <Chargement message="Chargement du catalogue…" />}

      {afficherPacks && packsFiltres.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Packs ({packsFiltres.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {packsFiltres.map((pack) => (
              <CartePack
                key={pack.codePack}
                pack={pack}
                disponibilite={disponibilitePack(pack, periodeValide)}
                onVoirCalendrier={() =>
                  ouvrirCalendrier("pack", pack.codePack, pack.libelle)
                }
              />
            ))}
          </div>
        </section>
      )}

      {afficherMateriels && materielsFiltres.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">
            Matériels ({materielsFiltres.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {materielsFiltres.slice(0, limite).map((materiel) => (
              <CarteMateriel
                key={materiel.CodeMateriel}
                materiel={materiel}
                disponibilite={disponibiliteMateriel(materiel, periodeValide)}
                onVoirCalendrier={() =>
                  ouvrirCalendrier(
                    "materiel",
                    materiel.CodeMateriel,
                    materiel.designation,
                  )
                }
              />
            ))}
          </div>
          {materielsFiltres.length > limite && (
            <div className="text-center">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setLimite((l) => l + PAS_AFFICHAGE)}
              >
                Afficher plus
              </button>
            </div>
          )}
        </section>
      )}

      {aucunResultat && (
        <EtatVide
          Icone={SearchX}
          titre="Aucun résultat"
          message="Essayez un autre mot-clé, une autre catégorie ou d'autres dates."
        />
      )}

      <ModalCalendrier
        cible={
          calendrierCible
            ? {
                ...calendrierCible,
                chargerMois: (moisISO) =>
                  chargerCalendrier(
                    calendrierCible.type,
                    calendrierCible.code,
                    moisISO,
                  ),
              }
            : null
        }
        periode={periode}
        onFermer={() => setCalendrierCible(null)}
      />
    </div>
  );
}

// import { useCallback, useEffect, useMemo, useState } from "react";
// import { SearchX } from "lucide-react";
// import { ReservationService } from "../../data/reservationService";
// import { CalendrierService } from "../../data/CalendrierService";
// import ModalCalendrier from "../components/calendrier/ModalCalendrier";
// import BarreRecherche from "../components/catalogue/BarreRecherche";
// import CarteMateriel from "../components/catalogue/CarteMateriel";
// import CartePack from "../components/catalogue/CartePack";
// import Chargement from "../components/commun/Chargement";
// import EtatVide from "../components/commun/EtatVide";
// import MessageErreur from "../components/commun/MessageErreur";
// import { useFilter } from "../contexts/FilterContext";
// import { STATUT_DISPONIBILITE as STATUT } from "../utils/constantes";
// import { extraireMessageErreur } from "../utils/erreurs";
// import { materielCorrespond, packCorrespond } from "../utils/recherche";

// const PAS_AFFICHAGE = 12;

// const ONGLETS = [
//   { valeur: "tout", libelle: "Tout" },
//   { valeur: "materiels", libelle: "Matériels" },
//   { valeur: "packs", libelle: "Packs" },
// ];

// // --- Aplatir l'arborescence catégories → matériels ---
// const aplatirMateriels = (reponse) => {
//   const resultat = [];
//   const parcourir = (noeud) => {
//     if (Array.isArray(noeud)) {
//       noeud.forEach(parcourir);
//       return;
//     }
//     if (!noeud || typeof noeud !== "object") return;
//     // matériel ?
//     if (noeud.CodeMateriel || noeud.codeMateriel) {
//       resultat.push({
//         ...noeud,
//         CodeMateriel: noeud.CodeMateriel ?? noeud.codeMateriel,
//         categorieIds: noeud.categorieIds ?? [],
//         quantiteDisponible: Number(noeud.quantiteDisponible ?? 0),
//       });
//       return;
//     }
//     parcourir(noeud.materiels);
//     parcourir(noeud.enfants);
//   };
//   parcourir(reponse);
//   return resultat;
// };

// // --- Normaliser les packs (liste plate) ---
// const normaliserPacks = (reponse) => {
//   if (!Array.isArray(reponse)) return [];
//   return reponse.map((p) => ({
//     ...p,
//     codePack: p.codePack ?? p.CodePack,
//     quantiteDisponible: Number(p.quantiteDisponible ?? 0),
//     composants: p.composants ?? [],
//     etatPack:
//       p.etatPack ?? (Number(p.quantiteDisponible) > 0 ? "disponible" : "indisponible"),
//   }));
// };

// export default function Catalogue() {
//   const {
//     periode,
//     periodeValide,
//     definirPeriode,
//     recherche,
//     categorieId,
//     setCategorieId,
//     onglet,
//     setOnglet,
//     seulementDisponibles,
//     setSeulementDisponibles,
//   } = useFilter();

//   const [materiels, setMateriels] = useState([]);
//   const [packs, setPacks] = useState([]);
//   const [chargement, setChargement] = useState(false);
//   const [erreur, setErreur] = useState(null);
//   const [limite, setLimite] = useState(PAS_AFFICHAGE);
//   const [calendrierCible, setCalendrierCible] = useState(null);

//   // ✅ Récupération directe des articles disponibles sur la période
//   const chargerDisponibilites = useCallback(async () => {
//     if (!periodeValide) {
//       setMateriels([]);
//       setPacks([]);
//       setErreur(null);
//       return;
//     }
//     setChargement(true);
//     setErreur(null);
//     try {
//       const [repMateriels, repPacks] = await Promise.all([
//         ReservationService.materielDispo({
//           dateDebut: periode.dateDebut,
//           dateFin: periode.dateFin,
//         }),
//         ReservationService.packsDisponibles({
//           dateDebut: periode.dateDebut,
//           dateFin: periode.dateFin,
//         }),
//       ]);

//       setMateriels(aplatirMateriels(repMateriels));
//       setPacks(normaliserPacks(repPacks));
//     } catch (e) {
//       console.error("[Catalogue] erreur chargement :", e);
//       setErreur(
//         extraireMessageErreur(
//           e,
//           "Impossible de charger la disponibilité du catalogue.",
//         ),
//       );
//       setMateriels([]);
//       setPacks([]);
//     } finally {
//       setChargement(false);
//     }
//   }, [periodeValide, periode.dateDebut, periode.dateFin]);

//   // Charger au montage si la période est déjà valide (ex. retour sur la page)
//   useEffect(() => {
//     chargerDisponibilites();
//   }, [chargerDisponibilites]);

//   useEffect(() => {
//     setLimite(PAS_AFFICHAGE);
//   }, [recherche, categorieId, onglet, seulementDisponibles]);

//   // ✅ Handler du bouton "Rechercher" — recharge avec les dates validées
//   const lancerRecherche = async ({ dateDebut, dateFin }) => {
//     definirPeriode({ dateDebut, dateFin });
//     // chargerDisponibilites sera rappelé via useEffect car periode change
//   };

//   // ✅ Fonction calendrier (materiel | pack)
//   const chargerCalendrier = useCallback(async (type, code, moisISO) => {
//     // Délègue à CalendrierService (qui pointe sur /calendrier/materiel/:code ou /calendrier/pack/:code)
//     return CalendrierService.fabriquerChargeur(type, code)(moisISO);
//   }, []);

//   // Filtres locaux
//   const materielsFiltres = useMemo(() => {
//     return materiels.filter((m) => {
//       if (seulementDisponibles && Number(m.quantiteDisponible) <= 0) return false;
//       if (recherche && !materielCorrespond(m, recherche)) return false;
//       if (categorieId && !(m.categorieIds ?? []).includes(categorieId)) return false;
//       return true;
//     });
//   }, [materiels, recherche, categorieId, seulementDisponibles]);

//   const packsFiltres = useMemo(() => {
//     if (categorieId) return [];
//     return packs.filter((p) => {
//       if (seulementDisponibles && p.etatPack !== "disponible") return false;
//       if (recherche && !packCorrespond(p, recherche)) return false;
//       return true;
//     });
//   }, [packs, recherche, categorieId, seulementDisponibles]);

//   const afficherPacks = onglet !== "materiels";
//   const afficherMateriels = onglet !== "packs";
//   const aucunResultat =
//     !chargement &&
//     periodeValide &&
//     (!afficherPacks || !packsFiltres.length) &&
//     (!afficherMateriels || !materielsFiltres.length);

//   const ouvrirCalendrier = (type, code, titre) =>
//     setCalendrierCible({ code, titre, type });

//   return (
//     <div className="space-y-6">
//       <BarreRecherche
//         key={`${periode.dateDebut}|${periode.dateFin}`}
//         termeInitial={recherche}
//         periodeInitiale={periode}
//         onRechercher={lancerRecherche}
//       />

//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div role="tablist" className="tabs tabs-box">
//           {ONGLETS.map((o) => (
//             <button
//               key={o.valeur}
//               type="button"
//               role="tab"
//               className={`tab ${onglet === o.valeur ? "tab-active" : ""}`}
//               onClick={() => setOnglet(o.valeur)}
//             >
//               {o.libelle}
//             </button>
//           ))}
//         </div>

//         <div className="flex flex-wrap items-center gap-3">
//           <label
//             className={`label cursor-pointer gap-2 text-sm ${
//               periodeValide ? "" : "opacity-50"
//             }`}
//           >
//             <input
//               type="checkbox"
//               className="toggle toggle-primary toggle-sm"
//               checked={seulementDisponibles}
//               disabled={!periodeValide}
//               onChange={(e) => setSeulementDisponibles(e.target.checked)}
//             />
//             Disponibles uniquement
//           </label>
//         </div>
//       </div>

//       {!periodeValide && (
//         <p className="text-sm text-base-content/60">
//           Choisissez une période puis cliquez sur « Rechercher » pour afficher
//           la disponibilité des articles.
//         </p>
//       )}

//       <MessageErreur message={erreur} onReessayer={chargerDisponibilites} />
//       {chargement && <Chargement message="Chargement du catalogue…" />}

//       {afficherPacks && packsFiltres.length > 0 && (
//         <section className="space-y-3">
//           <h2 className="text-xl font-bold">Packs ({packsFiltres.length})</h2>
//           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//             {packsFiltres.map((pack) => (
//               <CartePack
//                 key={pack.codePack}
//                 pack={pack}
//                 disponibilite={{
//                   statut:
//                     pack.etatPack === "disponible"
//                       ? STATUT.DISPONIBLE
//                       : STATUT.INDISPONIBLE,
//                   quantiteDisponible: pack.quantiteDisponible,
//                   etatPack: pack.etatPack,
//                 }}
//                 onVoirCalendrier={() =>
//                   ouvrirCalendrier("pack", pack.codePack, pack.libelle)
//                 }
//               />
//             ))}
//           </div>
//         </section>
//       )}

//       {afficherMateriels && materielsFiltres.length > 0 && (
//         <section className="space-y-3">
//           <h2 className="text-xl font-bold">
//             Matériels ({materielsFiltres.length})
//           </h2>
//           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//             {materielsFiltres.slice(0, limite).map((materiel) => (
//               <CarteMateriel
//                 key={materiel.CodeMateriel}
//                 materiel={materiel}
//                 disponibilite={{
//                   statut:
//                     Number(materiel.quantiteDisponible) > 0
//                       ? STATUT.DISPONIBLE
//                       : STATUT.INDISPONIBLE,
//                   quantiteDisponible: Number(materiel.quantiteDisponible ?? 0),
//                 }}
//                 onVoirCalendrier={() =>
//                   ouvrirCalendrier(
//                     "materiel",
//                     materiel.CodeMateriel,
//                     materiel.designation,
//                   )
//                 }
//               />
//             ))}
//           </div>
//           {materielsFiltres.length > limite && (
//             <div className="text-center">
//               <button
//                 type="button"
//                 className="btn btn-outline"
//                 onClick={() => setLimite((l) => l + PAS_AFFICHAGE)}
//               >
//                 Afficher plus
//               </button>
//             </div>
//           )}
//         </section>
//       )}

//       {aucunResultat && (
//         <EtatVide
//           Icone={SearchX}
//           titre="Aucun résultat"
//           message="Essayez un autre mot-clé, une autre catégorie ou d'autres dates."
//         />
//       )}

//       <ModalCalendrier
//         cible={
//           calendrierCible
//             ? {
//                 ...calendrierCible,
//                 chargerMois: (moisISO) =>
//                   chargerCalendrier(
//                     calendrierCible.type,
//                     calendrierCible.code,
//                     moisISO,
//                   ),
//               }
//             : null
//         }
//         periode={periode}
//         onFermer={() => setCalendrierCible(null)}
//       />
//     </div>
//   );
// }
