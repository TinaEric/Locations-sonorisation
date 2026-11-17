import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  ShieldCheck,
  Package,
  ShoppingCart,
  Plus,
  Info,
  AlertTriangle,
  Trash2,
  Replace,
  X,
  Search,
  Loader2,
  Users,
  MapPin,
  CalendarDays,
  RotateCcw,
  Music,
  Zap,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";

import {
  ReservationService,
  materielDispo,
} from "../../../data/reservationService";
import { PackService } from "../../../data/PackService";

import { ImageUrl } from "../../../components/ImageURL";
import { formatMoney } from "../../../utils/format";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../../contexts/ToastContext";
import { useNavbar } from "../../contexts/NavbarContext";
import { asList } from "../../../Admin/hooks/useFetch";
import { IMAGES_URL } from "../../../data/Api";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const today = () => new Date().toISOString().slice(0, 10);

const LABELS_CATEGORIE = {
  conference: "Conférence",
  soiree: "Soirée",
  mariage: "Mariage",
  concert: "Concert",
};

const LABELS_TYPE_LIEU = {
  interieur: "Intérieur",
  exterieur: "Extérieur",
  mixte: "Mixte",
};

const LABELS_ETAT = {
  disponible: { label: "Disponible", cls: "badge-success", Icon: CheckCircle },
  indisponible: { label: "Indisponible", cls: "badge-error", Icon: XCircle },
  detail: { label: "Consultation", cls: "badge-ghost", Icon: FileText },
};

function BadgeEtatPack({ etatPack }) {
  const cfg = LABELS_ETAT[etatPack];
  if (!cfg) return null;
  const { label, cls, Icon } = cfg;
  return (
    <span className={`badge badge-sm gap-1 ${cls}`}>
      <Icon size={12} /> {label}
    </span>
  );
}

/* ---------- Brouillon de personnalisation (localStorage) ----------
   La personnalisation n'est envoyée en base qu'au moment où le client
   valide sa réservation. D'ici là, elle reste dans le navigateur.     */

const STORAGE_PREFIX = "pack_custom_v1:";

const readDraft = (code) => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + code);
    const data = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(data)) return null;
    return data.filter((c) => c?.materiel?.CodeMateriel);
  } catch {
    return null;
  }
};

const writeDraft = (code, composition) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + code, JSON.stringify(composition));
  } catch {
    /* stockage indisponible : on ignore */
  }
};

const clearDraft = (code) => {
  try {
    localStorage.removeItem(STORAGE_PREFIX + code);
  } catch {
    /* ignore */
  }
};

const buildBase = (data) =>
  (data?.composants || []).map((c) => ({
    idComposant: c.idComposant,
    materiel: c.materiel,
    quantite: Number(c.quantite),
    ajoute: false,
  }));

/* ------------------------------------------------------------------ */
/*  Modale générique (bottom-sheet mobile / centrée desktop)           */
/* ------------------------------------------------------------------ */

