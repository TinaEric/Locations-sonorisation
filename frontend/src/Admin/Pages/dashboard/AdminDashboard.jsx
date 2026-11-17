import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";

import {
  ArrowUpRight,Boxes,Tags, ArrowDownRight, Calendar, Clock, DollarSign, Package,
  TrendingUp, Truck, Users, AlertTriangle, RefreshCcw, CheckCircle2, ChevronLeft, ChevronRight,
  AudioLines  
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import DataState from "../../components/DataState";
import StatusBadge from "../../components/StatusBadge";
import { formatMoney } from "../../../utils/format";
import { asList } from "../../hooks/useFetch";
import { ReservationService } from "../../../data/reservationService";
import { STATUT_LOCATION } from "../../../utils/statutValue";
import { DashboardService } from "../../../data/dashboardService";

// --- SOUS-COMPOSANTS UI ---
function StatCard({ title, value, icon: Icon, trend, trendValue, colorClass = "text-primary", bgClass = "bg-primary/10" }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-base-content/60">{title}</p>
            <h3 className="mt-2 text-3xl font-bold">{value}</h3>
          </div>
          <div className={`rounded-xl p-3 ${bgClass} ${colorClass}`}><Icon size={24} /></div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1 text-sm">
            <span className={`flex items-center gap-0.5 font-medium ${trend === "up" ? "text-success" : "text-error"}`}>
              {trend === "up" ? <ArrowUpRight size={16} /> : <Package size={16} />}{trendValue}
            </span>
            <span className="text-base-content/50">vs mois dernier</span>
          </div>
        )}
      </div>
    </div>
  );
}
function StatCardMateriel({ value, colorClass = "text-primary", bgClass = "bg-primary/10" }) {
    return (
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-5">
          <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-base-content/60">Equipement</p>
                <div className="mt-4 flex items-center gap-1 text-sm">
                    <span className={`flex items-center gap-0.5 font-medium text-accent`}>
                    <Tags size={16} />{value.categories}
                    </span>
                    <span className="text-base-content/50">Catégories</span>
                </div>
                <div className="mt-4  flex items-center gap-1 text-sm">
                    <span className={`flex items-center gap-0.5 font-medium text-accent`}>
                    <Package size={16} />{value.materiels}
                    </span>
                    <span className="text-base-content/50">Matériels</span>
                </div>
                <div className="mt-4  flex items-center gap-1 text-sm">
                    <span className={`flex items-center gap-0.5 font-medium text-accent`}>
                    <Boxes size={16} />{value.packs}
                    </span>
                    <span className="text-base-content/50">Packs</span>
                </div>
            </div>
            <div className={`rounded-xl p-3 ${bgClass} ${colorClass}`}><AudioLines   size={24} /></div>
          </div>
        </div>
      </div>
    );
  }

