import { createContext, useContext, useMemo, useState } from "react";

const FiltreContext = createContext(null);

export function FiltreProvider({ children }) {
  const [dateDebut, setDateDebut] = useState(null);
  const [dateFin, setDateFin] = useState(null);
  const [recherche, setRecherche] = useState("");


  const datesCompletes = Boolean(dateDebut && dateFin);

  const value = useMemo(
    () => ({
      dateDebut,
      dateFin,
      recherche,
      datesCompletes,
      setDateDebut,
      setDateFin,
      setRecherche,
      reset: () => {
        setDateDebut(null);
        setDateFin(null);
        setRecherche("");
      },
    }),
    [dateDebut, dateFin, datesCompletes, recherche]
  );

  return (
    <FiltreContext.Provider value={value}>{children}</FiltreContext.Provider>
  );
}

export const useFiltre = () => {
  const ctx = useContext(FiltreContext);
  if (!ctx)
    throw new Error("useFiltre doit être utilisé dans un FiltreProvider");
  return ctx;
};