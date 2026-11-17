// src/Client/components/catalogue/DateDispoBar.jsx
import { useState } from "react";
import { CalendarDays, Search, RotateCcw } from "lucide-react";
import { useNavbar } from "../../contexts/NavbarContext";
import { todayISO } from "../../../utils/format";

export default function DateFiltre() {
  const {
    dateDebut,
    setDateDebut,
    dateFin,
    setDateFin,
    reset,
  } = useNavbar();

  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!dateDebut || !dateFin) {
      setError("Veuillez sélectionner les deux dates.");
      return;
    }
    if (dateFin < dateDebut) {
      setError("La date de fin doit être ≥ à la date de début.");
      return;
    }
  };
 const dateNow = todayISO()
  const onReset = () => {
    reset();
    setError("");
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-base-300 bg-base-100 px-5 py-4 shadow-sm sm:px-6 sm:py-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-lg bg-accent/10 text-accent">
          <CalendarDays size={18} />
        </span>
        <div>
          <p className="font-semibold">Vos dates de location</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 ">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Date Début</span>
          <input
            type="date"
            value={dateDebut || ""}
            min={dateNow}
            onChange={(e) => {
              setDateDebut(e.target.value);
              setError("");
            }}
            className="w-full rounded-xl border border-base-300 px-4 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Date Fin</span>
          <input
            type="date"
            value={dateFin || ""}
            min={dateDebut || undefined}
            onChange={(e) => {
              setDateFin(e.target.value);
              setError("");
            }}
            className="w-full rounded-xl border border-base-300 px-4 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <div className="flex">
            <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-semibold text-white transition hover:brightness-95 w-full"
            >
                <Search size={16} />
                Appliquer
            </button>

            <button
                type="button"
                onClick={onReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-accent px-5 py-2.5 font-semibold text-accent transition hover:bg-accent/10 w-full"
            >
                <RotateCcw size={16} />
                Effacer
            </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      )}
    </form>
  );
}