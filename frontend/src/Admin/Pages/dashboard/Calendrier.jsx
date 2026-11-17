import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";

import {
  ArrowUpRight, ArrowDownRight, Calendar, Clock, DollarSign, Package,
  TrendingUp, Truck, Users, AlertTriangle, RefreshCcw, CheckCircle2, ChevronLeft, ChevronRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import DataState from "../../components/DataState";
import StatusBadge from "../../components/StatusBadge";
import { formatMoney } from "../../../utils/format";
import { asList } from "../../hooks/useFetch";
import { ReservationService } from "../../../data/reservationService";
import { STATUT_LOCATION } from "../../../utils/statutValue";


// --- COMPOSANT CALENDRIER RÉSERVATIONS ---
function ReservationCalendar({ reservations }) {

  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDay = getDay(startOfMonth(currentMonth)); // 0 = Dimanche
  const emptyDays = Array(startDay === 0 ? 6 : startDay - 1).fill(null); // Ajustement pour commencer le lundi

  const getReservationsForDay = (day) => {
    return reservations.filter(r => {
      if (!r.dateDebutPrevue || !r.dateFinPrevue) return false;
      const start = new Date(r.dateDebutPrevue);
      const end = new Date(r.dateFinPrevue);
      // La réservation couvre la journée si elle est entre le début et la fin
      return day >= new Date(start.setHours(0,0,0,0)) && day <= new Date(end.setHours(23,59,59,999));
    });
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar size={18} className="text-primary" /> Calendrier des réservations
          </h2>
          <div className="flex items-center gap-2">
            <button className="btn btn-sm btn-ghost btn-square" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium capitalize w-32 text-center">{format(currentMonth, "MMMM yyyy", { locale: fr })}</span>
            <button className="btn btn-sm btn-ghost btn-square" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => (
            <div key={d} className="text-xs font-semibold text-base-content/50 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, i) => <div key={`empty-${i}`} className="h-16 rounded bg-base-200/30" />)}
          {daysInMonth.map((day, i) => {
            const dayRes = getReservationsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className={`h-16 rounded border p-1 flex flex-col overflow-hidden text-xs ${isToday ? 'border-primary bg-primary/5' : 'border-base-200'}`}>
                <span className={`font-medium ${isToday ? 'text-primary' : 'text-base-content/70'}`}>{format(day, "d")}</span>
                <div className="flex-1 overflow-y-auto space-y-0.5 mt-1 scrollbar-hide">
                  {dayRes.slice(0, 2).map(r => (
                    <div key={r.numReservation} className="bg-primary/20 text-primary rounded px-1 truncate text-[10px]" title={r.utilisateur?.nomComplet}>
                      {r.utilisateur?.nomComplet?.split(" ")[0]}
                    </div>
                  ))}
                  {dayRes.length > 2 && <div className="text-[10px] text-base-content/50 text-center">+{dayRes.length - 2}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- COMPOSANT CALENDRIER DISPONIBILITÉ MATÉRIEL ---
function MaterialAvailabilityCalendar({ reservations }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  const startDay = getDay(startOfMonth(currentMonth));
  const emptyDays = Array(startDay === 0 ? 6 : startDay - 1).fill(null);

  // Compter les locations par jour
  const getActivityLevel = (day) => {
    let count = 0;
    reservations.forEach(r => {
      if (r.statutLocation === "ANNULEE") return;
      const start = new Date(r.dateDebutPrevue);
      const end = new Date(r.dateFinPrevue);
      if (day >= new Date(start.setHours(0,0,0,0)) && day <= new Date(end.setHours(23,59,59,999))) {
        count += (r.ligneLocations?.reduce((s, l) => s + l.quantite, 0) || 1);
      }
    });
    return count;
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Package size={18} className="text-secondary" /> Disponibilité Matériel
          </h2>
          <div className="flex items-center gap-2">
            <button className="btn btn-sm btn-ghost btn-square" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium capitalize w-32 text-center">{format(currentMonth, "MMMM yyyy", { locale: fr })}</span>
            <button className="btn btn-sm btn-ghost btn-square" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => (
            <div key={d} className="text-xs font-semibold text-base-content/50 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, i) => <div key={`empty-${i}`} className="h-12 rounded bg-base-200/30" />)}
          {daysInMonth.map((day, i) => {
            const activity = getActivityLevel(day);
            // Couleur en fonction de la charge (0 = vert, >10 = rouge)
            let bgClass = "bg-success/20 text-success-content";
            if (activity > 0 && activity <= 3) bgClass = "bg-success/40 text-success-content";
            else if (activity > 3 && activity <= 7) bgClass = "bg-warning/50 text-warning-content";
            else if (activity > 7) bgClass = "bg-error/60 text-error-content";

            return (
              <div key={i} className={`h-12 rounded flex flex-col items-center justify-center text-xs border border-base-200 ${activity > 0 ? bgClass : 'bg-base-100'}`} title={`${activity} matériel(s) loué(s)`}>
                <span className="font-medium">{format(day, "d")}</span>
                {activity > 0 && <span className="text-[10px] font-bold">{activity}</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-success/40"></div> Faible</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-warning/50"></div> Moyen</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-error/60"></div> Élevé</div>
        </div>
      </div>
    </div>
  );
}

export default function Calendrier() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ReservationService.list();
      setUsers(asList(loc))
    } catch (err) {
      setError("Impossible de charger les données du tableau de bord.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ReservationCalendar reservations={reservations} />
          <MaterialAvailabilityCalendar reservations={reservations} />
        </div>

    </div>
  )
}
