// Client/contexts/PanierContext.jsx
// Panier + période de location (source unique pour la recherche, le panier et la réservation).
// Un panier contient soit UN pack, soit des matériels (limite du CreateReservationDto).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
    } catch {
      /* quota ou navigation privée : le panier reste en mémoire */
    }
  }, [etat]);

  const modePanier = etat.lignes[0]?.type ?? null; // "pack" | "materiel" | null

  const definirPeriode = useCallback((periode) => {
    setEtat((prev) => ({ ...prev, periode: { dateDebut: periode.dateDebut, dateFin: periode.dateFin } }));
  }, []);

  const ajouterLigne = useCallback((nouvelleLigne, remplacerSiExiste = false) => {
    setEtat((prev) => {
      const existante = prev.lignes.find((l) => l.code === nouvelleLigne.code);
      const lignes = existante
        ? prev.lignes.map((l) =>
            l.code === nouvelleLigne.code
              ? { ...l, quantite: remplacerSiExiste ? nouvelleLigne.quantite : l.quantite + nouvelleLigne.quantite }
              : l,
          )
        : [...prev.lignes, nouvelleLigne];
      return { ...prev, lignes };
    });
  }, []);

  const ajouterMateriel = useCallback(
    (materiel, quantite = 1) => {
      if (modePanier === "pack") {
        return { ok: false, raison: "Votre panier contient un pack. Videz-le pour réserver du matériel à l'unité." };
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

  const ajouterPack = useCallback(
    (pack, quantite = 1) => {
      if (modePanier === "materiel") {
        return { ok: false, raison: "Votre panier contient du matériel. Videz-le pour réserver un pack." };
      }
      // Un seul pack par réservation : on remplace l'éventuel pack précédent
      setEtat((prev) => ({
        ...prev,
        lignes: [
          {
            type: "pack",
            code: pack.codePack,
            designation: pack.libelle,
            image: pack.photos,
            prixUnitaire: Number(pack.tarifJournalier),
            prixCaution: Number(pack.prixCaution),
            quantite,
          },
        ],
      }));
      return { ok: true };
    },
    [modePanier],
  );

  const modifierQuantite = useCallback((code, quantite) => {
    const valeur = Math.max(1, Number(quantite) || 1);
    setEtat((prev) => ({
      ...prev,
      lignes: prev.lignes.map((l) => (l.code === code ? { ...l, quantite: valeur } : l)),
    }));
  }, []);

  const retirerLigne = useCallback((code) => {
    setEtat((prev) => ({ ...prev, lignes: prev.lignes.filter((l) => l.code !== code) }));
  }, []);

  const viderPanier = useCallback(() => {
    setEtat((prev) => ({ ...prev, lignes: [] }));
  }, []);

  const valeur = useMemo(() => {
    const nbJours = nombreDeJours(etat.periode.dateDebut, etat.periode.dateFin);
    return {
      lignes: etat.lignes,
      periode: etat.periode,
      periodeValide: nbJours > 0,
      nbJours,
      modePanier,
      nombreArticles: etat.lignes.reduce((somme, l) => somme + l.quantite, 0),
      totaux: calculerTotaux(etat.lignes, nbJours),
      definirPeriode,
      ajouterMateriel,
      ajouterPack,
      modifierQuantite,
      retirerLigne,
      viderPanier,
    };
  }, [etat, modePanier, definirPeriode, ajouterMateriel, ajouterPack, modifierQuantite, retirerLigne, viderPanier]);

  return <PanierContext.Provider value={valeur}>{children}</PanierContext.Provider>;
}

export function usePanier() {
  const contexte = useContext(PanierContext);
  if (!contexte) throw new Error("usePanier doit être utilisé à l'intérieur d'un PanierProvider");
  return contexte;
}
