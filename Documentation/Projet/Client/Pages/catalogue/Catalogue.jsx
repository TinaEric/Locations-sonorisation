
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Package, Boxes, CalendarDays } from "lucide-react";
import { useNavbar } from "../../contexts/NavbarContext";
import DateDispoBar from "../../components/catalogue/DateDispoBar";
import PacksTab from "./PacksTab";
import MaterielsTab from "./MaterielsTab";
import { formatDate } from "../../../utils/format";

const ONGLETS = [
  {
    key: "packs",
    label: "Packs",
    icon: Package,
    sub: "Solutions prêtes à l'emploi",
  },
  {
    key: "materiels",
    label: "Matériel à la carte",
    icon: Boxes,
    sub: "Location à l'unité",
  },
];

export default function Catalogue() {
  const { dateDebut, dateFin, categoriePack } = useNavbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const onglet = searchParams.get("onglet") || "packs";

  const hasDates = Boolean(dateDebut && dateFin);
  const datesValides = hasDates && dateFin >= dateDebut;

  const criteres = useMemo(
    () =>
      [
        hasDates && `Du ${formatDate(dateDebut)} au ${formatDate(dateFin)}`,
        categoriePack &&
          `Catégorie : ${categoriePack.charAt(0).toUpperCase() + categoriePack.slice(1)}`,
      ].filter(Boolean),
    [dateDebut, dateFin, categoriePack, hasDates]
  );

  const changerOnglet = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set("onglet", value);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:py-16">
      {/* ---------- En-tête ---------- */}
      <header className="text-center">
        <h1 className="display text-3xl sm:text-4xl">
          Composez votre commande
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-base-content/70">
          Choisissez un <strong>pack prêt à l'emploi</strong> ou composez votre{" "}
          <strong>matériel à la carte</strong>. Tout se retrouve dans un panier
          unique.
        </p>
      </header>

      {/* ---------- Barre dates partagée ---------- */}
      <div className="mt-8">
        <DateDispoBar />
      </div>

      {/* ---------- Critères actifs ---------- */}
      {criteres.length > 0 && (
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {criteres.map((c, i) => (
            <li key={i} className="badge badge-neutral badge-lg gap-1">
              <CalendarDays size={14} />
              {c}
            </li>
          ))}
        </ul>
      )}

      {/* ---------- Onglets ---------- */}
      <div
        role="tablist"
        aria-label="Modes de commande"
        className="mt-10 grid gap-3 sm:grid-cols-2"
      >
        {ONGLETS.map(({ key, label, icon: Icon, sub }) => {
          const actif = onglet === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={actif}
              onClick={() => changerOnglet(key)}
              className={`group flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
                actif
                  ? "border-accent bg-accent/5 shadow-md"
                  : "border-base-300 bg-base-100 hover:border-accent/50"
              }`}
            >
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-xl ${
                  actif
                    ? "bg-accent text-white"
                    : "bg-base-200 text-base-content"
                }`}
              >
                <Icon size={22} />
              </span>
              <div className="min-w-0">
                <p className="font-bold">{label}</p>
                <p className="text-sm text-base-content/60">{sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ---------- Contenu ---------- */}
      <div className="mt-8">
        {!hasDates && (
          <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
            <CalendarDays className="mx-auto size-10 text-accent" />
            <h3 className="mt-3 text-lg font-semibold">
              Sélectionnez vos dates
            </h3>
            <p className="mt-1 text-sm text-base-content/60">
              Choisissez une période pour découvrir les disponibilités.
            </p>
          </div>
        )}

        {hasDates && !datesValides && (
          <p role="alert" className="text-center font-medium text-error">
            La date de fin doit être égale ou postérieure à la date de début.
          </p>
        )}

        {datesValides && onglet === "packs" && (
          <PacksTab dateDebut={dateDebut} dateFin={dateFin} />
        )}

        {datesValides && onglet === "materiels" && (
          <MaterielsTab dateDebut={dateDebut} dateFin={dateFin} />
        )}
      </div>
    </div>
  );
}