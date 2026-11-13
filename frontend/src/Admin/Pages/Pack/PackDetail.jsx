import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Boxes, Pencil, ChevronDown, Layers, Minus, PackagePlus, Plus, Search, Trash2 } from "lucide-react";
import DataState from "../../components/DataState";
import { useToast } from "../../../contexts/ToastContext";
import StatusBadge from "../../components/StatusBadge";
import { formatMoney } from "../../../utils/format";
import { asList } from "../../hooks/useFetch";
import { ImageUrl } from "../../../components/ImageURL";
import { PackService } from "../../../data/PackService";
import Modal from "../../components/Modal";
import { categorieService } from "../../../data/CategorieService";
import { materielService } from "../../../data/MaterielService";
import PackForm, { STATUT_PACK, fromPack, toPayload, typesFromApi } from "./PackForm";

const formatDateHeure = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

function Info({ label, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-base-content/50">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

export default function PackDetail() {
  const location = useLocation();
  const codePack = location.state;
  const toast = useToast();

  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [addMat, setAddMat] = useState(false);
  const [modifiePack, setModifiePack] = useState(false);

  const [infoForm, setInfoForm] = useState(null);
  const [typesOptions, setTypesOptions] = useState([]);

  // Section « Ajouter du matériel » : liste plate + recherche + filtre catégorie
  const [materiels, setMateriels] = useState([]);
  const [materielsLoading, setMaterielsLoading] = useState(false);
  const [materielsErreur, setMaterielsErreur] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesErreur, setCategoriesErreur] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("");
  const [selection, setSelection] = useState({}); // CodeMateriel -> matériel coché

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const resp = await PackService.detail(codePack);
      setPack(resp || null);
      if (resp && !silent) setInfoForm(fromPack(resp));
      return resp;
    } catch (err) {
      if (silent) toast.error(err.message);
      else setError("Erreur lors du chargement du pack.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!codePack) {
      setError("Aucun pack sélectionné.");
      setLoading(false);
      return;
    }
    fetchData();
    PackService.getTypeEvenement()
      .then((r) => setTypesOptions(typesFromApi(r)))
      .catch(() => {});
    categorieService
      .list()
      .then((r) => setCategories(asList(r)))
      .catch(() => setCategoriesErreur(true));
  }, []);

  // Charge tous les matériels une fois la modale ouverte
  useEffect(() => {
    if (!addMat || materiels.length) return;
    setMaterielsLoading(true);
    setMaterielsErreur(false);
    materielService
      .list()
      .then((r) => setMateriels(asList(r)))
      .catch(() => setMaterielsErreur(true))
      .finally(() => setMaterielsLoading(false));
  }, [addMat]);

  const composants = useMemo(
    () => [...(pack?.composants || [])].sort((a, b) => (a.idComposant ?? 0) - (b.idComposant ?? 0)),
    [pack]
  );
  const dejaDansPack = useMemo(() => new Set(composants.map((c) => c.materiel?.CodeMateriel)), [composants]);
  const valeurMateriel = composants.reduce(
    (s, c) => s + Number(c.quantite || 0) * Number(c.materiel?.prixLocation || 0),
    0
  );
  const nbSelection = Object.keys(selection).length;

  // Filtrage de la liste
  const materielsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return materiels.filter((m) => {
      if (filtreCategorie && String(m.idCategorie ?? m.categorie?.idCategorie) !== String(filtreCategorie)) return false;
      if (!q) return true;
      return (
        (m.designation || "").toLowerCase().includes(q) ||
        (m.marque || "").toLowerCase().includes(q) ||
        (m.CodeMateriel || "").toLowerCase().includes(q)
      );
    });
  }, [materiels, recherche, filtreCategorie]);

  /* ------------------------- Composants du pack ------------------------- */

  const enregistrerComposants = async (liste, message) => {
    setBusy(true);
    try {
      await PackService.update(pack.codePack, {
        composants: liste.map((c) => ({ CodeMateriel: c.materiel.CodeMateriel, quantite: c.quantite })),
      });
      if (message) toast.success(message);
      await fetchData(true);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const changerQuantite = (c, delta) => {
    const quantite = Math.max(1, c.quantite + delta);
    if (quantite === c.quantite) return;
    enregistrerComposants(
      composants.map((x) => (x.materiel.CodeMateriel === c.materiel.CodeMateriel ? { ...x, quantite } : x))
    );
  };

  const retirer = (c) =>
    enregistrerComposants(
      composants.filter((x) => x.materiel.CodeMateriel !== c.materiel.CodeMateriel),
      "Matériel retiré du pack"
    );

  /* ------------------------- Ajout de matériel ------------------------- */

  const basculer = (m) =>
    setSelection((prev) => {
      const next = { ...prev };
      if (next[m.CodeMateriel]) delete next[m.CodeMateriel];
      else next[m.CodeMateriel] = m;
      return next;
    });

  const basculerTout = () => {
    const dispo = materielsFiltres.filter((m) => !dejaDansPack.has(m.CodeMateriel));
    const tousCoches = dispo.length > 0 && dispo.every((m) => selection[m.CodeMateriel]);
    setSelection((prev) => {
      const next = { ...prev };
      dispo.forEach((m) => {
        if (tousCoches) delete next[m.CodeMateriel];
        else next[m.CodeMateriel] = m;
      });
      return next;
    });
  };

  const ajouterSelection = async () => {
    const nouveaux = Object.values(selection)
      .filter((m) => !dejaDansPack.has(m.CodeMateriel))
      .map((m) => ({ materiel: m, quantite: 1 }));
    if (!nouveaux.length) return;
    const ok = await enregistrerComposants(
      [...composants, ...nouveaux],
      `${nouveaux.length} matériel(s) ajouté(s) au pack`
    );
    if (ok) setSelection({});
  };

  /* ------------------------- Informations du pack ------------------------- */

  const enregistrerInfos = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await PackService.update(pack.codePack, toPayload(infoForm));
      toast.success("Informations du pack modifiées");
      const p = await fetchData(true);
      if (p) setInfoForm(fromPack(p));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const dispoFiltres = materielsFiltres.filter((m) => !dejaDansPack.has(m.CodeMateriel));
  const toutCocheFiltres = dispoFiltres.length > 0 && dispoFiltres.every((m) => selection[m.CodeMateriel]);

  return (
    <>
      <div className="breadcrumbs mb-2 text-sm">
        <ul>
          <li>
            <Link to="/admin/packs" className="inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Packs
            </Link>
          </li>
          <li>{pack?.libelle ?? codePack}</li>
        </ul>
      </div>

      <DataState loading={loading && !pack} error={error} onRetry={() => fetchData()}>
        {pack && (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ImageUrl src={pack.imageUrl} alt={pack.libelle} className="h-16 w-16 shrink-0" />
                    <div>
                      <h1 className="text-2xl font-bold">{pack.libelle}</h1>
                      <p className="font-mono text-xs text-base-content/60">{pack.codePack}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge map={STATUT_PACK} value={pack.statutPack} />
                    <button className="btn btn-sm btn-outline" onClick={() => setModifiePack(true)}>
                      <Pencil size={16} /> Modifier
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => setAddMat(true)}>
                      <Plus size={16} /> Ajouter Matériel
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Info label="Tarif / jour">
                    <span className="font-bold text-primary">{formatMoney(pack.tarifJournalier)}</span>
                  </Info>
                  <Info label="Caution">
                    <span className="font-medium">{formatMoney(pack.prixCaution)}</span>
                  </Info>
                  <Info label="Types d'événement">
                    <span className="badge badge-outline badge-sm capitalize">{pack.typesEvenement || "—"}</span>
                  </Info>
                  <Info label="Matériels">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Boxes size={16} /> {composants.length}
                    </span>
                  </Info>
                </div>

                <Info label="Description">
                  <p className="whitespace-pre-line">{pack.description || "—"}</p>
                </Info>

                <p className="text-xs text-base-content/50">
                  Créé le {formatDateHeure(pack.dateCreation)} · modifié le {formatDateHeure(pack.dateModification)}
                </p>
              </div>
            </div>

            {/* Matériel du pack */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <h2 className="card-title">Matériel du pack</h2>

                {!composants.length ? (
                  <p className="py-8 text-center text-base-content/50">
                    Aucun matériel dans ce pack. Ajoutez-en depuis la section ci-dessous.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Matériel</th>
                          <th>Quantité</th>
                          <th className="text-right">Prix location</th>
                          <th className="text-right">Sous-total</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {composants.map((c) => {
                          const m = c.materiel;
                          return (
                            <tr key={m.CodeMateriel} className="hover:bg-base-200/50">
                              <td>
                                <div className="flex items-center gap-3">
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
                              <td>
                                <div className="join">
                                  <button
                                    className="btn btn-xs join-item"
                                    aria-label="Diminuer la quantité"
                                    disabled={busy || c.quantite <= 1}
                                    onClick={() => changerQuantite(c, -1)}
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="join-item flex min-w-8 items-center justify-center border border-base-300 px-2 text-sm">
                                    {c.quantite}
                                  </span>
                                  <button
                                    className="btn btn-xs join-item"
                                    aria-label="Augmenter la quantité"
                                    disabled={busy}
                                    onClick={() => changerQuantite(c, 1)}
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </td>
                              <td className="whitespace-nowrap text-right">{formatMoney(m.prixLocation)}</td>
                              <td className="whitespace-nowrap text-right font-medium">
                                {formatMoney(Number(c.quantite) * Number(m.prixLocation || 0))}
                              </td>
                              <td className="text-right">
                                <button
                                  className="btn btn-ghost btn-sm btn-square text-error"
                                  title="Retirer du pack"
                                  aria-label="Retirer du pack"
                                  disabled={busy}
                                  onClick={() => retirer(c)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="text-right text-sm">
                            Valeur cumulée du matériel / jour
                          </td>
                          <td className="whitespace-nowrap text-right font-bold">{formatMoney(valeurMateriel)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Ajouter du matériel */}
            <Modal open={addMat} Icone={PackagePlus} title={"Matériel du pack"} pack wide onClose={() => setAddMat(false)}>
              <div className="card bg-base-100 shadow">
                <div className="card-body gap-4">
                  <p className="text-sm text-base-content/60">
                    Cochez les matériels à ajouter, puis validez.
                  </p>

                  {/* Barre de recherche + filtre catégorie */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="input input-bordered flex flex-1 items-center gap-2">
                      <Search size={16} className="opacity-60" />
                      <input
                        type="text"
                        className="grow"
                        placeholder="Rechercher (désignation, marque, code)..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                      />
                    </label>
                    <label className="select select-bordered flex items-center gap-2 sm:w-64">
                      <Layers size={16} className="opacity-60" />
                      <select
                        className="grow bg-transparent focus:outline-none"
                        value={filtreCategorie}
                        onChange={(e) => setFiltreCategorie(e.target.value)}
                        disabled={categoriesErreur}
                      >
                        <option value="">Toutes les catégories</option>
                        {categories.map((cat) => (
                          <option key={cat.idCategorie} value={cat.idCategorie}>
                            {cat.libelle}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Liste des matériels */}
                  {materielsLoading ? (
                    <div className="flex justify-center py-10">
                      <span className="loading loading-spinner text-primary" />
                    </div>
                  ) : materielsErreur ? (
                    <p className="py-6 text-center text-error">Impossible de charger les matériels.</p>
                  ) : !materielsFiltres.length ? (
                    <p className="py-6 text-center text-base-content/50">Aucun matériel ne correspond.</p>
                  ) : (
                    <>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={toutCocheFiltres}
                          disabled={!dispoFiltres.length}
                          onChange={basculerTout}
                        />
                        Tout sélectionner ({dispoFiltres.length} disponible{dispoFiltres.length > 1 ? "s" : ""})
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {materielsFiltres.map((m) => {
                          const deja = dejaDansPack.has(m.CodeMateriel);
                          const coche = !!selection[m.CodeMateriel];
                          return (
                            <label
                              key={m.CodeMateriel}
                              className={`flex items-center gap-3 rounded-box border p-3 transition ${
                                deja
                                  ? "cursor-not-allowed border-base-300 opacity-60"
                                  : coche
                                    ? "cursor-pointer border-primary bg-primary/10"
                                    : "cursor-pointer border-base-300 hover:bg-base-200/60"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="checkbox checkbox-primary"
                                checked={deja || coche}
                                disabled={deja}
                                onChange={() => basculer(m)}
                              />
                              <ImageUrl src={m.imageURL} alt={m.designation} className="h-10 w-10 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{m.designation}</p>
                                <p className="truncate text-xs opacity-60">
                                  {m.marque}
                                  {m.marque && " · "}
                                  {formatMoney(m.prixLocation)} / jour
                                </p>
                              </div>
                              {deja && <span className="badge badge-ghost badge-sm shrink-0">Dans le pack</span>}
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {nbSelection > 0 && (
                    <div className=" fixed z-[200]  items-center justify-between gap-3 rounded-box bg-primary/10 p-3">
                      <span className="text-sm font-medium">{nbSelection} matériel(s) sélectionné(s)</span>
                      <div className="flex gap-2">
                        <button className="btn btn-sm" disabled={busy} onClick={() => setSelection({})}>
                          Vider
                        </button>
                        <button className="btn btn-primary btn-sm" disabled={busy} onClick={ajouterSelection}>
                          {busy ? <span className="loading loading-spinner loading-xs" /> : <Plus size={16} />}
                          Ajouter au pack
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Modal>

            {/* Informations du pack */}
            <Modal open={modifiePack} title={"Informations du pack"} onClose={() => setModifiePack(false)}>
              <div className="card bg-base-100 shadow">
                <div className="card-body gap-4">
                  {infoForm && (
                    <PackForm
                      idPrefix="info"
                      value={infoForm}
                      onChange={setInfoForm}
                      onSubmit={enregistrerInfos}
                      onCancel={() => setInfoForm(fromPack(pack))}
                      cancelLabel="Réinitialiser"
                      busy={busy}
                      typesOptions={typesOptions}
                    />
                  )}
                </div>
              </div>
            </Modal>
          </div>
        )}
      </DataState>
    </>
  );
}

// import { useEffect, useMemo, useState } from "react";
// import { Link, useLocation } from "react-router-dom";
// import { ArrowLeft, Boxes, Pencil, ChevronDown, Layers, Minus, PackagePlus, Plus, Trash2 } from "lucide-react";
// import DataState from "../../components/DataState";
// import { useToast } from "../../../contexts/ToastContext";
// import StatusBadge from "../../components/StatusBadge";
// import { formatMoney } from "../../../utils/format";
// import { asList } from "../../hooks/useFetch";
// import { ImageUrl } from "../../../components/ImageURL";
// import { PackService } from "../../../data/PackService";
// import Modal from "../../components/Modal";
// import { categorieService } from "../../../data/CategorieService";
// import PackForm, { STATUT_PACK, fromPack, toPayload, typesFromApi } from "./PackForm";

// const formatDateHeure = (d) =>
//   d
//     ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
//     : "—";

// function Info({ label, children }) {
//   return (
//     <div>
//       <p className="text-xs uppercase tracking-wide text-base-content/50">{label}</p>
//       <div className="mt-0.5">{children}</div>
//     </div>
//   );
// }

// export default function PackDetail() {
//   const location = useLocation();
//   const codePack = location.state;
//   const toast = useToast();

//   const [pack, setPack] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [busy, setBusy] = useState(false);
//   const [addMat, setAddMat] = useState(false);
//   const [modifiePack, setModifiePack] = useState(false);

//   const [infoForm, setInfoForm] = useState(null); // section « Informations du pack »
//   const [typesOptions, setTypesOptions] = useState([]);

//   // Section « Ajouter du matériel par catégorie »
//   const [categories, setCategories] = useState([]);
//   const [categoriesErreur, setCategoriesErreur] = useState(false);
//   const [catOuverte, setCatOuverte] = useState(null);
//   const [cache, setCache] = useState({});         // idCategorie -> { materiels } | { loading } | { erreur }
//   const [selection, setSelection] = useState({}); // CodeMateriel -> matériel coché (conservé d'une catégorie à l'autre)

//   // silent = rechargement après une action : pas de spinner plein écran, formulaire d'infos conservé
//   const fetchData = async (silent = false) => {
//     if (!silent) setLoading(true);
//     setError(null);
//     try {
//       const resp = await PackService.detail(codePack);
//       setPack(resp || null);
//       if (resp && !silent) setInfoForm(fromPack(resp));
//       return resp;
//     } catch (err) {
//       if (silent) toast.error(err.message);
//       else setError("Erreur lors du chargement du pack.");
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!codePack) {
//       setError("Aucun pack sélectionné.");
//       setLoading(false);
//       return;
//     }
//     fetchData();
//     PackService.getTypeEvenement()
//       .then((r) => setTypesOptions(typesFromApi(r)))
//       .catch(() => {});
//     categorieService
//       .list()
//       .then((r) => setCategories(asList(r)))
//       .catch(() => setCategoriesErreur(true));
//   }, []);

//   const composants = useMemo(
//     () => [...(pack?.composants || [])].sort((a, b) => (a.idComposant ?? 0) - (b.idComposant ?? 0)),
//     [pack]
//   );
//   const dejaDansPack = useMemo(() => new Set(composants.map((c) => c.materiel?.CodeMateriel)), [composants]);
//   const valeurMateriel = composants.reduce(
//     (s, c) => s + Number(c.quantite || 0) * Number(c.materiel?.prixLocation || 0),
//     0
//   );
//   const nbSelection = Object.keys(selection).length;

//   /* ------------------------- Composants du pack ------------------------- */

//   // Envoie la liste complète des composants : [{ CodeMateriel, quantite }]
//   const enregistrerComposants = async (liste, message) => {
//     setBusy(true);
//     try {
//       await PackService.update(pack.codePack, {
//         composants: liste.map((c) => ({ CodeMateriel: c.materiel.CodeMateriel, quantite: c.quantite })),
//       });
//       if (message) toast.success(message);
//       await fetchData(true);
//       return true;
//     } catch (err) {
//       toast.error(err.message);
//       return false;
//     } finally {
//       setBusy(false);
//     }
//   };

//   const changerQuantite = (c, delta) => {
//     const quantite = Math.max(1, c.quantite + delta);
//     if (quantite === c.quantite) return;
//     enregistrerComposants(
//       composants.map((x) => (x.materiel.CodeMateriel === c.materiel.CodeMateriel ? { ...x, quantite } : x))
//     );
//   };

//   const retirer = (c) =>
//     enregistrerComposants(
//       composants.filter((x) => x.materiel.CodeMateriel !== c.materiel.CodeMateriel),
//       "Matériel retiré du pack"
//     );

//   /* ------------------------- Ajout par catégorie ------------------------- */

//   const ouvrirCategorie = async (cat) => {
//     const id = cat.idCategorie;
//     if (catOuverte === id) {
//       setCatOuverte(null);
//       return;
//     }
//     setCatOuverte(id);
//     if (cache[id]?.materiels) return;
//     setCache((c) => ({ ...c, [id]: { loading: true } }));
//     try {
//       const resp = await categorieService.detail(id);
//       setCache((c) => ({ ...c, [id]: { materiels: resp?.materiels || [] } }));
//     } catch {
//       setCache((c) => ({ ...c, [id]: { erreur: true } }));
//     }
//   };

//   const basculer = (m) =>
//     setSelection((prev) => {
//       const next = { ...prev };
//       if (next[m.CodeMateriel]) delete next[m.CodeMateriel];
//       else next[m.CodeMateriel] = m;
//       return next;
//     });

//   const basculerTout = (materiels) => {
//     const dispo = materiels.filter((m) => !dejaDansPack.has(m.CodeMateriel));
//     const tousCoches = dispo.every((m) => selection[m.CodeMateriel]);
//     setSelection((prev) => {
//       const next = { ...prev };
//       dispo.forEach((m) => {
//         if (tousCoches) delete next[m.CodeMateriel];
//         else next[m.CodeMateriel] = m;
//       });
//       return next;
//     });
//   };

//   const ajouterSelection = async () => {
//     const nouveaux = Object.values(selection)
//       .filter((m) => !dejaDansPack.has(m.CodeMateriel))
//       .map((m) => ({ materiel: m, quantite: 1 }));
//     if (!nouveaux.length) return;
//     const ok = await enregistrerComposants(
//       [...composants, ...nouveaux],
//       `${nouveaux.length} matériel(s) ajouté(s) au pack`
//     );
//     if (ok) setSelection({});
//   };

//   /* ------------------------- Informations du pack ------------------------- */

//   const enregistrerInfos = async (e) => {
//     e.preventDefault();
//     setBusy(true);
//     try {
//       await PackService.update(pack.codePack, toPayload(infoForm));
//       toast.success("Informations du pack modifiées");
//       const p = await fetchData(true);
//       if (p) setInfoForm(fromPack(p));
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <>
//       <div className="breadcrumbs mb-2 text-sm">
//         <ul>
//           <li>
//             <Link to="/admin/packs" className="inline-flex items-center gap-1">
//               <ArrowLeft size={14} /> Packs
//             </Link>
//           </li>
//           <li>{pack?.libelle ?? codePack}</li>
//         </ul>
//       </div>

//       <DataState loading={loading && !pack} error={error} onRetry={() => fetchData()}>
//         {pack && (
//           <div className="space-y-6">
//             {/* En-tête */}
//             <div className="card bg-base-100 shadow">
//               <div className="card-body gap-4">
//                 <div className="flex flex-wrap items-start justify-between gap-3">
//                   <div className="flex items-center gap-3">
//                     <ImageUrl src={pack.imageUrl} alt={pack.libelle} className="h-16 w-16 shrink-0" />
//                     <div>
//                       <h1 className="text-2xl font-bold">{pack.libelle}</h1>
//                       <p className="font-mono text-xs text-base-content/60">{pack.codePack}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <StatusBadge map={STATUT_PACK} value={pack.statutPack} />
//                     <button className="btn btn-sm btn-outline"  onClick={() => setModifiePack(true)}>
//                       <Pencil size={16} /> Modifier
//                     </button>
//                     <button className="btn btn-sm btn-outline" onClick={() => setAddMat(true)}>
//                       <Plus size={16} /> Ajouter Matériel
//                     </button>
//                   </div>
//                 </div>

//                 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//                   <Info label="Tarif / jour">
//                     <span className="font-bold text-primary">{formatMoney(pack.tarifJournalier)}</span>
//                   </Info>
//                   <Info label="Caution">
//                     <span className="font-medium">{formatMoney(pack.prixCaution)}</span>
//                   </Info>
//                   <Info label="Types d'événement">
//                           <span className="badge badge-outline badge-sm capitalize">
//                             {pack.typesEvenement ||  "—"}
//                           </span>
//                   </Info>
//                   <Info label="Matériels">
//                     <span className="inline-flex items-center gap-1 font-medium">
//                       <Boxes size={16} /> {composants.length}
//                     </span>
//                   </Info>
//                 </div>

//                 <Info label="Description">
//                   <p className="whitespace-pre-line">{pack.description || "—"}</p>
//                 </Info>

//                 <p className="text-xs text-base-content/50">
//                   Créé le {formatDateHeure(pack.dateCreation)} · modifié le {formatDateHeure(pack.dateModification)}
//                 </p>
//               </div>
//             </div>

//             {/* Matériel du pack */}
//             <div className="card bg-base-100 shadow">
//               <div className="card-body gap-4">
//                 <h2 className="card-title">Matériel du pack</h2>

//                 {!composants.length ? (
//                   <p className="py-8 text-center text-base-content/50">
//                     Aucun matériel dans ce pack. Ajoutez-en depuis la section ci-dessous.
//                   </p>
//                 ) : (
//                   <div className="overflow-x-auto">
//                     <table className="table">
//                       <thead>
//                         <tr>
//                           <th>Matériel</th>
//                           <th>Quantité</th>
//                           <th className="text-right">Prix location</th>
//                           <th className="text-right">Sous-total</th>
//                           <th />
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {composants.map((c) => {
//                           const m = c.materiel;
//                           return (
//                             <tr key={m.CodeMateriel} className="hover:bg-base-200/50">
//                               <td>
//                                 <div className="flex items-center gap-3">
//                                   <ImageUrl src={m.imageURL} alt={m.designation} />
//                                   <div>
//                                     <div className="font-medium">{m.designation}</div>
//                                     <div className="text-xs opacity-60">
//                                       {m.marque}
//                                       {m.marque && " · "}
//                                       <span className="font-mono">{m.CodeMateriel}</span>
//                                     </div>
//                                   </div>
//                                 </div>
//                               </td>
//                               <td>
//                                 <div className="join">
//                                   <button
//                                     className="btn btn-xs join-item"
//                                     aria-label="Diminuer la quantité"
//                                     disabled={busy || c.quantite <= 1}
//                                     onClick={() => changerQuantite(c, -1)}
//                                   >
//                                     <Minus size={12} />
//                                   </button>
//                                   <span className="join-item flex min-w-8 items-center justify-center border border-base-300 px-2 text-sm">
//                                     {c.quantite}
//                                   </span>
//                                   <button
//                                     className="btn btn-xs join-item"
//                                     aria-label="Augmenter la quantité"
//                                     disabled={busy}
//                                     onClick={() => changerQuantite(c, 1)}
//                                   >
//                                     <Plus size={12} />
//                                   </button>
//                                 </div>
//                               </td>
//                               <td className="whitespace-nowrap text-right">{formatMoney(m.prixLocation)}</td>
//                               <td className="whitespace-nowrap text-right font-medium">
//                                 {formatMoney(Number(c.quantite) * Number(m.prixLocation || 0))}
//                               </td>
//                               <td className="text-right">
//                                 <button
//                                   className="btn btn-ghost btn-sm btn-square text-error"
//                                   title="Retirer du pack"
//                                   aria-label="Retirer du pack"
//                                   disabled={busy}
//                                   onClick={() => retirer(c)}
//                                 >
//                                   <Trash2 size={16} />
//                                 </button>
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                       <tfoot>
//                         <tr>
//                           <td colSpan={3} className="text-right text-sm">
//                             Valeur cumulée du matériel / jour
//                           </td>
//                           <td className="whitespace-nowrap text-right font-bold">{formatMoney(valeurMateriel)}</td>
//                           <td />
//                         </tr>
//                       </tfoot>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Ajouter du matériel par catégorie */}
//             <Modal open={addMat} Icone={PackagePlus} title={"Matériel du pack"} pack wide onClose={() => setAddMat(false)}>
//               <div className="card bg-base-100 shadow">
//                 <div className="card-body gap-4">
//                   <div>
//                     <p className="mt-1 text-sm text-base-content/60">
//                       Ouvrez une catégorie, cochez les matériels voulus (la sélection est conservée d'une catégorie à
//                       l'autre), puis validez.
//                     </p>
//                   </div>

//                   {categoriesErreur ? (
//                     <p className="py-6 text-center text-error">Impossible de charger les catégories.</p>
//                   ) : !categories.length ? (
//                     <p className="py-6 text-center text-base-content/50">Aucune catégorie.</p>
//                   ) : (
//                     <div className="space-y-2">
//                       {categories.map((cat) => {
//                         const id = cat.idCategorie;
//                         const ouverte = catOuverte === id;
//                         const etat = cache[id] || {};
//                         const materiels = etat.materiels || [];
//                         const nbCochesCat = materiels.filter((m) => selection[m.CodeMateriel]).length;
//                         const dispo = materiels.filter((m) => !dejaDansPack.has(m.CodeMateriel));
//                         const toutCoche = dispo.length > 0 && dispo.every((m) => selection[m.CodeMateriel]);
//                         return (
//                           <div key={id} className="rounded-box border border-base-300">
//                             <button
//                               type="button"
//                               aria-expanded={ouverte}
//                               className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
//                               onClick={() => ouvrirCategorie(cat)}
//                             >
//                               <span className="inline-flex items-center gap-2 font-medium">
//                                 <Layers size={16} className="text-primary" />
//                                 {cat.libelle}
//                                 {cat.codeCategorie && (
//                                   <span className="badge badge-outline badge-sm font-mono">{cat.codeCategorie}</span>
//                                 )}
//                               </span>
//                               <span className="flex items-center gap-2">
//                                 {nbCochesCat > 0 && <span className="badge badge-primary badge-sm">{nbCochesCat}</span>}
//                                 <ChevronDown size={16} className={`transition ${ouverte ? "rotate-180" : ""}`} />
//                               </span>
//                             </button>

//                             {ouverte && (
//                               <div className="border-t border-base-300 p-3">
//                                 {etat.loading ? (
//                                   <div className="flex justify-center py-6">
//                                     <span className="loading loading-spinner text-primary" />
//                                   </div>
//                                 ) : etat.erreur ? (
//                                   <p className="py-4 text-center text-error">
//                                     Impossible de charger les matériels. Refermez puis rouvrez la catégorie.
//                                   </p>
//                                 ) : !materiels.length ? (
//                                   <p className="py-4 text-center text-base-content/50">Aucun matériel dans cette catégorie.</p>
//                                 ) : (
//                                   <>
//                                     <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm">
//                                       <input
//                                         type="checkbox"
//                                         className="checkbox checkbox-primary checkbox-sm"
//                                         checked={toutCoche}
//                                         disabled={!dispo.length}
//                                         onChange={() => basculerTout(materiels)}
//                                       />
//                                       Tout sélectionner
//                                     </label>
//                                     <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
//                                       {materiels.map((m) => {
//                                         const deja = dejaDansPack.has(m.CodeMateriel);
//                                         const coche = !!selection[m.CodeMateriel];
//                                         return (
//                                           <label
//                                             key={m.CodeMateriel}
//                                             className={`flex items-center gap-3 rounded-box border p-3 transition ${
//                                               deja
//                                                 ? "cursor-not-allowed border-base-300 opacity-60"
//                                                 : coche
//                                                   ? "cursor-pointer border-primary bg-primary/10"
//                                                   : "cursor-pointer border-base-300 hover:bg-base-200/60"
//                                             }`}
//                                           >
//                                             <input
//                                               type="checkbox"
//                                               className="checkbox checkbox-primary"
//                                               checked={deja || coche}
//                                               disabled={deja}
//                                               onChange={() => basculer(m)}
//                                             />
//                                             <ImageUrl src={m.imageURL} alt={m.designation} className="h-10 w-10 shrink-0" />
//                                             <div className="min-w-0 flex-1">
//                                               <p className="truncate text-sm font-medium">{m.designation}</p>
//                                               <p className="truncate text-xs opacity-60">
//                                                 {m.marque}
//                                                 {m.marque && " · "}
//                                                 {formatMoney(m.prixLocation)} / jour
//                                               </p>
//                                             </div>
//                                             {deja && <span className="badge badge-ghost badge-sm shrink-0">Dans le pack</span>}
//                                           </label>
//                                         );
//                                       })}
//                                     </div>
//                                   </>
//                                 )}
//                               </div>
//                             )}
//                           </div>
//                         );
//                       })}
//                     </div>
//                   )}

//                   {nbSelection > 0 && (
//                     <div className="flex flex-wrap items-center justify-between gap-3 rounded-box bg-primary/10 p-3">
//                       <span className="text-sm font-medium">{nbSelection} matériel(s) sélectionné(s)</span>
//                       <div className="flex gap-2">
//                         <button className="btn btn-sm" disabled={busy} onClick={() => setSelection({})}>
//                           Vider
//                         </button>
//                         <button className="btn btn-primary btn-sm" disabled={busy} onClick={ajouterSelection}>
//                           {busy ? <span className="loading loading-spinner loading-xs" /> : <Plus size={16} />}
//                           Ajouter au pack
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </Modal>

//             {/* Informations du pack */}
//             <Modal open={modifiePack} title={"Informations du pack"} onClose={() => setModifiePack(false)}>
//               <div className="card bg-base-100 shadow">
//                 <div className="card-body gap-4">
//                   {infoForm && (
//                     <PackForm
//                       idPrefix="info"
//                       value={infoForm}
//                       onChange={setInfoForm}
//                       onSubmit={enregistrerInfos}
//                       onCancel={() => setInfoForm(fromPack(pack))}
//                       cancelLabel="Réinitialiser"
//                       busy={busy}
//                       typesOptions={typesOptions}
//                     />
//                   )}
//                 </div>
//               </div>
//             </Modal>
//           </div>
//         )}
//       </DataState>
//     </>
//   );
// }
