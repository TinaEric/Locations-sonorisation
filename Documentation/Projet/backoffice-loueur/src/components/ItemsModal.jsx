import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { itemService } from "../api/services";
import { asList, useFetch } from "../hooks/useFetch";
import { useToast } from "../../contexts/ToastContext";
import Modal from "./Modal";
import DataState from "./DataState";
import StatusBadge from "./StatusBadge";
import { ETAT_ITEM, STATUT_ITEM } from "../utils/format";

const EMPTY = { numeroSerie: "", etatItem: "bon", statutItem: "disponible", emplacement: "" };

/** Gestion des exemplaires physiques (Item) d'un matériel. */
export default function ItemsModal({ materiel, onClose, onChanged }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useFetch(
    () => (materiel ? itemService.list({ idMateriel: materiel.id }) : Promise.resolve([])),
    [materiel?.id]
  );
  const items = asList(data);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const run = async (fn, okMsg, after) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      after?.();
      reload();
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const save = (e) => {
    e.preventDefault();
    const payload = { ...form, idMateriel: materiel.id };
    run(
      () => (form.id ? itemService.update(form.id, payload) : itemService.create(payload)),
      form.id ? "Exemplaire modifié" : "Exemplaire ajouté",
      () => setForm(null)
    );
  };

  return (
    <Modal open={!!materiel} wide title={`Exemplaires — ${materiel?.designation ?? ""}`} onClose={onClose}>
      <div className="mb-3 flex justify-end">
        {!form && (
          <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...EMPTY })}>
            <Plus size={16} /> Ajouter un exemplaire
          </button>
        )}
      </div>

      {form && (
        <form onSubmit={save} className="mb-4 grid gap-3 rounded-box border border-base-300 p-4 sm:grid-cols-4">
          <label className="form-control">
            <span className="label-text mb-1">N° de série *</span>
            <input required className="input input-bordered input-sm w-full" value={form.numeroSerie} onChange={set("numeroSerie")} />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">État</span>
            <select className="select select-bordered select-sm w-full" value={form.etatItem} onChange={set("etatItem")}>
              {Object.entries(ETAT_ITEM).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Statut</span>
            <select className="select select-bordered select-sm w-full" value={form.statutItem} onChange={set("statutItem")}>
              {Object.entries(STATUT_ITEM).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Emplacement</span>
            <input className="input input-bordered input-sm w-full" value={form.emplacement || ""} onChange={set("emplacement")} placeholder="Étagère A2…" />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-4">
            <button type="button" className="btn btn-sm" onClick={() => setForm(null)}>
              <X size={14} /> Annuler
            </button>
            <button className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? <span className="loading loading-spinner loading-xs" /> : <Check size={14} />}
              Enregistrer
            </button>
          </div>
        </form>
      )}

      <DataState loading={loading} error={error} empty={!items.length} onRetry={reload}>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>N° de série</th>
                <th>État</th>
                <th>Statut</th>
                <th>Emplacement</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="font-mono text-xs">{it.numeroSerie}</td>
                  <td><StatusBadge map={ETAT_ITEM} value={it.etatItem} /></td>
                  <td><StatusBadge map={STATUT_ITEM} value={it.statutItem} /></td>
                  <td>{it.emplacement || "—"}</td>
                  <td className="text-right whitespace-nowrap">
                    <button className="btn btn-ghost btn-xs btn-square" onClick={() => setForm({ ...EMPTY, ...it })} aria-label="Modifier">
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-xs btn-square text-error"
                      disabled={busy || it.statutItem === "loue"}
                      title={it.statutItem === "loue" ? "Exemplaire actuellement loué" : "Supprimer"}
                      onClick={() => run(() => itemService.remove(it.id), "Exemplaire supprimé")}
                      aria-label="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>
    </Modal>
  );
}
