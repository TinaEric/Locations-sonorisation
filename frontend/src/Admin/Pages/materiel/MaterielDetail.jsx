import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  ImageOff,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Tag,
  Layers,
  Image as ImageIcon,
  X,
  Check,
  Trash2,
  CircleCheck,
} from "lucide-react";
import DataState from "../../components/DataState";
import StatusBadge, { statusKey } from "../../components/StatusBadge";
import {
  ETAT_ITEM,
  STATUT_CATEGORIE,
  STATUT_ITEM,
} from "../../../utils/statutValue";
import { formatDateTime, formatMoney } from "../../../utils/format";
import { materielService } from "../../../data/materielService";
import { asList, useFetch } from "../../hooks/useFetch";
import Modal from "../../components/Modal";
import { useToast } from "../../../contexts/ToastContext";
import ItemsModal from "../../components/ItemsModal";
import CreateItem from "../../components/CreateItem";
import { ChampText } from "../../../components/ChampInput";
import { ItemService } from "../../../data/ItemService";
import { ImageUrl } from "../../../components/ImageURL";
import { IMAGES_URL } from "../../../data/Api";
import UploadImage from "../../components/UploadImage";

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

// Valeurs par défaut du formulaire d'item (création)
const FORM_ITEM_DEFAUT = {
  numeroSerie: "",
  etatItem: "bon",
  statutItem: "disponible",
  emplacementItem: "",
};

