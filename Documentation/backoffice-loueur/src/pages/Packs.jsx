import { useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { materielService, packService } from "../api/services";
import { asList, useFetch } from "../hooks/useFetch";
import { useToast } from "../../contexts/ToastContext";
import PageHeader from "../components/PageHeader";
import DataState from "../components/DataState";
import Modal from "../components/Modal";
import { formatMoney } from "../utils/format";

const EMPTY = {
  nomPack: "",
  description: "",
  prixBase: "",
  typeEvenement: "",
  capacitePersonne: "",
  actif: true,
  composants: [],
};

export default function Packs() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useFetch(() => packService.list(), []);
  const packs = asList(data);
  const materiels = asList(useFetch(() => materielService.list(), []).data);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const startEdit = (p) =>
    setForm({
      ...EMPTY,
      ...p,
      composants: (p.composants || []).map((c) => ({
        idMateriel: c.materiel?.id ?? c.idMateriel ?? "",
        quantite: c.quantite,
        obligatoire: c.obligatoire !== false,
      })),
    });

  const setComposant = (i, patch) =>
    setForm({
      ...form,
      composants: form.composants.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    });

  const addComposant = () =>
    setForm({ ...form, composants: [...form.composants, { idMateriel: "", quantite: 1, obligatoire: true }] });

  const removeComposant = (i) =>
    setForm({ ...form, composants: form.composants.filter((_, idx) => idx !== i) });

  const save = async (e) => {
    e.preventDefault();
    if (!form.composants.length) {
      toast.error("Ajoutez au moins un composant au pack");
      return;
    }
    setBusy(true);
    const payload = {
      ...form,
      prixBase: Number(form.prixBase),
      capacitePersonne: form.capacitePersonne === "" ? null : Number(form.capacitePersonne),
      composants: form.composants.map((c) => ({ ...c, quantite: Number(c.quantite) })),
    };
    try {
      if (form.id) await packService.update(form.id, payload);
      else await packService.create(payload);
      toast.success(form.id ? "Pack modifié" : "Pack créé");
      setForm(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await packService.remove(toDelete.id);
      toast.success("Pack supprimé");
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Packs" subtitle="Ensembles de matériel prêts à louer pour un type d'événement">
        <button className="btn btn-primary" onClick={() => setForm({ ...EMPTY, composants: [] })}>
          <Plus size={18} /> Créer un pack
        </button>
      </PageHeader>

      <DataState loading={loading} error={error} empty={!packs.length} onRetry={reload}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packs.map((p) => (
            <div key={p.id} className="card bg-base-100 shadow">
              <div className="card-body gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="card-title">{p.nomPack}</h2>
                  <span className={`badge badge-sm ${p.actif ? "badge-success" : "badge-ghost"}`}>
                    {p.actif ? "Actif" : "Inactif"}
                  </span>
                </div>
                <p className="text-sm text-base-content/70 line-clamp-2">{p.description || "—"}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {p.typeEvenement && <span className="badge badge-outline">{p.typeEvenement}</span>}
                  {p.capacitePersonne && (
                    <span className="badge badge-outline gap-1">
                      <Users size={12} /> {p.capacitePersonne} pers.
                    </span>
                  )}
                </div>
                <ul className="mt-1 text-sm">
                  {(p.composants || []).map((c) => (
                    <li key={c.id ?? c.materiel?.id} className="flex justify-between">
                      <span>{c.materiel?.designation}</span>
                      <span className="opacity-70">
                        ×{c.quantite}
                        {c.obligatoire === false && " (option)"}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="card-actions mt-2 items-center justify-between">
                  <span className="font-bold text-primary">{formatMoney(p.prixBase)}</span>
                  <div>
                    <button className="btn btn-ghost btn-sm btn-square" onClick={() => startEdit(p)} aria-label="Modifier">
                      <Pencil size={16} />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-square text-error" onClick={() => setToDelete(p)} aria-label="Supprimer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DataState>

      <Modal wide open={!!form} title={form?.id ? "Modifier le pack" : "Créer un pack"} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            <label className="form-control sm:col-span-2">
              <span className="label-text mb-1">Nom du pack *</span>
              <input required className="input input-bordered w-full" value={form.nomPack} onChange={set("nomPack")} />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Type d'événement</span>
              <input className="input input-bordered w-full" value={form.typeEvenement || ""} onChange={set("typeEvenement")} placeholder="Mariage, concert…" />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Capacité (personnes)</span>
              <input type="number" min="0" className="input input-bordered w-full" value={form.capacitePersonne ?? ""} onChange={set("capacitePersonne")} />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Prix de base (Ar) *</span>
              <input required type="number" min="0" className="input input-bordered w-full" value={form.prixBase} onChange={set("prixBase")} />
            </label>
            <label className="label cursor-pointer justify-start gap-3 self-end">
              <input type="checkbox" className="toggle toggle-success" checked={!!form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} />
              <span className="label-text">Pack actif</span>
            </label>
            <label className="form-control sm:col-span-2">
              <span className="label-text mb-1">Description</span>
              <textarea rows={2} className="textarea textarea-bordered w-full" value={form.description || ""} onChange={set("description")} />
            </label>

            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">Composition du pack</span>
                <button type="button" className="btn btn-sm btn-outline" onClick={addComposant}>
                  <Plus size={14} /> Composant
                </button>
              </div>
              <div className="space-y-2">
                {form.composants.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-box border border-base-300 p-2">
                    <select
                      required
                      className="select select-bordered select-sm min-w-0 flex-1"
                      value={c.idMateriel}
                      onChange={(e) => setComposant(i, { idMateriel: e.target.value })}
                    >
                      <option value="" disabled>Matériel…</option>
                      {materiels.map((m) => (
                        <option key={m.id} value={m.id}>{m.designation}</option>
                      ))}
                    </select>
                    <input
                      required
                      type="number"
                      min="1"
                      aria-label="Quantité"
                      className="input input-bordered input-sm w-20"
                      value={c.quantite}
                      onChange={(e) => setComposant(i, { quantite: e.target.value })}
                    />
                    <label className="label cursor-pointer gap-2 p-0">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={c.obligatoire}
                        onChange={(e) => setComposant(i, { obligatoire: e.target.checked })}
                      />
                      <span className="label-text text-xs">Obligatoire</span>
                    </label>
                    <button type="button" className="btn btn-ghost btn-sm btn-square text-error" onClick={() => removeComposant(i)} aria-label="Retirer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-action sm:col-span-2">
              <button type="button" className="btn" onClick={() => setForm(null)}>Annuler</button>
              <button className="btn btn-primary" disabled={busy}>
                {busy && <span className="loading loading-spinner loading-sm" />}
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!toDelete}
        title="Supprimer ce pack ?"
        onClose={() => setToDelete(null)}
        actions={
          <>
            <button className="btn" onClick={() => setToDelete(null)}>Annuler</button>
            <button className="btn btn-error" onClick={remove} disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" />}
              Supprimer
            </button>
          </>
        }
      >
        <p>Le pack « {toDelete?.nomPack} » sera supprimé. Le matériel qui le compose n'est pas affecté.</p>
      </Modal>
    </>
  );
}
