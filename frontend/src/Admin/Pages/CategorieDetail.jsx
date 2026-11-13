import { useMemo,useEffect, useState } from "react";
import { Link, useLocation, useNavigate} from "react-router-dom";
import {
  ArrowLeft, Banknote, Boxes, FileText, Image as ImageIcon, Layers, Package,
  Pencil, Plus, Search, ShieldCheck, Tag, Trash2,
} from "lucide-react";
import DataState from "../components/DataState";
import { useToast } from "../../contexts/ToastContext";
import StatusBadge from "../components/StatusBadge";
import { STATUT_CATEGORIE } from "../../utils/statutValue";
import { formatMoney } from "../../utils/format";
import { asList, useFetch } from "../hooks/useFetch";
import Modal from "../components/Modal";
import { ChampText } from "../../components/ChampInput";
import { categorieService } from "../../data/CategorieService";
import { materielService } from "../../data/materielService";
import { ImageUrl } from "../../components/ImageURL";

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
  const [categorie,setCategorie] = useState(null);
  const [search, setSearch] = useState("");
  const toast = useToast();
  const navigate = useNavigate()
  const [form, setForm] = useState(null);
  const [catForm, setCatForm] = useState(null);   // formulaire de modification de la catégorie
  const [toDelete, setToDelete] = useState(null); // matériel à supprimer (confirmation)
  const code = location.state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await categorieService.detail(location.state);
      console.log("resp cat: ", resp)
      if(resp){
        setCategorie(resp);
      }
      else{
        setCategorie(null)
      }
    } catch (err) {
      setError('Erreur lors du chargement des catégories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const materiels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!categorie) return [];
    if (!q) return categorie.materiels;
    return categorie.materiels.filter((m) =>
      [m.CodeMateriel, m.designation, m.marque, m.detailTechnique].some((v) => v?.toLowerCase().includes(q))
    );
  }, [categorie, search]);

  const voirDetail = (materiel) => {
    const contenu = {
      depart: "categorie",
      CodeMateriel: materiel.CodeMateriel,
    }
    navigate("/admin/detailMateriel", { state: contenu });
  }

  /* ------------------------- Matériel : ajout / modification ------------------------- */

  const set = (k) => (e) => setForm({
     ...form,
     [k]: e.target.value,
     idCategorie: code
    });

  // Ouvre le même formulaire pré-rempli (CodeMateriel présent = mode modification)
  const modifierMateriel = (m) => setForm({
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
      prixCaution: Number(form.prixCaution || 0)
    };
    try {
      if (CodeMateriel) await materielService.update(CodeMateriel, payload);
      else await materielService.create(payload);
      toast.success(CodeMateriel ? "Matériel modifié" : "Matériel ajouté");
      setForm(null);
      fetchData()
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------- Matériel : suppression (0 item uniquement) ------------------------- */

  const nbItems = (m) => m.items?.length || 0;

  const supprimerMateriel = async () => {
    if (!toDelete || nbItems(toDelete) > 0) return;
    setBusy(true);
    try {
      await materielService.remove(toDelete.CodeMateriel);
      toast.success("Matériel supprimé");
      setToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------- Catégorie : modification ------------------------- */

  const modifierCategorie = () => setCatForm({
    libelle: categorie.libelle || "",
    typeCategorie: categorie.typeCategorie || "",
    statutCategorie: categorie.statutCategorie || "actif",
    descriptionCategorie: categorie.descriptionCategorie || "",
  });

  const setCat = (k) => (e) => setCatForm({ ...catForm, [k]: e.target.value });

  // codeCategorie n'est pas envoyé : il est inchangeable
  const saveCategorie = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await categorieService.update(categorie.idCategorie, catForm);
      toast.success("Catégorie modifiée");
      setCatForm(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };


  return (
    <>
      <div className="breadcrumbs mb-2 text-sm">
        <ul>
          <li>
            <Link to="/admin/categories" className="inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Catégories
            </Link>
          </li>
          <li>{categorie?.libelle ?? code}</li>
        </ul>
      </div>

        {categorie && (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold">{categorie.libelle}</h1>
                    <p className="font-mono text-xs text-base-content/60">{categorie.idCategorie}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge map={STATUT_CATEGORIE} value={categorie.statutCategorie} />
                    <button className="btn btn-sm btn-outline" onClick={modifierCategorie}>
                      <Pencil size={16} /> Modifier
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Info label="Code">
                    <span className="badge badge-outline font-mono">{categorie.codeCategorie || "—"}</span>
                  </Info>
                  <Info label="Type">
                    <span className="capitalize">{categorie.typeCategorie || "—"}</span>
                  </Info>
                  <Info label="Matériels">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Boxes size={16} /> {categorie.materiels.length}
                    </span>
                  </Info>
                </div>

                <Info label="Description">
                  <p className="whitespace-pre-line">{categorie.descriptionCategorie || "—"}</p>
                </Info>
              </div>
            </div>

            {/* Matériels de la catégorie */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="card-title">Matériels de cette catégorie</h2>
                  {categorie.materiels.length > 0 && (
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
                  <button className="btn btn-accent" onClick={() => setForm({ ...EMPTY })}>
                    <Plus size={18} /> Ajouter Materiel
                  </button>
                </div>

                {!categorie.materiels.length ? (
                  <p className="py-8 text-center text-base-content/50">Aucun matériel dans cette catégorie.</p>
                ) : !materiels.length ? (
                  <p className="py-8 text-center text-base-content/50">Aucun résultat pour « {search} ».</p>
                ) : (
                  <>
                    {/* Tableau (écrans moyens et plus) */}
                    <div className="hidden overflow-x-auto md:block">
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
                            <tr key={m.CodeMateriel} onClick={() => voirDetail(m)} className="cursor-pointer hover:bg-base-200/50">
                              <td  onClick={() => voirDetail(m)}>
                                <div className="flex items-center gap-3" >
                                  <ImageUrl src={m.imageURL} alt={m.designation} />
                                  <div>
                                    <div className="font-medium">{m.designation}</div>
                                    <div className="text-xs opacity-60">
                                      {m.marque}
                                      {m.marque && " · "}
                                      <span className="font-mono">{m.CodeMateriel}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td  onClick={() => voirDetail(m)} className="max-w-xs text-sm">{m.detailTechnique || "—"}</td>
                              <td  onClick={() => voirDetail(m)} className="max-w-xs text-sm">{m.items?.length || "0"}</td>
                              <td  onClick={() => voirDetail(m)} className="whitespace-nowrap text-right font-medium">{formatMoney(m.prixLocation)}</td>
                              <td  onClick={() => voirDetail(m)} className="whitespace-nowrap text-right">{formatMoney(m.prixCaution)}</td>
                              {/* stopPropagation : ne pas ouvrir le détail en cliquant sur les actions */}
                              <td className="whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="btn btn-ghost btn-sm btn-square"
                                  title="Modifier"
                                  aria-label="Modifier"
                                  onClick={() => modifierMateriel(m)}
                                >
                                  <Pencil size={16} />
                                </button>
                                {nbItems(m) === 0 && (
                                  <button
                                    className="btn btn-ghost btn-sm btn-square text-error"
                                    title="Supprimer"
                                    aria-label="Supprimer"
                                    onClick={() => setToDelete(m)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Cartes (mobile) */}
                    <ul className="space-y-3 md:hidden">
                      {materiels.map((m) => (
                        <li key={m.CodeMateriel} onClick={() => voirDetail(m)}  className="flex gap-3 rounded-box border border-base-300 p-3">
                          <ImageUrl src={m.imageURL} alt={m.designation} className="h-16 w-16 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{m.designation}</p>
                            <p className="text-xs opacity-60">
                              {m.marque} · <span className="font-mono">{m.CodeMateriel}</span>
                            </p>
                            {m.detailTechnique && <p className="mt-1 text-sm">{m.detailTechnique}</p>}
                            <p className="mt-2 text-sm">
                              <b>{formatMoney(m.prixLocation)}</b> / jour
                              <span className="opacity-60"> · caution {formatMoney(m.prixCaution)}</span>
                            </p>
                            <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button className="btn btn-outline btn-xs" onClick={() => modifierMateriel(m)}>
                                <Pencil size={14} /> Modifier
                              </button>
                              {nbItems(m) === 0 && (
                                <button className="btn btn-outline btn-error btn-xs" onClick={() => setToDelete(m)}>
                                  <Trash2 size={14} /> Supprimer
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

            {/* Ajout / modification d'un matériel */}
            <Modal open={!!form} title={form?.CodeMateriel ? "Modifier le matériel" : "Ajouter un matériel"} onClose={() => setForm(null)}>
              {form && (
                <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
                  {form.CodeMateriel && (
                    <p className="sm:col-span-2 text-xs text-base-content/60">
                      Code : <span className="font-mono">{form.CodeMateriel}</span>
                    </p>
                  )}
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
                    label="Prix de la caution (Ar)"
                    icon={ShieldCheck}
                    type="number"
                    min="0"
                    value={form.prixCaution}
                    onChange={set("prixCaution")}
                  />

                  {form.CodeMateriel ? (
                    // Modification : un input file ne peut pas être pré-rempli avec l'image existante,
                    // on affiche donc l'image actuelle et on modifie son URL.
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
                    /* ameliorer le designe de l'image et afficher l'image après l'exportation */
                    <label className="form-control sm:col-span-2">
                      <span className="label-text mb-1">Image Matériel</span>
                      <input type="file" className="input w-full" value={form.imageURL || ""} onChange={set("imageURL")}/>
                    </label>
                  )}

                  <div className="sm:col-span-2">
                    <label htmlFor="detailTechnique" className="mb-1 block text-sm font-medium">Détail technique</label>
                    <textarea
                      id="detailTechnique"
                      rows={3}
                      className="textarea textarea-bordered w-full"
                      value={form.detailTechnique || ""}
                      onChange={set("detailTechnique")}
                    />
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

            {/* Modification de la catégorie (le code catégorie n'est pas modifiable) */}
            <Modal open={!!catForm} title="Modifier la catégorie" onClose={() => setCatForm(null)}>
              {catForm && (
                <form onSubmit={saveCategorie} className="grid gap-3 sm:grid-cols-2">
                  <p className="sm:col-span-2 text-xs text-base-content/60">
                    Code : <span className="badge badge-outline font-mono">{categorie?.codeCategorie}</span>
                    <span className="ml-2">(non modifiable)</span>
                  </p>
                  <ChampText
                    id="cat-libelle"
                    name="libelle"
                    label="Libellé *"
                    icon={Tag}
                    required
                    value={catForm.libelle}
                    onChange={setCat("libelle")}
                  />
                  <ChampText
                    id="cat-type"
                    name="typeCategorie"
                    label="Type"
                    icon={Layers}
                    value={catForm.typeCategorie}
                    onChange={setCat("typeCategorie")}
                  />
                  <div className="sm:col-span-2">
                    <label htmlFor="cat-statut" className="mb-1 block text-sm font-medium">Statut</label>
                    <select
                      id="cat-statut"
                      className="select w-full"
                      value={catForm.statutCategorie}
                      onChange={setCat("statutCategorie")}
                    >
                      {Object.entries(STATUT_CATEGORIE).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="cat-description" className="mb-1 block text-sm font-medium">Description</label>
                    <textarea
                      id="cat-description"
                      rows={3}
                      className="textarea textarea-bordered w-full"
                      value={catForm.descriptionCategorie}
                      onChange={setCat("descriptionCategorie")}
                    />
                  </div>
                  <div className="modal-action sm:col-span-2">
                    <button type="button" className="btn" onClick={() => setCatForm(null)}>Annuler</button>
                    <button className="btn btn-primary" disabled={busy}>
                      {busy && <span className="loading loading-spinner loading-sm" />}
                      Enregistrer
                    </button>
                  </div>
                </form>
              )}
            </Modal>

            {/* Confirmation de suppression d'un matériel */}
            <Modal
              open={!!toDelete}
              title="Supprimer ce matériel ?"
              onClose={() => setToDelete(null)}
              actions={
                <>
                  <button className="btn" onClick={() => setToDelete(null)}>Annuler</button>
                  <button className="btn btn-error" onClick={supprimerMateriel} disabled={busy}>
                    {busy && <span className="loading loading-spinner loading-sm" />}
                    Supprimer
                  </button>
                </>
              }
            >
              <p>« {toDelete?.designation} » sera définitivement supprimé. Cette action est irréversible.</p>
            </Modal>

    </>
  );
}
