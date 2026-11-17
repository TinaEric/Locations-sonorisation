import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, Package, User, CreditCard, Box, QrCode,
  Search, Filter, Trash2, ShoppingCart, ClipboardCheck, AlertTriangle,
  Banknote, Layers, ArrowLeftRight, PackageCheck,
} from "lucide-react";
import DataState from "../../components/DataState";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";
import RemplacementModal from "../../components/RemplacementModal";
import { useToast } from "../../../contexts/ToastContext";
import { formatMoney } from "../../../utils/format";
import { ImageUrl } from "../../../components/ImageURL";
import { retraitService } from "../../../data/RetraitService";
import { paiementService } from "../../../data/PaiementService";
import { materielService } from "../../../data/materielService";
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

const ETATS_ITEM = ["BON_ETAT", "ABIME", "HS", "PERDU"];
const MODES_PAIEMENT = ["ESPECES", "MVOLA", "CARTE", "VIREMENT"];
const TYPES_PAIEMENT = ["ACOMPTE", "SOLDE"];
const STATUTS_PAIEMENT = ["PAYE", "EN_ATTENTE"];

const estSelectionnable = (item) =>
  item.statutItem === "DISPONIBLE" &&
  item.etatItem !== "PERDU" &&
  item.etatItem !== "HS" &&
  item.etatItem !== "ENDOMMAGE";

/* -------- Badge stock -------- */
function StockBadge({ stock }) {
  if (!stock) return null;
  const dispo = stock.stockDisponible;
  const total = stock.stockTotal;
  let cls = "badge-success";
  if (dispo === 0) cls = "badge-error";
  else if (dispo < total / 2) cls = "badge-warning";

  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      <span className={`badge badge-sm ${cls} gap-1`}>
        <PackageCheck size={12} /> Dispo : {dispo} / {total}
      </span>
      {stock.stockLoue > 0 && (
        <span className="badge badge-ghost badge-sm">Loués : {stock.stockLoue}</span>
      )}
      {stock.stockMaintenance > 0 && (
        <span className="badge badge-error badge-outline badge-sm">
          Maint. : {stock.stockMaintenance}
        </span>
      )}
    </div>
  );
}

