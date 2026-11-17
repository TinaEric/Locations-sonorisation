import { useMemo, useState } from "react";
import { ChevronRight, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { categorieService } from "../../../data/CategorieService";
import { asList, useFetch } from "../../hooks/useFetch";
import { useToast } from "../../../contexts/ToastContext";
import PageHeader from "../../components/PageHeader";
import DataState from "../../components/DataState";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";
import { STATUT_CATEGORIE } from "../../../utils/statutValue";
import { useNavigate } from "react-router-dom";

const EMPTY = {
  libelle: "",
  descriptionCategorie: "",
  niveau: 1,
  idParent: null,
  statutCategorie: "actif",
};

export default function Categories() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("");
  const [niveauFiltre, setNiveauFiltre] = useState("");
  const [vue, setVue] = useState("liste"); // "liste" | "arborescence"
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  // On charge soit toutes les catégories, soit l'arborescence
  const {
    data: rawList,
    loading: loadingList,
    error: errorList,
    reload: reloadList,
  } = useFetch(() => categorieService.list(), []);

  const {
    data: rawTree,
    loading: loadingTree,
    error: errorTree,
    reload: reloadTree,
  } = useFetch(() => categorieService.arborescence(), []);

  const items = asList(rawList);
  const arbre = asList(rawTree);

  const loading = vue === "arborescence" ? loadingTree : loadingList;
  const error = vue === "arborescence" ? errorTree : errorList;
  const reload = () => {
    reloadList();
    reloadTree();
  };

  // Index des libellés de parents pour affichage
  const parentsMap = useMemo(() => {
    const map = new Map();
    items.forEach((c) => map.set(c.idCategorie, c));
    return map;
  }, [items]);

  const liste = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (p) =>
        (!statutFiltre || p.statutCategorie === statutFiltre) &&
        (!niveauFiltre || Number(p.niveau) === Number(niveauFiltre)) &&
        (!q ||
          [p.idCategorie, p.libelle, p.descriptionCategorie].some((v) =>
            v?.toLowerCase().includes(q)
          ))
    );
  }, [items, search, statutFiltre, niveauFiltre]);

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

  const supprimerCategorie = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const response = await categorieService.remove(toDelete.idCategorie);
      toast.success(response.message);
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      libelle: form.libelle,
      descriptionCategorie: form.descriptionCategorie,
      niveau: Number(form.niveau),
      idParent: Number(form.niveau) === 2 ? form.idParent : null,
      statutCategorie: form.statutCategorie,
    };
    const message = form.idCategorie
      ? `Catégorie '${form.idCategorie}' modifiée avec succès`
      : "Catégorie créée avec succès";
    run(
      () =>
        form.idCategorie
          ? categorieService.update(form.idCategorie, payload)
          : categorieService.create(payload),
      message,
      () => setForm(null)
    );
  };

  const voirDetail = (categorie) => {
    navigate("/admin/categories/detailCategorie", { state: categorie.idCategorie });
  };

  const deleteCategorie = (c) => {
    setToDelete({
      idCategorie: c.idCategorie,
      libelle: c.libelle,
      materiels: c.materiels?.length || 0,
      enfants: c.enfants?.length || 0,
    });
  };

  const toggle = (c) =>
    run(
      () =>
        categorieService.setStatut(
          c.idCategorie,
          c.statutCategorie === "actif" ? "inactif" : "actif"
        ),
      "Statut mis à jour"
    );

  const parentsNiveau1 = items.filter((c) => Number(c.niveau) === 1);

  // Rendu d'une ligne (réutilisé pour niveau 1 et 2)
  const renderRow = (c, indent = 0) => (
    <tr
      key={c.idCategorie}
      className="cursor-pointer hover:bg-base-200/50"
      onClick={() => voirDetail(c)}
    >
      <td className="font-mono text-xs">{c.idCategorie}</td>
      <td className="font-medium" style={{ paddingLeft: 8 + indent * 16 }}>
        {indent > 0 && <ChevronRight size={14} className="inline mr-1 opacity-50" />}
        {c.libelle}
      </td>
      <td>
        <span className={`badge ${Number(c.niveau) === 1 ? "badge-primary" : "badge-ghost"}`}>
          Niveau {c.niveau}
        </span>
      </td>
      <td className="text-xs opacity-70">
        {c.idParent ? parentsMap.get(c.idParent)?.libelle ?? c.idParent : "—"}
      </td>
      <td className="max-w-xs truncate">{c.descriptionCategorie || "—"}</td>
      <td>
        <StatusBadge map={STATUT_CATEGORIE} value={c.statutCategorie} />
      </td>
      <td>{c.materiels?.length || 0}</td>
      <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <button
          className="btn btn-ghost btn-sm btn-square"
          title={c.statutCategorie === "actif" ? "Désactiver" : "Activer"}
          onClick={() => toggle(c)}
          disabled={busy}
        >
          <Power size={16} />
        </button>
        <button
          className="btn btn-ghost btn-sm btn-square"
          onClick={() => setForm({ ...EMPTY, ...c })}
          aria-label="Modifier"
        >
          <Pencil size={16} />
        </button>
        <button
          className="btn btn-ghost btn-sm btn-square text-error"
          onClick={() => deleteCategorie(c)}
          aria-label="Supprimer"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );

  return (
    <>
      <PageHeader
        title="Catégories"
        subtitle="Classement hiérarchique du matériel (sonorisation, éclairage, scène…)"
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
            placeholder="Libellé, ID, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <select
          className="select select-bordered"
          value={statutFiltre}
          onChange={(e) => setStatutFiltre(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
        </select>

        <select
          className="select select-bordered"
          value={niveauFiltre}
          onChange={(e) => setNiveauFiltre(e.target.value)}
        >
          <option value="">Tous les niveaux</option>
          <option value="1">Niveau 1</option>
          <option value="2">Niveau 2</option>
        </select>

        <div className="join ml-auto">
          <button
            className={`btn join-item btn-sm ${vue === "liste" ? "btn-active" : ""}`}
            onClick={() => setVue("liste")}
          >
            Liste
          </button>
          <button
            className={`btn join-item btn-sm ${vue === "arborescence" ? "btn-active" : ""}`}
            onClick={() => setVue("arborescence")}
          >
            Arborescence
          </button>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <DataState
          loading={loading}
          error={error}
          empty={vue === "liste" ? !items.length : !arbre.length}
          onRetry={reload}
        >
          {vue === "liste" ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Libellé</th>
                    <th>Niveau</th>
                    <th>Parent</th>
                    <th>Description</th>
                    <th>Statut</th>
                    <th>Matériels</th>
                    <th />
                  </tr>
                </thead>
                <tbody>{liste.map((c) => renderRow(c))}</tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Libellé</th>
                    <th>Niveau</th>
                    <th>Parent</th>
                    <th>Description</th>
                    <th>Statut</th>
                    <th>Matériels</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {arbre.map((parent) => (
                    <>
                      {renderRow(parent, 0)}
                      {(parent.enfants ?? []).map((enfant) =>
                        renderRow(enfant, 1)
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataState>
      </div>

      {/* --- Modal Ajout / Modification --- */}
      <Modal
        open={!!form}
        title={form?.idCategorie ? "Modifier la catégorie" : "Ajouter une catégorie"}
        onClose={() => setForm(null)}
      >
        {form && (
          <form onSubmit={save} className="grid gap-3 px-2 sm:grid-cols-2">
            {form?.idCategorie && (
              <label className="form-control sm:col-span-2">
                <span className="label-text mb-1">ID Catégorie</span>
                <input disabled className="input input-bordered w-full" value={form.idCategorie} />
              </label>
            )}

            <label className="form-control">
              <span className="label-text mb-1">Niveau *</span>
              <select
                required
                className="select select-bordered w-full"
                value={form.niveau}
                onChange={set("niveau")}
                disabled={!!form.idCategorie}
              >
                <option value={1}>Niveau 1 — Catégorie racine</option>
                <option value={2}>Niveau 2 — Sous-catégorie</option>
              </select>
            </label>

            {Number(form.niveau) === 2 && (
              <label className="form-control">
                <span className="label-text mb-1">Catégorie parente *</span>
                <select
                  required
                  className="select select-bordered w-full"
                  value={form.idParent ?? ""}
                  onChange={set("idParent")}
                  disabled={!!form.idCategorie}
                >
                  <option value="">— Choisir —</option>
                  {parentsNiveau1.map((p) => (
                    <option key={p.idCategorie} value={p.idCategorie}>
                      {p.libelle} ({p.idCategorie})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="form-control sm:col-span-2">
              <span className="label-text mb-1">Libellé *</span>
              <input
                required
                className="input input-bordered w-full"
                value={form.libelle}
                onChange={set("libelle")}
              />
            </label>

            <label className="form-control sm:col-span-2">
              <span className="label-text mb-1">Description</span>
              <textarea
                rows={3}
                className="textarea textarea-bordered w-full"
                value={form.descriptionCategorie || ""}
                onChange={set("descriptionCategorie")}
              />
            </label>

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

      {/* --- Modal Suppression --- */}
      <Modal
        open={!!toDelete}
        title="Supprimer cette catégorie ?"
        onClose={() => setToDelete(null)}
        supp
        actions={
          <>
            <button className="btn" onClick={() => setToDelete(null)}>
              Annuler
            </button>
            <button
              className="btn btn-error"
              onClick={supprimerCategorie}
              disabled={busy || toDelete?.materiels > 0 || toDelete?.enfants > 0}
            >
              {busy && <span className="loading loading-spinner loading-sm" />}
              Supprimer
            </button>
          </>
        }
      >
        {toDelete?.materiels === 0 && toDelete?.enfants === 0 ? (
          <p>
            Voulez-vous vraiment supprimer « {toDelete?.libelle} » ? Cette action est irréversible.
          </p>
        ) : (
          <p>
            La suppression de « {toDelete?.libelle} » n'est pas autorisée.
            {toDelete?.materiels > 0 && ` (${toDelete.materiels} matériel(s) associé(s))`}
            {toDelete?.enfants > 0 && ` (${toDelete.enfants} sous-catégorie(s))`}
          </p>
        )}
      </Modal>
    </>
  );
}