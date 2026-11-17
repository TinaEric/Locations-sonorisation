import { useCart } from "../../contexts/CartContext";

/**
 * SEUL point de contact entre le catalogue et votre CartContext.
 * On sait que CartContext expose `itemCount` et `setPanierOuvert` (vu dans NavBar).
 * Les noms des fonctions d'ajout ne sont pas connus : adaptez les listes ci-dessous
 * au nom réel dans votre CartContext.
 */
const NOMS_AJOUT_PACK = ["ajouterPack", "addPack", "ajouterAuPanier", "addToCart"];
const NOMS_AJOUT_MATERIEL = ["ajouterMateriel", "addMateriel", "ajouterAuPanier", "addItem", "addToCart"];

export function useCartAdapter() {
  const cart = useCart();

  const appeler = (noms, ...args) => {
    const fn = noms.map((n) => cart?.[n]).find((f) => typeof f === "function");
    if (!fn) {
      console.warn(`[catalogue] Aucune fonction d'ajout trouvée dans CartContext parmi : ${noms.join(", ")}`);
      return false;
    }
    fn(...args);
    return true;
  };

  return {
    addPack(pack) {
      const ok = appeler(NOMS_AJOUT_PACK, pack);
      cart?.setPanierOuvert?.(true);
      return ok;
    },
    addMateriel(materiel, quantite = 1) {
      return appeler(NOMS_AJOUT_MATERIEL, materiel, quantite);
    },
  };
}
