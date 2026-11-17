import { createContext, useCallback, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "sono:recherche";
const SearchContext = createContext(null);

function load() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

/** Conserve les dates de l'événement (début, fin) pour toutes les pages. */
export function SearchProvider({ children }) {
  const [dates, setDates] = useState(() => {
    const saved = load();
    return { dateDebut: saved.dateDebut ?? "", dateFin: saved.dateFin ?? "" };
  });

  const updateDates = useCallback((next) => {
    setDates(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const value = useMemo(
    () => ({ ...dates, hasDates: Boolean(dates.dateDebut && dates.dateFin), updateDates }),
    [dates, updateDates]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch doit être utilisé dans <SearchProvider>");
  return ctx;
}