function AlertCard({ title, count, icon: Icon, linkTo, colorClass, bgClass }) {
  return (
    <Link to={linkTo} className="flex items-center gap-4 rounded-xl border border-base-200 bg-base-100 p-4 transition hover:border-primary/30 hover:shadow-md">
      <div className={`rounded-lg p-3 ${bgClass} ${colorClass}`}><Icon size={22} /></div>
      <div className="flex-1"><p className="text-sm font-medium text-base-content/60">{title}</p><p className="text-xl font-bold">{count}</p></div>
      <ArrowUpRight size={18} className="text-base-content/30" />
    </Link>
  );
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";


// --- COMPOSANT PRINCIPAL ---
export default function AdminDashboard() {
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);
  const [equipement, setEquipement] = useState({ categories: 0, materiels: 0, items: 0, packs: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ReservationService.list();
      const loc = await DashboardService.users();
      const mat = await DashboardService.statsMateriel();
      setUsers(asList(loc))
      setEquipement(mat ?? { categories: 0, materiels: 0, items: 0, packs : 0})
      setReservations(asList(res));
    } catch (err) {
      setError("Impossible de charger les données du tableau de bord.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- CALCULS DES DONNÉES ---
  const stats = useMemo(() => {
    let chiffreAffaire = 0, enAttente = 0, enCours = 0, confirmees = 0, terminees = 0;
    const parDate = {};
    const parMois = {};
    const parMateriel = {};

    reservations.forEach((r) => {
      if (["CONFIRMEE", "EN_COURS", "TERMINEE"].includes(r.statutLocation)) {
        chiffreAffaire += Number(r.montantTotal || 0);
      }
      if (r.statutLocation === "EN_ATTENTE") enAttente++;
      else if (r.statutLocation === "CONFIRMEE") confirmees++;
      else if (r.statutLocation === "EN_COURS") enCours++;
      else if (r.statutLocation === "TERMINEE") terminees++;

      // CA par jour
      if (r.dateCreation) {
        const jour = new Date(r.dateCreation).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
        parDate[jour] = (parDate[jour] || 0) + Number(r.montantTotal || 0);
      }
      
      // CA par mois
      if (r.dateCreation) {
        const mois = new Date(r.dateCreation).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
        parMois[mois] = (parMois[mois] || 0) + Number(r.montantTotal || 0);
      }

      // Top matériels
      (r.ligneLocations || []).forEach((l) => {
        const nom = l.materiel?.designation || l.pack?.libelle || "Inconnu";
        parMateriel[nom] = (parMateriel[nom] || 0) + Number(l.quantite || 0);
      });
    });

    const chartData = Object.entries(parDate).map(([name, total]) => ({ name, total })).slice(-7);
    const monthlyData = Object.entries(parMois).map(([name, total]) => ({ name, total })).slice(-6); // 6 derniers mois
    const topMateriels = Object.entries(parMateriel).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);

    return { chiffreAffaire, enAttente, enCours, confirmees, terminees, total: reservations.length, chartData, monthlyData, topMateriels };
  }, [reservations]);

  const recentes = reservations.slice(0, 5);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-base-content/60">Vue d'ensemble de votre activité</p>
        </div> */}
        <button className="btn btn-sm btn-outline gap-2" onClick={fetchData} disabled={loading}>
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> Actualiser
        </button>
      </div>

      <DataState loading={loading} error={error} onRetry={fetchData}>
        
        {/* SECTION 1 : KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Chiffre d'affaires" value={formatMoney(stats.chiffreAffaire)} icon={DollarSign} colorClass="text-success" bgClass="bg-success/10" trend="up" trendValue="+12%" />
          <StatCard title="Réservations" value={stats.total} icon={Calendar} colorClass="text-primary" bgClass="bg-primary/10" trend="up" trendValue="+5%" />
          {/* <StatCard title="En cours" value={stats.enCours} icon={Truck} colorClass="text-info" bgClass="bg-info/10" /> */}
          <StatCardMateriel value={equipement} colorClass="text-info" bgClass="bg-info/10" />
          <StatCard title="Clients" value={users.length} icon={Users} colorClass="text-secondary" bgClass="bg-secondary/10" />
          </div>

        {/* SECTION 2 : Alertes */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AlertCard title="Retraits à préparer" count={stats.confirmees} icon={Package} linkTo="/admin/retraits" colorClass="text-warning" bgClass="bg-warning/10" />
          <AlertCard title="Retours attendus" count={stats.enCours} icon={Clock} linkTo="/admin/retours" colorClass="text-info" bgClass="bg-info/10" />
          <AlertCard title="En attente" count={stats.enAttente} icon={AlertTriangle} linkTo="/admin/reservations" colorClass="text-error" bgClass="bg-error/10" />
          <AlertCard title="Terminées" count={stats.terminees} icon={CheckCircle2} linkTo="/admin/reservations" colorClass="text-success" bgClass="bg-success/10" />
        </div>

        {/* SECTION 3 : Calendriers */}
        <div className="grid gap-6 lg:grid-cols-2">
            {/* SECTION 5 : Graphiques classiques et Dernières réservations */}
            <div className="card bg-base-100 shadow-sm border border-base-200 l">
                    <div className="card-body p-6">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><TrendingUp size={18} className="text-primary" /> Revenus récents (7j)</h2>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs><linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#570df8" stopOpacity={0.3} /><stop offset="95%" stopColor="#570df8" stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip formatter={(value) => formatMoney(value)} />
                            <Area type="monotone" dataKey="total" stroke="#570df8" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    </div>
            </div>

             {/* SECTION 4 : Histogramme des recettes mensuelles */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <DollarSign size={18} className="text-success" /> Recettes mensuelles
                </h2>
                <div className="h-72 w-full">
                {stats.monthlyData.length === 0 ? (
                    <p className="flex h-full items-center justify-center text-base-content/50">Aucune donnée</p>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip formatter={(value) => formatMoney(value)} cursor={{ fill: "#f3f4f6" }} />
                        <Bar dataKey="total" fill="#570df8" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                    </ResponsiveContainer>
                )}
                </div>
            </div>
            </div>
           
        </div>

        {/* SECTION 6 : Tableau réservations */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-0">
            <div className="flex items-center justify-between p-6 border-b border-base-200">
              <h2 className="text-lg font-bold">Dernières réservations</h2>
              <Link to="/admin/reservations" className="btn btn-sm btn-ghost text-primary">Voir tout <ArrowUpRight size={14} /></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead><tr><th>N° Réservation</th><th>Client</th><th>Date début</th><th>Montant</th><th>Statut</th></tr></thead>
                <tbody>
                  {recentes.map((r) => (
                    <tr key={r.numReservation} className="hover">
                      <td className="font-mono text-xs">{r.numReservation}</td>
                      <td><div className="font-medium">{r.utilisateur?.nomComplet}</div><div className="text-xs text-base-content/60">{r.utilisateur?.telephone}</div></td>
                      <td>{formatDate(r.dateDebutPrevue)}</td>
                      <td className="font-medium">{formatMoney(r.montantTotal)}</td>
                      <td><StatusBadge map={STATUT_LOCATION} value={r.statutLocation} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DataState>
    </div>
  );
}