import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  ShieldCheck,
  ShoppingCart,
  Package,
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
  Music,
  Zap,
  CalendarDays,
  RotateCcw,
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

/* Brouillon de personnalisation : stocké dans le navigateur, envoyé en
   base uniquement à la validation de la réservation. */
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
    /* ignore */
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
/*  Modale générique                                                   */
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
    if (fin < debut) return setErr("La fin doit être après ou égale au début.");
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
          <button type="button" className="btn btn-primary" onClick={valider}>
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
                        ? "border-base-300 hover:border-primary hover:bg-primary/5"
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

/* Champ d'information avec titre explicite */
function InfoItem({ icon: Icon, label, children, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/60">
        {Icon && <Icon size={12} />} {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PackDetailPublic() {
  const { codePack } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { addItem, items, hasMateriel } = useCart();
  const navbar = useNavbar();

  // Dates choisies dans la page (prioritaires), sinon navigation, sinon navbar
  const [datesLocales, setDatesLocales] = useState(null);
  const dateDebut =
    datesLocales?.debut || location.state?.dateDebut || navbar.dateDebut;
  const dateFin =
    datesLocales?.fin || location.state?.dateFin || navbar.dateFin;
  const avecDates = Boolean(dateDebut && dateFin);

  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [composition, setComposition] = useState([]);
  const hydratedFor = useRef(null);

  const [datesOuvert, setDatesOuvert] = useState(false);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [remplaceCible, setRemplaceCible] = useState(null);

  const [materielsDispo, setMaterielsDispo] = useState([]);
  const [materielsLoading, setMaterielsLoading] = useState(false);
  const [materielsErreur, setMaterielsErreur] = useState(null);
  const fetchedKey = useRef(null);

  const appliquerDates = (debut, fin) => {
    setDatesLocales({ debut, fin });
    if (typeof navbar.setDates === "function") navbar.setDates(debut, fin);
    else {
      navbar.setDateDebut?.(debut);
      navbar.setDateFin?.(fin);
    }
    setDatesOuvert(false);
  };

  /* ---------------- Détail du pack (même service que la page précédente) */

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

        const draft = readDraft(codePack);
        const frais = new Map(
          base.map((c) => [c.materiel?.CodeMateriel, c.materiel])
        );
        const initiale = draft?.length
          ? draft.map((c) => ({
              ...c,
              materiel: frais.get(c.materiel.CodeMateriel) ?? c.materiel,
            }))
          : base;

        hydratedFor.current = codePack;
        setPack(data);
        setComposition(initiale);
      })
      .catch((e) => alive && setErreur(e.message))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [codePack, dateDebut, dateFin, avecDates]);

  /* ---------------- Matériels disponibles ---------------- */

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

  // Rafraîchit le stock des éléments déjà dans la composition
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
          materiel: { ...c.materiel, quantiteDisponible: f.quantiteDisponible },
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

  const dejaDansPanier = items.some((i) => i.code === codePack);
  const indisponible = pack?.etatPack === "indisponible";

  const baseParCode = useMemo(
    () =>
      new Map(
        (pack?.composants || []).map((c) => [
          c.materiel?.CodeMateriel,
          Number(c.quantite),
        ])
      ),
    [pack]
  );

  const compositionModifiee = useMemo(() => {
    if (!pack) return false;
    if (baseParCode.size !== composition.length) return true;
    return composition.some(
      (c) => baseParCode.get(c.materiel?.CodeMateriel) !== c.quantite
    );
  }, [pack, baseParCode, composition]);

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

  /* ---------------- Même catégorie pour le remplacement ---------------- */

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
          ? { ...c, materiel }
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
    if (dejaDansPanier)
      return toast.warning("Ce pack est déjà dans votre panier")
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

    clearDraft(codePack);
    toast
      .success(
        compositionModifiee
          ? `Pack « ${pack.libelle} » personnalisé ajouté`
          : `Pack « ${pack.libelle} » ajouté`
      )
    // navigate("/reservation");
  };

  /* ---------------- États ---------------- */

  if (loading)
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  if (erreur)
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center text-error">
        {erreur}
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
    ? "Panier occupé par des matériels"
    : indisponible || composantIndispo
    ? "Indisponible"
    : "Ajouter au panier";

  /* ---------------- Rendu ---------------- */

  return (
    <div className="mx-auto px-4 pb-24 pt-6">
      <Link to="/packs" className="btn btn-ghost btn-sm mb-4">
        <ArrowLeft size={16} /> Retour au catalogue
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* ---------- Fiche pack ---------- */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex items-start gap-4">
                <ImageUrl
                  src={`${IMAGES_URL}/${pack.photos}`}
                  alt={pack.libelle}
                  className="size-20 shrink-0 rounded-xl object-cover sm:size-24"
                />
                <div className="min-w-0">
                  <h1 className="text-xl font-bold sm:text-2xl">
                    {pack.libelle}
                  </h1>
                  <p className="font-mono text-xs text-base-content/60">
                    {pack.codePack}
                  </p>
                </div>
              </div>

              <div className="mt-3 border-t border-base-300 pt-3">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  <InfoItem icon={Boxes} label="Type d'événement">
                    {pack.categoriePack
                      ? LABELS_CATEGORIE[pack.categoriePack] ?? pack.categoriePack
                      : "—"}
                  </InfoItem>
                  <InfoItem icon={Users} label="Nombre de personnes">
                    {pack.capaciteMin != null || pack.capaciteMax != null
                      ? `${pack.capaciteMin ?? "?"} – ${pack.capaciteMax ?? "?"} personnes`
                      : "—"}
                  </InfoItem>
                  <InfoItem icon={MapPin} label="Type de lieu">
                    {pack.typeLieu
                      ? LABELS_TYPE_LIEU[pack.typeLieu] ?? pack.typeLieu
                      : "—"}
                  </InfoItem>
                  <InfoItem icon={Zap} label="Puissance totale">
                    {pack.puissanceTotal != null ? `${pack.puissanceTotal} W` : "—"}
                  </InfoItem>
                  <InfoItem icon={Music} label="Usages" className="col-span-full">
                    {Array.isArray(pack.usages) && pack.usages.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {pack.usages.map((u) => (
                          <span key={u} className="badge badge-primary badge-outline badge-sm">
                            {u}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </InfoItem>
                  <InfoItem label="Description" className="col-span-full">
                    <p className="whitespace-pre-line leading-relaxed opacity-80">
                      {pack.description || "Description non disponible"}
                    </p>
                  </InfoItem>
                </dl>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-box bg-base-200 p-3">
                  <p className="text-xs text-base-content/60">Tarif / jour</p>
                  <p className="text-base font-bold text-primary sm:text-lg">
                    {formatMoney(pack.tarifJournalier)}
                  </p>
                </div>
                <div className="rounded-box bg-base-200 p-3">
                  <p className="text-xs text-base-content/60">Caution</p>
                  <p className="text-base font-bold sm:text-lg">
                    {formatMoney(pack.prixCaution)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Composition ---------- */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="card-title">
                    <Boxes size={18} /> Composition du pack ({composition.length})
                  </h2>
                  <p className="text-sm text-base-content/60">
                    Remplacez un matériel par un autre de la même catégorie ou
                    ajoutez-en. Les quantités du pack sont fixes.
                  </p>
                </div>
                <div className="flex gap-2">
                  {compositionModifiee && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm gap-1"
                      onClick={reinitialiser}
                    >
                      <RotateCcw size={14} /> Réinitialiser
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline gap-1"
                    onClick={ouvrirAjout}
                  >
                    <Plus size={14} /> Ajouter
                  </button>
                </div>
              </div>

              {compositionModifiee && (
                <div className="alert alert-info alert-sm mt-2">
                  <Info size={14} />
                  <span>
                    Personnalisation enregistrée sur cet appareil. Elle sera
                    envoyée à la validation de votre réservation.
                  </span>
                </div>
              )}

              {!composition.length && (
                <p className="py-8 text-center text-base-content/60">
                  Aucun matériel dans ce pack.
                </p>
              )}

              {composition.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Matériel</th>
                        <th>Stock</th>
                        <th>Prix / jour</th>
                        <th>Qté</th>
                        <th className="text-right">Sous-total</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {composition.map((c) => {
                        const m = c.materiel || {};
                        const stock = toNumber(m.quantiteDisponible);
                        const indispo = avecDates && stock < c.quantite;
                        const modifie =
                          c.ajoute ||
                          baseParCode.get(m.CodeMateriel) !== c.quantite;
                        return (
                          <tr
                            key={`${c.idComposant}-${m.CodeMateriel}`}
                            className={
                              indispo
                                ? "bg-error/10"
                                : modifie
                                ? "bg-warning/10"
                                : ""
                            }
                          >
                            <td>
                              <div className="flex items-center gap-2">
                                <ImageUrl
                                  src={`${IMAGES_URL}/${m.imageURL}`}
                                  alt={m.designation}
                                  className="size-10 shrink-0 rounded object-cover"
                                />
                                <div className="min-w-0">
                                  <div className="font-medium">
                                    {m.designation}
                                  </div>
                                  <div className="text-xs opacity-60">
                                    {m.marque}
                                  </div>
                                  {indispo && (
                                    <div className="text-xs font-medium text-error">
                                      Indisponible — remplacez-le
                                    </div>
                                  )}
                                  {c.ajoute && !indispo && (
                                    <div className="text-xs font-medium text-primary">
                                      Ajouté par vous
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              {avecDates ? (
                                <span
                                  className={`badge badge-sm ${
                                    stock >= c.quantite
                                      ? "badge-success"
                                      : "badge-error"
                                  }`}
                                >
                                  {stock}
                                </span>
                              ) : (
                                <span className="badge badge-ghost badge-sm">
                                  n/a
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap">
                              {formatMoney(m.prixLocation)}
                            </td>
                            <td>
                              <span className="rounded-full bg-base-200 px-2.5 py-1 text-xs font-semibold">
                                × {c.quantite}
                              </span>
                            </td>
                            <td className="whitespace-nowrap text-right font-medium">
                              {formatMoney(
                                c.quantite * toNumber(m.prixLocation)
                              )}
                            </td>
                            <td>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs btn-square"
                                  title="Remplacer par un matériel de la même catégorie"
                                  aria-label="Remplacer"
                                  onClick={() => ouvrirRemplacement(c)}
                                >
                                  <Replace size={14} />
                                </button>
                                {c.ajoute && (
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-xs btn-square text-error"
                                    title="Retirer"
                                    aria-label="Retirer"
                                    onClick={() => retirerAjout(m.CodeMateriel)}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="text-right text-sm">
                          Total / jour
                        </td>
                        <td className="whitespace-nowrap text-right font-bold">
                          {formatMoney(totalPrix)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------- Récapitulatif ---------- */}
        <aside className="lg:col-span-1">
          <div className="card sticky top-4 bg-base-100 shadow">
            <div className="card-body gap-3">
              <h2 className="card-title text-lg">
                <Package size={18} /> Récapitulatif
              </h2>

              <button
                type="button"
                onClick={() => setDatesOuvert(true)}
                className={`flex w-full items-center gap-2 rounded-box border p-3 text-left text-sm transition ${
                  avecDates
                    ? "border-base-300 bg-base-200 hover:border-primary"
                    : "border-warning/50 bg-warning/10"
                }`}
              >
                <CalendarDays size={16} className="shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  {avecDates ? (
                    <>
                      <strong>{dateDebut}</strong> → <strong>{dateFin}</strong>
                    </>
                  ) : (
                    "Choisir mes dates"
                  )}
                </span>
                <span className="text-xs font-medium text-primary">
                  {avecDates ? "Modifier" : "Vérifier"}
                </span>
              </button>

              {avecDates && (indisponible || composantIndispo) && (
                <div className="alert alert-error alert-sm">
                  <AlertTriangle size={14} />
                  <span>
                    {composantIndispo
                      ? "Remplacez les matériels indisponibles."
                      : "Pack indisponible sur cette période."}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Composants</span>
                <span>
                  {composition.length} réf. · {totalUnites} unité(s)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Prix / jour</span>
                <span className="font-bold text-primary">
                  {formatMoney(totalPrix)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="inline-flex items-center gap-1 text-base-content/70">
                  <ShieldCheck size={14} /> Caution
                </span>
                <span className="font-medium">{formatMoney(totalCaution)}</span>
              </div>

              <div className="divider my-1" />

              {hasMateriel && avecDates && (
                <div className="alert alert-warning alert-sm">
                  <AlertTriangle size={14} />
                  <span>
                    Des matériels sont dans votre panier. Videz-le pour ajouter
                    ce pack.
                  </span>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary hidden w-full lg:flex"
                onClick={ajouterAuPanier}
                disabled={boutonBloque || !composition.length}
              >
                <ShoppingCart size={16} />
                {libelleBouton}
              </button>

              <p className="flex items-start gap-1 text-xs text-base-content/60">
                <Info size={12} className="mt-0.5 shrink-0" />
                Le montant final sera calculé dans le panier selon la durée.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Barre fixe mobile */}
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
          <button
            type="button"
            className="btn btn-primary shrink-0"
            onClick={ajouterAuPanier}
            disabled={boutonBloque || !composition.length}
          >
            <ShoppingCart size={16} />
            {libelleBouton}
          </button>
        </div>
      </div>

      {/* Modales */}
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

// import { useEffect, useMemo, useState } from "react";
// import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
// import {
//   ArrowLeft,
//   Boxes,
//   ShieldCheck,
//   ShoppingCart,
//   Package,
//   Plus,
//   Minus,
//   Info,
//   AlertTriangle,
//   Trash2,
//   Replace,
//   X,
//   Search,
//   Loader2,
//   Users,
//   MapPin,
//   Music,
//   Zap,
// } from "lucide-react";
// import {
//   ReservationService,
//   materielDispo,
// } from "../../../data/reservationService";

// import { ImageUrl } from "../../../components/ImageURL";
// import { formatMoney } from "../../../utils/format";
// import { useCart } from "../../contexts/CartContext";
// import { useToast } from "../../../contexts/ToastContext";
// import { useNavbar } from "../../contexts/NavbarContext";
// import { asList } from "../../../Admin/hooks/useFetch";

// const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// const LABELS_CATEGORIE = {
//   conference: "Conférence",
//   soiree: "Soirée",
//   mariage: "Mariage",
//   concert: "Concert",
// };

// const LABELS_TYPE_LIEU = {
//   interieur: "Intérieur",
//   exterieur: "Extérieur",
//   mixte: "Mixte",
// };

// export default function PackDetailPublic() {
//   const { codePack } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const toast = useToast();
//   const { addItem, items, hasMateriel } = useCart();
//   const { dateDebut: dateDebutNav, dateFin: dateFinNav } = useNavbar();

//   const dateDebut = location.state?.dateDebut || dateDebutNav;
//   const dateFin = location.state?.dateFin || dateFinNav;

//   const [pack, setPack] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [erreur, setErreur] = useState(null);

//   const [composition, setComposition] = useState([]);

//   const [ajoutOuvert, setAjoutOuvert] = useState(false);
//   const [remplaceCible, setRemplaceCible] = useState(null);
//   const [recherche, setRecherche] = useState("");
//   const [materielsDispo, setMaterielsDispo] = useState([]);
//   const [materielsLoading, setMaterielsLoading] = useState(false);
//   const [materielsErreur, setMaterielsErreur] = useState(null);

//   useEffect(() => {
//     let alive = true;
//     setLoading(true);
//     ReservationService.getPackDetail(codePack, dateDebut, dateFin)
//       .then((r) => {
//         if (!alive) return;
//         setPack(r);
//         setComposition(
//           (r.composants || []).map((c) => ({
//             idComposant: c.idComposant,
//             materiel: c.materiel,
//             quantite: Number(c.quantite),
//           }))
//         );
//       })
//       .catch((e) => alive && setErreur(e.message))
//       .finally(() => alive && setLoading(false));
//     return () => {
//       alive = false;
//     };
//   }, [codePack]);

//   useEffect(() => {
//     if ((!ajoutOuvert && !remplaceCible) || !dateDebut || !dateFin) return;
//     if (materielsDispo.length) return;

//     let alive = true;
//     setMaterielsLoading(true);
//     setMaterielsErreur(null);
//     materielDispo({ dateDebut, dateFin })
//       .then((r) => {
//         if (!alive) return;
//         const cats = asList(r);
//         const flat = cats.flatMap((cat) =>
//           (cat.materiels || []).map((m) => ({
//             ...m,
//             categorie: {
//               idCategorie: cat.idCategorie,
//               libelle: cat.libelle,
//             },
//           }))
//         );
//         setMaterielsDispo(flat);
//       })
//       .catch((e) => alive && setMaterielsErreur(e.message))
//       .finally(() => alive && setMaterielsLoading(false));

//     return () => {
//       alive = false;
//     };
//   }, [ajoutOuvert, remplaceCible, dateDebut, dateFin]);

//   const codesPresents = useMemo(
//     () => new Set(composition.map((c) => c.materiel?.CodeMateriel).filter(Boolean)),
//     [composition]
//   );

//   const totalPrix = useMemo(
//     () =>
//       composition.reduce(
//         (s, c) => s + c.quantite * toNumber(c.materiel?.prixLocation),
//         0
//       ),
//     [composition]
//   );

//   const totalCaution = useMemo(
//     () =>
//       composition.reduce(
//         (s, c) => s + c.quantite * toNumber(c.materiel?.prixCaution),
//         0
//       ),
//     [composition]
//   );

//   const dejaDansPanier = items.some((i) => i.code === codePack);
//   const compositionModifiee = useMemo(() => {
//     if (!pack) return false;
//     const original = new Map(
//       (pack.composants || []).map((c) => [
//         c.materiel?.CodeMateriel,
//         Number(c.quantite),
//       ])
//     );
//     if (original.size !== composition.length) return true;
//     for (const c of composition) {
//       const q = original.get(c.materiel?.CodeMateriel);
//       if (q === undefined || q !== c.quantite) return true;
//     }
//     return false;
//   }, [pack, composition]);

//   const getStock = (materiel) => toNumber(materiel?.quantiteDisponible);

//   const changerQte = (codeMateriel, delta) => {
//     setComposition((prev) =>
//       prev.map((c) => {
//         if (c.materiel?.CodeMateriel !== codeMateriel) return c;
//         const stock = getStock(c.materiel);
//         const max = stock > 0 ? stock : c.quantite;
//         const next = Math.max(1, Math.min(max, c.quantite + delta));
//         if (next === c.quantite) return c;
//         return { ...c, quantite: next };
//       })
//     );
//   };

//   const retirer = (codeMateriel) => {
//     if (composition.length <= 1) {
//       toast.warning("Le pack doit contenir au moins un matériel").bottom();
//       return;
//     }
//     setComposition((prev) =>
//       prev.filter((c) => c.materiel?.CodeMateriel !== codeMateriel)
//     );
//   };

//   const ajouterMateriel = (materiel) => {
//     if (codesPresents.has(materiel.CodeMateriel)) {
//       toast.warning("Ce matériel est déjà dans le pack").bottom();
//       return;
//     }
//     const stock = toNumber(materiel.quantiteDisponible);
//     if (stock <= 0) {
//       toast.warning("Ce matériel n'est pas disponible").bottom();
//       return;
//     }
//     setComposition((prev) => [
//       ...prev,
//       {
//         idComposant: `new-${materiel.CodeMateriel}`,
//         materiel,
//         quantite: 1,
//       },
//     ]);
//     setAjoutOuvert(false);
//     setRecherche("");
//   };

//   const remplacerPar = (materiel) => {
//     if (!remplaceCible) return;
//     if (codesPresents.has(materiel.CodeMateriel)) {
//       toast.warning("Ce matériel est déjà dans le pack").bottom();
//       return;
//     }
//     const stock = toNumber(materiel.quantiteDisponible);
//     if (stock <= 0) {
//       toast.warning("Ce matériel n'est pas disponible").bottom();
//       return;
//     }
//     setComposition((prev) =>
//       prev.map((c) =>
//         c.materiel?.CodeMateriel === remplaceCible.materiel?.CodeMateriel
//           ? {
//               ...c,
//               materiel,
//               quantite: Math.min(c.quantite, stock),
//             }
//           : c
//       )
//     );
//     setRemplaceCible(null);
//     setRecherche("");
//     toast.success("Matériel remplacé").bottom();
//   };

//   const reinitialiser = () => {
//     if (!pack) return;
//     setComposition(
//       (pack.composants || []).map((c) => ({
//         idComposant: c.idComposant,
//         materiel: c.materiel,
//         quantite: Number(c.quantite),
//       }))
//     );
//   };

//   const ajouterAuPanier = () => {
//     if (!dateDebut || !dateFin) {
//       toast.warning("Veuillez sélectionner vos dates avant d'ajouter").bottom();
//       return;
//     }
//     if (hasMateriel) {
//       toast
//         .warning(
//           "Des matériels sont déjà dans votre panier. Videz-le pour ajouter un pack."
//         )
//         .bottom();
//       return;
//     }
//     if (dejaDansPanier) {
//       toast.warning("Ce pack est déjà dans votre panier").bottom();
//       return;
//     }
//     if (!composition.length) {
//       toast.warning("La composition du pack est vide").bottom();
//       return;
//     }

//     const personnalisation = composition.map((c) => ({
//       idComposant: c.idComposant,
//       codeMateriel: c.materiel?.CodeMateriel,
//       quantite: c.quantite,
//       designation: c.materiel?.designation,
//       prixLocation: toNumber(c.materiel?.prixLocation),
//     }));

//     const prixPersonnalise = personnalisation.reduce(
//       (s, p) => s + p.quantite * p.prixLocation,
//       0
//     );

//     const ok = addItem(
//       {
//         code: codePack,
//         designation: pack.libelle,
//         photos: pack.photos,
//         categoriePack: pack.categoriePack,
//         tarifJournalier: prixPersonnalise,
//         tarifCatalogue: toNumber(pack.tarifJournalier),
//         prixCaution: totalCaution,
//         dateDebut,
//         dateFin,
//         personnalisation,
//         estPersonnalise: compositionModifiee,
//       },
//       "PACK"
//     );

//     if (!ok) {
//       toast
//         .warning("Impossible d'ajouter le pack (conflit avec le panier).")
//         .bottom();
//       return;
//     }
//     toast
//       .success(
//         compositionModifiee
//           ? `Pack « ${pack.libelle} » personnalisé ajouté`
//           : `Pack « ${pack.libelle} » ajouté`
//       )
//       .bottom();
//     navigate("/reservation");
//   };

//   if (loading)
//     return (
//       <div className="mx-auto max-w-5xl px-4 py-20 text-center">
//         <span className="loading loading-spinner loading-lg" />
//       </div>
//     );
//   if (erreur)
//     return (
//       <div className="mx-auto max-w-5xl px-4 py-20 text-center text-error">
//         {erreur}
//       </div>
//     );
//   if (!pack) return null;

//   return (
//     <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
//       <Link to="/reservation" className="btn btn-ghost btn-sm mb-4">
//         <ArrowLeft size={16} /> Retour au catalogue
//       </Link>

//       <div className="grid gap-6 lg:grid-cols-3">
//         <div className="space-y-6 lg:col-span-2">
//           {/* Fiche pack */}
//           <div className="card bg-base-100 shadow">
//             <div className="card-body">
//               <div className="flex items-start gap-4">
//                 <ImageUrl
//                   src={pack.photos}
//                   alt={pack.libelle}
//                   className="h-24 w-24 shrink-0 rounded-xl"
//                 />
//                 <div>
//                   <h1 className="text-2xl font-bold">{pack.libelle}</h1>
//                   <p className="font-mono text-xs text-base-content/60">
//                     {pack.codePack}
//                   </p>
//                   {pack.categoriePack && (
//                     <span className="badge badge-outline badge-sm mt-2">
//                       {LABELS_CATEGORIE[pack.categoriePack] ?? pack.categoriePack}
//                     </span>
//                   )}
//                 </div>
//               </div>

//               {pack.description && (
//                 <p className="mt-4 whitespace-pre-line text-base-content/80">
//                   {pack.description}
//                 </p>
//               )}

//               {/* Caractéristiques */}
//               <div className="mt-4 flex flex-wrap gap-2">
//                 {(pack.capaciteMin != null || pack.capaciteMax != null) && (
//                   <div className="badge badge-lg badge-ghost gap-2">
//                     <Users size={14} />
//                     {pack.capaciteMin ?? "?"}–{pack.capaciteMax ?? "?"} pers.
//                   </div>
//                 )}
//                 {pack.typeLieu && (
//                   <div className="badge badge-lg badge-ghost gap-2">
//                     <MapPin size={14} />
//                     {LABELS_TYPE_LIEU[pack.typeLieu] ?? pack.typeLieu}
//                   </div>
//                 )}
//                 {pack.puissanceTotal != null && (
//                   <div className="badge badge-lg badge-ghost gap-2">
//                     <Zap size={14} />
//                     {pack.puissanceTotal} W
//                   </div>
//                 )}
//               </div>

//               {Array.isArray(pack.usages) && pack.usages.length > 0 && (
//                 <div className="mt-2 flex flex-wrap gap-1">
//                   {pack.usages.map((u) => (
//                     <span
//                       key={u}
//                       className="badge badge-primary badge-sm badge-outline gap-1"
//                     >
//                       <Music size={12} />
//                       {u}
//                     </span>
//                   ))}
//                 </div>
//               )}

//               <div className="mt-4 grid grid-cols-2 gap-3">
//                 <div className="rounded-box bg-base-200 p-3">
//                   <p className="text-xs text-base-content/60">Tarif / jour</p>
//                   <p className="text-lg font-bold text-primary">
//                     {formatMoney(pack.tarifJournalier)}
//                   </p>
//                 </div>
//                 <div className="rounded-box bg-base-200 p-3">
//                   <p className="text-xs text-base-content/60">Caution</p>
//                   <p className="text-lg font-bold">
//                     {formatMoney(pack.prixCaution)}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Composition éditable */}
//           <div className="card bg-base-100 shadow">
//             <div className="card-body">
//               <div className="flex flex-wrap items-start justify-between gap-3">
//                 <div>
//                   <h2 className="card-title">
//                     <Boxes size={18} /> Composition du pack
//                   </h2>
//                   <p className="text-sm text-base-content/60">
//                     Ajoutez, remplacez, retirez ou ajustez les quantités. Le
//                     stock disponible est vérifié à chaque étape.
//                   </p>
//                 </div>
//                 <div className="flex gap-2">
//                   {compositionModifiee && (
//                     <button
//                       type="button"
//                       className="btn btn-ghost btn-sm"
//                       onClick={reinitialiser}
//                     >
//                       <X size={14} /> Réinitialiser
//                     </button>
//                   )}
//                   <button
//                     type="button"
//                     className="btn btn-sm btn-outline"
//                     onClick={() => setAjoutOuvert(true)}
//                   >
//                     <Plus size={14} /> Ajouter
//                   </button>
//                 </div>
//               </div>

//               {compositionModifiee && (
//                 <div className="alert alert-info alert-sm mt-2">
//                   <Info size={14} />
//                   <span>
//                     Composition modifiée : le tarif affiché est recalculé en
//                     direct selon les matériels sélectionnés.
//                   </span>
//                 </div>
//               )}

//               {!composition.length && (
//                 <p className="py-8 text-center text-base-content/60">
//                   Aucun matériel dans ce pack.
//                 </p>
//               )}

//               {composition.length > 0 && (
//                 <div className="overflow-x-auto">
//                   <table className="table table-sm">
//                     <thead>
//                       <tr>
//                         <th>Matériel</th>
//                         <th>Stock</th>
//                         <th>Prix / jour</th>
//                         <th>Quantité</th>
//                         <th className="text-right">Sous-total</th>
//                         <th />
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {composition.map((c) => {
//                         const m = c.materiel || {};
//                         const stock = getStock(m);
//                         const modifie = !pack.composants?.find(
//                           (o) =>
//                             o.materiel?.CodeMateriel === m.CodeMateriel &&
//                             Number(o.quantite) === c.quantite
//                         );
//                         return (
//                           <tr
//                             key={`${c.idComposant}-${m.CodeMateriel}`}
//                             className={modifie ? "bg-warning/10" : ""}
//                           >
//                             <td>
//                               <div className="flex items-center gap-2">
//                                 <ImageUrl
//                                   src={m.imageURL}
//                                   alt={m.designation}
//                                   className="h-10 w-10 rounded"
//                                 />
//                                 <div className="min-w-0">
//                                   <div className="font-medium">
//                                     {m.designation}
//                                   </div>
//                                   <div className="text-xs opacity-60">
//                                     {m.marque}
//                                   </div>
//                                 </div>
//                               </div>
//                             </td>
//                             <td>
//                               <span
//                                 className={`badge badge-sm ${
//                                   stock > 0 ? "badge-success" : "badge-error"
//                                 }`}
//                               >
//                                 {stock}
//                               </span>
//                             </td>
//                             <td>{formatMoney(m.prixLocation)}</td>
//                             <td>
//                               <div className="join">
//                                 <button
//                                   type="button"
//                                   className="btn btn-xs join-item"
//                                   onClick={() => changerQte(m.CodeMateriel, -1)}
//                                   disabled={c.quantite <= 1}
//                                 >
//                                   <Minus size={12} />
//                                 </button>
//                                 <span className="join-item flex min-w-10 items-center justify-center border border-base-300 px-2 text-sm">
//                                   {c.quantite}
//                                 </span>
//                                 <button
//                                   type="button"
//                                   className="btn btn-xs join-item"
//                                   onClick={() => changerQte(m.CodeMateriel, 1)}
//                                   disabled={stock > 0 && c.quantite >= stock}
//                                 >
//                                   <Plus size={12} />
//                                 </button>
//                               </div>
//                             </td>
//                             <td className="whitespace-nowrap text-right font-medium">
//                               {formatMoney(c.quantite * toNumber(m.prixLocation))}
//                             </td>
//                             <td>
//                               <div className="flex items-center gap-1">
//                                 <button
//                                   type="button"
//                                   className="btn btn-ghost btn-xs btn-square"
//                                   title="Remplacer"
//                                   onClick={() => setRemplaceCible(c)}
//                                 >
//                                   <Replace size={14} />
//                                 </button>
//                                 <button
//                                   type="button"
//                                   className="btn btn-ghost btn-xs btn-square text-error"
//                                   title="Retirer"
//                                   onClick={() => retirer(m.CodeMateriel)}
//                                   disabled={composition.length <= 1}
//                                 >
//                                   <Trash2 size={14} />
//                                 </button>
//                               </div>
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                     <tfoot>
//                       <tr>
//                         <td colSpan={4} className="text-right text-sm">
//                           Total / jour
//                         </td>
//                         <td className="whitespace-nowrap text-right font-bold">
//                           {formatMoney(totalPrix)}
//                         </td>
//                         <td />
//                       </tr>
//                     </tfoot>
//                   </table>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Récapitulatif sticky */}
//         <aside className="lg:col-span-1">
//           <div className="card bg-base-100 shadow sticky top-4">
//             <div className="card-body gap-3">
//               <h2 className="card-title text-lg">
//                 <Package size={18} /> Récapitulatif
//               </h2>

//               {dateDebut && dateFin && (
//                 <div className="rounded-box bg-base-200 p-3 text-sm">
//                   Période : <strong>{dateDebut}</strong> →{" "}
//                   <strong>{dateFin}</strong>
//                 </div>
//               )}

//               <div className="flex justify-between text-sm">
//                 <span className="text-base-content/70">Prix / jour</span>
//                 <span className="font-bold text-primary">
//                   {formatMoney(totalPrix)}
//                 </span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-base-content/70 inline-flex items-center gap-1">
//                   <ShieldCheck size={14} /> Caution
//                 </span>
//                 <span className="font-medium">{formatMoney(totalCaution)}</span>
//               </div>

//               <div className="divider my-1" />

//               {hasMateriel && (
//                 <div className="alert alert-warning alert-sm">
//                   <AlertTriangle size={14} />
//                   <span>
//                     Des matériels sont dans votre panier. Videz-le pour ajouter
//                     ce pack.
//                   </span>
//                 </div>
//               )}

//               <button
//                 className="btn btn-primary w-full"
//                 onClick={ajouterAuPanier}
//                 disabled={dejaDansPanier || hasMateriel || !composition.length}
//               >
//                 <ShoppingCart size={16} />
//                 {dejaDansPanier
//                   ? "Déjà dans le panier"
//                   : hasMateriel
//                   ? "Panier occupé par des matériels"
//                   : "Ajouter au panier"}
//               </button>

//               <p className="flex items-start gap-1 text-xs text-base-content/60">
//                 <Info size={12} className="mt-0.5 shrink-0" />
//                 Le montant final sera calculé dans le panier selon la durée.
//               </p>
//             </div>
//           </div>
//         </aside>
//       </div>

//       <ModalSelection
//         open={ajoutOuvert || !!remplaceCible}
//         title={
//           remplaceCible
//             ? `Remplacer « ${remplaceCible.materiel?.designation} »`
//             : "Ajouter un matériel"
//         }
//         onClose={() => {
//           setAjoutOuvert(false);
//           setRemplaceCible(null);
//           setRecherche("");
//         }}
//         recherche={recherche}
//         setRecherche={setRecherche}
//         materiels={materielsDispo}
//         loading={materielsLoading}
//         erreur={materielsErreur}
//         codesExclus={codesPresents}
//         onSelect={(m) => (remplaceCible ? remplacerPar(m) : ajouterMateriel(m))}
//       />
//     </div>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* Modale de sélection de matériel                                     */
// /* ------------------------------------------------------------------ */
// function ModalSelection({
//   open,
//   title,
//   onClose,
//   recherche,
//   setRecherche,
//   materiels,
//   loading,
//   erreur,
//   codesExclus,
//   onSelect,
// }) {
//   const filtres = useMemo(() => {
//     const q = recherche.trim().toLowerCase();
//     return materiels.filter((m) => {
//       if (!q) return true;
//       return (
//         m.designation?.toLowerCase().includes(q) ||
//         m.marque?.toLowerCase().includes(q) ||
//         m.CodeMateriel?.toLowerCase().includes(q)
//       );
//     });
//   }, [materiels, recherche]);

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50">
//       <div className="absolute inset-0 bg-black/50" onClick={onClose} />
//       <div className="absolute inset-0 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
//         <div className="relative w-full max-w-2xl rounded-2xl bg-base-100 shadow-xl">
//           <div className="flex items-center justify-between border-b border-base-300 p-4">
//             <h3 className="text-lg font-bold">{title}</h3>
//             <button
//               className="btn btn-ghost btn-sm btn-square"
//               onClick={onClose}
//             >
//               <X size={18} />
//             </button>
//           </div>

//           <div className="p-4">
//             <label className="input input-bordered flex items-center gap-2">
//               <Search size={16} className="opacity-60" />
//               <input
//                 type="search"
//                 className="grow"
//                 placeholder="Rechercher un matériel…"
//                 value={recherche}
//                 onChange={(e) => setRecherche(e.target.value)}
//                 autoFocus
//               />
//             </label>
//           </div>

//           <div className="max-h-[60vh] overflow-y-auto px-4 pb-4">
//             {loading && (
//               <div className="flex justify-center py-10">
//                 <Loader2 className="animate-spin" size={24} />
//               </div>
//             )}
//             {!loading && erreur && (
//               <p className="py-8 text-center text-error">{erreur}</p>
//             )}
//             {!loading && !erreur && !filtres.length && (
//               <p className="py-8 text-center text-base-content/60">
//                 Aucun matériel disponible.
//               </p>
//             )}
//             {!loading && !erreur && filtres.length > 0 && (
//               <ul className="space-y-2">
//                 {filtres.map((m) => {
//                   const stock = toNumber(m.quantiteDisponible);
//                   const deja = codesExclus.has(m.CodeMateriel);
//                   return (
//                     <li key={m.CodeMateriel}>
//                       <button
//                         type="button"
//                         onClick={() => !deja && stock > 0 && onSelect(m)}
//                         disabled={deja || stock <= 0}
//                         className={`flex w-full items-center gap-3 rounded-box border p-3 text-left transition ${
//                           deja || stock <= 0
//                             ? "cursor-not-allowed border-base-300 opacity-60"
//                             : "border-base-300 hover:border-primary hover:bg-primary/5"
//                         }`}
//                       >
//                         <ImageUrl
//                           src={m.imageURL}
//                           alt={m.designation}
//                           className="h-12 w-12 shrink-0 rounded"
//                         />
//                         <div className="min-w-0 flex-1">
//                           <p className="truncate font-medium">{m.designation}</p>
//                           <p className="truncate text-xs text-base-content/60">
//                             {m.marque}
//                             {m.marque && " · "}
//                             {formatMoney(m.prixLocation)} / jour
//                           </p>
//                         </div>
//                         <div className="shrink-0 text-right">
//                           <span
//                             className={`badge badge-sm ${
//                               stock > 0 ? "badge-success" : "badge-error"
//                             }`}
//                           >
//                             {stock} dispo
//                           </span>
//                           {deja && (
//                             <p className="mt-1 text-[10px] text-base-content/60">
//                               Déjà présent
//                             </p>
//                           )}
//                         </div>
//                       </button>
//                     </li>
//                   );
//                 })}
//               </ul>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }