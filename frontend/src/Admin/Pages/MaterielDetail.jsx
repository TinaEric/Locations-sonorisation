import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Banknote, ImageOff, MapPin, Plus, Search, ShieldCheck, Tag } from "lucide-react";
import DataState from "../components/DataState";
import StatusBadge, { statusKey } from "../components/StatusBadge";
import { ETAT_ITEM, STATUT_CATEGORIE, STATUT_ITEM } from "../../utils/statutValue";
import {formatDateTime, formatMoney } from "../../utils/format";
import { materielService } from "../../data/materielService";
import { asList, useFetch } from "../hooks/useFetch";
import Modal from "../components/Modal";
import ItemsModal from "../components/ItemsModal";
import CreateItem from "../components/CreateItem";

function Photo({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed)
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-box bg-base-200 text-base-content/30">
        <ImageOff size={40} />
      </div>
    );
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="aspect-square w-full rounded-box object-cover"
    />
  );
}

function Stat({ label, value, color = "" }) {
  return (
    <div className="flex justify-center items-center stat px-2 py-1">
      <div className="stat-title text-xs">{label}</div>
      <div className={`stat-value text-2xl ${color}`}>{value}</div>
    </div>
  );
}


export default function MaterielDetail() {
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
  const [etat, setEtat] = useState("");
  const location = useLocation();
  const navigate = useNavigate()
  const stateLocation = location.state;
  const code = stateLocation.CodeMateriel
  const [loading, setLoading] = useState(true);
  const [itemsOf, setItemsOf] = useState(null);
  const [error, setError] = useState(null);
  const [materiel, setMateriel] = useState(null);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await materielService.detail(code);
      console.log("resp mat: ", resp)
      if(resp){
        setMateriel(resp);
      }
      else{
        setMateriel(null)
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
  

  const counts = useMemo(() => {
    const items = materiel?.items || [];
    const dispo = items.filter((i) => statusKey(i.statutItem) === "disponible").length;
    return { total: items.length, dispo, autres: items.length - dispo };
  }, [materiel]);

  const statuts = useMemo(
    () => [...new Set((materiel?.items || []).map((i) => statusKey(i.statutItem)).filter(Boolean))],
    [materiel]
  );

  const etats = useMemo(
    () => [...new Set((materiel?.items || []).map((i) => statusKey(i.etatItem)).filter(Boolean))],
    [materiel]
  );

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (materiel?.items || []).filter(
      (i) =>
        (!statut || statusKey(i.statutItem) === statut) && 
        (!etat || statusKey(i.etatItem) === etat) &&
        (!q || [i.numeroSerie, i.emplacementItem].some((v) => v?.toLowerCase().includes(q)))
    );
  }, [materiel, search, statut, etat]);

  const retour = () => {
    navigate("/admin/detailCategorie", { state: materiel.categorie.idCategorie });
  }
  const tab1 = {
    lien: stateLocation.depart === "categorie" ? "/admin/categories" : "/admin/materiels",
    titre: stateLocation.depart === "categorie" ? "Catégorie" : "Matériels"
  }
  return (
    <>
      <div className="breadcrumbs mb-2 text-sm">
        <ul>
          <li>
            <Link to={tab1.lien} className="inline-flex items-center gap-1">
              <ArrowLeft size={14} /> {tab1.titre}
            </Link>
          </li>
          {(materiel?.categorie && stateLocation.depart === "categorie") && (
            <li>
              <div onClick={retour}>{materiel.categorie.libelle}</div>
            </li>
          )}
          <li>{materiel?.designation ?? code}</li>
        </ul>
      </div>

        {materiel && (
          <div className="space-y-6">
            {/* Fiche du matériel */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-6 md:flex-row">
                <div className="w-full shrink-0 md:w-64">
                  <Photo src={materiel.imageURL} alt={materiel.designation} />
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold">{materiel.designation}</h1>
                      {materiel.marque && <span className="badge badge-outline">{materiel.marque}</span>}
                    </div>
                    <p className="font-mono text-xs text-base-content/60">{materiel.CodeMateriel}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-box bg-base-200 p-3">
                      <Banknote className="text-primary" size={22} />
                      <div>
                        <p className="text-xs text-base-content/60">Prix de location / jour</p>
                        <p className="text-lg font-bold">{formatMoney(materiel.prixLocation)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-box bg-base-200 p-3">
                      <ShieldCheck className="text-secondary" size={22} />
                      <div>
                        <p className="text-xs text-base-content/60">Caution</p>
                        <p className="text-lg font-bold">{formatMoney(materiel.prixCaution)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-base-content/50">Détail technique</p>
                    <p className="mt-0.5 whitespace-pre-line">{materiel.detailTechnique || "—"}</p>
                  </div>

                  {materiel.categorie && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-base-content/50">Catégorie</p>
                      <Link
                        to={`/categories/${materiel.categorie.idCategorie}`}
                        className="mt-1 inline-flex items-center gap-2 rounded-box border border-base-300 px-3 py-2 transition hover:bg-base-200"
                      >
                        <Tag size={16} className="text-primary" />
                        <span className="font-medium">{materiel.categorie.libelle}</span>
                        <span className="badge badge-outline badge-sm font-mono">{materiel.categorie.codeCategorie}</span>
                        <StatusBadge map={STATUT_CATEGORIE} value={materiel.categorie.statutCategorie} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Exemplaires */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="card-title">Exemplaires</h2>
                  <div className="stats border border-base-300">
                    <Stat label="Total" value={counts.total} />
                    <Stat label="Disponibles" value={counts.dispo} color="text-success" />
                    <Stat label="Autres" value={counts.autres} color={counts.autres ? "text-warning" : ""} />
                  </div>
                  <button className="btn btn-accent" onClick={() => setItemsOf(materiel)}>
                        <Plus size={18} /> Ajouter Item
                      </button>
                </div>

                {!materiel.items.length ? (
                  <p className="py-8 text-center text-base-content/50">
                    Aucun exemplaire enregistré pour ce matériel.
                  </p>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center justify-center gap-2">
                        <label className="input input-bordered input-sm flex w-full items-center gap-2 sm:w-64">
                          <Search size={14} className="opacity-50" />
                          <input
                            type="search"
                            className="grow"
                            placeholder="N° de série, emplacement…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </label>
                        <select
                          className="select select-bordered select-sm"
                          value={etat}
                          onChange={(e) => setEtat(e.target.value)}
                          aria-label="Filtrer par état"
                        >
                          <option value="">Tous les états</option>
                          {etats.map((s) => (
                            <option key={s} value={s}>
                              {ETAT_ITEM[s]?.label ?? s}
                            </option>
                          ))}
                        </select>
                        <select
                          className="select select-bordered select-sm"
                          value={statut}
                          onChange={(e) => setStatut(e.target.value)}
                          aria-label="Filtrer par statut"
                        >
                          <option value="">Tous les statuts</option>
                          {statuts.map((s) => (
                            <option key={s} value={s}>
                              {STATUT_ITEM[s]?.label ?? s}
                            </option>
                          ))}
                        </select>
                      </div>
                     
                    </div>

                    {!items.length ? (
                      <p className="py-8 text-center text-base-content/50">Aucun exemplaire ne correspond.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>N° de série</th>
                              <th>État</th>
                              <th>Statut</th>
                              <th>Emplacement</th>
                              <th>Ajouté le</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((i) => (
                              <tr key={i.numeroSerie} className="hover:bg-base-200/50">
                                <td className="font-mono text-xs">{i.numeroSerie}</td>
                                <td><StatusBadge map={ETAT_ITEM} value={i.etatItem} /></td>
                                <td><StatusBadge map={STATUT_ITEM} value={i.statutItem} /></td>
                                <td>
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin size={14} className="opacity-50" /> {i.emplacementItem || "—"}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap text-sm">{formatDateTime(i.dateCreation)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

       <CreateItem materiel={itemsOf} onClose={() => setItemsOf(null)} onChanged={fetchData} />
      
    </>
  );
}
