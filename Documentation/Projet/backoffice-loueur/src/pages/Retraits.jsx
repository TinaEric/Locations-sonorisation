import { useEffect, useMemo, useState } from "react";
import { PackageOpen } from "lucide-react";
import { itemService, reservationService, retraitService } from "../api/services";
import { asList, useFetch } from "../hooks/useFetch";
import { useToast } from "../../contexts/ToastContext";
import PageHeader from "../components/PageHeader";
import DataState from "../components/DataState";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { ETAT_ITEM, ETATS_DEPART, MODES_RETRAIT, STATUT_LOCATION, formatDate } from "../utils/format";
import { clientNom, ligneLabel } from "../utils/accessors";

/**
 * Un « emplacement à pourvoir » = une unité physique à remettre au client.
 * - ligne matériel : `quantite` unités du matériel
 * - ligne pack     : pour chaque composant, quantite × composant.quantite unités
 */
function buildSlots(res) {
  const slots = [];
  (res?.lignes || []).forEach((l) => {
    if (l.typeItem === "pack") {
      (l.pack?.composants || []).forEach((c) => {
        for (let i = 0; i < c.quantite * l.quantite; i++) {
          slots.push({
            key: `${l.id}-${c.id}-${i}`,
            idLigne: l.id,
            materiel: c.materiel,
            obligatoire: c.obligatoire !== false,
            origine: ligneLabel(l),
          });
        }
      });
    } else {
      for (let i = 0; i < l.quantite; i++) {
        slots.push({
          key: `${l.id}-${i}`,
          idLigne: l.id,
          materiel: l.materiel,
          obligatoire: true,
          origine: null,
        });
      }
    }
  });
  return slots;
}

function RetraitModal({ reservation, onClose, onDone }) {
  const toast = useToast();
  const [res, setRes] = useState(null);
  const [dispo, setDispo] = useState({}); // idMateriel -> items disponibles
  const [choices, setChoices] = useState({});
  const [observations, setObservations] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!reservation) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setChoices({});
    setObservations("");
    (async () => {
      try {
        const detail = await reservationService.get(reservation.id);
        const ids = [...new Set(buildSlots(detail).map((s) => s.materiel?.id).filter(Boolean))];
        const lists = await Promise.all(
          ids.map((idMateriel) => itemService.list({ idMateriel, statutItem: "disponible" }))
        );
        if (cancelled) return;
        setRes(detail);
        setDispo(Object.fromEntries(ids.map((id, i) => [id, asList(lists[i])])));
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reservation]);

  const slots = useMemo(() => buildSlots(res), [res]);

  const choice = (key) => choices[key] || { idItem: "", etatDepart: "bon", accessoire: "" };
  const setChoice = (key, patch) => setChoices({ ...choices, [key]: { ...choice(key), ...patch } });

  const takenIds = (exceptKey) =>
    Object.entries(choices)
      .filter(([k, c]) => k !== exceptKey && c.idItem)
      .map(([, c]) => String(c.idItem));

  const missing = slots.filter((s) => s.obligatoire && !choice(s.key).idItem);

  const submit = async (e) => {
    e.preventDefault();
    if (missing.length) {
      toast.error(`${missing.length} exemplaire(s) obligatoire(s) restent à affecter`);
      return;
    }
    setBusy(true);
    try {
      await retraitService.enregistrer(reservation.id, {
        observations,
        mouvements: slots
          .filter((s) => choice(s.key).idItem)
          .map((s) => ({
            idLigne: s.idLigne,
            idItem: choice(s.key).idItem,
            etatDepart: choice(s.key).etatDepart,
            accessoire: choice(s.key).accessoire,
          })),
      });
      toast.success("Retrait enregistré");
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal wide open={!!reservation} title={`Retrait — ${reservation?.numReservation ?? ""}`} onClose={onClose}>
      <DataState loading={loading} error={error}>
        {res && (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm opacity-70">
              {clientNom(res)} — {MODES_RETRAIT[res.modeRetrait] || res.modeRetrait || "Retrait"} — début le{" "}
              {formatDate(res.dateDebutPrevue)}
            </p>

            <div className="space-y-2">
              {slots.map((s, idx) => {
                const c = choice(s.key);
                const options = (dispo[s.materiel?.id] || []).filter(
                  (it) => !takenIds(s.key).includes(String(it.id))
                );
                return (
                  <div key={s.key} className="grid gap-2 rounded-box border border-base-300 p-3 sm:grid-cols-12">
                    <div className="sm:col-span-12 text-sm font-medium">
                      {idx + 1}. {s.materiel?.designation}
                      {s.origine && <span className="ml-2 badge badge-outline badge-sm">{s.origine}</span>}
                      {!s.obligatoire && <span className="ml-2 badge badge-ghost badge-sm">optionnel</span>}
                    </div>
                    <select
                      className="select select-bordered select-sm sm:col-span-5"
                      value={c.idItem}
                      onChange={(e) => setChoice(s.key, { idItem: e.target.value })}
                      aria-label="Exemplaire"
                    >
                      <option value="">{s.obligatoire ? "Choisir un exemplaire…" : "Ne pas fournir"}</option>
                      {options.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.numeroSerie} — {ETAT_ITEM[it.etatItem]?.label || it.etatItem}
                        </option>
                      ))}
                    </select>
                    <select
                      className="select select-bordered select-sm sm:col-span-3"
                      value={c.etatDepart}
                      onChange={(e) => setChoice(s.key, { etatDepart: e.target.value })}
                      disabled={!c.idItem}
                      aria-label="État au départ"
                    >
                      {ETATS_DEPART.map((k) => (
                        <option key={k} value={k}>{ETAT_ITEM[k].label}</option>
                      ))}
                    </select>
                    <input
                      className="input input-bordered input-sm sm:col-span-4"
                      placeholder="Accessoires (câbles, pied, housse…)"
                      value={c.accessoire}
                      onChange={(e) => setChoice(s.key, { accessoire: e.target.value })}
                      disabled={!c.idItem}
                    />
                    {!options.length && !c.idItem && (
                      <p className="sm:col-span-12 text-xs text-error">Aucun exemplaire disponible pour ce matériel.</p>
                    )}
                  </div>
                );
              })}
            </div>

            <label className="form-control">
              <span className="label-text mb-1">Observations</span>
              <textarea rows={2} className="textarea textarea-bordered w-full" value={observations} onChange={(e) => setObservations(e.target.value)} />
            </label>

            <div className="modal-action">
              <button type="button" className="btn" onClick={onClose}>Annuler</button>
              <button className="btn btn-primary" disabled={busy}>
                {busy && <span className="loading loading-spinner loading-sm" />}
                Valider le retrait
              </button>
            </div>
          </form>
        )}
      </DataState>
    </Modal>
  );
}

