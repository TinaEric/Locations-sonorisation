import { useState } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { categorieService } from "../../data/CategorieService";
import { asList, useFetch } from "../hooks/useFetch";
import { useToast } from "../../contexts/ToastContext";
import PageHeader from "../components/PageHeader";
import DataState from "../components/DataState";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import { STATUT_CATEGORIE } from "../../utils/statutValue";
import { useNavigate } from "react-router-dom";

const EMPTY = {
  codeCategorie: "",
  libelle: "",
  descriptionCategorie: "",
  typeCategorie: "",
  statutCategorie: "actif",
};

export default function Categories() {
  const toast = useToast();
  const navigate = useNavigate()
  const [form, setForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useFetch(() => categorieService.list(), []);
  const items = asList(data);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const run = async (fn, okMsg, after) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      after?.();
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  console.log("Liste categorie: ",data)
  const save = (e) => {
    e.preventDefault();
    const data = {
      codeCategorie: form.codeCategorie,
      libelle: form.libelle,
      descriptionCategorie: form.descriptionCategorie,
      typeCategorie: form.typeCategorie,
      statutCategorie: form.statutCategorie,
    }
    run(
      () => (form.idCategorie ? categorieService.update(form.idCategorie, data) : categorieService.create(form)),
      form.idCategorie ? "Catégorie modifiée" : "Catégorie ajoutée",
      () => setForm(null)
    );
  };

  const voirDetail = (categorie) => {
    navigate("/admin/detailCategorie", { state: categorie.idCategorie });
  }

  // ModifierEtatCategorie(statut)
  const toggle = (c) =>
    run(
      () => categorieService.setStatut(c.idCategorie, c.statutCategorie === "actif" ? "inactif" : "actif"),
      "Statut mis à jour"
    );

  return (
    <>
      <PageHeader title="Catégories" subtitle="Classement du matériel (sonorisation, éclairage, scène…)">
        <button className="btn btn-accent" onClick={() => setForm({ ...EMPTY })}>
          <Plus size={18} /> Ajouter
        </button>
      </PageHeader>

      <div className="card bg-base-100 shadow">
        <DataState loading={loading} error={error} empty={!items.length} onRetry={reload}>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Libellé</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Statut</th>
                  <th>Effectif Matériel</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.idCategorie} className="cursor-pointer hover:bg-base-200/50">
                    <td className="font-mono text-xs" onClick={() => voirDetail(c)}>{c.codeCategorie}</td>
                    <td className="font-medium" onClick={() => voirDetail(c)}>{c.libelle}</td>
                    <td onClick={() => voirDetail(c)}>{c.typeCategorie || "—"}</td>
                    <td className="max-w-xs truncate" onClick={() => voirDetail(c)}>{c.descriptionCategorie || "—"}</td>
                    <td onClick={() => voirDetail(c)}><StatusBadge map={STATUT_CATEGORIE} value={c.statutCategorie} /></td>
                    <td onClick={() => voirDetail(c)} className="max-w-xs truncate">{c.materiels.length || "0"}</td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        className="btn btn-ghost btn-sm btn-square"
                        title={c.statutCategorie === "actif" ? "Désactiver" : "Activer"}
                        onClick={() => toggle(c)}
                        disabled={busy}
                      >
                        <Power size={16} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-square" onClick={() => setForm({ ...EMPTY, ...c })} aria-label="Modifier">
                        <Pencil size={16} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-square text-error" onClick={() => setToDelete(c)} aria-label="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </div>

      <Modal open={!!form} title={form?.idCategorie ? "Modifier la catégorie" : "Ajouter une catégorie"} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            <label className="form-control">
              <span className="label-text mb-1">Code *</span>
              <input required className="input input-bordered w-full" value={form.codeCategorie} onChange={set("codeCategorie")} />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Libellé *</span>
              <input required className="input input-bordered w-full" value={form.libelle} onChange={set("libelle")} />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Type</span>
              <input className="input input-bordered w-full" value={form.typeCategorie || ""} onChange={set("typeCategorie")} />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Statut</span>
              <select className="select select-bordered w-full" value={form.statutCategorie} onChange={set("statutCategorie")}>
                {Object.entries(STATUT_CATEGORIE).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </label>
            <label className="form-control sm:col-span-2">
              <span className="label-text mb-1">Description</span>
              <textarea rows={3} className="textarea textarea-bordered w-full" value={form.descriptionCategorie || ""} onChange={set("descriptionCategorie")} />
            </label>
            <div className="modal-action sm:col-span-2">
              <button type="button" className="btn" onClick={() => setForm(null)}>Annuler</button>
              <button className="btn btn-accent" disabled={busy}>
                {busy && (
                  <div className="flex justify-center items-center gap-2">
                     <span className="loading loading-spinner loading-sm" />
                     <span>Enregistrement...</span>
                  </div>
                )}
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!toDelete}
        title="Supprimer cette catégorie ?"
        onClose={() => setToDelete(null)}
        actions={
          <>
            <button className="btn" onClick={() => setToDelete(null)}>Annuler</button>
            <button
              className="btn btn-error"
              disabled={busy}
              onClick={() => run(() => categorieService.remove(toDelete.idCategorie), "Catégorie supprimée", () => setToDelete(null))}
            >
              {busy && <span className="loading loading-spinner loading-sm" />}
              Supprimer
            </button>
          </>
        }
      >
        <p>« {toDelete?.libelle} » sera supprimée. Les matériels associés doivent d'abord être déplacés.</p>
      </Modal>
    </>
  );
}
