import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Banknote, Boxes, ChevronRight, Image as ImageIcon,
  Layers, Package, Pencil, Plus, Search, ShieldCheck, Tag, Trash2,
} from "lucide-react";
import DataState from "../../components/DataState";
import { useToast } from "../../../contexts/ToastContext";
import StatusBadge from "../../components/StatusBadge";
import { STATUT_CATEGORIE } from "../../../utils/statutValue";
import { formatMoney } from "../../../utils/format";
import Modal from "../../components/Modal";
import { ChampText } from "../../../components/ChampInput";
import { categorieService } from "../../../data/CategorieService";
import { materielService } from "../../../data/materielService";
import { ImageUrl } from "../../../components/ImageURL";
import { IMAGES_URL } from "../../../data/Api";
import UploadImage from "../../components/UploadImage";

const EMPTY = {
  designation: "",
  marque: "",
  detailTechnique: "",
  imageURL: "",
  prixLocation: "",
  prixCaution: "",
  idCategorie: "",
};

function Info({ label, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-base-content/50">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

export default function CategorieDetail() {
  const location = useLocation();
  const [categorie, setCategorie] = useState(null);
  const [search, setSearch] = useState("");
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [catForm, setCatForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const code = location.state;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await categorieService.detail(code);
      setCategorie(resp || null);
    } catch {
      setError("Erreur lors du chargement de la catégorie.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [code]);

  const materiels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!categorie) return [];
    if (!q) return categorie.materiels || [];
    return (categorie.materiels || []).filter((m) =>
      [m.CodeMateriel, m.designation, m.marque, m.detailTechnique].some((v) =>
        v?.toLowerCase().includes(q)
      )
    );
  }, [categorie, search]);

  const voirDetailMateriel = (materiel) => {
    navigate("/admin/materiels/detailMateriel", {
      state: { depart: "categorie", CodeMateriel: materiel.CodeMateriel },
    });
  };

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.value, idCategorie: code });

  const modifierMateriel = (m) =>
    setForm({
      ...EMPTY,
      ...m,
      prixLocation: m.prixLocation ?? "",
      prixCaution: m.prixCaution ?? "",
      idCategorie: code,
    });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { items, CodeMateriel, ...rest } = form;
    const payload = {
      ...rest,
      prixLocation: Number(form.prixLocation || 0),
      prixCaution: Number(form.prixCaution || 0),
    };
    const message = CodeMateriel
      ? `Matériel '${CodeMateriel}' modifié avec succès`
      : "Matériel créé avec succès";
    try {
      if (CodeMateriel) await materielService.update(CodeMateriel, payload);
      else await materielService.create(payload);
      toast.success(message);
      setForm(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const supprimerMateriel = async () => {
    if (!toDelete || (toDelete.items?.length ?? 0) > 0) return;
    setBusy(true);
    try {
      const response = await materielService.remove(toDelete.CodeMateriel);
      toast.success(response.message);
      setToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ----- Modification de la catégorie ----- */
  const modifierCategorie = () =>
    setCatForm({
      libelle: categorie.libelle || "",
      descriptionCategorie: categorie.descriptionCategorie || "",
      statutCategorie: categorie.statutCategorie || "actif",
    });

  const setCat = (k) => (e) => setCatForm({ ...catForm, [k]: e.target.value });

  const saveCategorie = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await categorieService.update(categorie.idCategorie, catForm);
      toast.success(`Catégorie '${categorie.idCategorie}' modifiée avec succès`);
      setCatForm(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const parent = categorie?.parent;
  const enfants = categorie?.enfants ?? [];

  return (
    <>
      <div className="breadcrumbs mb-2 text-sm">
        <ul>
          <li>
            <Link to="/admin/categories" className="inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Catégories
            </Link>
          </li>
          {parent && (
            <li>
              <Link
                to="/admin/categories/detailCategorie"
                state={parent.idCategorie}
                className="inline-flex items-center gap-1"
              >
                {parent.libelle}
              </Link>
            </li>
          )}
          <li>{categorie?.libelle ?? code}</li>
        </ul>
      </div>

      <DataState loading={loading} error={error} empty={!categorie} onRetry={fetchData}>
        {categorie && (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold">{categorie.libelle}</h1>
                    <p className="font-mono text-xs text-base-content/60">
                      {categorie.idCategorie}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge map={STATUT_CATEGORIE} value={categorie.statutCategorie} />
                    <button className="btn btn-sm btn-outline" onClick={modifierCategorie}>
                      <Pencil size={16} /> Modifier
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  <Info label="Niveau">
                    <span
                      className={`badge ${
                        Number(categorie.niveau) === 1 ? "badge-primary" : "badge-ghost"
                      }`}
                    >
                      Niveau {categorie.niveau}
                    </span>
                  </Info>
                  {parent?.libelle && (
                    <Info label="Catégorie parente">
                      <span>{parent?.libelle ?? "__"}</span>
                    </Info>
                  )}
                  <Info label="Sous-catégories">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Layers size={16} /> {enfants.length}
                    </span>
                  </Info>
                  <Info label="Matériels">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Boxes size={16} /> {(categorie.materiels ?? []).length}
                    </span>
                  </Info>
                </div>

                <Info label="Description">
                  <p className="whitespace-pre-line">
                    {categorie.descriptionCategorie || "—"}
                  </p>
                </Info>
              </div>
            </div>

            {/* Sous-catégories (si niveau 1) */}
            {Number(categorie.niveau) === 1 && enfants.length > 0 && (
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h2 className="card-title">Sous-catégories</h2>
                  <ul className="divide-y divide-base-200">
                    {enfants.map((e) => (
                      <li
                        key={e.idCategorie}
                        className="flex items-center justify-between py-2 cursor-pointer hover:bg-base-200/40"
                        onClick={() =>
                          navigate("/admin/categories/detailCategorie", {
                            state: e.idCategorie,
                          })
                        }
                      >
                        <div>
                          <p className="font-medium">{e.libelle}</p>
                          <p className="font-mono text-xs opacity-60">{e.idCategorie}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge map={STATUT_CATEGORIE} value={e.statutCategorie} />
                          <ChevronRight size={16} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Matériels (uniquement si niveau 2 — ou pour information si niveau 1 vide) */}
            {Number(categorie.niveau) === 2 && (
              <div className="card bg-base-100 shadow">
                <div className="card-body gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="card-title">Matériels de cette catégorie</h2>
                    {(categorie.materiels ?? []).length > 0 && (
                      <label className="input input-bordered input-sm flex w-full items-center gap-2 sm:w-64">
                        <Search size={14} className="opacity-50" />
                        <input
                          type="search"
                          className="grow"
                          placeholder="Rechercher…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </label>
                    )}
                    <button
                      className="btn btn-accent"
                      onClick={() => setForm({ ...EMPTY })}
                    >
                      <Plus size={18} /> Ajouter Matériel
                    </button>
                  </div>

                  {!(categorie.materiels ?? []).length ? (
                    <p className="py-8 text-center text-base-content/50">
                      Aucun matériel dans cette catégorie.
                    </p>
                  ) : !materiels.length ? (
                    <p className="py-8 text-center text-base-content/50">
                      Aucun résultat pour « {search} ».
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Matériel</th>
                            <th>Détail technique</th>
                            <th>Stock</th>
                            <th className="text-right">Prix location</th>
                            <th className="text-right">Caution</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {materiels.map((m) => (
                            <tr
                              key={m.CodeMateriel}
                              className="cursor-pointer hover:bg-base-200/50"
                              onClick={() => voirDetailMateriel(m)}
                            >
                              <td>
                                <div className="flex items-center gap-3">

                                  <ImageUrl src={`${IMAGES_URL}/${m.imageURL}`} alt={m.designation} />
                                  <div>
                                    <div className="font-medium">{m.designation}</div>
                                    <div className="text-xs opacity-60">
                                      {m.marque} · <span className="font-mono">{m.CodeMateriel}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="max-w-xs text-sm">{m.detailTechnique || "—"}</td>
                              <td className="max-w-xs text-sm">{m.items?.length || 0}</td>
                              <td className="whitespace-nowrap text-right font-medium">
                                {formatMoney(m.prixLocation)}
                              </td>
                              <td className="whitespace-nowrap text-right">
                                {formatMoney(m.prixCaution)}
                              </td>
                              <td
                                className="whitespace-nowrap text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="btn btn-ghost btn-sm btn-square"
                                  onClick={() => modifierMateriel(m)}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm btn-square text-error"
                                  onClick={() => setToDelete(m)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DataState>

      {/* Modal Ajout / Modif Matériel */}
      <Modal
        open={!!form}
        title={form?.CodeMateriel ? "Modifier le matériel" : "Ajouter un matériel"}
        onClose={() => setForm(null)}
      >
        {form && (
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            <ChampText
              id="designation"
              name="designation"
              label="Désignation *"
              icon={Package}
              required
              value={form.designation}
              onChange={set("designation")}
            />
            <ChampText
              id="marque"
              name="marque"
              label="Marque"
              icon={Tag}
              value={form.marque || ""}
              onChange={set("marque")}
            />
            <ChampText
              id="prixLocation"
              name="prixLocation"
              label="Tarif journalier (Ar) *"
              icon={Banknote}
              type="number"
              min="0"
              required
              value={form.prixLocation}
              onChange={set("prixLocation")}
            />
            <ChampText
              id="prixCaution"
              name="prixCaution"
              label="Caution (Ar)"
              icon={ShieldCheck}
              type="number"
              min="0"
              value={form.prixCaution}
              onChange={set("prixCaution")}
            />

            {/* {form.CodeMateriel ? (
              <div className="sm:col-span-2 flex items-end gap-3">
                <ImageUrl src={form.imageURL} alt={form.designation} className="h-12 w-12 shrink-0" />
                
                <div className="flex-1">
                  <ChampText
                    id="imageURL"
                    name="imageURL"
                    label="Image du matériel (URL)"
                    icon={ImageIcon}
                    type="url"
                    placeholder="https://…"
                    value={form.imageURL || ""}
                    onChange={set("imageURL")}
                  />
                </div>
              </div>
            ) : (
              <label className="form-control sm:col-span-2">
                <span className="label-text mb-1">Image Matériel</span>
                <input
                  type="file"
                  className="input w-full"
                  value={form.imageURL || ""}
                  onChange={set("imageURL")}
                />
              </label>
            )} */}

                <UploadImage
                  imageFile={form.imageURL}
                  label={"Image Matériel"}
                  setImageFile={(val) => setForm({ ...form, imageURL: val })}
                />

            <div className="sm:col-span-2">
              <label htmlFor="detailTechnique" className="mb-1 block text-sm font-medium">
                Détail technique
              </label>
              <textarea
                id="detailTechnique"
                rows={3}
                className="textarea textarea-bordered w-full"
                value={form.detailTechnique || ""}
                onChange={set("detailTechnique")}
              />
            </div>

            <div className="modal-action sm:col-span-2">
              <button type="button" className="btn" onClick={() => setForm(null)}>
                Annuler
              </button>
              <button className="btn btn-accent" disabled={busy}>
                {busy && <span className="loading loading-spinner loading-sm" />}
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Modif Catégorie */}
      <Modal open={!!catForm} title="Modifier la catégorie" onClose={() => setCatForm(null)}>
        {catForm && (
          <form onSubmit={saveCategorie} className="grid gap-3 px-2 sm:grid-cols-2">
            <ChampText
              id="cat-libelle"
              name="libelle"
              label="Libellé *"
              icon={Tag}
              required
              value={catForm.libelle}
              onChange={setCat("libelle")}
            />
            <div className="sm:col-span-2">
              <label htmlFor="cat-statut" className="mb-1 block text-sm font-medium">
                Statut
              </label>
              <select
                id="cat-statut"
                className="select w-full"
                value={catForm.statutCategorie}
                onChange={setCat("statutCategorie")}
              >
                {Object.entries(STATUT_CATEGORIE).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cat-description" className="mb-1 block text-sm font-medium">
                Description
              </label>
              <textarea
                id="cat-description"
                rows={3}
                className="textarea textarea-bordered w-full"
                value={catForm.descriptionCategorie}
                onChange={setCat("descriptionCategorie")}
              />
            </div>
            <div className="modal-action sm:col-span-2">
              <button type="button" className="btn" onClick={() => setCatForm(null)}>
                Annuler
              </button>
              <button className="btn btn-accent" disabled={busy}>
                {busy && <span className="loading loading-spinner loading-sm" />}
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Suppression Matériel */}
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
              disabled={busy || (toDelete?.items?.length ?? 0) > 0}
            >
              {busy && <span className="loading loading-spinner loading-sm" />}
              Supprimer
            </button>
          </>
        }
      >
        {(toDelete?.items?.length ?? 0) === 0 ? (
          <p>
            Le matériel « {toDelete?.designation} » sera définitivement supprimé. Cette action
            est irréversible.
          </p>
        ) : (
          <p>
            La suppression du matériel « {toDelete?.designation} » n'est pas autorisée. Les
            items associés doivent d'abord être déplacés.
          </p>
        )}
      </Modal>
    </>
  );
}