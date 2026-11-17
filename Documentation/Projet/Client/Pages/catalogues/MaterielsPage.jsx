import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, Filter, Search } from "lucide-react";

import { useNavbar } from "../../contexts/NavbarContext";
import { useToast } from "../../../contexts/ToastContext";
import { ReservationService } from "../../../data/reservationService";
import { IMAGES_URL } from "../../../data/Api";

export default function MaterielsPage() {
  const { dateDebut, dateFin, datesCompletes } = useNavbar();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("");

  const chargerMateriels = async () => {
    setLoading(true);

    try {
      const response = datesCompletes
        ? await ReservationService.materielDispibles({
            dateDebut,
            dateFin,
          })
        : await ReservationService.tousMateriel();

      setCategories(response?.data ?? response ?? []);
    } catch (error) {
      showToast(
        error?.response?.data?.message ??
          "Impossible de charger les matériels.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerMateriels();
  }, [dateDebut, dateFin]);

  const materielsFiltres = useMemo(() => {
    const rechercheNormalisee = recherche.trim().toLowerCase();

    return categories
      .filter(
        (categorieItem) =>
          !categorie || categorieItem.codeCategorie === categorie
      )
      .map((categorieItem) => ({
        ...categorieItem,
        materiels: categorieItem.materiels.filter((materiel) => {
          const correspondRecherche =
            !rechercheNormalisee ||
            materiel.designation?.toLowerCase().includes(rechercheNormalisee) ||
            materiel.marque?.toLowerCase().includes(rechercheNormalisee);

          return correspondRecherche;
        }),
      }))
      .filter((categorieItem) => categorieItem.materiels.length > 0);
  }, [categories, recherche, categorie]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="card h-fit bg-base-100 shadow-sm">
        <div className="card-body gap-4">
          <h2 className="card-title flex items-center gap-2 text-lg">
            <Filter size={18} className="text-accent" />
            Filtres
          </h2>

          <label className="form-control">
            <span className="label-text">Recherche</span>

            <label className="input input-bordered flex items-center gap-2">
              <Search size={16} />
              <input
                type="text"
                placeholder="Micro, enceinte, table..."
                className="grow"
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
              />
            </label>
          </label>

          <label className="form-control">
            <span className="label-text">Catégorie</span>

            <select
              className="select select-bordered"
              value={categorie}
              onChange={(event) => setCategorie(event.target.value)}
            >
              <option value="">Toutes les catégories</option>

              {categories.map((categorieItem) => (
                <option
                  key={categorieItem.codeCategorie}
                  value={categorieItem.codeCategorie}
                >
                  {categorieItem.libelle}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setRecherche("");
              setCategorie("");
            }}
          >
            Réinitialiser
          </button>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Boxes size={22} className="text-accent" />
            Matériels
          </h1>

          <span className="badge badge-accent">
            {materielsFiltres.reduce(
              (total, categorieItem) => total + categorieItem.materiels.length,
              0
            )}{" "}
            résultat(s)
          </span>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg text-accent" />
          </div>
        )}

        {!loading && materielsFiltres.length === 0 && (
          <div className="alert alert-warning">
            Aucun matériel ne correspond à vos critères.
          </div>
        )}

        {materielsFiltres.map((categorieItem) => (
          <div key={categorieItem.codeCategorie} className="space-y-3">
            <h2 className="text-lg font-semibold">{categorieItem.libelle}</h2>

            <div className="list bg-base-100 rounded-box shadow-sm">
              {categorieItem.materiels.map((materiel) => (
                <div
                  key={materiel.CodeMateriel}
                  className="list-row transition-colors hover:bg-base-200"
                >
                  <div>
                    <img
                      src={`${IMAGES_URL}/${materiel.imageURL}`}
                      alt={materiel.designation}
                      className="size-16 rounded-box object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `${IMAGES_URL}/image.png`;
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="text-lg font-semibold">
                      {materiel.designation}
                    </div>

                    <div className="text-xs uppercase opacity-60">
                      {materiel.marque} • {materiel.CodeMateriel}
                    </div>

                    <div className="text-sm opacity-70">
                      {materiel.detailTechnique}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="badge badge-success">
                        {materiel.quantiteDisponible} disponible(s)
                      </span>

                      <span className="badge badge-accent">
                        {Number(materiel.prixLocation).toLocaleString("fr-FR")}{" "}
                        Ar / jour
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/materiels/${materiel.CodeMateriel}`}
                    className="btn btn-accent btn-sm"
                  >
                    Voir détails
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
