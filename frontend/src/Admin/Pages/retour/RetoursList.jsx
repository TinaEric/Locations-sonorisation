import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Eye, Package, Search, User, Filter } from "lucide-react";
import DataState from "../../components/DataState";
import StatusBadge from "../../components/StatusBadge";
import { formatMoney } from "../../../utils/format";
import { asList } from "../../hooks/useFetch";
import { retourService } from "../../../data/RetourService";
import { STATUT_LOCATION } from "../../../utils/statutValue";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function RetoursList() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [recherche, setRecherche] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await retourService.list();
      console.log("RETOUR  DATA: ", resp)
      const data = asList(resp).filter(r => r.statutLocation === "EN_COURS");
      setReservations(data);
    } catch {
      setError("Erreur lors du chargement des retours.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const result = reservations.filter((r) => {
      const matchTexte = 
        (r.numReservation || "").toLowerCase().includes(q) ||
        (r.utilisateur?.nomComplet || "").toLowerCase().includes(q) ||
        (r.utilisateur?.telephone || "").toLowerCase().includes(q);
      
      if (!matchTexte) return false;

      if (dateDebut) {
        const debut = new Date(r.dateDebutPrevue).setHours(0,0,0,0);
        const filtreDebut = new Date(dateDebut).setHours(0,0,0,0);
        if (debut < filtreDebut) return false;
      }
      
      if (dateFin) {
        const fin = new Date(r.dateFinPrevue).setHours(23,59,59,999);
        const filtreFin = new Date(dateFin).setHours(23,59,59,999);
        if (fin > filtreFin) return false;
      }

      return true;
    });

    return result.sort((a, b) => new Date(a.dateFinPrevue).getTime() - new Date(b.dateFinPrevue).getTime());
  }, [reservations, recherche, dateDebut, dateFin]);

  const voirDetail = (r) => {
    navigate(`/admin/retours/detailRetour`, { state: r.numReservation})
  }

  return (
    <>
      <div className="breadcrumbs mb-2 text-sm">
        <ul>
          <li>
            <Link to="/admin" className="inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Admin
            </Link>
          </li>
          <li>Gestion des retours</li>
        </ul>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Retours attendus</h1>
        <span className="badge badge-info">{filtrees.length} réservation(s) en cours</span>
      </div>

      <div className="mb-6 grid gap-3 rounded-box bg-base-100 p-4 shadow sm:grid-cols-12">
        <div className="sm:col-span-5">
          <label className="input input-bordered flex w-full items-center gap-2">
            <Search size={16} className="opacity-60" />
            <input
              type="text"
              className="grow"
              placeholder="Client, n° résa, téléphone..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </label>
        </div>
        <div className="sm:col-span-3">
          <label className="input input-bordered flex items-center gap-2">
            <Calendar size={16} className="opacity-60" />
            <input
              type="date"
              className="grow"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              title="Retour prévu à partir du"
            />
          </label>
        </div>
        <div className="sm:col-span-3">
          <label className="input input-bordered flex items-center gap-2">
            <Calendar size={16} className="opacity-60" />
            <input
              type="date"
              className="grow"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              title="Retour prévu jusqu'au"
            />
          </label>
        </div>
        <div className="sm:col-span-1 flex items-center justify-end">
          <button className="btn btn-ghost btn-square" onClick={() => { setRecherche(""); setDateDebut(""); setDateFin(""); }} title="Réinitialiser">
            <Filter size={16} />
          </button>
        </div>
      </div>

      <DataState loading={loading} error={error} onRetry={fetchData}>
        {!filtrees.length ? (
          <p className="py-10 text-center text-base-content/50">Aucun retour à traiter ne correspond aux critères.</p>
        ) : (
          <div className="overflow-x-auto rounded-box bg-base-100 shadow">
            <table className="table">
              <thead>
                <tr>
                  <th>Réservation</th>
                  <th>Client</th>
                  <th>Retour prévu</th>
                  <th>Lignes</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrees.map((r) => (
                  <tr key={r.numReservation} className="hover:bg-base-200/50 cursor-pointer">
                    <td onClick={() => voirDetail(r)}>
                      <div className="font-mono text-xs font-bold">{r.numReservation}</div>
                    </td>
                    <td onClick={() => voirDetail(r)}>
                      <div className="flex items-center gap-2">
                        <User size={14} className="opacity-60" />
                        <div>
                          <div className="font-medium">{r.utilisateur?.nomComplet || "—"}</div>
                          <div className="text-xs opacity-60">{r.utilisateur?.telephone}</div>
                        </div>
                      </div>
                    </td>
                    <td onClick={() => voirDetail(r)}>
                      <div className="inline-flex items-center gap-1 rounded bg-info/10 px-2 py-1 text-sm font-medium text-info">
                        <Calendar size={14} /> {formatDate(r.dateFinPrevue)}
                      </div>
                    </td>
                    <td onClick={() => voirDetail(r)}>
                      <span className="inline-flex items-center gap-1 badge badge-ghost badge-sm">
                        <Package size={12} /> {r.ligneLocations?.length || 0}
                      </span>
                    </td>
                    <td onClick={() => voirDetail(r)}>
                      <StatusBadge map={STATUT_LOCATION} value={r.statutLocation} />
                    </td>
                    <td className="text-right">
                      <button
                        className="btn btn-accent btn-sm"
                        onClick={() => voirDetail(r)}
                      >
                        <Eye size={16} /> Réceptionner
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataState>
    </>
  );
}