// Client/components/commun/SelecteurPeriode.jsx
import { CalendarDays } from "lucide-react";
import { aujourdhuiISO } from "../../utils/formatage";

export default function SelecteurPeriode({ dateDebut, dateFin, onChange, className = "" }) {
  const minimum = aujourdhuiISO();

  const changerDebut = (valeur) => {
    // Si la fin précède le nouveau début, on l'aligne
    const fin = dateFin && valeur && dateFin < valeur ? valeur : dateFin;
    onChange({ dateDebut: valeur, dateFin: fin });
  };

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <label className="form-control">
        <span className="mb-1 flex items-center gap-1 text-xs font-medium text-base-content/70">
          <CalendarDays className="size-3.5" /> Du
        </span>
        <input
          type="date"
          className="input input-bordered w-full"
          min={minimum}
          value={dateDebut}
          onChange={(e) => changerDebut(e.target.value)}
        />
      </label>
      <label className="form-control">
        <span className="mb-1 flex items-center gap-1 text-xs font-medium text-base-content/70">
          <CalendarDays className="size-3.5" /> Au
        </span>
        <input
          type="date"
          className="input input-bordered w-full"
          min={dateDebut || minimum}
          value={dateFin}
          onChange={(e) => onChange({ dateDebut, dateFin: e.target.value })}
        />
      </label>
    </div>
  );
}
