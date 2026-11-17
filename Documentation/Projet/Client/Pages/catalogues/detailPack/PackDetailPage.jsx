import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";

import {
  ReservationService,
  materielDispo,
} from "../../../../data/reservationService";
import { PackService } from "../../../../data/PackService";

import { useCart } from "../../../contexts/CartContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useNavbar } from "../../../contexts/NavbarContext";
import { asList } from "../../../../Admin/hooks/useFetch";

import PackIdentiteCard from "./PackIdentiteCard";
import PackRecapFinancier from "./PackRecapFinancier";
import PackCompositionPanel from "./PackCompositionPanel";
import ModalSelection from "./ModalSelection";

import { toNumber } from "./utils/packHelpers";
import { toISODate } from "./utils/toISODate";
import { PackDetailLoading, PackDetailErreur } from "./utils/responce";

export default function PackDetailPage() {
  const { codePack } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { addItem, items, hasMateriel } = useCart();
  const { dateDebut, dateFin } = useNavbar();

  const dateDebutISO = toISODate(dateDebut);
  const dateFinISO = toISODate(dateFin);
  const avecDates = Boolean(dateDebut && dateFin);

  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [composition, setComposition] = useState([]);

  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [remplaceCible, setRemplaceCible] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [materielsDispo, setMaterielsDispo] = useState([]);
  const [materielsLoading, setMaterielsLoading] = useState(false);
  const [materielsErreur, setMaterielsErreur] = useState(null);

  /* ---------------- Chargement du pack ---------------- */
  const charger = async () => {
    setLoading(true);
    setErreur(null);

    try {
      const data = avecDates
        ? await ReservationService.getPackDetail(codePack, dateDebutISO, dateFinISO)
        : await PackService.detail(codePack);
      if (!data) {
        setErreur("Pack introuvable");
        return
      }

      setPack(data);
      setComposition(
        (data.composants ?? []).map((c) => ({
          idComposant: c.idComposant,
          materiel: c.materiel,
          quantite: Number(c.quantite),
        }))
      );
    } catch (err) {
      setErreur(err?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    charger();
  }, []);

console.log("PACK: ", pack)

  /* ---------------- Chargement matériels dispo ---------------- */
  useEffect(() => {
    if ((!ajoutOuvert && !remplaceCible) || !avecDates) return;
    if (materielsDispo.length) return;

    let alive = true;
    setMaterielsLoading(true);
    setMaterielsErreur(null);
    materielDispo({ dateDebut: dateDebutISO, dateFin: dateFinISO })
      .then((r) => {
        if (!alive) return;
        const cats = asList(r);
        const flat = cats.flatMap((cat) =>
          (cat.materiels || []).map((m) => ({
            ...m,
            categorie: {
              idCategorie: cat.idCategorie,
              libelle: cat.libelle,
            },
          }))
        );
        setMaterielsDispo(flat);
      })
      .catch((e) => alive && setMaterielsErreur(e.message))
      .finally(() => alive && setMaterielsLoading(false));

    return () => {
      alive = false;
    };
  }, [ajoutOuvert, remplaceCible, avecDates, dateDebutISO, dateFinISO]);

  /* ---------------- Mémos ---------------- */
  const codesPresents = useMemo(
    () =>
      new Set(
        composition.map((c) => c.materiel?.CodeMateriel).filter(Boolean)
      ),
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

  const compositionModifiee = useMemo(() => {
    if (!pack) return false;
    const original = new Map(
      (pack.composants || []).map((c) => [
        c.materiel?.CodeMateriel,
        Number(c.quantite),
      ])
    );
    if (original.size !== composition.length) return true;
    for (const c of composition) {
      const q = original.get(c.materiel?.CodeMateriel);
      if (q === undefined || q !== c.quantite) return true;
    }
    return false;
  }, [pack, composition]);

  const indisponible = pack?.etatPack === "indisponible";

  const baseQuantiteParCode = useMemo(() => {
    const m = new Map();
    (pack?.composants || []).forEach((c) => {
      if (c.materiel?.CodeMateriel)
        m.set(c.materiel.CodeMateriel, Number(c.quantite));
    });
    return m;
  }, [pack]);

  /* ---------------- Actions ---------------- */
  const changerQte = (codeMateriel, delta) => {
    setComposition((prev) =>
      prev.map((c) => {
        if (c.materiel?.CodeMateriel !== codeMateriel) return c;
        const stock = toNumber(c.materiel?.quantiteDisponible);
        const max = avecDates && stock > 0 ? stock : Infinity;
        const next = Math.max(1, Math.min(max, c.quantite + delta));
        if (next === c.quantite) return c;
        return { ...c, quantite: next };
      })
    );
  };

  const retirer = (codeMateriel) => {
    if (composition.length <= 1) {
      toast.warning("Le pack doit contenir au moins un matériel").bottom();
      return;
    }
    setComposition((prev) =>
      prev.filter((c) => c.materiel?.CodeMateriel !== codeMateriel)
    );
  };

  const ajouterMateriel = (materiel) => {
    if (codesPresents.has(materiel.CodeMateriel)) {
      toast.warning("Ce matériel est déjà dans le pack").bottom();
      return;
    }
    const stock = toNumber(materiel.quantiteDisponible);
    if (stock <= 0) {
      toast.warning("Ce matériel n'est pas disponible").bottom();
      return;
    }
    setComposition((prev) => [
      ...prev,
      {
        idComposant: `new-${materiel.CodeMateriel}`,
        materiel,
        quantite: 1,
      },
    ]);
    setAjoutOuvert(false);
    setRecherche("");
  };

  const remplacerPar = (materiel) => {
    if (!remplaceCible) return;
    if (codesPresents.has(materiel.CodeMateriel)) {
      toast.warning("Ce matériel est déjà dans le pack").bottom();
      return;
    }
    const stock = toNumber(materiel.quantiteDisponible);
    if (stock <= 0) {
      toast.warning("Ce matériel n'est pas disponible").bottom();
      return;
    }
    setComposition((prev) =>
      prev.map((c) =>
        c.materiel?.CodeMateriel === remplaceCible.materiel?.CodeMateriel
          ? { ...c, materiel, quantite: Math.min(c.quantite, stock) }
          : c
      )
    );
    setRemplaceCible(null);
    setRecherche("");
    toast.success("Matériel remplacé").bottom();
  };

  const reinitialiser = () => {
    if (!pack) return;
    setComposition(
      (pack.composants || []).map((c) => ({
        idComposant: c.idComposant,
        materiel: c.materiel,
        quantite: Number(c.quantite),
      }))
    );
  };

  const ajouterAuPanier = () => {
    if (!avecDates) {
      toast.warning("Veuillez sélectionner vos dates avant d'ajouter").bottom();
      return;
    }
    if (hasMateriel) {
      toast
        .warning(
          "Des matériels sont déjà dans votre panier. Videz-le pour ajouter un pack."
        )
        .bottom();
      return;
    }
    if (dejaDansPanier) {
      toast.warning("Ce pack est déjà dans votre panier").bottom();
      return;
    }
    if (!composition.length) {
      toast.warning("La composition du pack est vide").bottom();
      return;
    }

    const personnalisation = composition.map((c) => ({
      idComposant: c.idComposant,
      codeMateriel: c.materiel?.CodeMateriel,
      quantite: c.quantite,
      designation: c.materiel?.designation,
      prixLocation: toNumber(c.materiel?.prixLocation),
    }));

    const prixPersonnalise = personnalisation.reduce(
      (s, p) => s + p.quantite * p.prixLocation,
      0
    );

    const ok = addItem(
      {
        code: codePack,
        designation: pack.libelle,
        photos: pack.photos,
        categoriePack: pack.categoriePack,
        tarifJournalier: prixPersonnalise,
        tarifCatalogue: toNumber(pack.tarifJournalier),
        prixCaution: totalCaution,
        dateDebut: dateDebutISO,
        dateFin: dateFinISO,
        personnalisation,
        estPersonnalise: compositionModifiee,
      },
      "PACK"
    );

    if (!ok) {
      toast
        .warning("Impossible d'ajouter le pack (conflit avec le panier).")
        .bottom();
      return;
    }
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
  // if (loading) return <PackDetailLoading />;
  // if (erreur) return <PackDetailErreur message={erreur} />;
  if (erreur) {
    console.error("PACKKKKKKK :", erreur);
  }
  // if (!pack) return null;

  return (
    <>
      {/* Bouton retour flottant */}
      <Link
        to="/packs"
        className="fixed left-4 top-20 z-40 btn btn-circle btn-sm border border-base-300 bg-base-100 shadow-md hover:btn-accent sm:left-6"
        aria-label="Retour aux packs"
        title="Retour aux packs"
      >
        <ArrowLeft size={16} />
      </Link>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[380px_1fr]">
          {/* COLONNE GAUCHE */}
          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <PackIdentiteCard pack={pack} />
            <PackRecapFinancier
              avecDates={avecDates}
              dateDebut={dateDebutISO}
              dateFin={dateFinISO}
              totalUnites={totalUnites}
              totalPrix={totalPrix}
              totalCaution={totalCaution}
              hasMateriel={hasMateriel}
              indisponible={indisponible}
              dejaDansPanier={dejaDansPanier}
              compositionModifiee={compositionModifiee}
              compositionLength={composition.length}
              onAjouter={ajouterAuPanier}
              onReinitialiser={reinitialiser}
            />
          </aside>

          {/* COLONNE DROITE */}
          <PackCompositionPanel
            avecDates={avecDates}
            composition={composition}
            totalUnites={totalUnites}
            totalPrix={totalPrix}
            totalCaution={totalCaution}
            compositionModifiee={compositionModifiee}
            indisponible={indisponible}
            dejaDansPanier={dejaDansPanier}
            hasMateriel={hasMateriel}
            baseQuantiteParCode={baseQuantiteParCode}
            onChangeQuantite={changerQte}
            onRemplacer={(c) => setRemplaceCible(c)}
            onRetirer={retirer}
            onAjouterMateriel={() => setAjoutOuvert(true)}
            onAjouterAuPanier={ajouterAuPanier}
          />
        </div>

        <ModalSelection
          open={ajoutOuvert || !!remplaceCible}
          title={
            remplaceCible
              ? `Remplacer « ${remplaceCible.materiel?.designation} »`
              : "Ajouter un matériel"
          }
          onClose={() => {
            setAjoutOuvert(false);
            setRemplaceCible(null);
            setRecherche("");
          }}
          recherche={recherche}
          setRecherche={setRecherche}
          materiels={materielsDispo}
          loading={materielsLoading}
          erreur={materielsErreur}
          codesExclus={codesPresents}
          onSelect={(m) =>
            remplaceCible ? remplacerPar(m) : ajouterMateriel(m)
          }
        />
      </div>
    </>
  );
}