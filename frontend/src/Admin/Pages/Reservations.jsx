import { useState } from "react";
import { Check, Eye, Search, X } from "lucide-react";
// import { reservationService } from "../api/services";
import { asList, useFetch } from "../hooks/useFetch";
import { useToast } from "../../contexts/ToastContext";
import PageHeader from "../components/PageHeader";
import DataState from "../components/DataState";
import StatusBadge from "../components/StatusBadge";
import ReservationDetail from "../components/ReservationDetail";
import { formatDate, formatMoney } from "../../utils/format";
import { STATUT_LOCATION } from "../../utils/statutValue";
import { clientNom, clientTel } from "../../utils/accessors";
import { ReservationService } from "../../data/reservationService";

export default function Reservations() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statutLocation, setStatut] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const { data, loading, error, reload } = useFetch(
    () => ReservationService.list({ search, statutLocation }),
    [search, statutLocation]
  );
  const items = asList(data);

  const changeStatut = async (r, nouveau) => {
    setBusyId(r.id);
    try {
      await ReservationService.setStatut(r.id, nouveau);
      toast.success(nouveau === "confirmee" ? "Réservation confirmée" : "Réservation refusée");
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader title="Gestion des réservations" subtitle="Validez ou refusez les demandes des locataires" />

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="input input-bordered flex items-center gap-2 w-full sm:w-72">
          <Search size={16} className="opacity-50" />
          <input type="search" className="grow" placeholder="N°, client, lieu…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <select className="select select-bordered" value={statutLocation} onChange={(e) => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_LOCATION).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="card bg-base-100 shadow">
        <DataState loading={loading} error={error} empty={!items.length} onRetry={reload}>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Client</th>
                  <th>Période</th>
                  <th>Lieu</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-base-200/50">
                    <td className="font-mono text-xs">{r.numReservation}</td>
                    <td>
                      <div className="font-medium">{clientNom(r)}</div>
                      <div className="text-xs opacity-60">{clientTel(r)}</div>
                    </td>
                    <td className="whitespace-nowrap text-sm">
                      {formatDate(r.dateDebutPrevue)} → {formatDate(r.dateFinPrevue)}
                    </td>
                    <td className="max-w-40 truncate">{r.lieuEvenement || "—"}</td>
                    <td>{formatMoney(r.montantTotal)}</td>
                    <td><StatusBadge map={STATUT_LOCATION} value={r.statutLocation} /></td>
                    <td className="text-right whitespace-nowrap">
                      <button className="btn btn-ghost btn-sm" onClick={() => setDetailId(r.id)}>
                        <Eye size={16} /> Détail
                      </button>
                      {r.statutLocation === "en_attente" && (
                        <div className="join ml-2">
                          <button className="btn btn-success btn-sm join-item" disabled={busyId === r.id} onClick={() => changeStatut(r, "confirmee")}>
                            <Check size={16} /> Confirmer
                          </button>
                          <button className="btn btn-error btn-outline btn-sm join-item" disabled={busyId === r.id} onClick={() => changeStatut(r, "refusee")}>
                            <X size={16} /> Refuser
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </div>

      <ReservationDetail id={detailId} onClose={() => setDetailId(null)} onChanged={reload} />
    </>
  );
}
