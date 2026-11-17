import { useMemo, useState } from "react";
import { Layers, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { categorieService } from "../../../data/CategorieService";
import { materielService } from "../../../data/materielService";
import { asList, useFetch } from "../../hooks/useFetch";
import { useToast } from "../../../contexts/ToastContext";
import PageHeader from "../../components/PageHeader";
import DataState from "../../components/DataState";
import Modal from "../../components/Modal";
import ItemsModal from "../../components/ItemsModal";
import { formatMoney } from "../../../utils/format";
import { useNavigate } from "react-router-dom";
import { ImageUrl } from "../../../components/ImageURL";
import UploadImage from "../../components/UploadImage";
import { IMAGES_URL } from "../../../data/Api";
import CategorieSelect from "../../components/CategorieSelect";

const EMPTY = {
  CodeMateriel: "",
  designation: "",
  marque: "",
  detailTechnique: "",
  imageURL: "",
  prixLocation: "",
  prixCaution: "",
  idCategorie: "",
};

export default function Materiels() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [filtreParent, setFiltreParent] = useState("");
  const [filtreCat, setFiltreCat] = useState("");
  const [form, setForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [itemsOf, setItemsOf] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const { data, loading, error, reload } = useFetch(() => materielService.list(), []);
  const items = asList(data);

  const { data: parentsData } = useFetch(() => categorieService.parents(), []);
  const parents = asList(parentsData);

  const { data: enfantsData } = useFetch(
    () => (filtreParent ? categorieService.enfants(filtreParent) : Promise.resolve([])),
    [filtreParent]
  );
  const enfants = asList(enfantsData);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const startEdit = (m) =>
    setForm({
      ...EMPTY,
      ...m,
      idCategorie: m.categorie?.idCategorie || "",
    });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { items, categorie, CodeMateriel, ...rest } = form;
    const payload = {
      ...rest,
      prixLocation: Number(form.prixLocation || 0),
      prixCaution: Number(form.prixCaution || 0),
      idCategorie: form.idCategorie,
    };
    try {
      if (CodeMateriel) await materielService.update(CodeMateriel, payload);
      else await materielService.create(payload);
      toast.success(CodeMateriel ? "Matériel modifié" : "Matériel ajouté");
      setForm(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const nbItems = (m) => m.items?.length || 0;

  const supprimerMateriel = async () => {
    if (!toDelete || nbItems(toDelete) > 0) return;
    setBusy(true);
    try {
      const response = await materielService.remove(toDelete.CodeMateriel);
      toast.success(response.message);
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const countDisponible = (materiel) => {
    const items = materiel?.items ?? [];
    return items.filter((i) => (i.statutItem || "").toLowerCase() === "disponible").length;
  };

  const voirDetail = (materiel) => {
    navigate("/admin/materiels/detailMateriel", {
      state: { depart: "materiel", CodeMateriel: materiel.CodeMateriel },
    });
  };

  const liste = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      const cat = p.categorie;
      if (filtreCat && cat?.idCategorie !== filtreCat) return false;
      if (filtreParent && cat?.idParent !== filtreParent) return false;
      if (!q) return true;
      return [p.designation, p.CodeMateriel, p.marque, p.detailTechnique].some((v) =>
        v?.toLowerCase().includes(q)
      );
    });
  }, [items, search, filtreParent, filtreCat]);

  return (
    <>
      <PageHeader
        title="Gestion du matériel"
        subtitle="Références, tarifs et exemplaires physiques"
      >
        <button className="btn btn-accent" onClick={() => setForm({ ...EMPTY })}>
          <Plus size={18} /> Ajouter
        </button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="input input-bordered flex items-center gap-2 w-full sm:w-72">
          <Search size={16} className="opacity-50" />
          <input
            type="search"
            className="grow"
            placeholder="Désignation, marque, code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <select
          className="select select-bordered"
          value={filtreParent}
          onChange={(e) => {
            setFiltreParent(e.target.value);
            setFiltreCat("");
          }}
        >
          <option value="">Toutes les catégories</option>
          {parents.map((c) => (
            <option key={c.idCategorie} value={c.idCategorie}>
              {c.libelle}
            </option>
          ))}
        </select>

        {filtreParent && (
          <select
            className="select select-bordered"
            value={filtreCat}
            onChange={(e) => setFiltreCat(e.target.value)}
          >
            <option value="">Toutes les sous-catégories</option>
            {enfants.map((c) => (
              <option key={c.idCategorie} value={c.idCategorie}>
                {c.libelle}
              </option>
            ))}
          </select>
        )}
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
                  <th>Quantité</th>
                  <th>Disponible</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((m) => (
                  <tr key={m.CodeMateriel} className="cursor-pointer hover:bg-base-200/50">
                    <td onClick={() => voirDetail(m)} className="font-mono text-xs">
                      {m.CodeMateriel}
                    </td>
                    <td onClick={() => voirDetail(m)}>
                      <div className="flex items-center gap-3">
                        <ImageUrl src={`${IMAGES_URL}/${m.imageURL}`} alt={m.designation} />
                        <div>
                          <div className="font-medium">{m.designation}</div>
                          <div className="text-xs opacity-60">{m.marque}</div>
                        </div>
                      </div>
                    </td>
                    <td onClick={() => voirDetail(m)}>
                      {m.categorie?.libelle || "—"}
                      {m.categorie?.parent && (
                        <span className="ml-1 text-xs opacity-60">
                          ({m.categorie.parent.libelle})
                        </span>
                      )}
                    </td>
                    <td onClick={() => voirDetail(m)}>{formatMoney(m.prixLocation)}</td>
                    <td onClick={() => voirDetail(m)}>Total: {m.items?.length ?? 0}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm gap-2" onClick={() => setItemsOf(m)}>
                        <Layers size={15} />
                        {countDisponible(m)}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-ghost btn-sm btn-square"
                          onClick={() => startEdit(m)}
                          aria-label="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-square text-error"
                          onClick={() => setToDelete(m)}
                          aria-label="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </div>

      <Modal
        open={!!form}
        title={form?.CodeMateriel ? "Modifier le matériel" : "Ajouter un matériel"}
        onClose={() => setForm(null)}
      >
        {form && (
          <form onSubmit={save} className="grid gap-3 px-2 sm:grid-cols-2">
            <label className="form-control sm:col-span-2">
              <span className="label-text mb-1">Désignation *</span>
              <input
                required
                className="input input-bordered w-full"
                value={form.designation}
                onChange={set("designation")}
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Marque</span>
              <input
                className="input input-bordered w-full"
                value={form.marque || ""}
                onChange={set("marque")}
              />
            </label>

            {/* Sélection hiérarchique : parent → sous-catégorie */}
            <div className="sm:col-span-2">
              <CategorieSelect
                value={form.idCategorie}
                onChange={(idCategorie) => setForm({ ...form, idCategorie })}
                required
                disabled={!!form.CodeMateriel} // on ne change pas la catégorie d'un matériel existant
              />
            </div>

            <label className="form-control">
              <span className="label-text mb-1">Tarif journalier (Ar) *</span>
              <input
                required
                type="number"
                min="0"
                className="input input-bordered w-full"
                value={form.prixLocation}
                onChange={set("prixLocation")}
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Prix de la caution (Ar)</span>
              <input
                type="number"
                min="0"
                className="input input-bordered w-full"
                value={form.prixCaution}
                onChange={set("prixCaution")}
              />
            </label>
            <label className="form-control sm:col-span-2">
              <span className="label-text mb-1">Détail technique</span>
              <textarea
                rows={3}
                className="textarea textarea-bordered w-full"
                value={form.detailTechnique || ""}
                onChange={set("detailTechnique")}
              />
            </label>
            <UploadImage
              imageFile={form.imageURL}
              label={"Image Matériel"}
              setImageFile={(val) => setForm({ ...form, imageURL: val })}
            />
            <div className="modal-action sm:col-span-2">
              <button type="button" className="btn" onClick={() => setForm(null)}>
                Annuler
              </button>
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
        supp
        actions={
          <>
            <button className="btn" onClick={() => setToDelete(null)}>
              Annuler
            </button>
            <button
              className="btn btn-error"
              onClick={supprimerMateriel}
              disabled={busy || (toDelete?.items?.length ?? 0) !== 0}
            >
              {busy && <span className="loading loading-spinner loading-sm" />}
              Supprimer
            </button>
          </>
        }
      >
        {(toDelete?.items?.length ?? 0) === 0 ? (
          <p>
            Le matériel « {toDelete?.designation} » sera définitivement supprimé.
            Cette action est irréversible.
          </p>
        ) : (
          <p>
            La suppression du matériel « {toDelete?.designation} » n'est pas
            autorisée. Les items associés doivent d'abord être déplacés.
          </p>
        )}
      </Modal>

      <ItemsModal materiel={itemsOf} onClose={() => setItemsOf(null)} onChanged={reload} />
    </>
  );
}