import { useState } from "react";
import { Plus } from "lucide-react";
import { reservationService } from "../api/services";
import { useFetch } from "../hooks/useFetch";
import { useToast } from "../../contexts/ToastContext";
import Modal from "./Modal";
import DataState from "./DataState";
import StatusBadge from "./StatusBadge";
import {
  MODES_PAIEMENT,
  MODES_RETRAIT,
  STATUT_LOCATION,
  STATUT_PAIEMENT,
  TYPES_PAIEMENT,
  formatDate,
  formatDateTime,
  formatMoney,
  labelOf,
} from "../utils/format";
import { clientNom, clientTel, duree, ligneLabel, sousTotal, totalPaye } from "../utils/accessors";

const EMPTY_PAIEMENT = {
  typePaiement: "acompte",
  modePaiement: "especes",
  montantPaye: "",
  referencePaiement: "",
};

/** Détail d'une réservation : lignes de location, paiements et solde. */
export default function ReservationDetail({ id, onClose, onChanged }) {
  const toast = useToast();
  const [paiement, setPaiement] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data: r, loading, error, reload } = useFetch(
    () => (id ? reservationService.get(id) : Promise.resolve(null)),
    [id]
  );

  const savePaiement = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await reservationService.ajouterPaiement(id, { ...paiement, montantPaye: Number(paiement.montantPaye) });
      toast.success("Paiement enregistré");
      setPaiement(null);
      reload();
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setPaiement({ ...paiement, [k]: e.target.value });
  const solde = r ? Number(r.montantTotal || 0) - totalPaye(r) : 0;

  return (
    <Modal wide open={!!id} title={`Réservation ${r?.numReservation ?? ""}`} onClose={onClose}>
      <DataState loading={loading} error={error} onRetry={reload}>
        {r && (
          <div className="space-y-6">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="opacity-60">Client</p>
                <p className="font-medium">{clientNom(r)}</p>
                <p>{clientTel(r)}</p>
              </div>
              <div>
                <p className="opacity-60">Statut</p>
                <StatusBadge map={STATUT_LOCATION} value={r.statutLocation} />
              </div>
              <div>
                <p className="opacity-60">Période prévue</p>
                <p>
                  {formatDate(r.dateDebutPrevue)} → {formatDate(r.dateFinPrevue)} ({duree(r)} j)
                </p>
              </div>
              <div>
                <p className="opacity-60">Lieu de l'événement</p>
                <p>{r.lieuEvenement || "—"}</p>
              </div>
              <div>
                <p className="opacity-60">Mode de retrait</p>
                <p>{MODES_RETRAIT[r.modeRetrait] || r.modeRetrait || "—"}</p>
              </div>
              <div>
                <p className="opacity-60">Créée le</p>
                <p>{formatDateTime(r.dateCreation)}</p>
              </div>
              {r.dateRetourReel && (
                <div>
                  <p className="opacity-60">Retour réel</p>
                  <p>{formatDate(r.dateRetourReel)}</p>
                </div>
              )}
              {r.remarques && (
                <div className="sm:col-span-2">
                  <p className="opacity-60">Remarques</p>
                  <p>{r.remarques}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Lignes de location</h4>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Élément</th>
                      <th className="text-right">Qté</th>
                      <th className="text-right">Tarif appliqué</th>
                      <th className="text-right">Sous-total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(r.lignes || []).map((l) => (
                      <tr key={l.id}>
                        <td>{ligneLabel(l)}</td>
                        <td className="text-right">{l.quantite}</td>
                        <td className="text-right">{formatMoney(l.tarifApplique)}</td>
                        <td className="text-right">{formatMoney(sousTotal(l, r))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {Number(r.fraisLivraison) > 0 && (
                      <tr>
                        <td colSpan={3} className="text-right">Frais de livraison</td>
                        <td className="text-right">{formatMoney(r.fraisLivraison)}</td>
                      </tr>
                    )}
                    <tr className="font-bold">
                      <td colSpan={3} className="text-right">Montant total</td>
                      <td className="text-right">{formatMoney(r.montantTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-semibold">Paiements</h4>
                {!paiement && (
                  <button className="btn btn-sm btn-outline" onClick={() => setPaiement({ ...EMPTY_PAIEMENT })}>
                    <Plus size={14} /> Enregistrer un paiement
                  </button>
                )}
              </div>

              {paiement && (
                <form onSubmit={savePaiement} className="mb-3 grid gap-3 rounded-box border border-base-300 p-4 sm:grid-cols-2">
                  <label className="form-control">
                    <span className="label-text mb-1">Type</span>
                    <select className="select select-bordered select-sm w-full" value={paiement.typePaiement} onChange={set("typePaiement")}>
                      {TYPES_PAIEMENT.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="form-control">
                    <span className="label-text mb-1">Mode</span>
                    <select className="select select-bordered select-sm w-full" value={paiement.modePaiement} onChange={set("modePaiement")}>
                      {MODES_PAIEMENT.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="form-control">
                    <span className="label-text mb-1">Montant payé (Ar) *</span>
                    <input required type="number" min="1" className="input input-bordered input-sm w-full" value={paiement.montantPaye} onChange={set("montantPaye")} />
                  </label>
                  <label className="form-control">
                    <span className="label-text mb-1">Référence</span>
                    <input className="input input-bordered input-sm w-full" value={paiement.referencePaiement} onChange={set("referencePaiement")} />
                  </label>
                  <div className="flex justify-end gap-2 sm:col-span-2">
                    <button type="button" className="btn btn-sm" onClick={() => setPaiement(null)}>Annuler</button>
                    <button className="btn btn-primary btn-sm" disabled={busy}>
                      {busy && <span className="loading loading-spinner loading-xs" />}
                      Enregistrer
                    </button>
                  </div>
                </form>
              )}

              {(r.paiements || []).length ? (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Mode</th>
                        <th>Référence</th>
                        <th>Statut</th>
                        <th className="text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.paiements.map((p) => (
                        <tr key={p.id}>
                          <td>{formatDate(p.datePaiement)}</td>
                          <td>{labelOf(TYPES_PAIEMENT, p.typePaiement)}</td>
                          <td>{labelOf(MODES_PAIEMENT, p.modePaiement)}</td>
                          <td className="font-mono text-xs">{p.referencePaiement || "—"}</td>
                          <td><StatusBadge map={STATUT_PAIEMENT} value={p.statutPaiement} /></td>
                          <td className="text-right">{formatMoney(p.montantPaye)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm opacity-60">Aucun paiement enregistré.</p>
              )}

              <div className="mt-3 flex justify-end gap-6 text-sm">
                <span>Payé : <b>{formatMoney(totalPaye(r))}</b></span>
                <span className={solde > 0 ? "text-error" : "text-success"}>
                  Reste à payer : <b>{formatMoney(Math.max(0, solde))}</b>
                </span>
              </div>
            </div>
          </div>
        )}
      </DataState>
    </Modal>
  );
}
