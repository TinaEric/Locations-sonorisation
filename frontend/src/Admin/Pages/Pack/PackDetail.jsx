import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  Pencil,
  Layers,
  Minus,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  DollarSign,
  Banknote,
  ShieldCheck,
  Power,
  Check,
  X,
  Users,
  MapPin,
  Zap,
  Music,
} from "lucide-react";
import DataState from "../../components/DataState";
import { useToast } from "../../../contexts/ToastContext";
import StatusBadge from "../../components/StatusBadge";
import { formatMoney } from "../../../utils/format";
import { asList } from "../../hooks/useFetch";
import { ImageUrl } from "../../../components/ImageURL";
import { PackService } from "../../../data/PackService";
import Modal from "../../components/Modal";
import { categorieService } from "../../../data/CategorieService";
import { materielService } from "../../../data/materielService";
import PackForm, { STATUT_PACK, fromPack, toPayload } from "./PackForm";
import { ChampText } from "../../../components/ChampInput";
import { IMAGES_URL } from "../../../data/Api";

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

const LABEL_CATEGORIE = {
  conference: "Conférence",
  soiree: "Soirée",
  mariage: "Mariage",
  concert: "Concert",
};

const LABEL_LIEU = {
  interieur: "Intérieur",
  exterieur: "Extérieur",
  mixte: "Mixte",
};

