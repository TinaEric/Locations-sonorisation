import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "cart:v1";

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], dates: { dateDebut: null, dateFin: null } };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { items: [], dates: { dateDebut: null, dateFin: null } };
    }
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      dates:
        parsed.dates && typeof parsed.dates === "object"
          ? {
              dateDebut: parsed.dates.dateDebut ?? null,
              dateFin: parsed.dates.dateFin ?? null,
            }
          : { dateDebut: null, dateFin: null },
    };
  } catch {
    return { items: [], dates: { dateDebut: null, dateFin: null } };
  }
}

export function CartProvider({ children }) {
  const initial = useRef(loadInitialState()).current;
  const [panierOuvert, setPanierOuvert] = useState(false);
  const [items, setItems] = useState(initial.items);
  const [dates, setDates] = useState(initial.dates);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, dates }));
    } catch {
      /* quota dépassé / mode privé : ignoré */
    }
  }, [items, dates]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      const next = loadInitialState();
      setItems(next.items);
      setDates(next.dates);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = (item, type = "PACK") => {
    const code = item.code ?? item.codePack ?? item.CodeMateriel;
    if (!code) return false;

    let ok = true;

    setItems((prev) => {
      const aPack = prev.some((i) => i.type === "PACK");
      const aMateriel = prev.some((i) => i.type === "MATERIEL");

      if (type === "PACK") {
        if (aPack || aMateriel) {
          ok = false;
          return prev;
        }
        return [{ ...item, code, type: "PACK", quantite: 1 }];
      }

      if (aPack) {
        ok = false;
        return prev;
      }
      if (prev.find((i) => i.code === code)) {
        ok = false;
        return prev;
      }
      return [...prev, { ...item, code, type: "MATERIEL", quantite: 1 }];
    });

    return ok;
  };

  const removeItem = (code) => {
    setItems((prev) => prev.filter((i) => i.code !== code));
  };

  const updateItem = (code, patch) => {
    setItems((prev) =>
      prev.map((i) => (i.code === code ? { ...i, ...patch } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setDates({ dateDebut: null, dateFin: null });
  };

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const prix = item.tarifJournalier || item.prixLocation || 0;
        return sum + Number(prix) * Number(item.quantite || 1);
      }, 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((s, i) => s + Number(i.quantite || 1), 0),
    [items]
  );

  const hasPack = useMemo(() => items.some((i) => i.type === "PACK"), [items]);
  const hasMateriel = useMemo(
    () => items.some((i) => i.type === "MATERIEL"),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        dates,
        setDates,
        addItem,
        removeItem,
        updateItem,
        clearCart,
        panierOuvert,
        setPanierOuvert,
        total,
        itemCount,
        hasPack,
        hasMateriel,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans un CartProvider");
  return ctx;
};

// import { createContext, useContext, useState, useMemo } from "react";

// const CartContext = createContext(null);

// export function CartProvider({ children }) {
//   const [items, setItems] = useState([]);
//   const [panierOuvert, setPanierOuvert] = useState(false);
//   const [dates, setDates] = useState({ dateDebut: null, dateFin: null });

//   const addItem = (item, type = "PACK") => {
//     setItems((prev) => {
//       const exists = prev.find(
//         (i) => i.code === item.codePack || i.code === item.CodeMateriel
//       );
//       if (exists) return prev; // Éviter les doublons
//       return [...prev, { ...item, type, quantite: 1 }];
//     });
//   };

//   const removeItem = (code) => {
//     setItems((prev) => prev.filter((i) => i.code !== code));
//   };

//   const clearCart = () => {
//     setItems([]);
//     setDates({ dateDebut: null, dateFin: null });
//   };

//   const total = useMemo(() => {
//     return items.reduce((sum, item) => {
//       const prix = item.tarifJournalier || item.prixLocation || 0;
//       return sum + Number(prix) * item.quantite;
//     }, 0);
//   }, [items]);

//   const itemCount = items.length;

//   const values = {
//     items,
//     dates,
//     setDates,
//     addItem,
//     removeItem,
//     panierOuvert,
//     setPanierOuvert,
//     clearCart,
//     total,
//     itemCount,
//   };
//   return <CartContext.Provider value={values}>{children}</CartContext.Provider>;
// }

// export const useCart = () => {
//   const ctx = useContext(CartContext);
//   if (!ctx) throw new Error("useCart doit être utilisé dans un CartProvider");
//   return ctx;
// };
