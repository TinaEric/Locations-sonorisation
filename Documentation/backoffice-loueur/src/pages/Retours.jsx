import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, ReceiptText, TriangleAlert } from "lucide-react";
import { reservationService, retourService } from "../api/services";
import { asList, useFetch } from "../hooks/useFetch";
import { useToast } from "../../contexts/ToastContext";
import PageHeader from "../components/PageHeader";
import DataState from "../components/DataState";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { ETAT_ITEM, ETATS_PROBLEME, ETATS_RETOUR, formatDate, formatMoney } from "../utils/format";
import { clientNom, isRetard, ligneLabel, totalPenalites } from "../utils/accessors";

const DAY = 86400000;
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Contrôle de l'état du matériel (cas « Contrôler l'état du matériel »).
 * Si un exemplaire est endommagé / perdu, ou si le retour est tardif, on peut
 * facturer une pénalité (extension « Facturer pénalités »).
 */
function RetourModal({ reservation, onClose, onDone }) {
  const toast = useToast();
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dateRetourReel, setDateRetourReel] = useState(today());
  const [observations, setObservations] = useState("");
  const [constats, setConstats] = useState({}); // idMouvement -> { etatRetour, accessoire }
  const [facturer, setFacturer] = useState(false);
  const [penalite, setPenalite] = useState({ montant: "", motif: "" });

  useEffect(() => {
    if (!reservation) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDateRetourReel(today());
    setObservations("");
    setFacturer(false);
    setPenalite({ montant: "", motif: "" });
    reservationService
      .get(reservation.id)
      .then((d) => {
        if (cancelled) return;
        setRes(d);
        const init = {};
        (d.lignes || []).forEach((l) =>
          (l.mouvements || []).forEach((m) => {
            init[m.id] = { etatRetour: "bon", accessoire: m.accessoire || "" };
          })
        );
        setConstats(init);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reservation]);

  const mouvements = useMemo(
    () =>
      (res?.lignes || []).flatMap((l) => (l.mouvements || []).map((m) => ({ ...m, ligne: l }))),
    [res]
  );

  const problemes = mouvements.filter((m) => ETATS_PROBLEME.includes(constats[m.id]?.etatRetour));
  const joursRetard = res
    ? Math.max(0, Math.ceil((new Date(dateRetourReel) - new Date(res.dateFinPrevue)) / DAY))
    : 0;
  const suggestion = problemes.length > 0 || joursRetard > 0;

  const setConstat = (id, patch) => setConstats({ ...constats, [id]: { ...constats[id], ...patch } });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const withPenalty = facturer && Number(penalite.montant) > 0;
    try {
      await retourService.enregistrer(reservation.id, {
        dateRetourReel,
        observations,
        mouvements: mouvements.map((m) => ({
          idMouvement: m.id,
          etatRetour: constats[m.id]?.etatRetour || "bon",
          accessoire: constats[m.id]?.accessoire || "",
        })),
        ...(withPenalty ? { penalite: { montant: Number(penalite.montant), motif: penalite.motif } } : {}),
      });
      toast.success(withPenalty ? "Retour enregistré, pénalité facturée" : "Retour enregistré");
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal wide open={!!reservation} title={`Retour — ${reservation?.numReservation ?? ""}`} onClose={onClose}>
      <DataState loading={loading} error={error}>
        {res && (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <p className="text-sm opacity-70">
                {clientNom(res)} — retour prévu le {formatDate(res.dateFinPrevue)}
              </p>
              <label className="form-control">
                <span className="label-text mb-1">Date de retour réelle</span>
                <input
                  type="date"
                  required
                  className="input input-bordered input-sm"
                  value={dateRetourReel}
                  onChange={(e) => setDateRetourReel(e.target.value)}
                />
              </label>
            </div>

            {joursRetard > 0 && (
              <div role="alert" className="alert alert-warning alert-soft text-sm">
                <TriangleAlert size={16} /> Retour tardif : {joursRetard} jour(s) de retard.
              </div>
            )}

            {!mouvements.length && (
              <p className="text-sm opacity-60">Aucun mouvement de retrait enregistré pour cette réservation.</p>
            )}

            <div className="space-y-2">
              {mouvements.map((m) => {
                const c = constats[m.id] || {};
                return (
                  <div key={m.id} className="grid gap-2 rounded-box border border-base-300 p-3 sm:grid-cols-12">
                    <div className="sm:col-span-12 text-sm">
                      <span className="font-medium">{m.item?.materiel?.designation ?? ligneLabel(m.ligne)}</span>
                      <span className="ml-2 font-mono text-xs opacity-70">{m.item?.numeroSerie}</span>
                      <span className="ml-3 text-xs opacity-70">
                        Départ : <StatusBadge map={ETAT_ITEM} value={m.etatDepart} />
                      </span>
                    </div>
                    <select
                      className="select select-bordered select-sm sm:col-span-4"
                      value={c.etatRetour || "bon"}
                      onChange={(e) => setConstat(m.id, { etatRetour: e.target.value })}
                      aria-label="État au retour"
                    >
                      {ETATS_RETOUR.map((k) => (
                        <option key={k} value={k}>{ETAT_ITEM[k].label}</option>
                      ))}
                    </select>
                    <input
                      className="input input-bordered input-sm sm:col-span-8"
                      placeholder="Accessoires restitués / manquants"
                      value={c.accessoire || ""}
                      onChange={(e) => setConstat(m.id, { accessoire: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>

            <label className="form-control">
              <span className="label-text mb-1">
                Observations{problemes.length > 0 && " * (décrivez les dommages / manques)"}
              </span>
              <textarea
                rows={2}
                required={problemes.length > 0}
                className="textarea textarea-bordered w-full"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </label>

            {suggestion && (
              <div className="rounded-box border border-warning/40 bg-warning/10 p-3 space-y-3">
                <label className="label cursor-pointer justify-start gap-3 p-0">
                  <input type="checkbox" className="toggle toggle-warning" checked={facturer} onChange={(e) => setFacturer(e.target.checked)} />
                  <span className="label-text font-medium">Facturer une pénalité</span>
                </label>
                {facturer && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="form-control">
                      <span className="label-text mb-1">Montant (Ar) *</span>
                      <input required type="number" min="1" className="input input-bordered input-sm w-full" value={penalite.montant} onChange={(e) => setPenalite({ ...penalite, montant: e.target.value })} />
                    </label>
                    <label className="form-control sm:col-span-2">
                      <span className="label-text mb-1">Motif</span>
                      <input
                        className="input input-bordered input-sm w-full"
                        value={penalite.motif}
                        onChange={(e) => setPenalite({ ...penalite, motif: e.target.value })}
                        placeholder={joursRetard > 0 ? "Retard, dommages…" : "Dommages, pièces manquantes…"}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            <div className="modal-action">
              <button type="button" className="btn" onClick={onClose}>Annuler</button>
              <button className="btn btn-primary" disabled={busy}>
                {busy && <span className="loading loading-spinner loading-sm" />}
                Valider le retour
              </button>
            </div>
          </form>
        )}
      </DataState>
    </Modal>
  );
}

export default function Retours() {
  const [tab, setTab] = useState("en_cours"); // retours attendus | terminee = historique
  const [selected, setSelected] = useState(null);

  const { data, loading, error, reload } = useFetch(
    () => reservationService.list({ statutLocation: tab }),
    [tab]
  );
  const items = asList(data);

  return (
    <>
      <PageHeader title="Gestion des retours" subtitle="Contrôle de l'état du matériel et facturation des pénalités" />

      <div role="tablist" className="tabs tabs-box mb-4 w-fit">
        <button role="tab" className={`tab ${tab === "en_cours" ? "tab-active" : ""}`} onClick={() => setTab("en_cours")}>
          Retours attendus
        </button>
        <button role="tab" className={`tab ${tab === "terminee" ? "tab-active" : ""}`} onClick={() => setTab("terminee")}>
          Historique
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
                  <th>Retour prévu</th>
                  {tab === "terminee" && (
                    <>
                      <th>Retour réel</th>
                      <th>Pénalités</th>
                    </>
                  )}
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-base-200/50">
                    <td className="font-mono text-xs">{r.numReservation}</td>
                    <td className="font-medium">{clientNom(r)}</td>
                    <td className="whitespace-nowrap">
                      {formatDate(r.dateFinPrevue)}
                      {tab === "en_cours" && isRetard(r) && <span className="badge badge-error badge-sm ml-2">En retard</span>}
                    </td>
                    {tab === "terminee" && (
                      <>
                        <td>{formatDate(r.dateRetourReel)}</td>
                        <td>
                          {totalPenalites(r) > 0 ? (
                            <span className="inline-flex items-center gap-1 text-error">
                              <ReceiptText size={14} /> {formatMoney(totalPenalites(r))}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </>
                    )}
                    <td className="text-right">
                      {tab === "en_cours" && (
                        <button className="btn btn-primary btn-sm" onClick={() => setSelected(r)}>
                          <ClipboardCheck size={16} /> Contrôler le retour
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

      <RetourModal
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
