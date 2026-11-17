import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, Calendar, CheckCircle2, CreditCard, Mail,
  MapPin, Package, Phone, ShieldCheck, Truck, User, XCircle, Lock,
  ClipboardCheck, FileCheck, Ban, Zap,
} from "lucide-react";
import DataState from "../../components/DataState";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";
import { useToast } from "../../../contexts/ToastContext";
import { formatMoney } from "../../../utils/format";
import { ImageUrl } from "../../../components/ImageURL";
import { MODES_RETRAIT, STATUT_LOCATION } from "../../../utils/statutValue";
import { ReservationService } from "../../../data/reservationService";
import { IMAGES_URL } from "../../../data/Api";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const formatDateHeure = (d) =>
  d ? new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }) : "—";

function Info({ label, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-base-content/50">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

export default function ReservationDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const numReservation = location.state;
  const toast = useToast();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [verifDispo, setVerifDispo] = useState(null);
  const [busyVerif, setBusyVerif] = useState(false);

  // Modales
  const [modalRefus, setModalRefus] = useState(null);       // { motif }
  const [modalAnnul, setModalAnnul] = useState(null);       // { motif }
  const [modalAccept, setModalAccept] = useState(null);     // { echeance, acompte }
  const [modalCloture, setModalCloture] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const resp = await ReservationService.detail(numReservation);
      setReservation(resp || null);
      return resp;
    } catch (err) {
      if (silent) toast.error(err.message);
      else setError("Erreur lors du chargement de la réservation.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!numReservation) { setError("Aucune réservation sélectionnée."); setLoading(false); return; }
    fetchData();
  }, []);

  /* --------- Dérivés --------- */
  const totalLignes = useMemo(
    () => (reservation?.ligneLocations || []).reduce((s, l) => s + Number(l.quantite || 0), 0),
    [reservation]
  );

  const totalPaye = useMemo(
    () => (reservation?.paiements || []).reduce((s, p) => s + Number(p.montantPaye ?? p.montant ?? 0), 0),
    [reservation]
  );

  const montantTotal = Number(reservation?.montantTotal || 0);
  const resteAPayer = Math.max(montantTotal - totalPaye, 0);
  const acompteRequis = useMemo(() => {
    // Règle de gestion : acompte = 30 % par défaut (à adapter si stocké en base)
    if (reservation?.acompte != null) return Number(reservation.acompte);
    return Math.round(montantTotal * 0.3 * 100) / 100;
  }, [reservation, montantTotal]);
  const acomptePaye = Math.min(totalPaye, acompteRequis);
  const soldeAPayer = Math.max(resteAPayer, 0);

  const peutConfirmer = reservation?.statutLocation === "EN_ATTENTE_ACOMPTE" && totalPaye >= acompteRequis;

  /* --------- Actions --------- */
  const executer = async (fn, okMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      await fetchData(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const verifierDispo = async () => {
    setBusyVerif(true);
    setVerifDispo(null);
    try {
      const resp = await ReservationService.verifierDisponibilite(numReservation);
      setVerifDispo(resp);
      if (resp?.disponible) toast.success("Tout le matériel est disponible sur la période.");
      else toast.warning("Certains matériels sont indisponibles — consultez le détail.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyVerif(false);
    }
  };

  const accepter = async () => {
    await executer(
      () => ReservationService.accepter(numReservation, {
        acompte: Number(modalAccept?.acompte || acompteRequis),
        echeancePaiement: modalAccept?.echeance || null,
      }),
      "Demande acceptée — en attente d'acompte"
    );
    setModalAccept(null);
  };

  const refuser = async () => {
    if (!modalRefus?.motif?.trim()) { toast.warning("Le motif du refus est obligatoire."); return; }
    await executer(() => ReservationService.refuser(numReservation, modalRefus.motif), "Réservation refusée");
    setModalRefus(null);
  };

  const annuler = async () => {
    if (!modalAnnul?.motif?.trim()) { toast.warning("Le motif d'annulation est obligatoire."); return; }
    await executer(() => ReservationService.annuler(numReservation, modalAnnul.motif), "Réservation annulée");
    setModalAnnul(null);
  };

  const marquerPrete = async () => {
    await executer(() => ReservationService.marquerPrete(numReservation), "Réservation prête pour le retrait");
  };

  const cloturer = async () => {
    if (resteAPayer > 0) {
      toast.warning(`Impossible de clôturer : il reste ${formatMoney(resteAPayer)} à payer.`);
      return;
    }
    await executer(() => ReservationService.cloturer(numReservation), "Réservation clôturée");
    setModalCloture(false);
  };

  const changerStatut = (statutLocation, label) =>
    executer(() => ReservationService.setStatut(numReservation, statutLocation), `Statut : ${label}`);

  /* --------- Boutons selon statut --------- */
  const actionsStatut = () => {
    const s = reservation?.statutLocation;
    const actifs = [];

    if (s === "EN_ATTENTE") {
      actifs.push(
        <button key="verif" className="btn btn-sm btn-outline" disabled={busyVerif || busy} onClick={verifierDispo}>
          {busyVerif ? <span className="loading loading-spinner loading-xs" /> : <ShieldCheck size={16} />}
          Vérifier disponibilité
        </button>,
        <button key="accept" className="btn btn-sm btn-info" disabled={busy}
          onClick={() => setModalAccept({ acompte: acompteRequis, echeance: "" })}>
          <CheckCircle2 size={16} /> Accepter
        </button>,
        <button key="refuse" className="btn btn-sm btn-error btn-outline" disabled={busy}
          onClick={() => setModalRefus({ motif: "" })}>
          <Ban size={16} /> Refuser
        </button>
      );
    }

    if (s === "EN_ATTENTE_ACOMPTE") {
      actifs.push(
        <button key="confirm" className="btn btn-sm btn-success" disabled={busy || !peutConfirmer}
          title={!peutConfirmer ? `Acompte requis : ${formatMoney(acompteRequis)}` : "Confirmer après acompte"}
          onClick={() => changerStatut("CONFIRMEE", "Confirmée")}>
          <CheckCircle2 size={16} /> Confirmer (acompte reçu)
        </button>,
        <button key="cancel" className="btn btn-sm btn-error btn-outline" disabled={busy}
          onClick={() => setModalAnnul({ motif: "" })}>
          <XCircle size={16} /> Annuler
        </button>
      );
    }

    if (s === "CONFIRMEE") {
      actifs.push(
        <button key="pret" className="btn btn-sm btn-accent" disabled={busy} onClick={marquerPrete}>
          <ClipboardCheck size={16} /> Marquer prête
        </button>,
        <button key="cancel" className="btn btn-sm btn-error btn-outline" disabled={busy}
          onClick={() => setModalAnnul({ motif: "" })}>
          <XCircle size={16} /> Annuler
        </button>
      );
    }

    if (s === "PRETE") {
      actifs.push(
        <button key="retrait" className="btn btn-sm btn-primary" disabled={busy}
          onClick={() => navigate("/admin/retraits/detailRetrait", { state: numReservation })}>
          <Truck size={16} /> Préparer le retrait
        </button>
      );
    }

    if (s === "EN_COURS") {
      actifs.push(
        <button key="retour" className="btn btn-sm btn-warning" disabled={busy}
          onClick={() => navigate("/admin/retours/detailRetour", { state: numReservation })}>
          <Package size={16} /> Réceptionner le retour
        </button>
      );
    }

    if (s === "RETOUR_A_CONTROLER") {
      actifs.push(
        <button key="control" className="btn btn-sm btn-warning" disabled={busy}
          onClick={() => navigate("/admin/retours/detailRetour", { state: numReservation })}>
          <ClipboardCheck size={16} /> Contrôler le retour
        </button>
      );
    }

    if (s === "TERMINEE") {
      actifs.push(
        <span key="done" className="badge badge-success gap-1">
          <FileCheck size={14} /> Dossier clôturé
        </span>
      );
    }

    // Clôture possible (retour contrôlé + paiements OK)
    if (["EN_COURS", "RETOUR_A_CONTROLER"].includes(s) && resteAPayer <= 0) {
      actifs.push(
        <button key="cloture" className="btn btn-sm btn-success" disabled={busy}
          onClick={() => setModalCloture(true)}>
          <Lock size={16} /> Clôturer
        </button>
      );
    }

    return actifs;
  };

  return (
    <>
      <div className="breadcrumbs mb-2 text-sm">
        <ul>
          <li>
            <Link to="/admin/reservations" className="inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Réservations
            </Link>
          </li>
          <li>N° {reservation?.numReservation ?? numReservation}</li>
        </ul>
      </div>

      <DataState loading={loading && !reservation} error={error} onRetry={() => fetchData()}>
        {reservation && (
          <div className="space-y-6">
            {/* -------- En-tête -------- */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold">Réservation</h1>
                    <p className="font-mono text-xs text-base-content/60">N° {reservation.numReservation}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge map={STATUT_LOCATION} value={reservation.statutLocation} />
                    {actionsStatut()}
                  </div>
                </div>

                {/* Bloc disponibilité */}
                {verifDispo && (
                  <div className={`alert ${verifDispo.disponible ? "alert-success" : "alert-warning"}`}>
                    <ShieldCheck size={18} />
                    <div>
                      <p className="font-semibold">
                        {verifDispo.disponible ? "Disponibilité confirmée" : "Conflits de disponibilité"}
                      </p>
                      {!verifDispo.disponible && verifDispo.details?.length ? (
                        <ul className="mt-1 list-disc pl-4 text-sm">
                          {verifDispo.details.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Résumé financier */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <Info label="Début prévu">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Calendar size={14} /> {formatDate(reservation.dateDebutPrevue)}
                    </span>
                  </Info>
                  <Info label="Fin prévue">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Calendar size={14} /> {formatDate(reservation.dateFinPrevue)}
                    </span>
                  </Info>
                  <Info label="Mode retrait">
                    <span className="inline-flex items-center gap-1 font-medium">
                      {reservation.modeRetrait === "LIVRAISON" ? <Truck size={14} /> : <Package size={14} />}
                      {MODES_RETRAIT[reservation.modeRetrait] || reservation.modeRetrait || "—"}
                    </span>
                  </Info>
                  <Info label="Montant total">
                    <span className="font-bold text-primary">{formatMoney(montantTotal)}</span>
                  </Info>
                  <Info label="Reste à payer">
                    <span className={`font-bold ${resteAPayer > 0 ? "text-warning" : "text-success"}`}>
                      {formatMoney(resteAPayer)}
                    </span>
                  </Info>
                </div>

                {/* Détail financier */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-box border border-base-300 p-3">
                    <p className="text-xs uppercase tracking-wide text-base-content/50">Acompte requis</p>
                    <p className="text-lg font-bold text-info">{formatMoney(acompteRequis)}</p>
                    <p className="text-xs text-base-content/60">
                      Reçu : {formatMoney(acomptePaye)} {acomptePaye >= acompteRequis && "✓"}
                    </p>
                  </div>
                  <div className="rounded-box border border-base-300 p-3">
                    <p className="text-xs uppercase tracking-wide text-base-content/50">Total payé</p>
                    <p className="text-lg font-bold text-success">{formatMoney(totalPaye)}</p>
                  </div>
                  <div className="rounded-box border border-base-300 p-3">
                    <p className="text-xs uppercase tracking-wide text-base-content/50">Solde restant</p>
                    <p className={`text-lg font-bold ${soldeAPayer > 0 ? "text-warning" : "text-success"}`}>
                      {formatMoney(soldeAPayer)}
                    </p>
                  </div>
                </div>

                {reservation.lieuEvenement && (
                  <Info label="Lieu de l'événement">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} className="opacity-60" /> {reservation.lieuEvenement}
                    </span>
                  </Info>
                )}

                {reservation.remarques && (
                  <Info label="Remarques">
                    <p className="whitespace-pre-line">{reservation.remarques}</p>
                  </Info>
                )}

                <p className="text-xs text-base-content/50">
                  Créée le {formatDateHeure(reservation.dateCreation)}
                </p>
              </div>
            </div>

            {/* -------- Client -------- */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <h2 className="card-title"><User size={18} /> Client</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Info label="Nom complet">{reservation.utilisateur?.nomComplet || "—"}</Info>
                  <Info label="Téléphone">
                    <a href={`tel:${reservation.utilisateur?.telephone}`} className="link link-hover inline-flex items-center gap-1">
                      <Phone size={14} /> {reservation.utilisateur?.telephone || "—"}
                    </a>
                  </Info>
                  <Info label="Email">
                    <a href={`mailto:${reservation.utilisateur?.email}`} className="link link-hover inline-flex items-center gap-1">
                      <Mail size={14} /> {reservation.utilisateur?.email || "—"}
                    </a>
                  </Info>
                  <Info label="Identifiant">
                    <span className="font-mono text-xs">{reservation.utilisateur?.idUser || "—"}</span>
                  </Info>
                </div>
              </div>
            </div>

            {/* -------- Lignes -------- */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <h2 className="card-title">
                  <Package size={18} /> Lignes de location
                  <span className="badge badge-ghost badge-sm">{totalLignes} article(s)</span>
                </h2>

                {!reservation.ligneLocations?.length ? (
                  <p className="py-6 text-center text-base-content/50">Aucune ligne.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Article</th>
                          <th>Type</th>
                          <th className="text-right">Quantité</th>
                          <th className="text-right">Tarif</th>
                          <th className="text-right">Sous-total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservation.ligneLocations.map((l) => {
                          const article = l.materiel || l.pack;
                          const code = article?.CodeMateriel || article?.codePack || `#${l.idLigne}`;
                          const designation = article?.designation || article?.libelle || "—";
                          const image = article?.imageURL || article?.photos;
                          return (
                            <tr key={l.idLigne} className="hover:bg-base-200/50">
                              <td>
                                <div className="flex items-center gap-3">
                                  <ImageUrl 
                                    src={`${IMAGES_URL}/${image}`}
                                   alt={designation} className="h-12 w-12 shrink-0" />
                                  <div>
                                    <div className="font-medium">{designation}</div>
                                    <div className="text-xs opacity-60">
                                      {article?.marque && <>{article.marque} · </>}
                                      <span className="font-mono">{code}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`badge badge-sm ${l.typeLigne === "PACK" ? "badge-secondary" : "badge-accent"}`}>
                                  {l.typeLigne}
                                </span>
                              </td>
                              <td className="text-right">{l.quantite}</td>
                              <td className="whitespace-nowrap text-right">{formatMoney(l.tarifApplique)}</td>
                              <td className="whitespace-nowrap text-right font-medium">
                                {formatMoney(Number(l.quantite) * Number(l.tarifApplique || 0))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* -------- Paiements -------- */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <h2 className="card-title"><CreditCard size={18} /> Paiements</h2>
                {!reservation.paiements?.length ? (
                  <p className="py-4 text-center text-base-content/50">Aucun paiement enregistré.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Référence</th>
                          <th>Date</th>
                          <th>Mode</th>
                          <th className="text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservation.paiements.map((p, i) => (
                          <tr key={p.idPaiement ?? i}>
                            <td className="font-mono text-xs">{p.referencePaiement || `#${p.idPaiement ?? i}`}</td>
                            <td>{formatDateHeure(p.datePaiement)}</td>
                            <td>{p.modePaiement || "—"}</td>
                            <td className="whitespace-nowrap text-right font-medium">
                              {formatMoney(p.montantPaye ?? p.montant)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DataState>

      {/* -------- Modal Accepter -------- */}
      <Modal open={!!modalAccept} title="Accepter la demande" onClose={() => setModalAccept(null)}>
        {modalAccept && (
          <form onSubmit={(e) => { e.preventDefault(); accepter(); }} className="grid gap-3 px-2">
            <p className="text-sm text-base-content/70">
              L'acceptation place la réservation en <b>attente d'acompte</b> et bloque temporairement le stock.
            </p>
            <label className="form-control">
              <span className="label-text mb-1">Acompte requis (Ar) *</span>
              <input type="number" min="0" required className="input input-bordered w-full"
                value={modalAccept.acompte}
                onChange={(e) => setModalAccept({ ...modalAccept, acompte: e.target.value })} />
              <p className="text-xs text-base-content/60 mt-1">Calculé par défaut : {formatMoney(acompteRequis)}</p>
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Échéance de paiement</span>
              <input type="datetime-local" className="input input-bordered w-full"
                value={modalAccept.echeance}
                onChange={(e) => setModalAccept({ ...modalAccept, echeance: e.target.value })} />
            </label>
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => setModalAccept(null)}>Annuler</button>
              <button className="btn btn-info" disabled={busy}>
                {busy && <span className="loading loading-spinner loading-sm" />} Accepter
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* -------- Modal Refuser -------- */}
      <Modal open={!!modalRefus} title="Refuser la demande" onClose={() => setModalRefus(null)} supp>
        {modalRefus && (
          <form onSubmit={(e) => { e.preventDefault(); refuser(); }} className="grid gap-3 px-2">
            <div className="alert alert-warning">
              <AlertTriangle size={18} />
              <span>Le client sera informé du refus.</span>
            </div>
            <label className="form-control">
              <span className="label-text mb-1">Motif du refus *</span>
              <textarea required rows={3} className="textarea textarea-bordered w-full"
                value={modalRefus.motif}
                onChange={(e) => setModalRefus({ motif: e.target.value })} />
            </label>
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => setModalRefus(null)}>Annuler</button>
              <button className="btn btn-error" disabled={busy}>
                {busy && <span className="loading loading-spinner loading-sm" />} Refuser
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* -------- Modal Annuler -------- */}
      <Modal open={!!modalAnnul} title="Annuler la réservation" onClose={() => setModalAnnul(null)} supp>
        {modalAnnul && (
          <form onSubmit={(e) => { e.preventDefault(); annuler(); }} className="grid gap-3 px-2">
            <label className="form-control">
              <span className="label-text mb-1">Motif d'annulation *</span>
              <textarea required rows={3} className="textarea textarea-bordered w-full"
                value={modalAnnul.motif}
                onChange={(e) => setModalAnnul({ motif: e.target.value })} />
            </label>
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => setModalAnnul(null)}>Annuler</button>
              <button className="btn btn-error" disabled={busy}>
                {busy && <span className="loading loading-spinner loading-sm" />} Confirmer l'annulation
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* -------- Modal Clôture -------- */}
      <Modal open={modalCloture} title="Clôturer la réservation" onClose={() => setModalCloture(false)}>
        <div className="grid gap-3 px-2">
          <p className="text-sm">La réservation sera définitivement clôturée :</p>
          <ul className="list-disc pl-5 text-sm text-base-content/70">
            <li>Retour contrôlé</li>
            <li>Solde soldé ({formatMoney(resteAPayer)})</li>
            <li>Historique conservé</li>
          </ul>
          <div className="modal-action">
            <button className="btn" onClick={() => setModalCloture(false)}>Annuler</button>
            <button className="btn btn-success" onClick={cloturer} disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" />}
              <Lock size={16} /> Clôturer définitivement
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}