function Info({ label, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-base-content/50">
        {label}
      </p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

export default function PackDetail() {
  const location = useLocation();
  const codePack = location.state;
  const toast = useToast();
  const navigate = useNavigate();

  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [tarif, setTarif] = useState({ tarifJournalier: 0, prixCaution: 0 });
  const [addMat, setAddMat] = useState(false);
  const [toDelete, setToDelete] = useState(false);
  const [regleTarif, setRegleTarif] = useState(false);
  const [modifiePack, setModifiePack] = useState(false);
  const [busyCode, setBusyCode] = useState(null);
  const [deleteMat, setDeleteMat] = useState(null);

  // ✅ Flags tarif
  const [tarifObligatoire, setTarifObligatoire] = useState(false);
  const [tarifAPayer, setTarifAPayer] = useState(false);

  const [infoForm, setInfoForm] = useState(null);

  const [materiels, setMateriels] = useState([]);
  const [materielsLoading, setMaterielsLoading] = useState(false);
  const [materielsErreur, setMaterielsErreur] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesErreur, setCategoriesErreur] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("");
  const [selection, setSelection] = useState({});

  // ✅ Quantités éditées localement (idComposant -> quantite)
  const [quantites, setQuantites] = useState({});

  // -------------------- Chargement --------------------
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const resp = await PackService.detail(codePack);
      if (resp) {
        setPack(resp);
        setTarif({
          tarifJournalier: resp.tarifJournalier,
          prixCaution: resp.prixCaution,
        });
        const map = {};
        (resp.composants || []).forEach((c) => {
          map[c.idComposant] = Number(c.quantite);
        });
        setQuantites(map);
      } else {
        setPack(null);
        setQuantites({});
      }
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
    categorieService
      .listDispo()
      .then((r) => setCategories(asList(r)))
      .catch(() => setCategoriesErreur(true));
  }, []);

  useEffect(() => {
    if (!addMat || materiels.length) return;
    setMaterielsLoading(true);
    setMaterielsErreur(false);
    materielService
      .listDispo()
      .then((r) => setMateriels(asList(r)))
      .catch(() => setMaterielsErreur(true))
      .finally(() => setMaterielsLoading(false));
  }, [addMat]);

  // -------------------- Dérivés --------------------
  const composants = useMemo(
    () =>
      [...(pack?.composants || [])].sort(
        (a, b) => (a.idComposant ?? 0) - (b.idComposant ?? 0)
      ),
    [pack]
  );

  const dejaDansPack = useMemo(
    () =>
      new Set(
        composants.map((c) => c.materiel?.CodeMateriel).filter(Boolean)
      ),
    [composants]
  );

  const quantitesModifiees = useMemo(() => {
    return composants.some((c) => {
      const local = Number(quantites[c.idComposant] ?? c.quantite);
      return local !== Number(c.quantite);
    });
  }, [composants, quantites]);

  const totalPrixLocation = composants.reduce(
    (s, c) =>
      s +
      Number(quantites[c.idComposant] ?? c.quantite) *
        Number(c.materiel?.prixLocation || 0),
    0
  );

  const totalCaution = composants.reduce(
    (s, c) =>
      s +
      Number(quantites[c.idComposant] ?? c.quantite) *
        Number(c.materiel?.prixCaution || 0),
    0
  );

  const nbSelection = Object.keys(selection).length;

  const materielsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return materiels.filter((m) => {
      if (
        filtreCategorie &&
        String(m.idCategorie ?? m.categorie?.idCategorie) !==
          String(filtreCategorie)
      )
        return false;
      if (!q) return true;
      return (
        (m.designation || "").toLowerCase().includes(q) ||
        (m.marque || "").toLowerCase().includes(q) ||
        (m.CodeMateriel || "").toLowerCase().includes(q)
      );
    });
  }, [materiels, recherche, filtreCategorie]);

  // Nettoyer la sélection si un matériel devient déjà présent
  useEffect(() => {
    setSelection((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const code of Object.keys(next)) {
        if (dejaDansPack.has(code)) {
          delete next[code];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [dejaDansPack]);

  // -------------------- Helpers --------------------
  const nbrItem = (code) => {
    for (const cat of categories) {
      for (const mat of cat?.materiels || []) {
        if (mat.CodeMateriel === code) return mat.items?.length ?? 0;
      }
    }
    return 0;
  };

  const desactiverSiNecessaire = async (raison) => {
    setTarifAPayer(true);
    if (pack?.statutPack !== "actif") {
      toast.warning(raison).bottom();
      return;
    }
    try {
      await PackService.setStatut(pack.codePack, "inactif");
      await fetchData(true);
      toast.warning(
        `${raison} Le pack a été désactivé : réglez le tarif avant de le réactiver.`
      ).bottom();
    } catch (err) {
      toast.error(
        `Le pack n'a pas pu être désactivé automatiquement : ${err.message}`
      );
    }
  };

  // -------------------- Quantités : édition locale --------------------
  const changerQuantiteLocale = (composant, delta) => {
    const id = composant.idComposant;
    const actuelle = Number(quantites[id] ?? composant.quantite);
    const stock = nbrItem(composant.materiel?.CodeMateriel);

    let nouvelle = actuelle + delta;
    if (nouvelle < 1) nouvelle = 1;
    if (stock > 0 && nouvelle > stock) nouvelle = stock;

    if (nouvelle === actuelle) return;
    setQuantites((prev) => ({ ...prev, [id]: nouvelle }));
  };

  const validerQuantites = async () => {
    const modifies = composants
      .map((c) => ({
        idComposant: c.idComposant,
        quantiteLocale: Number(quantites[c.idComposant] ?? c.quantite),
        quantiteServeur: Number(c.quantite),
      }))
      .filter((x) => x.quantiteLocale !== x.quantiteServeur);

    if (!modifies.length) return;

    const dataEnvoie = modifies.map((m) => ({
      idComposant: m.idComposant,
      quantite: m.quantiteLocale,
    }));

    setBusy(true);
    try {
      const res = await PackService.changeQuantite(dataEnvoie);
      toast.success(
        res?.message ||
          `${dataEnvoie.length} quantité(s) mise(s) à jour avec succès`
      );

      const p = await fetchData(true);
      setTarifAPayer(true);

      // Ouvre directement la modale tarif (comportement conservé)
      setTarif({
        tarifJournalier: p?.tarifJournalier ?? 0,
        prixCaution: p?.prixCaution ?? 0,
      });
      setRegleTarif(true);
      setTarifObligatoire(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const annulerQuantites = () => {
    const map = {};
    composants.forEach((c) => {
      map[c.idComposant] = Number(c.quantite);
    });
    setQuantites(map);
  };

  // -------------------- Retirer un matériel --------------------
  const retirer = async () => {
    if (!deleteMat?.idComposant) {
      toast.error("Composant introuvable.");
      return;
    }
    setBusy(true);
    try {
      await PackService.removeComposant(deleteMat.idComposant);
      toast.success("Un matériel a été retiré du pack avec succès");
      setDeleteMat(null);
      await fetchData(true);
      await desactiverSiNecessaire("La composition du pack a changé.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  // -------------------- Ajout de matériel --------------------
  const basculer = (m) =>
    setSelection((prev) => {
      const next = { ...prev };
      if (next[m.CodeMateriel]) delete next[m.CodeMateriel];
      else next[m.CodeMateriel] = m;
      return next;
    });

  const dispoFiltres = materielsFiltres.filter(
    (m) => !dejaDansPack.has(m.CodeMateriel)
  );
  const toutCocheFiltres =
    dispoFiltres.length > 0 &&
    dispoFiltres.every((m) => selection[m.CodeMateriel]);

  const basculerTout = () => {
    setSelection((prev) => {
      const next = { ...prev };
      dispoFiltres.forEach((m) => {
        if (toutCocheFiltres) delete next[m.CodeMateriel];
        else next[m.CodeMateriel] = m;
      });
      return next;
    });
  };

  const ajouterSelection = async () => {
    const nouveaux = Object.values(selection)
      .filter((m) => m?.CodeMateriel && !dejaDansPack.has(m.CodeMateriel))
      .map((m) => ({ materiel: m, quantite: 1 }));

    if (!nouveaux.length) {
      toast.warning("Aucun nouveau matériel à ajouter.");
      return;
    }

    setBusy(true);
    try {
      const dataEnvoie = nouveaux.map((n) => ({
        codeMateriel: n.materiel.CodeMateriel,
        quantite: n.quantite,
      }));
      await PackService.addComposants(pack.codePack, dataEnvoie);
      toast.success(`${nouveaux.length} matériel(s) ajouté(s) au pack`);
      setSelection({});
      setAddMat(false);
      await fetchData(true);
      await desactiverSiNecessaire("La composition du pack a changé.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  // -------------------- Informations du pack --------------------
  const modifieTarif = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await PackService.update(pack.codePack, {
        ...toPayload(fromPack(pack)),
        tarifJournalier: Number(tarif.tarifJournalier ?? 0),
        prixCaution: Number(tarif.prixCaution ?? 0),
      });
      toast.success("Tarif du pack mis à jour");
      const p = await fetchData(true);
      if (p) setInfoForm(fromPack(p));

      setRegleTarif(false);
      setTarifObligatoire(false);
      setTarifAPayer(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const enregistrerInfos = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await PackService.update(pack.codePack, toPayload(infoForm));
      toast.success("Informations du pack modifiées");
      const p = await fetchData(true);
      if (p) setInfoForm(fromPack(p));
      setModifiePack(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const changerStatut = async (p) => {
    if (
      p.statutPack !== "actif" &&
      (tarifAPayer || Number(p.tarifJournalier) === 0)
    ) {
      toast.warning(
        "Veuillez régler le tarif du pack avant de l'activer."
      );
      return;
    }

    if (composants.length === 0) {
      toast.warning(
        "Veuillez sélectionner les matériels du pack avant d'activer le pack !"
      );
      return;
    }
    if (
      Number(pack.tarifJournalier) === 0 &&
      Number(pack.prixCaution) === 0
    ) {
      toast.warning("Veuillez régler le tarif avant d'activer le pack !");
      return;
    }
    const nouveau = p.statutPack === "actif" ? "inactif" : "actif";
    setBusyCode(p.codePack);
    try {
      await PackService.setStatut(p.codePack, nouveau);
      toast.success(nouveau === "actif" ? "Pack activé" : "Pack désactivé");
      const res = await fetchData(true);
      if (res) setInfoForm(fromPack(res));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyCode(null);
    }
  };

  const actifTarif = () => {
    if (composants.length === 0) {
      toast.warning(
        "Veuillez sélectionner les matériels du pack pour régler le tarif !"
      );
      return;
    }
    setRegleTarif(true);
    setTarifObligatoire(false);
    setTarif({
      tarifJournalier: pack.tarifJournalier,
      prixCaution: pack.prixCaution,
    });
  };

  const supprimer = async () => {
    setBusy(true);
    try {
      const result = await PackService.remove(pack.codePack);
      toast.success(result.message);
      setToDelete(false);
      navigate("/admin/packs");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  // -------------------- Rendu --------------------
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

      <DataState
        loading={loading && !pack}
        error={error}
        onRetry={() => fetchData()}
      >
        {pack && (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ImageUrl
                      src={`${IMAGES_URL}/${pack.photos}`}
                      alt={pack.libelle}
                      className="h-16 w-16 shrink-0"
                    />
                    <div>
                      <div className="flex items-center justify-start gap-2">
                        <h1 className="text-2xl font-bold">{pack.libelle}</h1>
                        <p className="text-xs">
                          <StatusBadge
                            map={STATUT_PACK}
                            value={pack.statutPack}
                          />
                        </p>
                      </div>
                      <p className="font-mono text-xs text-base-content/60">
                        {pack.codePack}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className={`btn btn-sm ${
                        pack.statutPack === "actif"
                          ? "text-success"
                          : "text-error"
                      }`}
                      title={
                        pack.statutPack === "actif"
                          ? "Désactiver"
                          : tarifAPayer
                          ? "Réglez le tarif avant d'activer"
                          : "Activer"
                      }
                      aria-label={
                        pack.statutPack === "actif" ? "Désactiver" : "Activer"
                      }
                      disabled={
                        busyCode === pack.codePack ||
                        (pack.statutPack !== "actif" && tarifAPayer)
                      }
                      onClick={() => changerStatut(pack)}
                    >
                      {busyCode === pack.codePack ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <Power size={16} />
                      )}
                    </button>
                    <button
                      className="btn btn-sm"
                      title="Modifier le Pack"
                      onClick={() => setModifiePack(true)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="btn btn-sm text-error"
                      title="Supprimer le Pack"
                      onClick={() => setToDelete(true)}
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      className="btn btn-sm btn-warning btn-outline"
                      title="Ajuster le prix"
                      onClick={actifTarif}
                    >
                      <DollarSign size={16} /> Régler Tarif
                    </button>
                  </div>
                </div>

                {/* ---------- Infos principales ---------- */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Info label="Catégorie">
                    {pack.categoriePack ? (
                      <span className="badge badge-outline badge-sm">
                        {LABEL_CATEGORIE[pack.categoriePack] ??
                          pack.categoriePack}
                      </span>
                    ) : (
                      "—"
                    )}
                  </Info>

                  <Info label="Tarif / jour">
                    <span className="font-bold text-primary">
                      {formatMoney(pack.tarifJournalier)}
                    </span>
                  </Info>

                  <Info label="Caution">
                    <span className="font-medium">
                      {formatMoney(pack.prixCaution)}
                    </span>
                  </Info>

                  <Info label="Matériels">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Boxes size={16} /> {composants.length}
                    </span>
                  </Info>

                  <Info label="Capacité">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Users size={14} className="opacity-60" />
                      {pack.capaciteMin ?? "?"}–{pack.capaciteMax ?? "?"} pers.
                    </span>
                  </Info>

                  <Info label="Type de lieu">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} className="opacity-60" />
                      {pack.typeLieu
                        ? LABEL_LIEU[pack.typeLieu] ?? pack.typeLieu
                        : "—"}
                    </span>
                  </Info>

                  <Info label="Puissance totale">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Zap size={14} className="opacity-60" />
                      {pack.puissanceTotal != null
                        ? `${pack.puissanceTotal} W`
                        : "—"}
                    </span>
                  </Info>

                  <Info label="Usages">
                    {pack.usages?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {pack.usages.map((u) => (
                          <span
                            key={u}
                            className="badge badge-primary badge-outline badge-sm gap-1"
                          >
                            <Music size={10} />
                            {u}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </Info>
                </div>

                <Info label="Description">
                  <p className="whitespace-pre-line">
                    {pack.description || "—"}
                  </p>
                </Info>

                <p className="text-xs text-base-content/50">
                  Créé le {formatDateHeure(pack.dateCreation)} · modifié le{" "}
                  {formatDateHeure(pack.dateModification)}
                </p>
              </div>
            </div>

            {/* Matériel du pack */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <h2 className="card-title">Matériel du pack</h2>
                    <p className="font-mono text-xs text-base-content/60">
                      {composants.length}{" "}
                      {composants.length > 1 ? "MATERIELS" : "MATERIEL"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {quantitesModifiees && (
                      <>
                        <button
                          className="btn btn-sm"
                          onClick={annulerQuantites}
                          disabled={busy}
                        >
                          <X size={16} /> Annuler
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={validerQuantites}
                          disabled={busy}
                        >
                          {busy ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <Check size={16} />
                          )}
                          Valider les quantités
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setAddMat(true)}
                    >
                      <Plus size={16} /> Ajouter Matériel
                    </button>
                  </div>
                </div>

                {!composants.length ? (
                  <p className="py-8 text-center text-base-content/50">
                    Aucun matériel dans ce pack. Ajoutez-en depuis la section
                    ci-dessous.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Matériel</th>
                          <th>Stock</th>
                          <th className="text-right">Prix location</th>
                          <th>Quantité</th>
                          <th className="text-right">Sous-total</th>
                          <th>Retirer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {composants.map((c) => {
                          const m = c.materiel;
                          const qte = Number(
                            quantites[c.idComposant] ?? c.quantite
                          );
                          const modifiee = qte !== Number(c.quantite);
                          const stock = nbrItem(m?.CodeMateriel);
                          return (
                            <tr
                              key={c.idComposant}
                              className={`hover:bg-base-200/50 ${
                                modifiee ? "bg-warning/10" : ""
                              }`}
                            >
                              <td>
                                <div className="flex items-center gap-3">
                                  <ImageUrl
                                    src={`${IMAGES_URL}/${m?.imageURL}`}
                                    alt={m?.designation}
                                  />
                                  <div>
                                    <div className="font-medium">
                                      {m?.designation}
                                    </div>
                                    <div className="text-xs opacity-60">
                                      {m?.marque}
                                      {m?.marque && " · "}
                                      <span className="font-mono">
                                        {m?.CodeMateriel}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td>{stock}</td>

                              <td className="whitespace-nowrap text-right">
                                {formatMoney(m?.prixLocation)}
                              </td>

                              <td>
                                <div className="join">
                                  <button
                                    className="btn btn-xs join-item"
                                    aria-label="Diminuer la quantité"
                                    disabled={busy || qte <= 1}
                                    onClick={() =>
                                      changerQuantiteLocale(c, -1)
                                    }
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="join-item flex min-w-10 items-center justify-center border border-base-300 px-2 text-sm font-medium">
                                    {qte}
                                  </span>
                                  <button
                                    className="btn btn-xs join-item"
                                    aria-label="Augmenter la quantité"
                                    disabled={
                                      busy || (stock > 0 && qte >= stock)
                                    }
                                    onClick={() =>
                                      changerQuantiteLocale(c, 1)
                                    }
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </td>

                              <td className="whitespace-nowrap text-right font-medium">
                                {formatMoney(
                                  qte * Number(m?.prixLocation || 0)
                                )}
                              </td>

                              <td className="text-right">
                                <button
                                  className="btn btn-ghost btn-sm btn-square text-error"
                                  title="Retirer du pack"
                                  aria-label="Retirer du pack"
                                  disabled={busy}
                                  onClick={() => setDeleteMat(c)}
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
                          <td colSpan={4} className="text-right text-sm">
                            Valeur cumulée du matériel / jour
                            {quantitesModifiees && (
                              <span className="ml-2 badge badge-warning badge-sm">
                                non validé
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap text-right font-bold">
                            {formatMoney(totalPrixLocation)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Ajouter du matériel */}
            <Modal
              open={addMat}
              Icone={PackagePlus}
              title={"Matériel du pack"}
              pack
              wide
              onClose={() => setAddMat(false)}
            >
              <div className="card bg-base-100 shadow">
                <div className="card-body gap-4">
                  <p className="text-sm text-base-content/60">
                    Cochez les matériels à ajouter, puis validez.
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="input input-bordered flex flex-1 items-center gap-2">
                      <Search size={16} className="opacity-60" />
                      <input
                        type="text"
                        className="grow"
                        placeholder="Rechercher (désignation, marque, code)..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                      />
                    </label>
                    <label className="select select-bordered flex items-center gap-2 sm:w-64">
                      <Layers size={16} className="opacity-60" />
                      <select
                        className="grow bg-transparent focus:outline-none"
                        value={filtreCategorie}
                        onChange={(e) => setFiltreCategorie(e.target.value)}
                        disabled={categoriesErreur}
                      >
                        <option value="">Toutes les catégories</option>
                        {categories.map((cat) => (
                          <option key={cat.idCategorie} value={cat.idCategorie}>
                            {cat.libelle}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {materielsLoading ? (
                    <div className="flex justify-center py-10">
                      <span className="loading loading-spinner text-primary" />
                    </div>
                  ) : materielsErreur ? (
                    <p className="py-6 text-center text-error">
                      Impossible de charger les matériels.
                    </p>
                  ) : !materielsFiltres.length ? (
                    <p className="py-6 text-center text-base-content/50">
                      Aucun matériel ne correspond.
                    </p>
                  ) : (
                    <>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={toutCocheFiltres}
                          disabled={!dispoFiltres.length}
                          onChange={basculerTout}
                        />
                        Tout sélectionner ({dispoFiltres.length} disponible
                        {dispoFiltres.length > 1 ? "s" : ""})
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2 overflow-y-auto overflow-x-hidden xl:grid-cols-3">
                        {materielsFiltres.map((m) => {
                          const deja = dejaDansPack.has(m.CodeMateriel);
                          const coche = !!selection[m.CodeMateriel];
                          return (
                            <label
                              key={m.CodeMateriel}
                              className={`flex items-center gap-3 rounded-box border p-3 transition ${
                                deja
                                  ? "cursor-not-allowed border-base-300 opacity-60"
                                  : coche
                                  ? "cursor-pointer border-primary bg-primary/10"
                                  : "cursor-pointer border-base-300 hover:bg-base-200/60"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="checkbox checkbox-primary"
                                checked={deja || coche}
                                disabled={deja}
                                onChange={() => basculer(m)}
                              />
                              <ImageUrl
                                src={`${IMAGES_URL}/${m?.imageURL}`}
                                alt={m.designation}
                                className="h-10 w-10 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {m.designation}
                                </p>
                                <p className="truncate text-xs opacity-60">
                                  {m.marque}
                                  {m.marque && " · "}
                                  {formatMoney(m.prixLocation)} / jour
                                </p>
                              </div>
                              {deja && (
                                <span className="badge badge-ghost badge-sm shrink-0">
                                  Dans le pack
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {nbSelection > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-box bg-primary/10 p-3">
                      <span className="text-sm font-medium">
                        {nbSelection} matériel(s) sélectionné(s)
                      </span>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-sm"
                          disabled={busy}
                          onClick={() => setSelection({})}
                        >
                          Vider
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={busy}
                          onClick={ajouterSelection}
                        >
                          {busy ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <Plus size={16} />
                          )}
                          Ajouter au pack
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Modal>

            {/* Confirmation suppression pack */}
            <Modal
              open={!!toDelete}
              title="Supprimer ce pack ?"
              supp
              onClose={() => setToDelete(false)}
              actions={
                <>
                  <button className="btn" onClick={() => setToDelete(false)}>
                    Annuler
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={supprimer}
                    disabled={busy}
                  >
                    {busy && (
                      <span className="loading loading-spinner loading-sm" />
                    )}
                    Supprimer
                  </button>
                </>
              }
            >
              <p>
                « {pack?.libelle} » sera définitivement supprimé. Le matériel
                qui le compose n'est pas affecté.
              </p>
            </Modal>

            {/* Informations du pack */}
            <Modal
              open={modifiePack}
              title={"Informations du pack"}
              onClose={() => setModifiePack(false)}
            >
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
                    />
                  )}
                </div>
              </div>
            </Modal>

            {/* Régler tarif */}
            <Modal
              open={regleTarif}
              title={
                tarifObligatoire
                  ? "Réglage du tarif (obligatoire)"
                  : "Régler le tarif du pack"
              }
              onClose={() => {
                if (tarifObligatoire) {
                  toast.warning(
                    "Vous devez enregistrer le tarif après avoir modifié les quantités."
                  );
                  return;
                }
                setRegleTarif(false);
              }}
            >
              <form onSubmit={modifieTarif} className="space-y-4">
                {tarifObligatoire && (
                  <div className="alert alert-warning">
                    <ShieldCheck size={18} />
                    <span>
                      Les quantités du pack ont changé. Ajustez et enregistrez
                      le tarif pour finaliser la modification.
                    </span>
                  </div>
                )}

                {/* Bloc 1 — Valeur calculée du matériel */}
                <div className="rounded-box border border-base-300 bg-base-200/40 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-base-content/70">
                    <Boxes size={16} />
                    Valeur du matériel dans le pack
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-box bg-base-100 p-3">
                      <p className="text-xs uppercase tracking-wide text-base-content/50">
                        Location / jour
                      </p>
                      <p className="mt-1 text-lg font-bold text-primary">
                        {formatMoney(totalPrixLocation)}
                      </p>
                    </div>
                    <div className="rounded-box bg-base-100 p-3">
                      <p className="text-xs uppercase tracking-wide text-base-content/50">
                        Caution totale
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {formatMoney(totalCaution)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bloc 2 — Saisie */}
                <div className="rounded-box border border-base-300 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-base-content/70">
                    <DollarSign size={16} />
                    Tarif appliqué au client
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <ChampText
                        id="prix-tarifJournalier"
                        name="tarifJournalier"
                        label="Tarif journalier (Ar) *"
                        icon={Banknote}
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={tarif.tarifJournalier}
                        onChange={(e) =>
                          setTarif({
                            ...tarif,
                            tarifJournalier: e.target.value,
                          })
                        }
                        placeholder="Ex: 9999 Ar..."
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-base-content/60">
                          Calculé : {formatMoney(totalPrixLocation)}
                        </span>
                        {totalPrixLocation > 0 && (
                          <button
                            type="button"
                            className="link link-primary"
                            onClick={() =>
                              setTarif({
                                ...tarif,
                                tarifJournalier: totalPrixLocation,
                              })
                            }
                          >
                            Utiliser ce montant
                          </button>
                        )}
                      </div>
                      {Number(pack?.tarifJournalier) !==
                        Number(tarif.tarifJournalier) && (
                        <p className="text-xs text-base-content/50">
                          Ancien : {formatMoney(pack?.tarifJournalier)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <ChampText
                        id="prix-prixCaution"
                        name="prixCaution"
                        label="Caution (Ar)"
                        icon={ShieldCheck}
                        type="number"
                        min="0"
                        step="any"
                        value={tarif.prixCaution}
                        onChange={(e) =>
                          setTarif({
                            ...tarif,
                            prixCaution: e.target.value,
                          })
                        }
                        placeholder="Ex: 1000 Ar..."
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-base-content/60">
                          Calculé : {formatMoney(totalCaution)}
                        </span>
                        {totalCaution > 0 && (
                          <button
                            type="button"
                            className="link link-primary"
                            onClick={() =>
                              setTarif({
                                ...tarif,
                                prixCaution: totalCaution,
                              })
                            }
                          >
                            Utiliser ce montant
                          </button>
                        )}
                      </div>
                      {Number(pack?.prixCaution) !==
                        Number(tarif.prixCaution) && (
                        <p className="text-xs text-base-content/50">
                          Ancien : {formatMoney(pack?.prixCaution)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bloc 3 — Récap / écart / alertes */}
                {(() => {
                  const ancienTotal =
                    Number(pack?.tarifJournalier || 0) +
                    Number(pack?.prixCaution || 0);
                  const nouveauTotal =
                    Number(tarif.tarifJournalier || 0) +
                    Number(tarif.prixCaution || 0);
                  const ecart = nouveauTotal - ancienTotal;
                  const majore = ecart > 0;
                  const minore = ecart < 0;

                  const tarifZero = Number(tarif.tarifJournalier || 0) <= 0;
                  const cautionSupTarif =
                    Number(tarif.prixCaution || 0) >
                      Number(tarif.tarifJournalier || 0) &&
                    Number(tarif.prixCaution || 0) > 0;

                  return (
                    <>
                      {tarifZero && (
                        <div className="alert alert-error alert-sm">
                          <span>
                            Le tarif journalier doit être supérieur à 0 pour
                            activer le pack.
                          </span>
                        </div>
                      )}
                      {cautionSupTarif && (
                        <div className="alert alert-info alert-sm">
                          <span>
                            La caution est supérieure au tarif journalier —
                            vérifiez que c'est intentionnel.
                          </span>
                        </div>
                      )}

                      <div className="rounded-box bg-base-200/40 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-base-content/50">
                              Nouveau total
                            </p>
                            <p className="text-xl font-bold">
                              {formatMoney(nouveauTotal)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wide text-base-content/50">
                              Écart
                            </p>
                            <p
                              className={`text-lg font-bold ${
                                majore
                                  ? "text-success"
                                  : minore
                                  ? "text-error"
                                  : "text-base-content/60"
                              }`}
                            >
                              {majore ? "+" : ""}
                              {formatMoney(ecart)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  {!tarifObligatoire && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setRegleTarif(false)}
                      disabled={busy}
                    >
                      Annuler
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={busy || Number(tarif.tarifJournalier || 0) <= 0}
                  >
                    {busy ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <Check size={16} />
                    )}
                    Enregistrer le tarif
                  </button>
                </div>
              </form>
            </Modal>

            {/* Retirer matériel */}
            <Modal
              open={!!deleteMat}
              title="Retirer Matériel du Pack"
              supp
              onClose={() => setDeleteMat(null)}
              actions={
                <>
                  <button className="btn" onClick={() => setDeleteMat(null)}>
                    Annuler
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={retirer}
                    disabled={busy}
                  >
                    {busy && (
                      <span className="loading loading-spinner loading-sm" />
                    )}
                    Supprimer
                  </button>
                </>
              }
            >
              <p>
                Le matériel « {deleteMat?.materiel?.designation} » sera retiré
                définitivement de ce pack.
              </p>
            </Modal>
          </div>
        )}
      </DataState>
    </>
  );
}