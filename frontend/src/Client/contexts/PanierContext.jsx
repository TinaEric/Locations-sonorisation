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
import { useFilter } from "./FilterContext";
import { nombreDeJours } from "../utils/formatage";
import { calculerTotaux } from "../utils/tarification";
import { ReservationService } from "../../data/reservationService";
import { extraireMessageErreur } from "../utils/erreurs";

const CLE_STOCKAGE = "panier_client";
const ETAT_INITIAL = { lignes: [] };

const lireStockage = () => {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return ETAT_INITIAL;
    const parsed = JSON.parse(brut);
    return { lignes: Array.isArray(parsed?.lignes) ? parsed.lignes : [] };
  } catch {
    return ETAT_INITIAL;
  }
};

const PanierContext = createContext(null);

export function PanierProvider({ children }) {
  const { periode, periodeValide, nbJours } = useFilter();
  const [etat, setEtat] = useState(lireStockage);
  const [ouvreDateModal, setOuvreDateModal] = useState(false);

  // action en attente : { executer, article, type }
  const actionEnAttente = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify({ lignes: etat.lignes }));
    } catch {
      /* quota */
    }
  }, [etat]);

  const datesCompletes = Boolean(periode.dateDebut && periode.dateFin);

  // ------------------------------------------------------------
  // AJOUTS
  // ------------------------------------------------------------
  const ajouterLigne = useCallback((nouvelleLigne) => {
    setEtat((prev) => {
      const existante = prev.lignes.find((l) => l.code === nouvelleLigne.code);
      const lignes = existante
        ? prev.lignes.map((l) =>
            l.code === nouvelleLigne.code
              ? { ...l, quantite: l.quantite + nouvelleLigne.quantite }
              : l,
          )
        : [...prev.lignes, nouvelleLigne];
      return { ...prev, lignes };
    });
  }, []);

  const ajouterMaterielBrut = useCallback(
    (materiel, quantite = 1) => {
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
    [ajouterLigne],
  );

  const ajouterPackBrut = useCallback(
    (pack, quantite = 1) => {
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

      // ✅ Ajout (pas remplacement) : on peut avoir pack + matériels
      ajouterLigne(lignePack);
      return { ok: true };
    },
    [ajouterLigne],
  );

  const ajouterAvecDates = useCallback((action, article) => {
    actionEnAttente.current = { executer: action, article };
    setOuvreDateModal(true);
  }, []);

  const ajouterMateriel = useCallback(
    (materiel, quantite = 1) => {
      if (!datesCompletes) {
        ajouterAvecDates(
          () => ajouterMaterielBrut(materiel, quantite),
          {
            type: "materiel",
            code: materiel.CodeMateriel,
            designation: materiel.designation,
            quantite,
          },
        );
        return { ok: false, raison: "dates_requises" };
      }
      return ajouterMaterielBrut(materiel, quantite);
    },
    [datesCompletes, ajouterAvecDates, ajouterMaterielBrut],
  );

  const ajouterPack = useCallback(
    (pack, quantite = 1) => {
      if (!datesCompletes) {
        ajouterAvecDates(
          () => ajouterPackBrut(pack, quantite),
          {
            type: "pack",
            code: pack.codePack,
            designation: pack.libelle,
            quantite,
          },
        );
        return { ok: false, raison: "dates_requises" };
      }
      return ajouterPackBrut(pack, quantite);
    },
    [datesCompletes, ajouterAvecDates, ajouterPackBrut],
  );

  // ------------------------------------------------------------
  // CALCUL GLOBAL DES BESOINS PAR MATÉRIEL
  // Somme : matériels directs + composants de packs (× quantité pack)
  // ------------------------------------------------------------
  const calculerBesoins = useCallback((lignes) => {
    const besoins = new Map(); // codeMateriel -> quantité totale demandée

    for (const ligne of lignes) {
      if (ligne.type === "materiel") {
        const code = ligne.code;
        besoins.set(code, (besoins.get(code) ?? 0) + ligne.quantite);
      } else if (ligne.type === "pack") {
        for (const c of ligne.composants ?? []) {
          if (!c.codeMateriel) continue;
          besoins.set(
            c.codeMateriel,
            (besoins.get(c.codeMateriel) ?? 0) +
              c.quantite * ligne.quantite,
          );
        }
      }
    }
    return besoins;
  }, []);

  // ------------------------------------------------------------
  // VÉRIFICATION GLOBALE — un seul appel, tous les codes agrégés
  // ------------------------------------------------------------
  const verifierDisponibiliteGlobale = useCallback(
    async (lignes, periodeVerif) => {
      const besoins = calculerBesoins(lignes);
      if (besoins.size === 0) return { ok: true };

      try {
        const reponseMateriels = await ReservationService.materielDispo({
          dateDebut: periodeVerif.dateDebut,
          dateFin: periodeVerif.dateFin,
        });

        // Index : codeMateriel -> quantiteDisponible
        const dispoParCode = new Map();
        const parcourir = (noeud) => {
          if (Array.isArray(noeud)) {
            noeud.forEach(parcourir);
            return;
          }
          if (!noeud || typeof noeud !== "object") return;
          const code = noeud.CodeMateriel ?? noeud.codeMateriel;
          if (code) {
            dispoParCode.set(code, Number(noeud.quantiteDisponible ?? 0));
          }
          parcourir(noeud.materiels);
          parcourir(noeud.enfants);
        };
        parcourir(reponseMateriels);

        const erreurs = [];
        for (const [code, demande] of besoins) {
          const libre = dispoParCode.get(code);
          if (libre == null) {
            erreurs.push(`${code} : stock inconnu`);
          } else if (demande > libre) {
            erreurs.push(
              `${code} : ${demande} demandé(s), ${libre} disponible(s)`,
            );
          }
        }

        if (erreurs.length) {
          return {
            ok: false,
            raison: `Stock insuffisant : ${erreurs.join(" ; ")}`,
            details: erreurs,
          };
        }
        return { ok: true };
      } catch (e) {
        return {
          ok: false,
          raison: extraireMessageErreur(
            e,
            "Impossible de vérifier la disponibilité.",
          ),
        };
      }
    },
    [calculerBesoins],
  );

  // ------------------------------------------------------------
  // Validation des dates (appelée par DatesModal)
  // - enregistre la période côté FilterContext
  // - vérifie la dispo GLOBALE du panier + de l'article en attente
  // - exécute l'action
  // ------------------------------------------------------------
  const finaliserDates = useCallback(
    async (periodeNouvelle) => {
      const enAttente = actionEnAttente.current;
      actionEnAttente.current = null;
      setOuvreDateModal(false);

      // 1. Simulation du panier avec l'article en attente pour vérif globale
      let lignesSimulees = [...etat.lignes];
      if (enAttente?.article) {
        // On ajoute un "fantôme" de la ligne pour inclure ses besoins
        const art = enAttente.article;
        if (art.type === "materiel") {
          lignesSimulees = [
            ...lignesSimulees,
            { type: "materiel", code: art.code, quantite: art.quantite },
          ];
        } else {
          // Pack : il faut ses composants → on les récupère dans l'objet article
          // (l'article doit exposer composants ; sinon, la vérif les obtiendra
          //  via le back au moment de l'ajout réel)
          lignesSimulees = [
            ...lignesSimulees,
            {
              type: "pack",
              code: art.code,
              quantite: art.quantite,
              composants: art.composants ?? [],
            },
          ];
        }
      }

      // 2. Vérification globale
      const verif = await verifierDisponibiliteGlobale(
        lignesSimulees,
        periodeNouvelle,
      );
      if (!verif.ok) {
        return { ok: false, raison: verif.raison, details: verif.details };
      }

      // 3. Dispo OK → exécuter l'action
      if (enAttente?.executer) enAttente.executer();

      return { ok: true, article: enAttente?.article };
    },
    [etat.lignes, verifierDisponibiliteGlobale],
  );

  const annulerDates = useCallback(() => {
    actionEnAttente.current = null;
    setOuvreDateModal(false);
  }, []);

  // ------------------------------------------------------------
  // MUTATIONS
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // VALEUR EXPOSÉE
  // ------------------------------------------------------------
  const valeur = useMemo(() => {
    return {
      // état panier
      lignes: etat.lignes,
      nombreArticles: etat.lignes.reduce((s, l) => s + l.quantite, 0),
      totaux: calculerTotaux(etat.lignes, nbJours),
      nbJours,
      periode,              // ← vient de FilterContext
      periodeValide,
      datesCompletes,

      // actions
      ajouterMateriel,
      ajouterPack,
      modifierQuantite,
      retirerLigne,
      viderPanier,

      // modal dates
      ouvreDateModal,
      setOuvreDateModal,
      finaliserDates,
      annulerDates,

      // helpers
      calculerBesoins,
    };
  }, [
    etat.lignes,
    nbJours,
    periode,
    periodeValide,
    datesCompletes,
    ajouterMateriel,
    ajouterPack,
    modifierQuantite,
    retirerLigne,
    viderPanier,
    ouvreDateModal,
    finaliserDates,
    annulerDates,
    calculerBesoins,
  ]);

  return (
    <PanierContext.Provider value={valeur}>{children}</PanierContext.Provider>
  );
}

export function usePanier() {
  const ctx = useContext(PanierContext);
  if (!ctx)
    throw new Error("usePanier doit être utilisé dans un PanierProvider");
  return ctx;
}