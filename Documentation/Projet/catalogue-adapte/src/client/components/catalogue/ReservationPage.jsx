import { useEffect, useState } from "react";
import { CalendarDays, PartyPopper, RotateCcw } from "lucide-react";

import { useNavbar } from "../../contexts/NavbarContext";
import { PackService } from "../../../data/PackService";
import PacksTab from "./PacksTab";
import MaterielTab from "./MaterielTab";
import { nbJours } from "./format";

const versOption = (t) => (typeof t === "object" ? { value: t.id, label: t.libelle } : { value: t, label: t });
const field = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

/**
 * Page « /reservation » : reprend les dates et le type d'événement saisis dans FilterBar (NavbarContext)
 * et affiche deux onglets : Packs / Matériel à la carte.
 */
export default function ReservationPage() {
  const { dateDebut, setDateDebut, dateFin, setDateFin, typeEvent, setTypeEvent, resetValue } = useNavbar();
  const [tab, setTab] = useState("packs");
  const [types, setTypes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let actif = true;
    PackService.getTypeEvenement()
      .then((r) => actif && setTypes(Array.isArray(r) ? r : []))
      .catch(() => actif && setTypes([]));
    return () => { actif = false; };
  }, []);

  const changeDebut = (v) => {
    setDateDebut(v);
    if (dateFin && dateFin < v) setDateFin(v);
    setError("");
  };
  const changeFin = (v) => {
    if (dateDebut && v < dateDebut) return setError("La date de fin doit être postérieure ou égale à la date de début.");
    setDateFin(v);
    setError("");
  };

  const jours = nbJours(dateDebut, dateFin);
  const tabClass = (id) =>
    `border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
      tab === id ? "border-accent text-accent" : "border-transparent text-slate-500 hover:text-slate-800"
    }`;

  return (
    // pt-24 : la NavBar est fixe (h-16)
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <label className="block text-sm font-semibold text-slate-700">
            <span className="mb-1.5 flex items-center gap-2"><CalendarDays size={16} className="text-accent" /> Date de début</span>
            <input type="date" value={dateDebut || ""} onChange={(e) => changeDebut(e.target.value)} className={field} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            <span className="mb-1.5 flex items-center gap-2"><CalendarDays size={16} className="text-accent" /> Date de fin</span>
            <input type="date" value={dateFin || ""} min={dateDebut || undefined} onChange={(e) => changeFin(e.target.value)} className={field} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            <span className="mb-1.5 flex items-center gap-2"><PartyPopper size={16} className="text-accent" /> Type d'événement</span>
            <select value={typeEvent || ""} onChange={(e) => setTypeEvent(e.target.value)} className={field}>
              <option value="">Tous les événements</option>
              {types.map(versOption).map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => { resetValue(); setError(""); }} className="btn btn-outline btn-accent">
            <RotateCcw size={16} /> Réinitialiser
          </button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        {jours > 0 && !error && <p className="mt-3 text-sm text-slate-500">{jours} jour{jours > 1 ? "s" : ""}</p>}
        {!dateDebut && !dateFin && (
          <p className="mt-3 text-sm text-slate-500">
            Saisissez vos dates pour ne voir que ce qui est disponible. La disponibilité est confirmée après le choix des heures.
          </p>
        )}
      </div>

      <div className="mt-6 flex border-b border-slate-200" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "packs"} onClick={() => setTab("packs")} className={tabClass("packs")}>Packs</button>
        <button type="button" role="tab" aria-selected={tab === "materiel"} onClick={() => setTab("materiel")} className={tabClass("materiel")}>Matériel à la carte</button>
      </div>

      <div className="mt-6">
        {tab === "packs" ? (
          <PacksTab dateDebut={dateDebut} dateFin={dateFin} typeEvent={typeEvent} onSwitchToMateriel={() => setTab("materiel")} />
        ) : (
          <MaterielTab dateDebut={dateDebut} dateFin={dateFin} onSwitchToPacks={() => setTab("packs")} />
        )}
      </div>
    </div>
  );
}
