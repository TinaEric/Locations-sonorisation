import { useMemo,useEffect, useState } from "react";
import { Link, useLocation, useNavigate} from "react-router-dom";
import { ArrowLeft, Boxes, ImageOff, Plus, Search } from "lucide-react";
import DataState from "../components/DataState";
import { useToast } from "../../contexts/ToastContext";
import StatusBadge from "../components/StatusBadge";
import { STATUT_CATEGORIE } from "../../utils/statutValue";
import { formatMoney } from "../../utils/format";
import { asList, useFetch } from "../hooks/useFetch";
import Modal from "../components/Modal";
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

  const set = (k) => (e) => setForm({
     ...form, 
     [k]: e.target.value,
     idCategorie: code
    });
    
    const save = async (e) => {
      e.preventDefault();
      setBusy(true);
      const { categorie, nbItems, nbItemsDisponibles, ...rest } = form;
      const payload = {
        ...form,
        prixLocation: Number(form.prixLocation || 0),
        prixCaution: Number(form.prixCaution || 0)
      };
      try {
         await materielService.create(payload);
        toast.success("Matériel ajouté");
        setForm(null);
        fetchData()
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
                  <StatusBadge map={STATUT_CATEGORIE} value={categorie.statutCategorie} />
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
      
            <Modal open={!!form} title={"Ajouter un matériel"} onClose={() => setForm(null)}>
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
                    <span className="label-text mb-1">Tarif journalier (Ar) *</span>
                    <input required type="number" min="0" className="input input-bordered w-full" value={form.prixLocation} onChange={set("prixLocation")} />
                  </label> 
                  <label className="form-control">
                    <span className="label-text mb-1">Prix de la caution (Ar)</span>
                    <input type="number" min="0" className="input input-bordered w-full" value={form.prixCaution} onChange={set("prixCaution")} />
                  </label>

                  {/* ameliorer le designe de l'image et afficher l'image après l'exportation */}
                  <label className="form-control sm:col-span-2">
                    <span className="label-text mb-1">Image Matériel</span>
                    <input type="file" className="input w-full" value={form.imageURL || ""} onChange={set("imageURL")}/>
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
      
    </>
  );
}
