import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { asList, useFetch } from "../hooks/useFetch";
import { useToast } from "../../contexts/ToastContext";
import Modal from "./Modal";
import DataState from "./DataState";
import StatusBadge, { statusKey } from "./StatusBadge";
import { ETAT_ITEM, STATUT_ITEM } from "../../utils/statutValue";
import { materielService } from "../../data/materielService";
import { ItemService } from "../../data/ItemService";

const EMPTY = {
  numeroSerie: "",
  etatItem: "bon",
  statutItem: "disponible",
  emplacementItem: "",
};

export default function ItemsModal({ materiel, onClose, onChanged }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useFetch(
    () =>
      materiel
        ? materielService.detail(materiel.CodeMateriel)
        : Promise.resolve([]),
    [materiel?.CodeMateriel]
  );

  const items = asList(data?.items || []);
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

  // ----- Ouverture création -----
  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...EMPTY });
  };

  // ----- Ouverture édition -----
  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      numeroSerie: item.numeroSerie || "",
      etatItem: statusKey(item.etatItem) || "bon",
      statutItem: statusKey(item.statutItem) || "disponible",
      emplacementItem: item.emplacementItem || "",
    });
  };

  const closeForm = () => {
    setForm(null);
    setEditingItem(null);
  };

  // ----- Enregistrement (create ou update) -----
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        emplacementItem: form.emplacementItem,
        etatItem: form.etatItem,
        statutItem: form.statutItem,
        codeMateriel: materiel.CodeMateriel,
      };
      console.log("Item payload: ", payload, "editing:", editingItem);

      if (editingItem) {
        await ItemService.update(editingItem.numeroSerie, payload);
        toast.success(
          `Item '${editingItem.numeroSerie}' modifié avec succès `
        );
      } else {
        await ItemService.create(payload);
        toast.success("Un Item créé avec succès");
      }
      closeForm();
      reload();
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  // ----- Suppression (via modale de confirmation) -----
  const confirmerSuppression = async () => {
    if (!toDelete || statusKey(toDelete.statutItem) === "loue") return;
    setBusy(true);
    try {
      const response = await ItemService.remove(toDelete.numeroSerie);
      toast.success(response?.message || "Exemplaire supprimé");
      setToDelete(null);
      reload();
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Modal
        open={!!materiel}
        wide
        title={`Exemplaires — ${materiel?.designation ?? ""}`}
        onClose={onClose}
      >
        <div className="mb-3 flex justify-end">
          {!form && (
            <button className="btn btn-primary btn-sm" onClick={openCreate}>
              <Plus size={16} /> Ajouter un exemplaire
            </button>
          )}
        </div>

        {form && (
          <form
            onSubmit={save}
            className="mb-4 grid gap-3 rounded-box border border-base-300 p-4 sm:grid-cols-4"
          >
            <label className="form-control">
              <span className="label-text mb-1">N° de série</span>
              <input
                disabled
                className="input input-bordered font-bold input-sm w-full"
                value={form.numeroSerie || "Générer par le système"}
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">État</span>
              <select
                className="select select-bordered select-sm w-full"
                value={form.etatItem}
                onChange={set("etatItem")}
              >
                {Object.entries(ETAT_ITEM).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Statut</span>
              <select
                className="select select-bordered select-sm w-full"
                value={form.statutItem}
                onChange={set("statutItem")}
              >
                {Object.entries(STATUT_ITEM).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Emplacement</span>
              <input
                className="input input-bordered input-sm w-full"
                value={form.emplacementItem || ""}
                onChange={set("emplacementItem")}
                placeholder="Étagère A2…"
              />
            </label>
            <div className="flex justify-end gap-2 sm:col-span-4">
              <button type="button" className="btn btn-sm" onClick={closeForm}>
                <X size={14} /> Annuler
              </button>
              <button className="btn btn-primary btn-sm" disabled={busy}>
                {busy ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Check size={14} />
                )}
                {editingItem ? "Mettre à jour" : "Enregistrer"}
              </button>
            </div>
          </form>
        )}

        <DataState
          loading={loading}
          error={error}
          empty={!items.length}
          onRetry={reload}
        >
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
                {items.map((it) => {
                  const estLoue = statusKey(it.statutItem) === "loue";
                  return (
                    <tr key={it.numeroSerie}>
                      <td className="font-mono text-xs">{it.numeroSerie}</td>
                      <td>
                        <StatusBadge map={ETAT_ITEM} value={it.etatItem} />
                      </td>
                      <td>
                        <StatusBadge map={STATUT_ITEM} value={it.statutItem} />
                      </td>
                      <td>{it.emplacementItem || "—"}</td>
                      <td className="text-right whitespace-nowrap">
                        <button
                          className="btn btn-ghost btn-xs btn-square"
                          onClick={() => openEdit(it)}
                          aria-label="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs btn-square text-error"
                          disabled={busy}
                          title={
                            estLoue
                              ? "Exemplaire actuellement loué — suppression impossible"
                              : "Supprimer"
                          }
                          onClick={() => setToDelete(it)}
                          aria-label="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DataState>
      </Modal>

      {/* Modale de confirmation de suppression */}
      <Modal
        open={!!toDelete}
        title="Supprimer cet Item ?"
        onClose={() => !busy && setToDelete(null)}
        supp
        actions={
          <>
            <button
              className="btn"
              onClick={() => setToDelete(null)}
              disabled={busy}
            >
              Annuler
            </button>
            <button
              className="btn btn-error"
              onClick={confirmerSuppression}
              disabled={busy || statusKey(toDelete?.statutItem) === "loue"}
            >
              {busy && <span className="loading loading-spinner loading-sm" />}
              Supprimer
            </button>
          </>
        }
      >
        {statusKey(toDelete?.statutItem) !== "loue" ? (
          <p>
            L'Item « <span className="font-mono">{toDelete?.numeroSerie}</span>{" "}
            » sera définitivement supprimé. Cette action est irréversible.
          </p>
        ) : (
          <p>
            La suppression de l'item «{" "}
            <span className="font-mono">{toDelete?.numeroSerie}</span> » n'est
            pas autorisée car il est en location pour le moment.
          </p>
        )}
      </Modal>
    </>
  );
}
