// Client/contexts/FilterContext.jsx
// Gère la période (dates), la recherche et les filtres du catalogue.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { nombreDeJours } from "../utils/formatage";

const CLE_PERIODE = "filtre_periode";
const PERIODE_VIDE = { dateDebut: "", dateFin: "" };

const lirePeriode = () => {
  try {
    const brut = localStorage.getItem(CLE_PERIODE);
    return brut ? { ...PERIODE_VIDE, ...JSON.parse(brut) } : PERIODE_VIDE;
  } catch {
    return PERIODE_VIDE;
  }
};

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [periode, setPeriode] = useState(lirePeriode);
  const [recherche, setRecherche] = useState("");       // texte libre
  const [categorieId, setCategorieId] = useState("");   // id catégorie
  const [onglet, setOnglet] = useState("tout");         // tout | materiels | packs
  const [seulementDisponibles, setSeulementDisponibles] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CLE_PERIODE, JSON.stringify(periode));
    } catch {
      /* quota */
    }
  }, [periode]);

  const definirPeriode = useCallback((p) => {
    setPeriode({
      dateDebut: p?.dateDebut ?? "",
      dateFin: p?.dateFin ?? "",
    });
  }, []);

  const reinitialiser = useCallback(() => {
    setRecherche("");
    setCategorieId("");
    setOnglet("tout");
    setSeulementDisponibles(false);
  }, []);

  const periodeValide = nombreDeJours(periode.dateDebut, periode.dateFin) > 0;
  const datesCompletes = Boolean(periode.dateDebut && periode.dateFin);
  const nbJours = nombreDeJours(periode.dateDebut, periode.dateFin);

  const valeur = useMemo(
    () => ({
      periode,
      periodeValide,
      datesCompletes,
      nbJours,
      definirPeriode,

      recherche,
      setRecherche,
      categorieId,
      setCategorieId,
      onglet,
      setOnglet,
      seulementDisponibles,
      setSeulementDisponibles,
      reinitialiser,
    }),
    [
      periode,
      periodeValide,
      datesCompletes,
      nbJours,
      definirPeriode,
      recherche,
      categorieId,
      onglet,
      seulementDisponibles,
      reinitialiser,
    ],
  );

  return (
    <FilterContext.Provider value={valeur}>{children}</FilterContext.Provider>
  );
}

export function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx)
    throw new Error("useFilter doit être utilisé dans un FilterProvider");
  return ctx;
}