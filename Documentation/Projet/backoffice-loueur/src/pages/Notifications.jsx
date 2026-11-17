import { useState } from "react";
import { Bell, BellOff, Trash2 } from "lucide-react";
import { notificationService } from "../api/services";
import { asList, useFetch } from "../hooks/useFetch";
import { useToast } from "../../contexts/ToastContext";
import PageHeader from "../components/PageHeader";
import DataState from "../components/DataState";
import { formatDateTime } from "../utils/format";

export default function Notifications() {
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);
  const { data, loading, error, reload } = useFetch(() => notificationService.list(), []);
  const items = asList(data);
  const unread = items.filter((n) => !n.lue).length;

  const run = async (id, fn) => {
    setBusyId(id);
    try {
      await fn();
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} non lue(s)` : "Tout est à jour"}
      />

      <div className="card bg-base-100 shadow">
        <DataState loading={loading} error={error} empty={!items.length} onRetry={reload}>
          <ul className="divide-y divide-base-300">
            {items.map((n) => (
              <li key={n.id} className={`flex items-start gap-3 p-4 ${n.lue ? "opacity-60" : ""}`}>
                <span className={`mt-1 ${n.lue ? "" : "text-primary"}`}>
                  <Bell size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={n.lue ? "" : "font-medium"}>{n.message}</p>
                  <p className="text-xs opacity-60">
                    {formatDateTime(n.dateCreate)}
                    {n.type && <span className="badge badge-outline badge-xs ml-2">{n.type}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    className="btn btn-ghost btn-sm btn-square"
                    disabled={busyId === n.id}
                    title={n.lue ? "Marquer comme non lue" : "Marquer comme lue"}
                    onClick={() => run(n.id, () => notificationService.setLue(n.id, !n.lue))}
                  >
                    {n.lue ? <BellOff size={16} /> : <Bell size={16} />}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-square text-error"
                    disabled={busyId === n.id}
                    aria-label="Supprimer"
                    onClick={() => run(n.id, () => notificationService.remove(n.id))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </DataState>
      </div>
    </>
  );
}
