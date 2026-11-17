import { createContext, useContext, useMemo, useState } from "react";

const NavbarContext = createContext(null);

export function NavbarProvider({ children }) {
  const [dateDebut, setDateDebut] = useState(null);
  const [dateFin, setDateFin] = useState(null);
  const [categoriePack, setCategoriePack] = useState("");


  const datesCompletes = Boolean(dateDebut && dateFin);

  const value = useMemo(
    () => ({
      dateDebut,
      dateFin,
      categoriePack,
      datesCompletes,
      setDateDebut,
      setDateFin,
      setCategoriePack,
      reset: () => {
        setDateDebut(null);
        setDateFin(null);
        setCategoriePack("");
      },
    }),
    [dateDebut, dateFin,datesCompletes, categoriePack]
  );

  return (
    <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>
  );
}

export const useNavbar = () => {
  const ctx = useContext(NavbarContext);
  if (!ctx)
    throw new Error("useNavbar doit être utilisé dans un NavbarProvider");
  return ctx;
};