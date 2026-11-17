import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Boxes, Pencil, Minus, PackagePlus, Plus, Search, Trash2 } from "lucide-react";
import DataState from "../../components/DataState";
import { useToast } from "../../../contexts/ToastContext";
import StatusBadge from "../../components/StatusBadge";
import { formatMoney } from "../../../utils/format";
import { asList } from "../../hooks/useFetch";
import { ImageUrl } from "../../../components/ImageURL";
import { PackService } from "../../../data/PackService";
import Modal from "../../components/Modal";
import { categorieService } from "../../../data/CategorieService";
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

  const [infoForm, setInfoForm] = useState(null); // section « Informations du pack »
  const [typesOptions, setTypesOptions] = useState([]);

  // Section « Ajouter du matériel au pack » : liste à plat de tous les matériels, avec recherche et filtre par catégorie
  const [categories, setCategories] = useState([]);
  const [categoriesErreur, setCategoriesErreur] = useState(false);
  const [materielsDispo, setMaterielsDispo] = useState(null); // null = pas encore chargé ; chaque matériel porte idCategorie / libelleCategorie
  const [materielsLoading, setMaterielsLoading] = useState(false);
  const [materielsErreur, setMaterielsErreur] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("");
  const [selection, setSelection] = useState({}); // CodeMateriel -> matériel coché (conservé quand la recherche ou le filtre change)

  // silent = rechargement après une action : pas de spinner plein écran, formulaire d'infos conservé
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

  const materielsEnChargement =
    materielsLoading || (materielsDispo === null && categories.length > 0 && !materielsErreur);

  // Recherche + filtre par catégorie
  const materielsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return (materielsDispo || []).filter(
      (m) =>
        (!filtreCategorie || m.idCategorie === filtreCategorie) &&
        (!q ||
          [m.CodeMateriel, m.designation, m.marque, m.detailTechnique, m.libelleCategorie].some((v) =>
            v?.toLowerCase().includes(q)
          ))
    );
  }, [materielsDispo, recherche, filtreCategorie]);
  const filtresDispo = materielsFiltres.filter((m) => !dejaDansPack.has(m.CodeMateriel));
  const toutCoche = filtresDispo.length > 0 && filtresDispo.every((m) => selection[m.CodeMateriel]);

  /* ------------------------- Composants du pack ------------------------- */

  // Envoie la liste complète des composants : [{ CodeMateriel, quantite }]
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

  /* ------------------------- Ajout par catégorie ------------------------- */

  // Charge une seule fois tous les matériels (détail de chaque catégorie), en gardant la catégorie d'origine
  const chargerMateriels = async () => {
    setMaterielsLoading(true);
    setMaterielsErreur(false);
    try {
      const details = await Promise.all(categories.map((cat) => categorieService.detail(cat.idCategorie)));
      setMaterielsDispo(
        details.flatMap((d, i) =>
          (d?.materiels || []).map((m) => ({
            ...m,
            idCategorie: categories[i].idCategorie,
            libelleCategorie: categories[i].libelle,
          }))
        )
      );
    } catch {
      setMaterielsErreur(true);
    } finally {
      setMaterielsLoading(false);
    }
  };

  // Chargement à la première ouverture de la fenêtre « Ajouter matériel »
  useEffect(() => {
    if (addMat && categories.length && materielsDispo === null && !materielsLoading) chargerMateriels();
  }, [addMat, categories]);

  const basculer = (m) =>
    setSelection((prev) => {
      const next = { ...prev };
      if (next[m.CodeMateriel]) delete next[m.CodeMateriel];
      else next[m.CodeMateriel] = m;
      return next;
    });

  const basculerTout = (materiels) => {
    const dispo = materiels.filter((m) => !dejaDansPack.has(m.CodeMateriel));
    const tousCoches = dispo.every((m) => selection[m.CodeMateriel]);
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
                    <button className="btn btn-sm btn-outline"  onClick={() => setModifiePack(true)}>
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
                          <span className="badge badge-outline badge-sm capitalize">
                            {pack.typesEvenement ||  "—"}
                          </span>
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

            {/* Ajouter du matériel par catégorie */}
            <Modal open={addMat} Icone={PackagePlus} title={"Matériel du pack"} pack wide onClose={() => setAddMat(false)}>
              <div className="card bg-base-100 shadow">
                <div className="card-body gap-4">
                  <p className="text-sm text-base-content/60">
                    Cochez les matériels à ajouter au pack, puis validez. Recherchez ou filtrez par catégorie pour
                    retrouver un matériel : la sélection est conservée quand la recherche ou le filtre change.
                  </p>

                  {categoriesErreur ? (
                    <p className="py-6 text-center text-error">Impossible de charger les catégories.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-3">
                        <label className="input input-bordered flex w-full items-center gap-2 sm:w-72">
                          <Search size={16} className="opacity-50" />
                          <input
                            type="search"
                            className="grow"
                            placeholder="Désignation, marque, code…"
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                          />
                        </label>
                        <select
                          className="select select-bordered"
                          value={filtreCategorie}
                          onChange={(e) => setFiltreCategorie(e.target.value)}
                          aria-label="Filtrer par catégorie"
                        >
                          <option value="">Toutes les catégories</option>
                          {categories.map((cat) => (
                            <option key={cat.idCategorie} value={cat.idCategorie}>
                              {cat.libelle}
                            </option>
                          ))}
                        </select>
                      </div>

                      {materielsEnChargement ? (
                        <div className="flex justify-center py-8">
                          <span className="loading loading-spinner text-primary" />
                        </div>
                      ) : materielsErreur ? (
                        <div className="py-6 text-center">
                          <p className="text-error">Impossible de charger les matériels.</p>
                          <button className="btn btn-sm mt-3" onClick={chargerMateriels}>
                            Réessayer
                          </button>
                        </div>
                      ) : !materielsDispo?.length ? (
                        <p className="py-6 text-center text-base-content/50">Aucun matériel disponible.</p>
                      ) : !materielsFiltres.length ? (
                        <p className="py-6 text-center text-base-content/50">Aucun matériel ne correspond à la recherche.</p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <label className="inline-flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-primary checkbox-sm"
                                checked={toutCoche}
                                disabled={!filtresDispo.length}
                                onChange={() => basculerTout(materielsFiltres)}
                              />
                              Tout sélectionner
                            </label>
                            <span className="text-base-content/60">{materielsFiltres.length} matériel(s)</span>
                          </div>

                          <ul className="max-h-96 divide-y divide-base-300 overflow-y-auto rounded-box border border-base-300">
                            {materielsFiltres.map((m) => {
                              const deja = dejaDansPack.has(m.CodeMateriel);
                              const coche = !!selection[m.CodeMateriel];
                              return (
                                <li key={m.CodeMateriel}>
                                  <label
                                    className={`flex items-center gap-3 px-3 py-2 transition ${
                                      deja
                                        ? "cursor-not-allowed opacity-60"
                                        : coche
                                          ? "cursor-pointer bg-primary/10"
                                          : "cursor-pointer hover:bg-base-200/60"
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
                                        <span className="font-mono">{m.CodeMateriel}</span>
                                      </p>
                                    </div>
                                    {m.libelleCategorie && (
                                      <span className="badge badge-outline badge-sm hidden shrink-0 sm:inline-flex">
                                        {m.libelleCategorie}
                                      </span>
                                    )}
                                    <span className="shrink-0 whitespace-nowrap text-sm font-medium">
                                      {formatMoney(m.prixLocation)}
                                      <span className="text-xs font-normal opacity-60"> / jour</span>
                                    </span>
                                    {deja && <span className="badge badge-ghost badge-sm shrink-0">Dans le pack</span>}
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </>
                  )}

                  {nbSelection > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-box bg-primary/10 p-3">
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
