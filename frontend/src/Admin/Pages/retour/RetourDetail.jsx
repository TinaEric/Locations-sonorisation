import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, Package, User, CreditCard, QrCode,
  AlertTriangle, ClipboardCheck, Wrench, Lock, ShieldCheck,
  Banknote, Calendar, Clock,
} from "lucide-react";
import DataState from "../../components/DataState";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../../contexts/ToastContext";
import { formatMoney } from "../../../utils/format";
import { ImageUrl } from "../../../components/ImageURL";
import { retourService } from "../../../data/RetourService";
import { STATUT_LOCATION } from "../../../utils/statutValue";
import { IMAGES_URL } from "../../../data/Api";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatDateHeure = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

function Info({ label, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-base-content/50">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

const ETATS_RETOUR = [
  { value: "BON_ETAT", label: "Bon état", cls: "text-success", statutItem: "DISPONIBLE" },
  { value: "ABIME", label: "Abîmé", cls: "text-warning", statutItem: "MAINTENANCE" },
  { value: "HS", label: "Hors service", cls: "text-error", statutItem: "HORS_SERVICE" },
  { value: "PERDU", label: "Perdu", cls: "text-error", statutItem: "HORS_SERVICE" },
];

const STATUT_ITEM_CLS = {
  DISPONIBLE: "badge-success",
  LOUE: "badge-primary",
  MAINTENANCE: "badge-warning",
  HORS_SERVICE: "badge-error",
};

const STATUT_ITEM_LABEL = {
  DISPONIBLE: "Disponible",
  LOUE: "Loué",
  MAINTENANCE: "Maintenance",
  HORS_SERVICE: "Hors service",
};

const ETAT_ITEM_CLS = {
  BON_ETAT: "badge-success",
  ABIME: "badge-warning",
  HS: "badge-error",
  PERDU: "badge-error",
};

export default function RetourDetail() {
  const location = useLocation();
  const numReservation = location.state;
  const toast = useToast();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busyMvt, setBusyMvt] = useState(null);

  // États sélectionnés par mouvement (clé = IdMouvement)
  const [etatsSelectionnes, setEtatsSelectionnes] = useState({});
  const [accessoires, setAccessoires] = useState({});

  /* ---------- Chargement ---------- */
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const resp = await retourService.detail(numReservation);
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
    if (!numReservation) {
      setError("Aucune réservation sélectionnée.");
      setLoading(false);
      return;
    }
    fetchData();
  }, []);

  /* ---------- Dérivés ---------- */
  const totalPaye = useMemo(
    () =>
      (reservation?.paiements || []).reduce(
        (s, p) => s + Number(p.montantPaye ?? p.montant ?? 0),
        0
      ),
    [reservation]
  );
  const resteAPayer = Math.max(
    Number(reservation?.montantTotal || 0) - totalPaye,
    0
  );

  /* Tous les mouvements de la réservation (quelle que soit la ligne) */
  const tousMouvements = useMemo(() => {
    if (!reservation) return [];
    const result = [];
    for (const l of reservation.ligneLocations || []) {
      for (const m of l.mouvements || []) {
        result.push({
          ...m,
          idLigne: l.idLigne,
          ligne: l,
          materielLigne: l.materiel,
          packLigne: l.pack,
        });
      }
    }
    return result;
  }, [reservation]);

  /* Mouvements groupés par ligne pour l'affichage */
  const lignesAvecMouvements = useMemo(() => {
    if (!reservation) return [];
    return (reservation.ligneLocations || [])
      .filter((l) => (l.mouvements || []).length > 0)
      .map((l) => ({
        ligne: l,
        mouvements: l.mouvements || [],
      }));
  }, [reservation]);

  /* Compteurs */
  const totalMouvements = tousMouvements.length;
  const totalRetournes = tousMouvements.filter((m) => m.dateRetour).length;
  const tousRetournes = totalMouvements > 0 && totalRetournes === totalMouvements;

  /* ---------- Actions ---------- */
  const setEtat = (idMouvement, etat) =>
    setEtatsSelectionnes((prev) => ({ ...prev, [idMouvement]: etat }));

  const setAccessoire = (idMouvement, valeur) =>
    setAccessoires((prev) => ({ ...prev, [idMouvement]: valeur }));


  const enregistrerRetour = async (mouvement) => {
    const etat = etatsSelectionnes[mouvement.IdMouvement];
    if (!etat) {
      toast.warning("Veuillez sélectionner un état de retour.");
      return;
    }

    setBusyMvt(mouvement.IdMouvement);
    try {
      const resp = await retourService.enregistrerRetour(mouvement.IdMouvement, {
        etatRetour: etat,
        accessoire: accessoires[mouvement.IdMouvement] ?? mouvement.accessoire ?? "",
      });
      console.log("Retour: ", resp)
      const label = ETATS_RETOUR.find((e) => e.value === etat)?.label ?? etat;
      toast.success(
        `Item ${resp.numeroSerie} retourné : ${label}` +
          (resp.statutItem !== "DISPONIBLE"
            ? ` → ${STATUT_ITEM_LABEL[resp.statutItem] || resp.statutItem}`
            : "")
      );

      // Nettoyer l'état local pour ce mouvement
      setEtatsSelectionnes((prev) => {
        const next = { ...prev };
        delete next[mouvement.IdMouvement];
        return next;
      });
      setAccessoires((prev) => {
        const next = { ...prev };
        delete next[mouvement.IdMouvement];
        return next;
      });

      await fetchData(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyMvt(null);
    }
  };

  const cloturer = async () => {
    if (!tousRetournes) {
      toast.warning("Tous les items doivent être retournés avant la clôture.");
      return;
    }
    if (resteAPayer > 0) {
      toast.warning(
        `Solde impayé : ${formatMoney(resteAPayer)}. Réglez-le avant la clôture.`
      );
      return;
    }

    setBusy(true);
    try {
      await retourService.cloturer(numReservation);
      toast.success("Réservation clôturée avec succès.");
      await fetchData(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Rendu ---------- */
  return (
    <>
      <div className="breadcrumbs mb-2 text-sm">
        <ul>
          <li>
            <Link to="/admin/retours" className="inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Retours
            </Link>
          </li>
          <li>{reservation?.numReservation ?? numReservation}</li>
        </ul>
      </div>

      <DataState
        loading={loading && !reservation}
        error={error}
        onRetry={() => fetchData()}
      >
        {reservation && (
          <div className="space-y-6">
            {/* -------- En-tête -------- */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold">Réception du retour</h1>
                    <p className="font-mono text-xs text-base-content/60">
                      {reservation.numReservation}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      map={STATUT_LOCATION}
                      value={reservation.statutLocation}
                    />
                    {reservation.statutLocation === "EN_COURS" && !tousRetournes && (
                      <span className="badge badge-info gap-1">
                        <Package size={14} />
                        {totalRetournes}/{totalMouvements} item(s) retourné(s)
                      </span>
                    )}
                    {reservation.statutLocation === "RETOUR_A_CONTROLER" && (
                      <button
                        className="btn btn-sm btn-success"
                        disabled={busy || !tousRetournes || resteAPayer > 0}
                        title={
                          resteAPayer > 0
                            ? `Reste à payer : ${formatMoney(resteAPayer)}`
                            : !tousRetournes
                            ? "Tous les items doivent être retournés"
                            : "Clôturer la réservation"
                        }
                        onClick={cloturer}
                      >
                        {busy ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <Lock size={16} />
                        )}
                        Clôturer
                      </button>
                    )}
                    {reservation.statutLocation === "TERMINEE" && (
                      <span className="badge badge-success gap-1">
                        <CheckCircle2 size={14} /> Dossier clôturé
                      </span>
                    )}
                  </div>
                </div>

                {/* Alertes */}
                {reservation.statutLocation === "RETOUR_A_CONTROLER" &&
                  (!tousRetournes || resteAPayer > 0) && (
                    <div className="alert alert-warning py-2 text-sm">
                      <AlertTriangle size={16} />
                      <span>
                        {resteAPayer > 0
                          ? `Solde impayé : ${formatMoney(resteAPayer)}. Réglez-le pour clôturer.`
                          : "Tous les items doivent être retournés avant la clôture."}
                      </span>
                    </div>
                  )}

                {reservation.statutLocation === "EN_COURS" && !tousRetournes && (
                  <div className="alert alert-info py-2 text-sm">
                    <Package size={16} />
                    <span>
                      Enregistrez le retour de chaque item ci-dessous. La
                      réservation passera automatiquement en{" "}
                      <b>Retour à contrôler</b> quand tous les items seront
                      rentrés.
                    </span>
                  </div>
                )}

                {/* Résumé */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  <Info label="Montant total">
                    <span className="font-bold">
                      {formatMoney(reservation.montantTotal)}
                    </span>
                  </Info>
                  <Info label="Reste à payer">
                    <span
                      className={`font-bold ${
                        resteAPayer > 0 ? "text-warning" : "text-success"
                      }`}
                    >
                      {formatMoney(resteAPayer)}
                    </span>
                  </Info>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* -------- Client + Paiements -------- */}
              <div className="space-y-6 lg:col-span-1">
                <div className="card bg-base-100 shadow">
                  <div className="card-body gap-4">
                    <h2 className="card-title">
                      <User size={18} /> Client
                    </h2>
                    <Info label="Nom complet">
                      {reservation.utilisateur?.nomComplet || "—"}
                    </Info>
                    <Info label="Téléphone">
                      {reservation.utilisateur?.telephone || "—"}
                    </Info>
                    <Info label="Email">
                      {reservation.utilisateur?.email || "—"}
                    </Info>
                  </div>
                </div>

                <div className="card bg-base-100 shadow">
                  <div className="card-body gap-4">
                    <h2 className="card-title">
                      <CreditCard size={18} /> Paiements
                    </h2>
                    {!reservation.paiements?.length ? (
                      <p className="text-sm text-base-content/50">
                        Aucun paiement.
                      </p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {reservation.paiements.map((p, i) => (
                          <li
                            key={p.IdPaiement ?? p.idPaiement ?? i}
                            className="flex justify-between border-b pb-1"
                          >
                            <div>
                              <span className="opacity-70">
                                {p.typePaiement || p.modePaiement || "Paiement"}
                              </span>
                              <span className="ml-2 text-xs opacity-50">
                                {formatDateHeure(p.datePaiement)}
                              </span>
                            </div>
                            <span className="font-medium">
                              {formatMoney(p.montantPaye ?? p.montant)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* -------- Contrôle des items -------- */}
              <div className="space-y-6 lg:col-span-2">
                <div className="card bg-base-100 shadow">
                  <div className="card-body gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="card-title">
                        <ClipboardCheck size={18} /> Contrôle des matériels
                      </h2>
                      <span className="badge badge-ghost">
                        {totalRetournes}/{totalMouvements} retourné(s)
                      </span>
                    </div>

                    {!lignesAvecMouvements.length ? (
                      <p className="py-8 text-center text-base-content/50">
                        Aucun item n'a été sorti pour cette réservation.
                      </p>
                    ) : (
                      <div className="space-y-6">
                        {lignesAvecMouvements.map(({ ligne, mouvements }) => {
                          const mat = ligne.materiel || ligne.pack;
                          const image = mat?.imageURL || mat?.photos;
                          const designation = mat?.designation || mat?.libelle;
                          const code = mat?.CodeMateriel || mat?.codePack;
                          const retoursLigne = mouvements.filter(
                            (m) => m.dateRetour
                          ).length;

                          return (
                            <div
                              key={ligne.idLigne}
                              className="rounded-box border border-base-300 p-4"
                            >
                              {/* En-tête ligne */}
                              <div className="mb-4 flex items-center justify-between gap-4 border-b border-base-200 pb-3">
                                <div className="flex items-center gap-4">
                                  <ImageUrl
                                    src={`${IMAGES_URL}/${image}`}
                                    alt={designation}
                                    className="h-12 w-12 shrink-0"
                                  />
                                  <div>
                                    <h3 className="font-bold">{designation}</h3>
                                    <p className="text-sm opacity-70">
                                      {mat?.marque && <>{mat.marque} · </>}
                                      <span className="font-mono">{code}</span>
                                      {ligne.pack && (
                                        <span className="ml-2 badge badge-ghost badge-xs">
                                          Pack · × {ligne.quantite}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`badge badge-sm ${
                                    retoursLigne === mouvements.length
                                      ? "badge-success"
                                      : "badge-ghost"
                                  }`}
                                >
                                  {retoursLigne}/{mouvements.length}
                                </span>
                              </div>

                              {/* Liste des items */}
                              {mouvements.length === 0 ? (
                                <p className="text-sm italic text-base-content/50">
                                  Aucun item n'a été sorti sur cette ligne.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {mouvements.map((m) => {
                                    const estTraite = !!m.dateRetour;
                                    const etatSelectionne =
                                      etatsSelectionnes[m.IdMouvement] || "";
                                    const accessoireValue =
                                      accessoires[m.IdMouvement] ??
                                      m.accessoire ??
                                      "";

                                    return (
                                      <div
                                        key={m.IdMouvement}
                                        className={`flex flex-col gap-3 rounded-box border p-3 sm:flex-row sm:items-center sm:justify-between ${
                                          estTraite
                                            ? "border-success/30 bg-success/5 opacity-80"
                                            : "border-base-200 bg-base-200/40"
                                        }`}
                                      >
                                        {/* Info item */}
                                        <div className="flex items-center gap-3">
                                          <QrCode
                                            size={18}
                                            className={
                                              estTraite
                                                ? "text-success"
                                                : "text-primary"
                                            }
                                          />
                                          <div>
                                            <p className="font-mono font-bold">
                                              {m.item?.numeroSerie ||
                                                `Mvt #${m.IdMouvement}`}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-1 text-xs opacity-70">
                                              <span
                                                className={`badge badge-xs ${
                                                  STATUT_ITEM_CLS[
                                                    m.item?.statutItem
                                                  ] || "badge-ghost"
                                                }`}
                                              >
                                                {STATUT_ITEM_LABEL[
                                                  m.item?.statutItem
                                                ] || m.item?.statutItem}
                                              </span>
                                              {m.item?.etatItem && (
                                                <span
                                                  className={`badge badge-xs ${
                                                    ETAT_ITEM_CLS[
                                                      m.item.etatItem
                                                    ] || "badge-ghost"
                                                  }`}
                                                >
                                                  {m.item.etatItem}
                                                </span>
                                              )}
                                              {m.dateDepart && (
                                                <span className="text-[10px] opacity-60">
                                                  Sorti :{" "}
                                                  {formatDateHeure(m.dateDepart)}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Retour enregistré */}
                                        {estTraite ? (
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span
                                              className={`badge badge-sm ${
                                                ETAT_ITEM_CLS[
                                                  m.etatRetour
                                                ] || "badge-ghost"
                                              } gap-1`}
                                            >
                                              <ShieldCheck size={12} />
                                              {m.etatRetour}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs text-base-content/60">
                                              <Clock size={12} />
                                              {formatDateHeure(m.dateRetour)}
                                            </span>
                                            {m.accessoire && (
                                              <span className="badge badge-ghost badge-xs">
                                                {m.accessoire}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          /* Formulaire de retour */
                                          <div className="flex flex-wrap items-center gap-2">
                                            <select
                                              className="select select-bordered select-sm w-full sm:w-auto"
                                              value={etatSelectionne}
                                              onChange={(e) =>
                                                setEtat(
                                                  m.IdMouvement,
                                                  e.target.value
                                                )
                                              }
                                              disabled={
                                                busy ||
                                                busyMvt === m.IdMouvement
                                              }
                                            >
                                              <option value="">
                                                -- État de retour --
                                              </option>
                                              {ETATS_RETOUR.map((etat) => (
                                                <option
                                                  key={etat.value}
                                                  value={etat.value}
                                                >
                                                  {etat.label}
                                                </option>
                                              ))}
                                            </select>

                                            <input
                                              type="text"
                                              className="input input-bordered input-sm w-full sm:w-48"
                                              placeholder="Accessoire (option.)"
                                              value={accessoireValue}
                                              onChange={(e) =>
                                                setAccessoire(
                                                  m.IdMouvement,
                                                  e.target.value
                                                )
                                              }
                                              disabled={
                                                busy ||
                                                busyMvt === m.IdMouvement
                                              }
                                            />

                                            <button
                                              className="btn btn-sm btn-primary"
                                              disabled={
                                                !etatSelectionne ||
                                                busy ||
                                                busyMvt === m.IdMouvement
                                              }
                                              onClick={() =>
                                                enregistrerRetour(m)
                                              }
                                            >
                                              {busyMvt === m.IdMouvement ? (
                                                <span className="loading loading-spinner loading-xs" />
                                              ) : (
                                                <CheckCircle2 size={14} />
                                              )}
                                              Enregistrer
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Note sur les états */}
                <div className="card bg-base-100 shadow">
                  <div className="card-body py-4">
                    <p className="text-xs text-base-content/60">
                      <b>Règles de retour :</b> les items en bon état redeviennent{" "}
                      <span className="badge badge-success badge-xs">
                        DISPONIBLE
                      </span>
                      , les abîmés passent en{" "}
                      <span className="badge badge-warning badge-xs">
                        MAINTENANCE
                      </span>
                      , les HS/perdus sont{" "}
                      <span className="badge badge-error badge-xs">
                        HORS_SERVICE
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DataState>
    </>
  );
}