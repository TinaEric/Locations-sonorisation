import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import DataState from "../../components/DataState";
import { useToast } from "../../../contexts/ToastContext";
import StatusBadge from "../../components/StatusBadge";
import { formatMoney } from "../../../utils/format";
import { asList } from "../../hooks/useFetch";
import Modal from "../../components/Modal";
import { ImageUrl } from "../../../components/ImageURL";
import PackForm, { EMPTY_PACK, STATUT_PACK, fromPack, toPayload, typesFromApi } from "./PackForm";
import { PackService } from "../../../data/PackService";

export default function Packs() {
  const navigate = useNavigate();
  const toast = useToast();
  const [packs, setPacks] = useState([]);
  const [typesOptions, setTypesOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("");
  const [form, setForm] = useState(null);        // null = modal fermé ; codePack présent = modification
  const [toDelete, setToDelete] = useState(null); // pack à supprimer (confirmation)
  const [busy, setBusy] = useState(false);
  const [busyCode, setBusyCode] = useState(null); // pack dont le statut est en cours de changement

  // silent = rechargement après une action (pas de spinner plein écran)
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [resp, types] = await Promise.all([
        PackService.list(),
        PackService.getTypeEvenement().catch(() => []),
      ]);
      setPacks(asList(resp));
      setTypesOptions(typesFromApi(types));
    } catch (err) {
      if (silent) toast.error(err.message);
      else setError("Erreur lors du chargement des packs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const liste = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packs.filter(
      (p) =>
        (!statutFiltre || p.statutPack === statutFiltre) &&
        (!q ||
          [p.codePack, p.libelle, p.description,p.typesEvenement].some((v) =>
            v?.toLowerCase().includes(q)
          ))
    );
  }, [packs, search, statutFiltre]);

  const voirDetail = (pack) => navigate("/admin/detailPack", { state: pack.codePack });

  /* ------------------------- Création / modification ------------------------- */

  const modifier = (p) => setForm({ codePack: p.codePack, ...fromPack(p) });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      let pack = {}
      if (form.codePack) {
        pack = form
      } else{
        pack = {
          ...form,
          prixCaution:  0,
          tarifJournalier:  0,
          statutPack: "inactif"
        }
      }
      
      console.log("pack: ", pack)
      if (pack.codePack){
        await PackService.update(pack.codePack, toPayload(pack));
      } else{
        await PackService.create(toPayload(pack));  
      } 
      toast.success(pack.codePack ? "Pack modifié" : "Pack créé");
      setForm(null);
      fetchData(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------- Statut (actif / inactif) ------------------------- */

  const changerStatut = async (p) => {
    const nouveau = p.statutPack === "actif" ? "inactif" : "actif";
    setBusyCode(p.codePack);
    try {
      await PackService.setStatut(p.codePack, nouveau);
      toast.success(nouveau === "actif" ? "Pack activé" : "Pack désactivé");
      fetchData(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyCode(null);
    }
  };

  /* ------------------------- Suppression ------------------------- */

  const supprimer = async () => {
    setBusy(true);
    try {
      await PackService.remove(toDelete.codePack);
      toast.success("Pack supprimé");
      setToDelete(null);
      fetchData(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Boutons d'action d'une ligne (stopPropagation : ne pas ouvrir le détail)
  const actions = (p) => (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        className="btn btn-ghost btn-sm btn-square"
        title={p.statutPack === "actif" ? "Désactiver" : "Activer"}
        aria-label={p.statutPack === "actif" ? "Désactiver" : "Activer"}
        disabled={busyCode === p.codePack}
        onClick={() => changerStatut(p)}
      >
        {busyCode === p.codePack ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <Power size={16} className={p.statutPack === "actif" ? "text-success" : ""} />
        )}
      </button>
      <button className="btn btn-ghost btn-sm btn-square" title="Modifier" aria-label="Modifier" onClick={() => modifier(p)}>
        <Pencil size={16} />
      </button>
      <button
        className="btn btn-ghost btn-sm btn-square text-error"
        title="Supprimer"
        aria-label="Supprimer"
        onClick={() => setToDelete(p)}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  const typesBadges = (p) =>
    (p.typesEvenement || []).length ? (
      <div className="flex flex-wrap gap-1">
        {p.typesEvenement.map((t) => (
          <span key={t} className="badge badge-outline badge-sm capitalize">
            {t}
          </span>
        ))}
      </div>
    ) : (
      "—"
    );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Packs</h1>
          <p className="mt-1 text-sm text-base-content/60">
            Ensembles de matériel prêts à louer pour un type d'événement
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm({ ...EMPTY_PACK })}>
          <Plus size={18} /> Créer un pack
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="input input-bordered flex w-full items-center gap-2 sm:w-72">
          <Search size={16} className="opacity-50" />
          <input
            type="search"
            className="grow"
            placeholder="Libellé, code, type d'événement…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          className="select select-bordered"
          value={statutFiltre}
          onChange={(e) => setStatutFiltre(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_PACK).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card bg-base-100 shadow">
        <DataState loading={loading} error={error} empty={!packs.length} onRetry={() => fetchData()}>
          {!liste.length ? (
            <p className="py-8 text-center text-base-content/50">Aucun pack ne correspond à la recherche.</p>
          ) : (
            <>
              {/* Tableau (écrans moyens et plus) */}
              <div className="hidden overflow-x-auto md:block">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Pack</th>
                      <th>Types d'événement</th>
                      <th>Matériels</th>
                      <th className="text-right">Tarif / jour</th>
                      <th className="text-right">Caution</th>
                      <th>Statut</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {liste.map((p) => (
                      <tr key={p.codePack} onClick={() => voirDetail(p)} className="cursor-pointer hover:bg-base-200/50">
                        <td>
                          <div className="flex items-center gap-3">
                            <ImageUrl src={p.imageUrl} alt={p.libelle} />
                            <div>
                              <div className="font-medium">{p.libelle}</div>
                              <div className="font-mono text-xs opacity-60">{p.codePack}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-outline badge-sm capitalize">{p.typesEvenement || "_"}</span></td>
                        <td>
                          <span className="inline-flex items-center gap-1">
                            <Boxes size={14} className="opacity-60" /> {p.composants?.length || 0}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-right font-medium">{formatMoney(p.tarifJournalier)}</td>
                        <td className="whitespace-nowrap text-right">{formatMoney(p.prixCaution)}</td>
                        <td>
                          <StatusBadge map={STATUT_PACK} value={p.statutPack} />
                        </td>
                        <td>{actions(p)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cartes (mobile) */}
              <ul className="space-y-3 p-4 md:hidden">
                {liste.map((p) => (
                  <li
                    key={p.codePack}
                    onClick={() => voirDetail(p)}
                    className="flex cursor-pointer gap-3 rounded-box border border-base-300 p-3"
                  >
                    <ImageUrl src={p.imageUrl} alt={p.libelle} className="h-16 w-16 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{p.libelle}</p>
                        <StatusBadge map={STATUT_PACK} value={p.statutPack} />
                      </div>
                      <p className="font-mono text-xs opacity-60">{p.codePack}</p>
                          <span className="badge badge-outline badge-sm capitalize">{p.typesEvenement ||  "—"}</span>
                      <p className="text-sm">
                        <b>{formatMoney(p.tarifJournalier)}</b> / jour
                        <span className="opacity-60"> · caution {formatMoney(p.prixCaution)}</span>
                      </p>
                      {actions(p)}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DataState>
      </div>

      {/* Création / modification */}
      <Modal open={!!form} title={form?.codePack ? "Modifier le pack" : "Créer un pack"} onClose={() => setForm(null)}>
        {form && (
          <>
            {form.codePack && (
              <p className="mb-3 text-xs text-base-content/60">
                Code : <span className="font-mono">{form.codePack}</span>
              </p>
            )}
            <PackForm
              idPrefix="modal"
              value={form}
              onChange={setForm}
              onSubmit={save}
              onCancel={() => setForm(null)}
              busy={busy}
              typesOptions={typesOptions}
              typeForm="ajout"
            />
          </>
        )}
      </Modal>

      {/* Confirmation de suppression */}
      <Modal
        open={!!toDelete}
        title="Supprimer ce pack ?"
        onClose={() => setToDelete(null)}
        actions={
          <>
            <button className="btn" onClick={() => setToDelete(null)}>
              Annuler
            </button>
            <button className="btn btn-error" onClick={supprimer} disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" />}
              Supprimer
            </button>
          </>
        }
      >
        <p>
          « {toDelete?.libelle} » sera définitivement supprimé. Le matériel qui le compose n'est pas affecté.
        </p>
      </Modal>
    </>
  );
}
