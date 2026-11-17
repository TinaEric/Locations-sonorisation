import { createContext, useCallback, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

/**
 * Panier « Ma sélection » : un pack (facultatif) + lignes de matériel à la carte.
 * La persistance et la création du brouillon côté serveur se feront dans un futur commandeService.
 */
export function CartProvider({ children }) {
  const [pack, setPack] = useState(null);
  const [lignes, setLignes] = useState([]); // [{ materiel, quantite }]

  const choisirPack = useCallback((p) => setPack(p), []);
  const retirerPack = useCallback(() => setPack(null), []);

  const ajouterMateriel = useCallback((materiel, quantite = 1) => {
    setLignes((prev) => {
      const existing = prev.find((l) => l.materiel.id_materiel === materiel.id_materiel);
      const max = materiel.quantite_disponible ?? Infinity;
      if (existing) {
        return prev.map((l) =>
          l.materiel.id_materiel === materiel.id_materiel
            ? { ...l, quantite: Math.min(l.quantite + quantite, max) }
            : l
        );
      }
      return [...prev, { materiel, quantite: Math.min(quantite, max) }];
    });
  }, []);

  const retirerMateriel = useCallback(
    (id) => setLignes((prev) => prev.filter((l) => l.materiel.id_materiel !== id)),
    []
  );

  const vider = useCallback(() => {
    setPack(null);
    setLignes([]);
  }, []);

  const value = useMemo(() => {
    const sousTotalMateriel = lignes.reduce(
      (s, l) => s + (l.materiel.prix_location_unitaire ?? 0) * l.quantite,
      0
    );
    return {
      pack,
      lignes,
      count: (pack ? 1 : 0) + lignes.reduce((s, l) => s + l.quantite, 0),
      sousTotal: (pack?.prix_pour_dates ?? 0) + sousTotalMateriel,
      choisirPack,
      retirerPack,
      ajouterMateriel,
      retirerMateriel,
      vider,
    };
  }, [pack, lignes, choisirPack, retirerPack, ajouterMateriel, retirerMateriel, vider]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return ctx;
}
