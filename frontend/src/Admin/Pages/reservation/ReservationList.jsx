import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Eye, Package, Search, User, Filter } from "lucide-react";
import DataState from "../../components/DataState";
import StatusBadge from "../../components/StatusBadge";
import { formatMoney } from "../../../utils/format";
import { asList } from "../../hooks/useFetch";
import { ReservationService } from "../../../data/reservationService";
import { STATUT_LOCATION } from "../../../utils/statutValue";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function ReservationsList() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await ReservationService.list();
      setReservations(asList(resp));
    } catch {
      setError("Erreur lors du chargement des réservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return reservations.filter((r) => {
      if (filtreStatut && r.statutLocation !== filtreStatut) return false;
      if (q) {
        const match =
          (r.numReservation || "").toLowerCase().includes(q) ||
          (r.utilisateur?.nomComplet || "").toLowerCase().includes(q) ||
          (r.utilisateur?.email || "").toLowerCase().includes(q) ||
          (r.lieuEvenement || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (dateDebut && new Date(r.dateDebutPrevue) < new Date(dateDebut)) return false;
      if (dateFin && new Date(r.dateFinPrevue) > new Date(dateFin)) return false;
      return true;
    });
  }, [reservations, recherche, filtreStatut, dateDebut, dateFin]);

  const totalMontant = filtrees.reduce((s, r) => s + Number(r.montantTotal || 0), 0);

  const resteAPayer = (r) => {
    const paye = (r.paiements || []).reduce((s, p) => s + Number(p.montantPaye ?? p.montant ?? 0), 0);
    return Math.max(Number(r.montantTotal || 0) - paye, 0);
  };

  const dirigeDetail = (r) =>
    navigate(`/admin/reservations/detailReservation`, { state: r.numReservation });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Réservations</h1>
        <span className="text-sm text-base-content/60">
          {filtrees.length} réservation(s) · {formatMoney(totalMontant)}
        </span>
      </div>

      <div className="mb-4 grid gap-3 rounded-box bg-base-100 p-3 shadow sm:grid-cols-12">
        <div className="sm:col-span-4">
          <label className="input input-bordered flex items-center gap-2">
            <Search size={16} className="opacity-60" />
            <input type="text" className="grow" placeholder="N° résa, client, lieu..."
              value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          </label>
        </div>
        <div className="sm:col-span-3">
          <select className="select select-bordered w-full" value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_LOCATION).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <input type="date" className="input input-bordered w-full" value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)} title="Début" />
        </div>
        <div className="sm:col-span-2">
          <input type="date" className="input input-bordered w-full" value={dateFin}
            onChange={(e) => setDateFin(e.target.value)} title="Fin" />
        </div>
        <div className="sm:col-span-1 flex items-center justify-end">
          <button className="btn btn-ghost btn-square"
            onClick={() => { setRecherche(""); setFiltreStatut(""); setDateDebut(""); setDateFin(""); }}>
            <Filter size={16} />
          </button>
        </div>
      </div>

      <DataState loading={loading} error={error} onRetry={fetchData}>
        {!filtrees.length ? (
          <p className="py-10 text-center text-base-content/50">Aucune réservation.</p>
        ) : (
          <div className="overflow-x-auto rounded-box bg-base-100 shadow">
            <table className="table">
              <thead>
                <tr>
                  <th>N° réservation</th>
                  <th>Client</th>
                  <th>Période</th>
                  <th>Lignes</th>
                  <th className="text-right">Montant</th>
                  <th className="text-right">Reste</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrees.map((r) => {
                  const reste = resteAPayer(r);
                  return (
                    <tr key={r.numReservation} className="hover:bg-base-200/50 cursor-pointer"
                      onClick={() => dirigeDetail(r)}>
                      <td>
                        <div className="font-mono text-xs">{r.numReservation}</div>
                        <div className="text-xs text-base-content/50">créée le {formatDate(r.dateCreation)}</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <User size={14} className="opacity-60" />
                          <div>
                            <div className="font-medium">{r.utilisateur?.nomComplet || "—"}</div>
                            <div className="text-xs opacity-60">{r.utilisateur?.telephone}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar size={14} className="opacity-60" />
                          {formatDate(r.dateDebutPrevue)} → {formatDate(r.dateFinPrevue)}
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 badge badge-ghost badge-sm">
                          <Package size={12} /> {r.ligneLocations?.length || 0}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-right font-medium">
                        {formatMoney(r.montantTotal)}
                      </td>
                      <td className={`whitespace-nowrap text-right font-medium ${reste > 0 ? "text-warning" : "text-success"}`}>
                        {formatMoney(reste)}
                      </td>
                      <td><StatusBadge map={STATUT_LOCATION} value={r.statutLocation} /></td>
                      <td className="text-right">
                        <button className="btn btn-ghost btn-sm btn-square" onClick={() => dirigeDetail(r)}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataState>
    </>
  );
}