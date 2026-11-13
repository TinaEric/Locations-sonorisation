import { useState } from "react";
import { Layers, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { categorieService } from "../../data/CategorieService"
import { materielService } from "../../data/materielService"
import { asList, useFetch } from "../hooks/useFetch";
import { useToast } from "../../contexts/ToastContext";
import PageHeader from "../components/PageHeader";
import DataState from "../components/DataState";
import Modal from "../components/Modal";
import ItemsModal from "../components/ItemsModal";
import { formatMoney } from "../../utils/format";
import { useNavigate } from "react-router-dom";
import { ImageUrl } from "../../components/ImageURL";

const EMPTY = {
  codeMateriel: "",
  designation: "",
  marque: "",
  detailTechnique: "",
  imageUrl: "",
  tarifJournalier: "",
  prixCaution: "",
  idCategorie: "",
};

export default function Materiels() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [idCategorie, setIdCategorie] = useState("");
  const [form, setForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [itemsOf, setItemsOf] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate()

  const { data, loading, error, reload } = useFetch(
    () => materielService.list({ search, idCategorie }),
    [search, idCategorie]
  );
  const items = asList(data);
  const categories = asList(useFetch(() => categorieService.list(), []).data);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const startEdit = (m) =>
    setForm({ ...EMPTY, ...m, idCategorie: m.categorie?.id ?? m.idCategorie ?? "" });

  // const save = async (e) => {
  //   e.preventDefault();
  //   setBusy(true);
  //   const { categorie, nbItems, nbItemsDisponibles, ...rest } = form;
  //   const payload = {
  //     ...rest,
  //     tarifJournalier: Number(form.tarifJournalier),
  //     prixCaution: Number(form.prixCaution || 0),
  //   };
  //   try {
  //     if (form.id) await materielService.update(form.id, payload);
  //     else await materielService.create(payload);
  //     toast.success(form.id ? "Matériel modifié" : "Matériel ajouté");
  //     setForm(null);
  //     reload();
  //   } catch (err) {
  //     toast.error(err.message);
  //   } finally {
  //     setBusy(false);
  //   }
  // };
    const save = async (e) => {
      e.preventDefault();
      setBusy(true);
      const { items, CodeMateriel, ...rest } = form;
      const payload = {
        ...rest,
        prixLocation: Number(form.prixLocation || 0),
        prixCaution: Number(form.prixCaution || 0)
      };
      try {
        if (CodeMateriel) await materielService.update(CodeMateriel, payload);
        else await materielService.create(payload);
        toast.success(CodeMateriel ? "Matériel modifié" : "Matériel ajouté");
        setForm(null);
        reload()
      } catch (err) {
        toast.error(err.message);
      } finally {
        setBusy(false);
      }
    };

  const remove = async () => {
    setBusy(true);
    try {
      await materielService.remove(toDelete.id);
      toast.success("Matériel supprimé");
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const voirDetail = (materiel) => {
    const contenu = {
      depart: "materiel",
      CodeMateriel: materiel.CodeMateriel,
    }
    navigate("/admin/detailMateriel", { state: contenu });
  }
  // console.log("New DAtA: ", items)
  return (
    <>
      <PageHeader title="Gestion du matériel" subtitle="Références, tarifs et exemplaires physiques">
        <button className="btn btn-primary" onClick={() => setForm({ ...EMPTY })}>
          <Plus size={18} /> Ajouter
        </button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="input input-bordered flex items-center gap-2 w-full sm:w-72">
          <Search size={16} className="opacity-50" />
          <input type="search" className="grow" placeholder="Désignation, marque, code…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <select className="select select-bordered" value={idCategorie} onChange={(e) => setIdCategorie(e.target.value)}>
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.libelle}</option>
          ))}
        </select>
      </div>

      <div className="card bg-base-100 shadow">
        <DataState loading={loading} error={error} empty={!items.length} onRetry={reload}>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Désignation</th>
                  <th>Catégorie</th>
                  <th>Tarif / jour</th>
                  <th>Caution</th>
                  <th>Exemplaires</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.CodeMateriel} className="cursor-pointer hover:bg-base-200/50">
                    <td onClick={() => voirDetail(m)} className="font-mono text-xs">{m.CodeMateriel}</td>
                    <td  onClick={() => voirDetail(m)}>
                      <div className="flex items-center gap-3">
                        <ImageUrl src={m.imageURL} alt={m.designation} />
                        <div>
                          <div className="font-medium">{m.designation}</div>
                          <div className="text-xs opacity-60">{m.marque}</div>
                        </div>
                      </div>
                    </td>
                    <td  onClick={() => voirDetail(m)}>{m.categorie?.libelle || "—"}</td>
                    <td  onClick={() => voirDetail(m)}>{formatMoney(m.tarifJournalier)}</td>
                    <td  onClick={() => voirDetail(m)}>{formatMoney(m.prixCaution)}</td>
                    <td >
                      <button className="btn btn-ghost btn-sm gap-1" onClick={() => setItemsOf(m)}>
                        <Layers size={15} />
                        {m.nbItemsDisponibles ?? "–"} / {m.nbItems ?? "–"}
                      </button>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button className="btn btn-ghost btn-sm btn-square" onClick={() => startEdit(m)} aria-label="Modifier">
                        <Pencil size={16} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-square text-error" onClick={() => setToDelete(m)} aria-label="Supprimer">
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

      <Modal open={!!form} title={form?.id ? "Modifier le matériel" : "Ajouter un matériel"} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            <label className="form-control ">
              <span className="label-text mb-1">Désignation *</span>
              <input required className="input input-bordered w-full" value={form.designation} onChange={set("designation")} />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Marque</span>
              <input className="input input-bordered w-full" value={form.marque || ""} onChange={set("marque")} />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Catégorie *</span>
              <select required className="select select-bordered w-full" value={form.idCategorie} onChange={set("idCategorie")}>
                <option value="" disabled>Choisir…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.libelle}</option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Image Matériel</span>
              <input type="file" className="input input-bordered w-full" value={form.imageURL || ""} onChange={set("imageURL")} placeholder="https://…" />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Tarif journalier (Ar) *</span>
              <input required type="number" min="0" className="input input-bordered w-full" value={form.tarifJournalier} onChange={set("tarifJournalier")} />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Prix de la caution (Ar)</span>
              <input type="number" min="0" className="input input-bordered w-full" value={form.prixCaution} onChange={set("prixCaution")} />
            </label>
            <label className="form-control sm:col-span-2">
              <span className="label-text mb-1">Détail technique</span>
              <textarea rows={3} className="textarea textarea-bordered w-full" value={form.detailTechnique || ""} onChange={set("detailTechnique")} />
            </label>
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
        title="Supprimer ce matériel ?"
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
        <p>« {toDelete?.designation} » et ses exemplaires seront supprimés du catalogue. Cette action est irréversible.</p>
      </Modal>

      <ItemsModal materiel={itemsOf} onClose={() => setItemsOf(null)} onChanged={reload} />
    </>
  );
}
