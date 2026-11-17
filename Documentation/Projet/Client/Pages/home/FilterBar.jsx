import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Search,
  RotateCcw,
  PartyPopper,
  Tag,
} from "lucide-react";

import { useNavbar } from "../../contexts/NavbarContext";
import { PackService } from "../../../data/PackService";
import { todayISO } from "../../../utils/format";
import { useToast } from "../../../contexts/ToastContext";

// Fallback local si l'endpoint n'est pas disponible
const CATEGORIES_FALLBACK = [
  { value: "conference", label: "Conférence" },
  { value: "soiree", label: "Soirée" },
  { value: "mariage", label: "Mariage" },
  { value: "concert", label: "Concert" },
];

const LIBELLES_CATEGORIE = {
  conference: "Conférence",
  soiree: "Soirée",
  mariage: "Mariage",
  concert: "Concert",
};

const FilterBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === "/";

  const {
    dateDebut,
    setDateDebut,
    dateFin,
    setDateFin,
    categoriePack,
    setCategoriePack,
    reset,
  } = useNavbar();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const dateNow = todayISO()
  const toast = useToast()
  const textPrimary = isHomePage ? "text-white" : "text-slate-800";
  const textSecondary = isHomePage ? "text-white/80" : "text-slate-500";
  const labelClass = isHomePage ? "text-white" : "text-slate-700";
  const fieldClass = isHomePage
    ? "border-white/30 bg-white/10 text-white placeholder:text-white/60"
    : "border-gray-200 bg-gray-50 text-slate-700";

  useEffect(() => {
    let alive = true;
    console.log("DATY: ", dateNow)
    setLoading(true);
    PackService.getCategories()
      .then((r) => {
        if (!alive) return;
        const list = Array.isArray(r) ? r : [];
        setCategories(
          list.length
            ? list.map((c) =>
                typeof c === "object"
                  ? { value: c, label: LIBELLES_CATEGORIE[c] ?? c }
                  : { value: c, label: LIBELLES_CATEGORIE[c] ?? c }
              )
            : CATEGORIES_FALLBACK
        );
      })
      .catch(() => {
        if (alive) setCategories(CATEGORIES_FALLBACK);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (dateFin < dateDebut || dateFin === null) {
      setDateFin(dateDebut)
    }
    console.log("dateFin: ",dateFin)
  }, [dateDebut]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    if (!dateDebut || !dateFin) {
      toast.warning("Veuillez sélectionner les dates de location.");
      setValidationError("Veuillez sélectionner les dates de location.");
      return;
    }
    if (dateFin < dateDebut) {
      setValidationError("La date de fin doit être postérieure ou égale à la date de début.");
      toast.warning("La date de fin doit être postérieure ou égale à la date de début.");
      return;
    }

    navigate("/reservation");
  };

  const handleReset = () => {
    reset();
    setValidationError("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full rounded-2xl p-5 transition-all duration-300 sm:p-6 ${
        isHomePage ? "bg-transparent shadow-none" : "bg-white shadow-xl"
      }`}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <PartyPopper size={21} />
        </div>
        <div>
          <h2 className={`text-lg font-bold ${textPrimary}`}>
            Trouvez votre pack
          </h2>
          <p className={`text-sm ${textSecondary}`}>
            Sélectionnez vos dates pour voir les packs disponibles
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Date de début */}
        <div>
          <label
            htmlFor="dateDebut"
            className={`mb-2 flex items-center gap-2 text-sm font-semibold ${labelClass}`}
          >
            <CalendarDays size={16} className="text-accent" />
            Date de début
          </label>
          <input
            id="dateDebut"
            type="date"
            value={dateDebut || ""}
            min={dateNow}
            onChange={(e) => {
              setDateDebut(e.target.value);
              setValidationError("");
            }}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 ${fieldClass}`}
          />
        </div>

        {/* Date de fin */}
        <div>
          <label
            htmlFor="dateFin"
            className={`mb-2 flex items-center gap-2 text-sm font-semibold ${labelClass}`}
          >
            <CalendarDays size={16} className="text-accent" />
            Date de fin
          </label>
          <input
            id="dateFin"
            type="date"
            value={dateFin || ""}
            min={dateDebut || undefined}
            onChange={(e) => {
              setDateFin(e.target.value);
              setValidationError("");
            }}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 ${fieldClass}`}
          />
        </div>

        {/* Catégorie de pack */}
        {/* <div className="md:col-span-2">
          <label
            htmlFor="categoriePack"
            className={`mb-2 flex items-center gap-2 text-sm font-semibold ${labelClass}`}
          >
            <Tag size={16} className="text-accent" />
            Catégorie de pack
          </label>
          <select
            id="categoriePack"
            value={categoriePack || ""}
            onChange={(e) => setCategoriePack(e.target.value)}
            disabled={loading}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60 ${fieldClass}`}
          >
            <option value="" className="bg-white text-slate-700">
              {loading ? "Chargement des catégories..." : "Toutes les catégories"}
            </option>
            {!loading &&
              categories.map(({ value, label }) => (
                <option
                  key={value}
                  value={value}
                  className="bg-white text-slate-700"
                >
                  {label}
                </option>
              ))}
          </select>
        </div> */}
      </div>

      {validationError && (
        <div role="alert" className="mt-2 text-sm text-red-600">
          {validationError}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-white shadow-md transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <Search size={18} />
          Rechercher
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={`flex items-center justify-center gap-2 rounded-xl border border-accent px-5 py-3 font-semibold transition hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/20 ${
            isHomePage ? "text-white" : "text-accent"
          }`}
        >
          <RotateCcw size={17} />
          Réinitialiser
        </button>
      </div>
    </form>
  );
};

export default FilterBar;