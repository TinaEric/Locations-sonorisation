import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Package, Boxes } from "lucide-react";
import { useNavbar } from "../../contexts/NavbarContext";
import FilterBar from "../home/FilterBar";
import MaterielsDisponibles from "./MaterielsDisponibles";
import PacksDisponibles from "./PacksDisponibles";
import { formatDate } from "../../../utils/format";

export default function Catalogue() {
  const { dateDebut, dateFin, categoriePack } = useNavbar();

  const [searchParams, setSearchParams] = useSearchParams();
  const onglet = searchParams.get("onglet") || "materiels";

  const hasDates = Boolean(dateDebut && dateFin);
  const datesValides = hasDates && dateFin >= dateDebut;

  const criteres = useMemo(
    () =>
      [
        hasDates && `Du ${formatDate(dateDebut)} au ${formatDate(dateFin)}`,
        categoriePack && `Catégorie : ${categoriePack}`,
      ].filter(Boolean),
    [dateDebut, dateFin, categoriePack, hasDates]
  );

  const filterFormKey = `${dateDebut}-${dateFin}-${categoriePack}`;

  const changerOnglet = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set("onglet", value);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:py-16">
      <h1 className="display text-3xl sm:text-4xl">
        Indiquez les dates de votre événement
      </h1>
      <p className="mt-2 max-w-xl text-base-content/70">
        Découvrez le matériel et les packs de sonorisation disponibles sur la
        période sélectionnée.
      </p>

      <div className="mt-6 flex w-full justify-center rounded-2xl p-2">
        <FilterBar
          key={filterFormKey}
          initial={{ dateDebut, dateFin, categoriePack }}
        />
      </div>

      {criteres.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Critères choisis">
          {criteres.map((critere, i) => (
            <li key={i} className="badge badge-neutral badge-lg">
              {critere}
            </li>
          ))}
        </ul>
      )}

      <div role="tablist" className="tabs tabs-boxed mt-8 w-fit">
        <button
          role="tab"
          className={`tab gap-2 ${onglet === "materiels" ? "tab-active" : ""}`}
          onClick={() => changerOnglet("materiels")}
        >
          <Boxes size={16} /> Matériels
        </button>
        <button
          role="tab"
          className={`tab gap-2 ${onglet === "packs" ? "tab-active" : ""}`}
          onClick={() => changerOnglet("packs")}
        >
          <Package size={16} /> Packs
        </button>
      </div>

      <div className="mt-6">
        {!hasDates && (
          <p className="mt-10 text-base-content/75">
            Sélectionnez vos dates pour afficher les disponibilités.
          </p>
        )}

        {hasDates && !datesValides && (
          <p role="alert" className="mt-10 font-medium text-error">
            La date de fin doit être égale ou postérieure à la date de début.
          </p>
        )}

        {datesValides && onglet === "materiels" && (
          <MaterielsDisponibles dateDebut={dateDebut} dateFin={dateFin} />
        )}

        {datesValides && onglet === "packs" && (
          <PacksDisponibles
            dateDebut={dateDebut}
            dateFin={dateFin}
            categoriePack={categoriePack}
          />
        )}
      </div>
    </div>
  );
}