function Modal({ open, title, subtitle, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-base-100 shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-start justify-between gap-2 border-b border-base-300 p-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs opacity-60">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modale de saisie des dates                                         */
/* ------------------------------------------------------------------ */

function DatesModal({ open, onClose, dateDebut, dateFin, onConfirm }) {
  const [debut, setDebut] = useState(dateDebut || "");
  const [fin, setFin] = useState(dateFin || "");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setDebut(dateDebut || "");
      setFin(dateFin || "");
      setErr("");
    }
  }, [open, dateDebut, dateFin]);

  const valider = () => {
    if (!debut || !fin) return setErr("Veuillez renseigner les deux dates.");
    if (debut < today()) return setErr("La date de début est déjà passée.");
    if (fin < debut)
      return setErr("La fin doit être après ou égale au début.");
    onConfirm(debut, fin);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quand avez-vous besoin du pack ?"
      subtitle="Nous vérifions la disponibilité sur ces dates."
    >
      <div className="space-y-3 p-4">
        <label className="form-control w-full">
          <span className="mb-1 text-sm font-medium">Début</span>
          <input
            type="date"
            className="input input-bordered w-full"
            min={today()}
            value={debut}
            onChange={(e) => {
              setDebut(e.target.value);
              if (fin && e.target.value > fin) setFin(e.target.value);
            }}
          />
        </label>
        <label className="form-control w-full">
          <span className="mb-1 text-sm font-medium">Fin</span>
          <input
            type="date"
            className="input input-bordered w-full"
            min={debut || today()}
            value={fin}
            onChange={(e) => setFin(e.target.value)}
          />
        </label>
        {err && <p className="text-sm text-error">{err}</p>}
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Plus tard
          </button>
          <button type="button" className="btn btn-accent" onClick={valider}>
            Vérifier la disponibilité
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Modale de sélection de matériel (ajout / remplacement)             */
/* ------------------------------------------------------------------ */

function SelectionModal({
  open,
  title,
  subtitle,
  onClose,
  materiels,
  loading,
  erreur,
  codesExclus,
  quantiteMin = 1,
  onSelect,
}) {
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    if (!open) setRecherche("");
  }, [open]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return materiels.filter(
      (m) =>
        !q ||
        m.designation?.toLowerCase().includes(q) ||
        m.marque?.toLowerCase().includes(q) ||
        m.CodeMateriel?.toLowerCase().includes(q)
    );
  }, [materiels, recherche]);

  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle}>
      <div className="p-4 pb-2">
        <label className="input input-bordered flex items-center gap-2">
          <Search size={16} className="opacity-60" />
          <input
            type="search"
            className="grow"
            placeholder="Rechercher…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </label>
      </div>

      <div className="px-4 pb-4">
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" size={24} />
          </div>
        )}
        {!loading && erreur && (
          <p className="py-8 text-center text-error">{erreur}</p>
        )}
        {!loading && !erreur && !filtres.length && (
          <p className="py-8 text-center text-sm opacity-60">
            Aucun matériel disponible.
          </p>
        )}
        {!loading && !erreur && filtres.length > 0 && (
          <ul className="space-y-2">
            {filtres.map((m) => {
              const stock = toNumber(m.quantiteDisponible);
              const deja = codesExclus.has(m.CodeMateriel);
              const ok = !deja && stock >= quantiteMin;
              return (
                <li key={m.CodeMateriel}>
                  <button
                    type="button"
                    disabled={!ok}
                    onClick={() => ok && onSelect(m)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                      ok
                        ? "border-base-300 hover:border-accent hover:bg-accent/5"
                        : "cursor-not-allowed border-base-300 opacity-50"
                    }`}
                  >
                    <ImageUrl
                      src={`${IMAGES_URL}/${m.imageURL}`}
                      alt={m.designation}
                      className="size-12 shrink-0 rounded-lg object-cover"
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
                    <span className="shrink-0 text-xs opacity-70">
                      {deja ? "Déjà présent" : `${stock} dispo`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Ligne composant (quantité figée)                                   */
/* ------------------------------------------------------------------ */

function ComposantRow({ composant, avecStock, onRemplacer, onRetirer }) {
  const { materiel, quantite, ajoute } = composant;
  const stock = toNumber(materiel?.quantiteDisponible);
  const indispo = avecStock && stock < quantite;

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border p-2.5 ${
        indispo
          ? "border-error/40 bg-error/5"
          : ajoute
          ? "border-accent/40 bg-accent/5"
          : "border-base-300 bg-base-100"
      }`}
    >
      <ImageUrl
        src={`${IMAGES_URL}/${materiel?.imageURL}`}
        alt={materiel?.designation}
        className="size-12 shrink-0 rounded-lg object-cover"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {materiel?.designation || "—"}
        </p>
        <p className="truncate text-xs opacity-60">
          {materiel?.marque || "—"} · {formatMoney(materiel?.prixLocation)} /
          jour
        </p>
        {indispo && (
          <p className="text-xs font-medium text-error">
            Indisponible — remplacez-le
          </p>
        )}
        {ajoute && !indispo && (
          <p className="text-xs font-medium text-accent">Ajouté par vous</p>
        )}
      </div>

      <span className="shrink-0 rounded-full bg-base-200 px-2.5 py-1 text-xs font-semibold">
        × {quantite}
      </span>

      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square"
          title="Remplacer par un matériel de la même catégorie"
          aria-label="Remplacer"
          onClick={onRemplacer}
        >
          <Replace size={16} />
        </button>
        {ajoute && (
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square text-error"
            title="Retirer"
            aria-label="Retirer"
            onClick={onRetirer}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Page principale                                                    */
/* ------------------------------------------------------------------ */

export default function PackDetailPage() {
  const { codePack } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { addItem, items, hasMateriel } = useCart();
  const navbar = useNavbar();
  const { dateDebut, dateFin } = navbar;

  const avecDates = Boolean(dateDebut && dateFin);

  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  /** composition = [{ idComposant, materiel, quantite, ajoute }] */
  const [composition, setComposition] = useState([]);
  const hydratedFor = useRef(null);

  /* Modales */
  const [datesOuvert, setDatesOuvert] = useState(false);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [remplaceCible, setRemplaceCible] = useState(null);

  /* Matériels disponibles */
  const [materielsDispo, setMaterielsDispo] = useState([]);
  const [materielsLoading, setMaterielsLoading] = useState(false);
  const [materielsErreur, setMaterielsErreur] = useState(null);
  const fetchedKey = useRef(null);

  /* ---------------- Dates (met à jour la navbar) ---------------- */

  const appliquerDates = (debut, fin) => {
    if (typeof navbar.setDates === "function") navbar.setDates(debut, fin);
    else {
      navbar.setDateDebut?.(debut);
      navbar.setDateFin?.(fin);
    }
    setDatesOuvert(false);
  };

  /* ---------------- Chargement du pack ---------------- */

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErreur(null);

    const requete = avecDates
      ? ReservationService.getPackDetail(codePack, dateDebut, dateFin)
      : PackService.detail(codePack);

    requete
      .then((r) => {
        if (!alive) return;
        const data = r?.data ?? r;
        const base = buildBase(data);

        // Reprise du brouillon local, avec stock rafraîchi pour les
        // matériels d'origine encore présents dans le pack.
        const draft = readDraft(codePack);
        const frais = new Map(
          base.map((c) => [c.materiel?.CodeMateriel, c.materiel])
        );
        const composition = draft?.length
          ? draft.map((c) => ({
              ...c,
              materiel: frais.get(c.materiel.CodeMateriel) ?? c.materiel,
            }))
          : base;

        hydratedFor.current = codePack;
        setPack(data);
        setComposition(composition);
      })
      .catch((e) => alive && setErreur(e.message))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [codePack, dateDebut, dateFin, avecDates]);

  /* ---------------- Chargement des matériels dispo ---------------- */

  const modaleMaterielOuverte = ajoutOuvert || !!remplaceCible;

  useEffect(() => {
    if (!modaleMaterielOuverte || !avecDates) return;
    const key = `${dateDebut}|${dateFin}`;
    if (fetchedKey.current === key) return;

    let alive = true;
    setMaterielsLoading(true);
    setMaterielsErreur(null);
    materielDispo({ dateDebut, dateFin })
      .then((r) => {
        if (!alive) return;
        const flat = asList(r).flatMap((cat) =>
          (cat.materiels || []).map((m) => ({
            ...m,
            categorie: { idCategorie: cat.idCategorie, libelle: cat.libelle },
          }))
        );
        fetchedKey.current = key;
        setMaterielsDispo(flat);
      })
      .catch((e) => alive && setMaterielsErreur(e.message))
      .finally(() => alive && setMaterielsLoading(false));

    return () => {
      alive = false;
    };
  }, [modaleMaterielOuverte, avecDates, dateDebut, dateFin]);

  const dispoParCode = useMemo(
    () => new Map(materielsDispo.map((m) => [m.CodeMateriel, m])),
    [materielsDispo]
  );

  // Synchronise le stock des éléments déjà dans la composition
  useEffect(() => {
    if (!materielsDispo.length) return;
    setComposition((prev) => {
      let changed = false;
      const next = prev.map((c) => {
        const f = dispoParCode.get(c.materiel?.CodeMateriel);
        if (!f || f.quantiteDisponible === c.materiel.quantiteDisponible)
          return c;
        changed = true;
        return {
          ...c,
          materiel: {
            ...c.materiel,
            quantiteDisponible: f.quantiteDisponible,
          },
        };
      });
      return changed ? next : prev;
    });
  }, [dispoParCode, materielsDispo.length]);

  /* ---------------- Mémo ---------------- */

  const codesPresents = useMemo(
    () =>
      new Set(composition.map((c) => c.materiel?.CodeMateriel).filter(Boolean)),
    [composition]
  );

  const totalPrix = useMemo(
    () =>
      composition.reduce(
        (s, c) => s + c.quantite * toNumber(c.materiel?.prixLocation),
        0
      ),
    [composition]
  );

  const totalCaution = useMemo(
    () =>
      composition.reduce(
        (s, c) => s + c.quantite * toNumber(c.materiel?.prixCaution),
        0
      ),
    [composition]
  );

  const totalUnites = useMemo(
    () => composition.reduce((s, c) => s + c.quantite, 0),
    [composition]
  );

  const compositionModifiee = useMemo(() => {
    if (!pack) return false;
    const original = new Map(
      (pack.composants || []).map((c) => [
        c.materiel?.CodeMateriel,
        Number(c.quantite),
      ])
    );
    if (original.size !== composition.length) return true;
    return composition.some(
      (c) => original.get(c.materiel?.CodeMateriel) !== c.quantite
    );
  }, [pack, composition]);

  const dejaDansPanier = items.some((i) => i.code === codePack);
  const indisponible = pack?.etatPack === "indisponible";

  const composantIndispo = useMemo(
    () =>
      avecDates &&
      composition.some(
        (c) => toNumber(c.materiel?.quantiteDisponible) < c.quantite
      ),
    [avecDates, composition]
  );

  /* ---------------- Brouillon localStorage ---------------- */

  useEffect(() => {
    if (!pack || hydratedFor.current !== codePack) return;
    if (compositionModifiee) writeDraft(codePack, composition);
    else clearDraft(codePack);
  }, [composition, compositionModifiee, pack, codePack]);

  /* ---------------- Catégorie du matériel à remplacer ---------------- */

  const categorieCible = useMemo(() => {
    if (!remplaceCible) return null;
    const m = remplaceCible.materiel;
    const fromDispo = dispoParCode.get(m?.CodeMateriel)?.categorie;
    const id =
      m?.categorie?.idCategorie ?? m?.idCategorie ?? fromDispo?.idCategorie;
    const libelle = m?.categorie?.libelle ?? fromDispo?.libelle;
    return id != null ? { id, libelle } : null;
  }, [remplaceCible, dispoParCode]);

  const candidatsRemplacement = useMemo(() => {
    if (!remplaceCible) return [];
    if (!categorieCible) return materielsDispo;
    return materielsDispo.filter(
      (m) => m.categorie?.idCategorie === categorieCible.id
    );
  }, [remplaceCible, categorieCible, materielsDispo]);

  /* ---------------- Actions ---------------- */

  const exigerDates = () => {
    if (avecDates) return true;
    setDatesOuvert(true);
    return false;
  };

  const ouvrirAjout = () => exigerDates() && setAjoutOuvert(true);
  const ouvrirRemplacement = (c) => exigerDates() && setRemplaceCible(c);

  const ajouterMateriel = (materiel) => {
    if (codesPresents.has(materiel.CodeMateriel))
      return toast.warning("Ce matériel est déjà dans le pack").bottom();
    if (toNumber(materiel.quantiteDisponible) <= 0)
      return toast.warning("Ce matériel n'est pas disponible").bottom();

    setComposition((prev) => [
      ...prev,
      {
        idComposant: `new-${materiel.CodeMateriel}`,
        materiel,
        quantite: 1,
        ajoute: true,
      },
    ]);
    setAjoutOuvert(false);
    toast.success("Matériel ajouté").bottom();
  };

  const remplacerPar = (materiel) => {
    if (!remplaceCible) return;
    if (codesPresents.has(materiel.CodeMateriel))
      return toast.warning("Ce matériel est déjà dans le pack").bottom();
    if (toNumber(materiel.quantiteDisponible) < remplaceCible.quantite)
      return toast
        .warning("Stock insuffisant pour la quantité du pack")
        .bottom();

    setComposition((prev) =>
      prev.map((c) =>
        c.materiel?.CodeMateriel === remplaceCible.materiel?.CodeMateriel
          ? { ...c, materiel } // quantité inchangée
          : c
      )
    );
    setRemplaceCible(null);
    toast.success("Matériel remplacé").bottom();
  };

  // Seuls les matériels ajoutés par le client peuvent être retirés
  const retirerAjout = (code) =>
    setComposition((prev) =>
      prev.filter((c) => !(c.ajoute && c.materiel?.CodeMateriel === code))
    );

  const reinitialiser = () => {
    clearDraft(codePack);
    setComposition(buildBase(pack));
  };

  const ajouterAuPanier = () => {
    if (!exigerDates()) return;
    if (hasMateriel)
      return toast
        .warning(
          "Des matériels sont déjà dans votre panier. Videz-le pour ajouter un pack."
        )
        .bottom();
    if (dejaDansPanier)
      return toast.warning("Ce pack est déjà dans votre panier").bottom();
    if (composantIndispo)
      return toast
        .warning("Remplacez les matériels indisponibles avant de continuer")
        .bottom();

    const personnalisation = composition.map((c) => ({
      idComposant: c.idComposant,
      codeMateriel: c.materiel?.CodeMateriel,
      quantite: c.quantite,
      designation: c.materiel?.designation,
      prixLocation: toNumber(c.materiel?.prixLocation),
    }));

    const ok = addItem(
      {
        code: codePack,
        designation: pack.libelle,
        photos: pack.photos,
        categoriePack: pack.categoriePack,
        tarifJournalier: totalPrix,
        tarifCatalogue: toNumber(pack.tarifJournalier),
        prixCaution: totalCaution,
        dateDebut,
        dateFin,
        personnalisation,
        estPersonnalise: compositionModifiee,
      },
      "PACK"
    );

    if (!ok)
      return toast
        .warning("Impossible d'ajouter le pack (conflit avec le panier).")
        .bottom();

    // Le brouillon est désormais porté par le panier / la réservation
    clearDraft(codePack);
    toast
      .success(
        compositionModifiee
          ? `Pack « ${pack.libelle} » personnalisé ajouté`
          : `Pack « ${pack.libelle} » ajouté`
      )
      .bottom();
    navigate("/reservation");
  };

  /* ---------------- États ---------------- */

  if (loading)
    return (
      <div className="py-20 text-center">
        <span className="loading loading-spinner loading-lg text-accent" />
      </div>
    );

  if (erreur)
    return (
      <div className="alert alert-error m-4">
        <AlertTriangle size={18} /> {erreur}
      </div>
    );

  if (!pack) return null;

  const boutonBloque =
    avecDates &&
    (indisponible || dejaDansPanier || hasMateriel || composantIndispo);

  const libelleBouton = !avecDates
    ? "Choisir mes dates"
    : dejaDansPanier
    ? "Déjà dans le panier"
    : hasMateriel
    ? "Panier occupé"
    : indisponible || composantIndispo
    ? "Indisponible"
    : "Ajouter au panier";

  /* ---------------- Rendu ---------------- */

  const BoutonPanier = ({ className = "" }) => (
    <button
      type="button"
      className={`btn btn-accent ${className}`}
      onClick={ajouterAuPanier}
      disabled={boutonBloque || !composition.length}
    >
      <ShoppingCart size={16} />
      {libelleBouton}
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6 lg:h-[calc(100dvh-5rem)] lg:overflow-hidden lg:pb-4">
      <div className="grid gap-4 lg:h-full lg:grid-cols-[1fr_360px]">
        {/* ============ GAUCHE : liste des composants ============ */}
        <section className="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-base-300 p-3 sm:p-4">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                onClick={() => navigate(-1)}
                aria-label="Retour"
              >
                <ArrowLeft size={16} />
              </button>
              <h2 className="flex items-center gap-2 truncate text-base font-semibold">
                <Boxes size={18} className="shrink-0 text-accent" />
                Composition ({composition.length})
              </h2>
            </div>
            <div className="flex items-center gap-1">
              {compositionModifiee && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm gap-1"
                  onClick={reinitialiser}
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">Réinitialiser</span>
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline btn-sm gap-1"
                onClick={ouvrirAjout}
              >
                <Plus size={14} /> Ajouter
              </button>
            </div>
          </div>

          {compositionModifiee && (
            <p className="flex items-start gap-1.5 border-b border-base-300 bg-base-200/50 px-4 py-2 text-xs opacity-80">
              <Info size={14} className="mt-0.5 shrink-0" />
              Personnalisation enregistrée sur cet appareil, envoyée à la
              validation de votre réservation.
            </p>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            {composition.length === 0 ? (
              <p className="py-10 text-center text-sm opacity-60">
                Ce pack ne contient aucun matériel.
              </p>
            ) : (
              <ul className="space-y-2">
                {composition.map((c, i) => {
                  const code = c.materiel?.CodeMateriel;
                  return (
                    <ComposantRow
                      key={`${c.idComposant}-${code ?? i}`}
                      composant={c}
                      avecStock={avecDates}
                      onRemplacer={() => ouvrirRemplacement(c)}
                      onRetirer={() => retirerAjout(code)}
                    />
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* ============ DROITE : détail + récapitulatif ============ */}
        <aside className="order-first flex min-h-0 flex-col gap-3 lg:order-none lg:overflow-y-auto">
          {/* Détail du pack (complet) */}
          <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
            <ImageUrl
              src={`${IMAGES_URL}/${pack.photos}`}
              alt={pack.libelle}
              className="h-32 w-full object-cover sm:h-36"
            />
            <div className="space-y-2.5 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold leading-tight">
                  {pack.libelle}
                </h1>
                {pack.codePack && (
                  <span className="badge badge-outline badge-xs uppercase">
                    {pack.codePack}
                  </span>
                )}
                {pack.etatPack && <BadgeEtatPack etatPack={pack.etatPack} />}
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs">
                {pack.categoriePack && (
                  <span className="badge badge-outline badge-sm">
                    {LABELS_CATEGORIE[pack.categoriePack] ?? pack.categoriePack}
                  </span>
                )}
                {(pack.capaciteMin != null || pack.capaciteMax != null) && (
                  <span className="badge badge-ghost badge-sm gap-1">
                    <Users size={12} /> {pack.capaciteMin ?? "?"}–
                    {pack.capaciteMax ?? "?"} pers.
                  </span>
                )}
                {pack.typeLieu && (
                  <span className="badge badge-ghost badge-sm gap-1">
                    <MapPin size={12} />
                    {LABELS_TYPE_LIEU[pack.typeLieu] ?? pack.typeLieu}
                  </span>
                )}
                {pack.puissanceTotal != null && (
                  <span className="badge badge-ghost badge-sm gap-1">
                    <Zap size={12} /> {pack.puissanceTotal} W
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed opacity-80">
                {pack.description || "Description non disponible"}
              </p>

              {Array.isArray(pack.usages) && pack.usages.length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] font-medium uppercase opacity-60">
                    Usages
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {pack.usages.map((u) => (
                      <span
                        key={u}
                        className="badge badge-primary badge-outline badge-sm gap-1"
                      >
                        <Music size={10} /> {u}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {pack.tarifJournalier != null && (
                <div className="flex justify-between border-t border-base-300 pt-2 text-xs">
                  <span className="opacity-70">Tarif catalogue / jour</span>
                  <span className="font-medium">
                    {formatMoney(toNumber(pack.tarifJournalier))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck size={16} className="text-accent" />
              Récapitulatif
            </h3>

            <button
              type="button"
              onClick={() => setDatesOuvert(true)}
              className={`mb-2 flex w-full items-center gap-2 rounded-lg border p-2 text-left text-xs transition ${
                avecDates
                  ? "border-base-300 bg-base-200 hover:border-accent"
                  : "border-warning/50 bg-warning/10"
              }`}
            >
              <CalendarDays size={16} className="shrink-0 text-accent" />
              <span className="min-w-0 flex-1">
                {avecDates ? (
                  <>
                    <strong>{dateDebut}</strong> → <strong>{dateFin}</strong>
                  </>
                ) : (
                  "Choisir mes dates"
                )}
              </span>
              <span className="font-medium text-accent">
                {avecDates ? "Modifier" : "Vérifier"}
              </span>
            </button>

            {avecDates && (indisponible || composantIndispo) && (
              <div className="alert alert-error mb-2 p-2 text-xs">
                <AlertTriangle size={14} />
                <span>
                  {composantIndispo
                    ? "Remplacez les matériels indisponibles."
                    : "Pack indisponible sur cette période."}
                </span>
              </div>
            )}

            {hasMateriel && avecDates && (
              <div className="alert alert-warning mb-2 p-2 text-xs">
                <AlertTriangle size={14} />
                <span>Panier occupé par des matériels. Videz-le d'abord.</span>
              </div>
            )}

            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="flex items-center gap-1 opacity-70">
                  <Package size={13} /> Composants
                </dt>
                <dd>
                  {composition.length} réf. · {totalUnites} unité(s)
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="opacity-70">Location / jour</dt>
                <dd className="font-semibold">{formatMoney(totalPrix)}</dd>
              </div>
              <div className="flex justify-between text-xs">
                <dt className="opacity-70">Caution</dt>
                <dd>{formatMoney(totalCaution)}</dd>
              </div>
            </dl>

            <div className="divider my-2" />

            <div className="flex items-center justify-between">
              <span className="font-semibold">Total / jour</span>
              <span className="text-lg font-bold text-accent">
                {formatMoney(totalPrix)}
              </span>
            </div>

            <BoutonPanier className="mt-3 hidden w-full lg:flex" />

            <p className="mt-2 flex items-start gap-1 text-[11px] opacity-60">
              <Info size={12} className="mt-0.5 shrink-0" />
              Le montant final est calculé dans le panier selon la durée.
            </p>
          </div>
        </aside>
      </div>

      {/* ---------- Barre fixe mobile ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight">
              {formatMoney(totalPrix)}{" "}
              <span className="text-xs font-normal opacity-60">/ jour</span>
            </p>
            <p className="truncate text-xs opacity-60">
              Caution : {formatMoney(totalCaution)}
            </p>
          </div>
          <BoutonPanier className="shrink-0" />
        </div>
      </div>

      {/* ---------- Modales ---------- */}
      <DatesModal
        open={datesOuvert}
        onClose={() => setDatesOuvert(false)}
        dateDebut={dateDebut}
        dateFin={dateFin}
        onConfirm={appliquerDates}
      />

      <SelectionModal
        open={ajoutOuvert}
        title="Ajouter un matériel"
        onClose={() => setAjoutOuvert(false)}
        materiels={materielsDispo}
        loading={materielsLoading}
        erreur={materielsErreur}
        codesExclus={codesPresents}
        onSelect={ajouterMateriel}
      />

      <SelectionModal
        open={!!remplaceCible}
        title={`Remplacer « ${remplaceCible?.materiel?.designation ?? ""} »`}
        subtitle={
          categorieCible?.libelle
            ? `Catégorie : ${categorieCible.libelle}`
            : "Même catégorie uniquement"
        }
        onClose={() => setRemplaceCible(null)}
        materiels={candidatsRemplacement}
        loading={materielsLoading}
        erreur={materielsErreur}
        codesExclus={codesPresents}
        quantiteMin={remplaceCible?.quantite ?? 1}
        onSelect={remplacerPar}
      />
    </div>
  );
}