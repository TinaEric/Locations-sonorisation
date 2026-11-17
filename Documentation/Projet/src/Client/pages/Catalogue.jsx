// Client/pages/Catalogue.jsx
// Matériels et packs avec leur état de disponibilité sur la période choisie.
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchX } from "lucide-react";
import { CalendrierService } from "../../data/CalendrierService";
import ModalCalendrier from "../components/calendrier/ModalCalendrier";
import BarreRecherche from "../components/catalogue/BarreRecherche";
import CarteMateriel from "../components/catalogue/CarteMateriel";
import CartePack from "../components/catalogue/CartePack";
import Chargement from "../components/commun/Chargement";
import EtatVide from "../components/commun/EtatVide";
import MessageErreur from "../components/commun/MessageErreur";
import { usePanier } from "../contexts/PanierContext";
import useCatalogue from "../hooks/useCatalogue";
import useDisponibilites from "../hooks/useDisponibilites";
import { STATUT_DISPONIBILITE as STATUT } from "../utils/constantes";
import { materielCorrespond, packCorrespond } from "../utils/recherche";

const PAS_AFFICHAGE = 12;
const ONGLETS = [
  { valeur: "tout", libelle: "Tout" },
  { valeur: "materiels", libelle: "Matériels" },
  { valeur: "packs", libelle: "Packs" },
];

export default function Catalogue() {
  const [params, setParams] = useSearchParams();
  const terme = params.get("q") ?? "";
  const categorie = params.get("cat") ?? "";
  const onglet = params.get("onglet") ?? "tout";
  const seulementDisponibles = params.get("dispo") === "1";

  const { periode, definirPeriode } = usePanier();
  const { materiels, packs, categories, chargement, erreur } = useCatalogue();
  const disponibilites = useDisponibilites(periode);
  const [limite, setLimite] = useState(PAS_AFFICHAGE);
  const [calendrierCible, setCalendrierCible] = useState(null);

  const modifierParametre = (cle, valeur) => {
    const suivants = new URLSearchParams(params);
    if (valeur) suivants.set(cle, valeur);
    else suivants.delete(cle);
    setParams(suivants, { replace: true });
    setLimite(PAS_AFFICHAGE);
  };

  const lancerRecherche = ({ terme: nouveauTerme, dateDebut, dateFin }) => {
    definirPeriode({ dateDebut, dateFin });
    modifierParametre("q", nouveauTerme);
  };

  const estVisible = (type, code) =>
    !seulementDisponibles || disponibilites.obtenir(type, code).statut !== STATUT.INDISPONIBLE;

  const materielsFiltres = useMemo(
    () =>
      materiels.filter(
        (m) =>
          (!terme || materielCorrespond(m, terme)) &&
          (!categorie || m.categorieIds.includes(categorie)) &&
          estVisible("materiel", m.CodeMateriel),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [materiels, terme, categorie, seulementDisponibles, disponibilites.obtenir],
  );

  const packsFiltres = useMemo(
    () =>
      categorie
        ? []
        : packs.filter((p) => (!terme || packCorrespond(p, terme)) && estVisible("pack", p.codePack)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [packs, terme, categorie, seulementDisponibles, disponibilites.obtenir],
  );

  const afficherPacks = onglet !== "materiels";
  const afficherMateriels = onglet !== "packs";
  const aucunResultat =
    !chargement && (!afficherPacks || !packsFiltres.length) && (!afficherMateriels || !materielsFiltres.length);

  const ouvrirCalendrier = (type, code, titre) =>
    setCalendrierCible({ code, titre, chargerMois: CalendrierService.fabriquerChargeur(type, code) });

  return (
    <div className="space-y-6">
      <BarreRecherche
        key={`${terme}|${periode.dateDebut}|${periode.dateFin}`}
        termeInitial={terme}
        periodeInitiale={periode}
        onRechercher={lancerRecherche}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="tabs tabs-box">
          {ONGLETS.map((o) => (
            <button
              key={o.valeur}
              type="button"
              role="tab"
              className={`tab ${onglet === o.valeur ? "tab-active" : ""}`}
              onClick={() => modifierParametre("onglet", o.valeur === "tout" ? "" : o.valeur)}
            >
              {o.libelle}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="select select-bordered select-sm"
            value={categorie}
            onChange={(e) => modifierParametre("cat", e.target.value)}
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.idCategorie} value={c.idCategorie}>
                {"— ".repeat(Math.max(0, (c.niveau ?? 1) - 1))}{c.libelle}
              </option>
            ))}
          </select>

          <label className={`label cursor-pointer gap-2 text-sm ${disponibilites.periodeValide ? "" : "opacity-50"}`}>
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={seulementDisponibles}
              disabled={!disponibilites.periodeValide}
              onChange={(e) => modifierParametre("dispo", e.target.checked ? "1" : "")}
            />
            Disponibles uniquement
          </label>
        </div>
      </div>

      {!disponibilites.periodeValide && (
        <p className="text-sm text-base-content/60">
          Choisissez une période pour afficher la disponibilité de chaque matériel et pack.
        </p>
      )}
      <MessageErreur message={erreur ?? disponibilites.erreur} onReessayer={disponibilites.rafraichir} />
      {chargement && <Chargement message="Chargement du catalogue…" />}

      {afficherPacks && packsFiltres.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Packs ({packsFiltres.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {packsFiltres.map((pack) => (
              <CartePack
                key={pack.codePack}
                pack={pack}
                disponibilite={disponibilites.obtenir("pack", pack.codePack)}
                onVoirCalendrier={() => ouvrirCalendrier("pack", pack.codePack, pack.libelle)}
              />
            ))}
          </div>
        </section>
      )}

      {afficherMateriels && materielsFiltres.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Matériels ({materielsFiltres.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {materielsFiltres.slice(0, limite).map((materiel) => (
              <CarteMateriel
                key={materiel.CodeMateriel}
                materiel={materiel}
                disponibilite={disponibilites.obtenir("materiel", materiel.CodeMateriel)}
                onVoirCalendrier={() => ouvrirCalendrier("materiel", materiel.CodeMateriel, materiel.designation)}
              />
            ))}
          </div>
          {materielsFiltres.length > limite && (
            <div className="text-center">
              <button type="button" className="btn btn-outline" onClick={() => setLimite((l) => l + PAS_AFFICHAGE)}>
                Afficher plus
              </button>
            </div>
          )}
        </section>
      )}

      {aucunResultat && (
        <EtatVide
          Icone={SearchX}
          titre="Aucun résultat"
          message="Essayez un autre mot-clé, une autre catégorie ou d'autres dates."
        />
      )}

      <ModalCalendrier cible={calendrierCible} periode={periode} onFermer={() => setCalendrierCible(null)} />
    </div>
  );
}