export default function Retraits() {
  const [tab, setTab] = useState("confirmee"); // à remettre | en_cours = déjà retirées
  const [selected, setSelected] = useState(null);

  const { data, loading, error, reload } = useFetch(
    () => reservationService.list({ statutLocation: tab }),
    [tab]
  );
  const items = asList(data);

  return (
    <>
      <PageHeader title="Gestion des retraits" subtitle="Affectez les exemplaires et remettez le matériel aux clients" />

      <div role="tablist" className="tabs tabs-box mb-4 w-fit">
        <button role="tab" className={`tab ${tab === "confirmee" ? "tab-active" : ""}`} onClick={() => setTab("confirmee")}>
          À remettre
        </button>
        <button role="tab" className={`tab ${tab === "en_cours" ? "tab-active" : ""}`} onClick={() => setTab("en_cours")}>
          Matériel sorti
        </button>
      </div>

      <div className="card bg-base-100 shadow">
        <DataState loading={loading} error={error} empty={!items.length} onRetry={reload}>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Client</th>
                  <th>Mode</th>
                  <th>Début prévu</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-base-200/50">
                    <td className="font-mono text-xs">{r.numReservation}</td>
                    <td className="font-medium">{clientNom(r)}</td>
                    <td>{MODES_RETRAIT[r.modeRetrait] || r.modeRetrait || "—"}</td>
                    <td>{formatDate(r.dateDebutPrevue)}</td>
                    <td><StatusBadge map={STATUT_LOCATION} value={r.statutLocation} /></td>
                    <td className="text-right">
                      {tab === "confirmee" && (
                        <button className="btn btn-primary btn-sm" onClick={() => setSelected(r)}>
                          <PackageOpen size={16} /> Enregistrer le retrait
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </div>

      <RetraitModal
        reservation={selected}
        onClose={() => setSelected(null)}
        onDone={() => {
          setSelected(null);
          reload();
        }}
      />
    </>
  );
}