/* -------- Carte d'une sous-ligne (matériel ou composant de pack) -------- */
function SousLigneCard({
  sousLigne,
  stock,
  affectes,
  complet,
  loadingStock,
  onAffecter,
  onRemplacer,
}) {
  const { ligne, materiel, pack, quantite, mouvements } = sousLigne;
  const designation = materiel?.designation || pack?.libelle || "—";
  const code = materiel?.CodeMateriel || pack?.codePack || `#${ligne.idLigne}`;
  const image = materiel?.imageURL || pack?.photos;
  const stockInsuffisant = stock && stock.stockDisponible < quantite - affectes;

  return (
    <div
      className={`flex flex-col gap-4 rounded-box border p-4 sm:flex-row sm:items-start sm:justify-between ${
        stockInsuffisant ? "border-warning bg-warning/5" : "border-base-300"
      }`}
    >
      <div className="flex items-start gap-4">
        <ImageUrl
          src={`${IMAGES_URL}/${image}`}
          alt={designation}
          className="h-16 w-16 shrink-0"
        />
        <div className="space-y-1">
          <h3 className="font-bold">{designation}</h3>
          <p className="text-sm opacity-70">
            {materiel?.marque && <>{materiel.marque} · </>}
            <span className="font-mono">{code}</span>
            {pack && (
              <span className="ml-2 badge badge-ghost badge-xs">
                <Layers size={10} className="mr-1" /> {pack.libelle}
              </span>
            )}
          </p>
          <p className="text-xs text-base-content/50">
            Quantité demandée :{" "}
            <span className="font-bold text-primary">{quantite}</span>
            {pack && ligne.quantite > 1 && (
              <span className="ml-1 opacity-60">
                (× {ligne.quantite} pack)
              </span>
            )}
          </p>

          {loadingStock ? (
            <div className="mt-1 flex items-center gap-2 text-xs text-base-content/60">
              <span className="loading loading-spinner loading-xs" /> Chargement du stock…
            </div>
          ) : (
            <div className="mt-1">
              <StockBadge stock={stock} />
            </div>
          )}

          {stockInsuffisant && (
            <p className="flex items-center gap-1 text-xs text-warning">
              <AlertTriangle size={12} />
              Stock insuffisant ({stock.stockDisponible} disponible(s) pour{" "}
              {quantite - affectes} restant(s))
            </p>
          )}

          {/* Items déjà affectés */}
          {mouvements.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-base-content/60">
                Items affectés ({mouvements.length} / {quantite}) :
              </p>
              <ul className="space-y-0.5 text-xs">
                {mouvements.map((m) => (
                  <li
                    key={m.IdMouvement}
                    className="flex flex-wrap items-center gap-2 text-base-content/70"
                  >
                    <QrCode size={11} className="text-primary" />
                    <span className="font-mono">
                      {m.item?.numeroSerie || `Mvt #${m.IdMouvement}`}
                    </span>
                    <span className="badge badge-ghost badge-xs">
                      {m.item?.etatItem || m.etatDepart || "—"}
                    </span>
                    <span className="text-[10px] opacity-40">
                      {formatDateHeure(m.dateDepart)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <button
          className={`btn btn-sm ${complet ? "btn-success btn-outline" : "btn-outline btn-primary"}`}
          onClick={onAffecter}
          disabled={loadingStock || complet}
        >
          <Box size={16} />
          {complet ? "Complet" : "Affecter les items"}
        </button>

        {stockInsuffisant && (
          <button className="btn btn-sm btn-warning" onClick={onRemplacer}>
            <ArrowLeftRight size={16} /> Remplacer
          </button>
        )}

        <span className={`badge badge-sm ${complet ? "badge-success" : "badge-ghost"}`}>
          {affectes} / {quantite} affecté(s)
        </span>
      </div>
    </div>
  );
}

export default function RetraitDetail() {
  const location = useLocation();
  const numReservation = location.state;
  const toast = useToast();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [stocks, setStocks] = useState({});
  const [loadingStocks, setLoadingStocks] = useState(false);

  const [modalItemOpen, setModalItemOpen] = useState(false);
  const [contexteAffectation, setContexteAffectation] = useState(null);
  const [itemsDisponibles, setItemsDisponibles] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [rechercheItem, setRechercheItem] = useState("");
  const [filtreEtat, setFiltreEtat] = useState("");

  const [modalRempl, setModalRempl] = useState(null);

  const [panier, setPanier] = useState([]);
  const [envoiPanier, setEnvoiPanier] = useState(false);

  const [modalPaiement, setModalPaiement] = useState(false);
  const [paiement, setPaiement] = useState({
    montantPaye: "",
    modePaiement: "ESPECES",
    typePaiement: "SOLDE",
    statutPaiement: "PAYE",
    referencePaiement: "",
    datePaiement: new Date().toISOString().slice(0, 16),
  });
  const [envoiPaiement, setEnvoiPaiement] = useState(false);

  /* ---------- Chargement ---------- */
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const resp = await retraitService.detail(numReservation);
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

  const chargerStocks = async (reservationData) => {
    if (!reservationData) return;
    const codes = new Set();
    for (const l of reservationData.ligneLocations || []) {
      if (l.materiel?.CodeMateriel) codes.add(l.materiel.CodeMateriel);
      if (l.pack?.composants) {
        for (const c of l.pack.composants) {
          if (c.materiel?.CodeMateriel) codes.add(c.materiel.CodeMateriel);
        }
      }
    }
    if (!codes.size) return;

    setLoadingStocks(true);
    try {
      const result = {};
      await Promise.all(
        [...codes].map(async (code) => {
          try {
            const stock = await materielService.stockReel(code);
            result[code] = stock;
          } catch {
            /* silencieux */
          }
        })
      );
      setStocks(result);
    } finally {
      setLoadingStocks(false);
    }
  };

  useEffect(() => {
    if (!numReservation) {
      setError("Aucune réservation sélectionnée.");
      setLoading(false);
      return;
    }
    fetchData().then((data) => {
      if (data) chargerStocks(data);
    });
  }, []);

  const refreshAll = async () => {
    const data = await fetchData(true);
    if (data) await chargerStocks(data);
    return data;
  };

  /* ---------- Ouverture modale affectation ---------- */
  const ouvrirAffectation = async (ligne, codeMateriel, quantite, pack = null) => {
    setContexteAffectation({ ligne, codeMateriel, quantite, pack });
    setModalItemOpen(true);
    setLoadingItems(true);
    setRechercheItem("");
    setFiltreEtat("");
    setPanier([]);
    try {
      const resp = await retraitService.itemsDisponiblesParLigne(numReservation);
      const ligneData = Array.isArray(resp)
        ? resp.find((x) => x.ligneId === ligne.idLigne)
        : null;
      const items = (ligneData?.itemsDisponibles || []).filter(
        (i) => i.materiel?.CodeMateriel === codeMateriel
      );
      setItemsDisponibles(items);
    } catch (err) {
      toast.error("Impossible de charger les items disponibles.");
    } finally {
      setLoadingItems(false);
    }
  };

  /* ---------- Items déjà affectés par matériel (numéro de série) ---------- */
  const dejaAffectesSet = useMemo(() => {
    const set = new Set();
    const mvt = contexteAffectation?.ligne?.mouvements || [];
    const codeMat = contexteAffectation?.codeMateriel;
    for (const m of mvt) {
      if (!m.item?.numeroSerie) continue;
      if (codeMat && m.item?.materiel?.CodeMateriel && m.item.materiel.CodeMateriel !== codeMat) {
        continue;
      }
      set.add(m.item.numeroSerie);
    }
    return set;
  }, [contexteAffectation]);

  const dejaAffectesCount = dejaAffectesSet.size;

  /* ---------- Panier ---------- */
  const togglePanier = (item) => {
    setPanier((prev) => {
      const existe = prev.find((i) => i.numeroSerie === item.numeroSerie);
      if (existe) return prev.filter((i) => i.numeroSerie !== item.numeroSerie);

      const max = (contexteAffectation?.quantite ?? 0) - dejaAffectesCount;
      if (prev.length >= max) {
        toast.warning(`Quantité maximale restante (${max}) atteinte.`);
        return prev;
      }
      return [...prev, item];
    });
  };

  const estDansPanier = (numeroSerie) =>
    panier.some((i) => i.numeroSerie === numeroSerie);

  const validerPanier = async () => {
    if (!panier.length) return;
    setEnvoiPanier(true);
    try {
      await retraitService.creerMouvements(
        numReservation,
        contexteAffectation.ligne.idLigne,
        {
          dateDepart: new Date().toISOString(),
          items: panier.map((item) => ({
            numeroSerie: item.numeroSerie,
            etatDepart: item.etatItem || "BON_ETAT",
            accessoire: "",
          })),
        }
      );
      toast.success(`${panier.length} item(s) affecté(s) avec succès.`);
      setModalItemOpen(false);
      setPanier([]);
      await refreshAll();
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'affectation.");
    } finally {
      setEnvoiPanier(false);
    }
  };

  /* ---------- Remplacement ---------- */
  const ouvrirRemplacement = (sousLigne) => setModalRempl({ sousLigne });

  const confirmerRemplacement = async (codeMateriel) => {
    if (!codeMateriel) {
      toast.warning("Sélectionnez un matériel de remplacement.");
      return;
    }
    setBusy(true);
    try {
      await retraitService.remplacerMateriel(
        numReservation,
        modalRempl.sousLigne.ligne.idLigne,
        { materielCodeMateriel: codeMateriel }
      );
      toast.success("Matériel de remplacement affecté.");
      setModalRempl(null);
      await refreshAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Actions réservation ---------- */
  const marquerPrete = async () => {
    setBusy(true);
    try {
      await retraitService.marquerPrete(numReservation);
      toast.success("Réservation marquée prête.");
      await refreshAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const validerRetrait = async () => {
    setBusy(true);
    try {
      await retraitService.validerRetrait(numReservation);
      toast.success("Sortie enregistrée. Réservation en cours.");
      await refreshAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Paiement ---------- */
  const ouvrirPaiement = () => {
    setPaiement({
      montantPaye: resteAPayer > 0 ? String(resteAPayer) : "",
      modePaiement: "ESPECES",
      typePaiement: "SOLDE",
      statutPaiement: "PAYE",
      referencePaiement: "",
      datePaiement: new Date().toISOString().slice(0, 16),
    });
    setModalPaiement(true);
  };

  const enregistrerPaiement = async (e) => {
    e.preventDefault();
    const montant = Number(paiement.montantPaye);
    if (!montant || montant <= 0) {
      toast.warning("Le montant doit être supérieur à 0.");
      return;
    }
    if (montant > resteAPayer) {
      toast.warning(`Le montant ne peut pas dépasser le solde restant (${formatMoney(resteAPayer)}).`);
      return;
    }
    setEnvoiPaiement(true);
    try {
      await paiementService.create({
        referencePaiement: paiement.referencePaiement?.trim() || `PAY-${Date.now()}`,
        montantPaye: montant,
        statutPaiement: "PAYE",
        typePaiement: paiement.typePaiement,
        modePaiement: paiement.modePaiement,
        reservationNumReservation: numReservation,
      });
      toast.success(`Paiement de ${formatMoney(montant)} enregistré.`);
      setModalPaiement(false);
      await refreshAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnvoiPaiement(false);
    }
  };

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

  const itemsFiltres = useMemo(() => {
    const q = rechercheItem.trim().toLowerCase();
    return itemsDisponibles.filter((i) => {
      if (!estSelectionnable(i)) return false;
      if (dejaAffectesSet.has(i.numeroSerie)) return false;
      if (q) {
        const match =
          (i.numeroSerie || "").toLowerCase().includes(q) ||
          (i.etatItem || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filtreEtat && i.etatItem !== filtreEtat) return false;
      return true;
    });
  }, [itemsDisponibles, rechercheItem, filtreEtat, dejaAffectesSet]);

  /* -------- Sous-lignes : matériel ou pack déplié -------- */
  const sousLignes = useMemo(() => {
    if (!reservation) return [];
    const result = [];
    for (const l of reservation.ligneLocations || []) {
      // Cas 1 : ligne matériel à l'unité
      if (l.materiel) {
        const mvt = (l.mouvements || []).filter(
          (m) =>
            !m.item?.materiel?.CodeMateriel ||
            m.item.materiel.CodeMateriel === l.materiel.CodeMateriel
        );
        result.push({
          key: `${l.idLigne}-MAT`,
          ligne: l,
          materiel: l.materiel,
          pack: null,
          quantite: l.quantite,
          mouvements: mvt,
        });
      }
      // Cas 2 : ligne pack → on déplie chaque composant
      else if (l.pack) {
        for (const c of l.pack.composants || []) {
          if (!c.materiel) continue;
          const qte = Number(c.quantite) * Number(l.quantite);
          const mvt = (l.mouvements || []).filter(
            (m) => m.item?.materiel?.CodeMateriel === c.materiel.CodeMateriel
          );
          result.push({
            key: `${l.idLigne}-${c.idComposant}-${c.materiel.CodeMateriel}`,
            ligne: l,
            materiel: c.materiel,
            pack: l.pack,
            quantite: qte,
            mouvements: mvt,
            composantId: c.idComposant,
          });
        }
      }
    }
    return result;
  }, [reservation]);

  const toutesLignesCompletes = useMemo(
    () =>
      sousLignes.length > 0 &&
      sousLignes.every((s) => (s.mouvements?.length ?? 0) >= s.quantite),
    [sousLignes]
  );

  /* ---------- Rendu ---------- */
  return (
    <>
      <div className="breadcrumbs mb-2 text-sm">
        <ul>
          <li>
            <Link to="/admin/retraits" className="inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Retraits
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
            {/* En-tête */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold">Préparation du retrait</h1>
                    <p className="font-mono text-xs text-base-content/60">
                      {reservation.numReservation}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge map={STATUT_LOCATION} value={reservation.statutLocation} />
                    {resteAPayer > 0 && (
                      <button className="btn btn-sm btn-warning" disabled={busy} onClick={ouvrirPaiement}>
                        <Banknote size={16} /> Régler le solde
                      </button>
                    )}
                    {reservation.statutLocation === "CONFIRMEE" && (
                      <button className="btn btn-sm btn-accent" disabled={busy} onClick={marquerPrete}>
                        <ClipboardCheck size={16} /> Marquer prête
                      </button>
                    )}
                    {reservation.statutLocation === "PRETE" && (
                      <button
                        className="btn btn-sm btn-success"
                        disabled={busy || !toutesLignesCompletes}
                        title={
                          !toutesLignesCompletes
                            ? "Toutes les lignes doivent être affectées"
                            : "Enregistrer la sortie"
                        }
                        onClick={validerRetrait}
                      >
                        <CheckCircle2 size={16} /> Enregistrer la sortie
                      </button>
                    )}
                  </div>
                </div>

                {reservation.statutLocation === "PRETE" && !toutesLignesCompletes && (
                  <div className="alert alert-warning py-2 text-sm">
                    <AlertTriangle size={16} />
                    <span>Affectez tous les items sur chaque ligne avant d'enregistrer la sortie.</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Info label="Début prévu">
                    <span className="font-medium text-primary">
                      {formatDate(reservation.dateDebutPrevue)}
                    </span>
                  </Info>
                  <Info label="Fin prévue">
                    <span className="font-medium">
                      {formatDate(reservation.dateFinPrevue)}
                    </span>
                  </Info>
                  <Info label="Montant total">
                    <span className="font-bold">{formatMoney(reservation.montantTotal)}</span>
                  </Info>
                  <Info label="Reste à payer">
                    <span className={`font-bold ${resteAPayer > 0 ? "text-warning" : "text-success"}`}>
                      {formatMoney(resteAPayer)}
                    </span>
                  </Info>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Client / Paiements */}
              <div className="space-y-6 lg:col-span-1">
                <div className="card bg-base-100 shadow">
                  <div className="card-body gap-4">
                    <h2 className="card-title"><User size={18} /> Client</h2>
                    <Info label="Nom complet">{reservation.utilisateur?.nomComplet || "—"}</Info>
                    <Info label="Téléphone">{reservation.utilisateur?.telephone || "—"}</Info>
                    <Info label="Email">{reservation.utilisateur?.email || "—"}</Info>
                  </div>
                </div>

                <div className="card bg-base-100 shadow">
                  <div className="card-body gap-4">
                    <h2 className="card-title"><CreditCard size={18} /> Paiements</h2>
                    {!reservation.paiements?.length ? (
                      <p className="text-sm text-base-content/50">Aucun paiement.</p>
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
                    {resteAPayer > 0 && (
                      <button className="btn btn-warning btn-sm mt-2" onClick={ouvrirPaiement}>
                        <Banknote size={16} /> Régler le solde ({formatMoney(resteAPayer)})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Matériels (avec packs dépliés) */}
              <div className="space-y-6 lg:col-span-2">
                <div className="card bg-base-100 shadow">
                  <div className="card-body gap-4">
                    <h2 className="card-title"><Package size={18} /> Matériels à préparer</h2>

                    {!sousLignes.length ? (
                      <p className="text-center text-base-content/50">Aucun matériel.</p>
                    ) : (
                      <div className="space-y-4">
                        {sousLignes.map((s) => {
                          const affectes = s.mouvements?.length ?? 0;
                          const complet = affectes >= s.quantite;
                          return (
                            <SousLigneCard
                              key={s.key}
                              sousLigne={s}
                              stock={stocks[s.materiel?.CodeMateriel]}
                              affectes={affectes}
                              complet={complet}
                              loadingStock={loadingStocks}
                              onAffecter={() =>
                                ouvrirAffectation(
                                  s.ligne,
                                  s.materiel?.CodeMateriel,
                                  s.quantite,
                                  s.pack
                                )
                              }
                              onRemplacer={() => ouvrirRemplacement(s)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DataState>

      {/* -------- Modale affectation -------- */}
      <Modal
        open={modalItemOpen}
        onClose={() => setModalItemOpen(false)}
        title={`Affecter : ${
          contexteAffectation?.materiel?.designation ||
          contexteAffectation?.pack?.libelle ||
          ""
        }`}
        wide
      >
        <div className="space-y-4">
          <p className="text-sm text-base-content/70">
            Sélectionnez les numéros de série physiques. Seuls les items{" "}
            <span className="font-semibold text-success">disponibles</span> peuvent être affectés.
          </p>

          <div className="grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-8">
              <label className="input input-bordered flex items-center gap-2">
                <Search size={16} className="opacity-60" />
                <input
                  type="text"
                  className="grow"
                  placeholder="Rechercher un N° de série..."
                  value={rechercheItem}
                  onChange={(e) => setRechercheItem(e.target.value)}
                />
              </label>
            </div>
            <div className="sm:col-span-4">
              <select
                className="select select-bordered w-full"
                value={filtreEtat}
                onChange={(e) => setFiltreEtat(e.target.value)}
              >
                <option value="">Tous les états</option>
                {ETATS_ITEM.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          {(rechercheItem || filtreEtat) && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => { setRechercheItem(""); setFiltreEtat(""); }}
            >
              <Filter size={12} /> Réinitialiser
            </button>
          )}

          {loadingItems ? (
            <div className="flex justify-center py-6">
              <span className="loading loading-spinner text-primary" />
            </div>
          ) : !itemsFiltres.length ? (
            <p className="py-4 text-center text-base-content/50">
              Aucun item disponible ne correspond aux critères.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pb-24">
              {itemsFiltres.map((item) => {
                const selectable = estSelectionnable(item);
                const selected = estDansPanier(item.numeroSerie);
                return (
                  <div
                    key={item.numeroSerie}
                    className={`flex items-center justify-between rounded-box border p-3 ${
                      selected
                        ? "border-primary bg-primary/5"
                        : selectable
                        ? "border-base-300 hover:bg-base-200"
                        : "cursor-not-allowed border-base-200 bg-base-200/40 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <QrCode
                        size={20}
                        className={
                          selected ? "text-primary" : selectable ? "text-base-content/60" : "text-base-content/40"
                        }
                      />
                      <div>
                        <p className="font-mono font-bold">{item.numeroSerie}</p>
                        <p className="text-xs opacity-60">
                          État : <span className="font-medium">{item.etatItem}</span>
                          {" · "}Statut : <span className="font-medium">{item.statutItem}</span>
                          {item.emplacementItem && ` · 📍 ${item.emplacementItem}`}
                        </p>
                      </div>
                    </div>
                    <button
                      className={`btn btn-sm ${selected ? "btn-ghost text-error" : "btn-primary"}`}
                      disabled={busy || !selectable}
                      onClick={() => togglePanier(item)}
                    >
                      {selected ? (<><Trash2 size={16} /> Retirer</>) : ("Sélectionner")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="sticky bottom-0 left-0 right-0 mx-6 -mb-6 mt-4 border-t border-base-300 bg-base-100 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart size={24} className="text-primary" />
                  {panier.length > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-error-content">
                      {panier.length}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {panier.length} sélectionné(s) — {dejaAffectesCount} déjà affecté(s)
                  </p>
                  <p className="text-xs text-base-content/60">
                    Max restant :{" "}
                    {(contexteAffectation?.quantite ?? 0) - dejaAffectesCount}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPanier([])}
                  disabled={!panier.length || envoiPanier}
                >
                  Vider
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={validerPanier}
                  disabled={!panier.length || envoiPanier}
                >
                  {envoiPanier ? <span className="loading loading-spinner loading-xs" /> : "Valider l'affectation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* -------- Modale remplacement -------- */}
      <RemplacementModal
        open={!!modalRempl}
        onClose={() => setModalRempl(null)}
        sousLigne={modalRempl?.sousLigne}
        onConfirm={confirmerRemplacement}
      />

      {/* -------- Modale paiement -------- */}
      <Modal open={modalPaiement} title="Régler le solde" onClose={() => setModalPaiement(false)}>
        <form onSubmit={enregistrerPaiement} className="grid gap-3 px-2">
          <div className="rounded-box border border-base-300 p-3">
            <p className="text-xs uppercase tracking-wide text-base-content/50">Reste à payer</p>
            <p className="text-xl font-bold text-warning">{formatMoney(resteAPayer)}</p>
          </div>

          <label className="form-control">
            <span className="label-text mb-1">Montant à encaisser (Ar) *</span>
            <input
              type="number"
              min="1"
              step="any"
              required
              className="input input-bordered w-full"
              value={paiement.montantPaye}
              onChange={(e) => setPaiement({ ...paiement, montantPaye: e.target.value })}
            />
            <p className="mt-1 text-xs text-base-content/60">Maximum : {formatMoney(resteAPayer)}</p>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-control">
              <span className="label-text mb-1">Mode de paiement *</span>
              <select
                required
                className="select select-bordered w-full"
                value={paiement.modePaiement}
                onChange={(e) => setPaiement({ ...paiement, modePaiement: e.target.value })}
              >
                {MODES_PAIEMENT.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Type de paiement *</span>
              <select
                required
                className="select select-bordered w-full"
                value={paiement.typePaiement}
                onChange={(e) => setPaiement({ ...paiement, typePaiement: e.target.value })}
              >
                {TYPES_PAIEMENT.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            {/* <label className="form-control">
              <span className="label-text mb-1">Statut *</span>
              <select
                required
                className="select select-bordered w-full"
                value={paiement.statutPaiement}
                onChange={(e) => setPaiement({ ...paiement, statutPaiement: e.target.value })}
              >
                {STATUTS_PAIEMENT.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Date du paiement</span>
              <input
                type="datetime-local"
                className="input input-bordered w-full"
                value={paiement.datePaiement}
                onChange={(e) => setPaiement({ ...paiement, datePaiement: e.target.value })}
              />
            </label> */}
          </div>

          <label className="form-control">
            <span className="label-text mb-1">Référence (optionnel — générée si vide)</span>
            <input
              className="input input-bordered w-full"
              placeholder="Ex: PAY-2026-0001"
              value={paiement.referencePaiement}
              onChange={(e) => setPaiement({ ...paiement, referencePaiement: e.target.value })}
            />
          </label>

          <div className="modal-action">
            <button type="button" className="btn" onClick={() => setModalPaiement(false)}>
              Annuler
            </button>
            <button className="btn btn-warning" disabled={envoiPaiement}>
              {envoiPaiement && <span className="loading loading-spinner loading-sm" />}
              Enregistrer le paiement
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}