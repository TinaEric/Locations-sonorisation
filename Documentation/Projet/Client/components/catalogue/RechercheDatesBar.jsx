import { CalendarDays } from "lucide-react";
import { useNavbar } from "../../contexts/NavbarContext";

export default function RechercheDatesBar() {
  const { dateDebut, dateFin, setDateDebut, setDateFin, datesCompletes } =
    useNavbar();

  return (
    <div className="border-b border-base-300 bg-base-100">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-3 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays size={18} className="text-accent" />
          Dates de location
        </div>

        <label className="form-control">
          <span className="label-text">Date début</span>

          <input
            type="date"
            className="input input-bordered input-sm"
            value={dateDebut}
            onChange={(event) => setDateDebut(event.target.value)}
          />
        </label>

        <label className="form-control">
          <span className="label-text">Date fin</span>

          <input
            type="date"
            className="input input-bordered input-sm"
            value={dateFin}
            onChange={(event) => setDateFin(event.target.value)}
          />
        </label>

        <div
          className={`alert py-2 text-sm ${
            datesCompletes ? "alert-success" : "alert-warning"
          }`}
        >
          {datesCompletes
            ? `Disponibilité vérifiée du ${dateDebut} au ${dateFin}.`
            : "Sélectionnez vos dates pour vérifier la disponibilité."}
        </div>
      </div>
    </div>
  );
}