export default function MaterielDetail() {
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deteteMat, setDeteteMat] = useState(false);
  const [etat, setEtat] = useState("");
  const [matForm, setMatForm] = useState(null);
  const [verifieSupp, setVerifieSupp] = useState(null);

  const [form, setForm] = useState(FORM_ITEM_DEFAUT);
  const [editingItem, setEditingItem] = useState(null);
  const defaultImage = "/images/image.png";
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const stateLocation = location.state;
  const code = stateLocation.CodeMateriel;

  const [loading, setLoading] = useState(true);
  const [itemsOf, setItemsOf] = useState(null); // contrôle l'ouverture de la modale items
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [materiel, setMateriel] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await materielService.detail(code);
      console.log("resp mat: ", resp);
      if (resp) {
        setMateriel(resp);
      } else {
        setMateriel(null);
      }
    } catch (err) {
      setError("Erreur lors du chargement des catégories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const modifierMateriel = () =>
    setMatForm({
      CodeMateriel: materiel.CodeMateriel,
      designation: materiel.designation || "",
      marque: materiel.marque || "",
      detailTechnique: materiel.detailTechnique || "",
      imageURL: materiel.imageURL || "",
      prixLocation: materiel.prixLocation,
      prixCaution: materiel.prixCaution,
      idCategorie: materiel.categorie?.idCategorie || "",
    });

  const setCat = (k) => (e) => setMatForm({ ...matForm, [k]: e.target.value });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const counts = useMemo(() => {
    const items = materiel?.items || [];
    const dispo = items.filter(
      (i) => statusKey(i.statutItem) === "disponible"
    ).length;
    return { total: items.length, dispo, autres: items.length - dispo };
  }, [materiel]);

  const statuts = useMemo(
    () => [
      ...new Set(
        (materiel?.items || [])
          .map((i) => statusKey(i.statutItem))
          .filter(Boolean)
      ),
    ],
    [materiel]
  );

  const etats = useMemo(
    () => [
      ...new Set(
        (materiel?.items || [])
          .map((i) => statusKey(i.etatItem))
          .filter(Boolean)
      ),
    ],
    [materiel]
  );

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (materiel?.items || []).filter(
      (i) =>
        (!statut || statusKey(i.statutItem) === statut) &&
        (!etat || statusKey(i.etatItem) === etat) &&
        (!q ||
          [i.numeroSerie, i.emplacementItem].some((v) =>
            v?.toLowerCase().includes(q)
          ))
    );
  }, [materiel, search, statut, etat]);

  const retour = (par) => {
    if (par === "sous"){
      navigate("/admin/categories/detailCategorie", {
        state: materiel.categorie.idCategorie,
      });
    }else{
      navigate("/admin/categories/detailCategorie", {
        state: materiel.categorie.parent.idCategorie,
      });
    }
  };

  const tab1 = {
    lien:
      stateLocation.depart === "categorie"
        ? "/admin/categories"
        : "/admin/materiels",
    titre: stateLocation.depart === "categorie" ? "Catégorie" : "Matériels",
  };

  // ---------- MATERIEL ----------
  const saveMateriel = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { idCategorie, CodeMateriel, ...rest } = matForm;
      const payload = {
        ...rest,
        prixLocation: Number(matForm.prixLocation || 0),
        prixCaution: Number(matForm.prixCaution || 0),
      };

      const response = await materielService.update(CodeMateriel, payload);
      console.log("SAVE: ", response);
      toast.success(`Matériel '${CodeMateriel}' modifié avec succès `);
      setMatForm(null);
      fetchData();
    } catch (err) {
      console.log("SAVEERROR: ", err.message);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...FORM_ITEM_DEFAUT });
    setItemsOf(materiel);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      numeroSerie: item.numeroSerie || "",
      etatItem: statusKey(item.etatItem) || "bon",
      statutItem: statusKey(item.statutItem) || "disponible",
      emplacementItem: item.emplacementItem || "",
    });
    setItemsOf(materiel);
  };

  const closeItemsModal = () => {
    setItemsOf(null);
    setEditingItem(null);
    setForm({ ...FORM_ITEM_DEFAUT });
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        emplacementItem: form.emplacementItem,
        etatItem: form.etatItem,
        statutItem: form.statutItem,
        codeMateriel: materiel.CodeMateriel,
      };
      console.log("Item payload: ", payload, "editing:", editingItem);

      if (editingItem) {
        await ItemService.update(editingItem.numeroSerie, payload);
        toast.success(`Item '${editingItem.numeroSerie}' modifié avec succès `);
      } else {
        await ItemService.create(payload);
        toast.success("Un Item créé avec succès");
      }
      closeItemsModal();
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const supprimerItem = async () => {
    if (!toDelete || statusKey(toDelete.statutItem) === "loue") return;
    setBusy(true);
    try {
      const response = await ItemService.remove(toDelete.numeroSerie);
      console.log("Item supprimé: ", response.message);
      toast.success(response.message);
      setToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const supprimer = async () => {
    setBusy(true);
    try {
      const result = await materielService.remove(materiel.CodeMateriel);
      toast.success(result.message);
      console.log("DELETE Mat: ", result.message);
      setToDelete(false);
      if (materiel?.categorie && stateLocation.depart === "categorie") {
        retour();
      } else {
        navigate("/admin/materiels");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  console.log("mat: ", materiel)

  const verifieDabord = async () => {
    setLoading(true);
    try {
      const resp = await materielService.verifieSupp(code);
      console.log("VERIFIER MAT: ", resp);
      if (resp) setVerifieSupp(resp);
      setDeteteMat(true);
    } catch (err) {
      setError("Erreur lors du chargement des catégories.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="breadcrumbs mb-2 text-sm">
        <ul>
          <li>
            <Link to={tab1.lien} className="inline-flex items-center gap-1">
              <ArrowLeft size={14} /> {tab1.titre}
            </Link>
          </li>
          {materiel?.categorie?.parent && stateLocation.depart === "categorie" && (
            <li>
              <div onClick={() => retour("parent")}>{materiel.categorie.parent.libelle}</div>
            </li>
          )}
          {materiel?.categorie && stateLocation.depart === "categorie" && (
            <li>
              <div onClick={() => retour("sous")}>{materiel.categorie.libelle}</div>
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
                <img
                  src={`${IMAGES_URL}/${materiel.imageURL}`}
                  alt={materiel.designation}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =`${IMAGES_URL}/image.png`;
                  }}
                  className="aspect-square w-full rounded-box object-cover"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold">
                        {materiel.designation}
                      </h1>
                      {materiel.marque && (
                        <span className="badge badge-outline">
                          {materiel.marque}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-base-content/60">
                      {materiel.CodeMateriel}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      className="btn btn-sm"
                      title="Modifier matériel"
                      onClick={modifierMateriel}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="btn btn-sm text-error"
                      title="Supprimer le matériel"
                      onClick={verifieDabord}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-box bg-base-200 p-3">
                    <Banknote className="text-primary" size={22} />
                    <div>
                      <p className="text-xs text-base-content/60">
                        Prix de location / jour
                      </p>
                      <p className="text-lg font-bold">
                        {formatMoney(materiel.prixLocation)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-box bg-base-200 p-3">
                    <ShieldCheck className="text-secondary" size={22} />
                    <div>
                      <p className="text-xs text-base-content/60">Caution</p>
                      <p className="text-lg font-bold">
                        {formatMoney(materiel.prixCaution)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-base-content/50">
                    Détail technique
                  </p>
                  <p className="mt-0.5 whitespace-pre-line">
                    {materiel.detailTechnique || "—"}
                  </p>
                </div>
                  {materiel.categorie && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-base-content/50">Catégorie</p>
                      <div className="mt-1 inline-flex items-center gap-2 rounded-box border border-base-300 px-3 py-2">
                        <Tag size={16} className="text-primary" />
                        <span className="font-medium">{materiel.categorie.libelle}</span>
                        <span className="badge badge-outline badge-sm font-mono">
                          {materiel.categorie.idCategorie}
                        </span>
                        {materiel.categorie.parent && (
                          <span className="badge badge-ghost badge-sm">
                            {materiel.categorie.parent.libelle}
                          </span>
                        )}
                        <StatusBadge map={STATUT_CATEGORIE} value={materiel.categorie.statutCategorie} />
                      </div>
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
                  <Stat
                    label="Disponibles"
                    value={counts.dispo}
                    color="text-success"
                  />
                  <Stat
                    label="Autres"
                    value={counts.autres}
                    color={counts.autres ? "text-warning" : ""}
                  />
                </div>
                <button className="btn btn-accent" onClick={openCreate}>
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
                    <p className="py-8 text-center text-base-content/50">
                      Aucun exemplaire ne correspond.
                    </p>
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
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((i) => (
                            <tr
                              key={i.numeroSerie}
                              className="hover:bg-base-200/50"
                            >
                              <td className="font-mono text-xs">
                                {i.numeroSerie}
                              </td>
                              <td>
                                <StatusBadge
                                  map={ETAT_ITEM}
                                  value={i.etatItem}
                                />
                              </td>
                              <td>
                                <StatusBadge
                                  map={STATUT_ITEM}
                                  value={i.statutItem}
                                />
                              </td>
                              <td>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin size={14} className="opacity-50" />{" "}
                                  {i.emplacementItem || "—"}
                                </span>
                              </td>
                              <td className="whitespace-nowrap text-sm">
                                {formatDateTime(i.dateCreation)}
                              </td>
                              <td>
                                <div className="flex items-center gap-4">
                                  <button
                                    className="btn btn-ghost btn-xs btn-square"
                                    onClick={() => openEdit(i)}
                                    aria-label="Modifier"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-xs btn-square text-error"
                                    disabled={busy}
                                    title={
                                      statusKey(i.statutItem) === "loue"
                                        ? "Exemplaire actuellement loué"
                                        : "Supprimer"
                                    }
                                    onClick={() => setToDelete(i)}
                                    aria-label="Supprimer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
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

      {/* Modale modification matériel */}
      <Modal
        open={!!matForm}
        title="Modifier le Matériel"
        onClose={() => setMatForm(null)}
        cle={materiel?.CodeMateriel}
      >
        {matForm && (
          <form
            onSubmit={saveMateriel}
            className="grid gap-3 px-2 sm:grid-cols-2"
          >
            <ChampText
              id="mat-designation"
              name="designation"
              label="Désignation *"
              icon={Tag}
              required
              value={matForm.designation}
              onChange={setCat("designation")}
            />
            <ChampText
              id="mat-marque"
              name="marque"
              label="Marque"
              icon={Layers}
              value={matForm.marque}
              onChange={setCat("marque")}
            />
            <ChampText
              id="mat-prixLocation"
              name="prixLocation"
              label="Prix location Journalier"
              icon={Layers}
              value={matForm.prixLocation}
              onChange={setCat("prixLocation")}
            />
            <ChampText
              id="mat-prixCaution"
              name="prixCaution"
              label="Prix Caution"
              icon={Layers}
              value={matForm.prixCaution}
              onChange={setCat("prixCaution")}
            />
            <div className="sm:col-span-2">
              <label
                htmlFor="mat-detailTechnique"
                className="mb-1 block text-sm font-medium"
              >
                Détail Technique
              </label>
              <textarea
                id="mat-detailTechnique"
                rows={3}
                className="textarea textarea-bordered w-full"
                value={matForm.detailTechnique}
                onChange={setCat("detailTechnique")}
              />
            </div>
            <UploadImage  
              imageFile={matForm.imageURL}
              label={"Image Matériel"}
              setImageFile={(val) => setMatForm({ ...matForm, imageURL: val })}
            />
            <div className="modal-action sm:col-span-2">
              <button
                type="button"
                className="btn"
                onClick={() => setMatForm(null)}
              >
                Annuler
              </button>
              <button className="btn btn-accent" disabled={busy}>
                {busy && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modale création / édition d'un item */}
      <Modal
        wide
        open={!!itemsOf}
        title={
          editingItem
            ? `Modifier l'exemplaire — ${editingItem.numeroSerie}`
            : `Exemplaires — ${materiel?.designation ?? ""}`
        }
        onClose={closeItemsModal}
      >
        <form
          onSubmit={save}
          className="mb-4 grid gap-3 rounded-box border border-base-300 p-4 sm:grid-cols-4"
        >
          <label className="form-control">
            <span className="label-text mb-1">N° de série</span>
            <input
              disabled
              className="input input-bordered font-bold input-sm w-full"
              value={form.numeroSerie || "Générer par le système"}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">État</span>
            <select
              className="select select-bordered select-sm w-full"
              value={form.etatItem}
              onChange={set("etatItem")}
            >
              {Object.entries(ETAT_ITEM).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Statut</span>
            <select
              className="select select-bordered select-sm w-full"
              value={form.statutItem}
              onChange={set("statutItem")}
            >
              {Object.entries(STATUT_ITEM).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Emplacement</span>
            <input
              className="input input-bordered input-sm w-full"
              value={form.emplacementItem || ""}
              onChange={set("emplacementItem")}
              placeholder="Étagère A2…"
            />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-4">
            <button
              type="button"
              className="btn btn-sm"
              onClick={closeItemsModal}
            >
              <X size={14} /> Annuler
            </button>
            <button className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <Check size={14} />
              )}
              {editingItem ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modale suppression item */}
      <Modal
        open={!!toDelete}
        title="Supprimer cet Item ?"
        onClose={() => setToDelete(null)}
        supp
        actions={
          <>
            <button className="btn" onClick={() => setToDelete(null)}>
              Annuler
            </button>
            <button
              className="btn btn-error"
              onClick={supprimerItem}
              disabled={busy || statusKey(toDelete?.statutItem) === "loue"}
            >
              {busy && <span className="loading loading-spinner loading-sm" />}
              Supprimer
            </button>
          </>
        }
      >
        {statusKey(toDelete?.statutItem) !== "loue" ? (
          <p>
            L'Item « {toDelete?.numeroSerie} » sera définitivement supprimé.
            Cette action est irréversible.
          </p>
        ) : (
          <p>
            La suppression de l'item « {toDelete?.numeroSerie} » n'est pas
            autorisée car il est en location pour le moment.
          </p>
        )}
      </Modal>

      {/* Confirmation de suppression */}
      <Modal
        open={!!deteteMat}
        title="Supprimer ce materiel ?"
        onClose={() => setDeteteMat(false)}
        supp
        actions={
          <>
            <button className="btn" onClick={() => setDeteteMat(false)}>
              Annuler
            </button>
            <button
              className="btn btn-error"
              onClick={supprimer}
              disabled={
                busy ||
                loading ||
                verifieSupp?.statut != "autorise" ||
                verifieSupp?.nbrPackLie != 0
              }
            >
              {(busy || loading) && (
                <span className="loading loading-spinner loading-sm" />
              )}
              Supprimer
            </button>
          </>
        }
      >
        {verifieSupp?.statut != "autorise" ? (
          <div>
            <p>
              La suppression du matériel « {materiel?.designation} » n'est pas
              autorisée:{" "}
            </p>
            {verifieSupp?.nbrReservation != 0 && (
              <div className="flex gap-2 items-center">
                {" "}
                <CircleCheck className="size-4 text-red-600" />{" "}
                {verifieSupp?.nbrReservation} Réservation(s) confirmée(s) lié(s)
              </div>
            )}
            {verifieSupp?.nbrPacks != 0 && (
              <div className="flex gap-2 items-center">
                {" "}
                <CircleCheck className="size-4 text-red-600" />{" "}
                {verifieSupp?.nbrPacks} Pack(s) réservé confirmée
              </div>
            )}
          </div>
        ) : verifieSupp?.nbrPackLie != 0 ? (
          <p>
            La suppression du matériel « {materiel?.designation} (
            {materiel?.CodeMateriel})» n'est pas autorisé car il y a{" "}
            {verifieSupp?.nbrPackLie} Packs qui utilise ce materiel. Veuillez
            remplacer les par d'autre matériel simulaire avant de le supprimer
          </p>
        ) : (
          <p>
            Le materiel « {materiel?.designation} ({materiel?.CodeMateriel})»
            sera définitivement supprimé. L'item qui le compose sera supprimer
            aussi.
          </p>
        )}
      </Modal>
    </>
  );
}
