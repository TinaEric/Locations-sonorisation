import { useEffect, useState } from "react";
import { SlidersHorizontal, X, PackageOpen, RefreshCw } from "lucide-react";
import { useNavbar } from "../../contexts/NavbarContext";
import { PackService } from "../../../data/PackService";
import FilterBar from "../home/FilterBar";
import PackCard from "./PackCard";

export default function PacksPage() {
  const { dateDebut, dateFin, typeEvent, resetValue } = useNavbar();

  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const hasFilters = Boolean(dateDebut || dateFin || typeEvent);

  // Chargement des packs à chaque changement de filtre
  useEffect(() => {
    let cancelled = false;

    const fetchPacks = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = {
            dateDebut:dateDebut,
            dateFin: dateFin,
            typeEvenement: typeEvent
        }
       const response = (!dateDebut && !dateFin) ? await PackService.list() : await PackService.packsDisponibles(data)
        const filteredPacks = Array.isArray(response) ? response.filter(pack => pack.statutPack === 'actif') : [];
        console.log("PACK LISTTTTT: ",response)
        if (!cancelled) setPacks(filteredPacks);
      } catch (err) {
        if (!cancelled) setError("Impossible de charger les packs disponibles.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPacks();
    return () => {
      cancelled = true;
    };
  }, [dateDebut, dateFin, typeEvent, reloadKey]);

  const handleReset = () => {
    resetValue();
    setFiltersOpen(false);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-12">
      {/* ── En-tête ── */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Packs disponibles
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Choisissez un pack, personnalisez-le selon votre événement et
          réservez en quelques clics.
        </p>

        {/* Résumé des filtres actifs */}
        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-slate-700">Filtres :</span>
            {dateDebut && dateFin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 font-medium text-accent">
                Du {formatDate(dateDebut)} au {formatDate(dateFin)}
              </span>
            )}
            {typeEvent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                {typeEvent}
              </span>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-slate-500 underline-offset-2 hover:text-accent hover:underline"
            >
              <X className="size-3" />
              Effacer
            </button>
          </div>
        )}
      </header>

      {/* ── Filtres : bouton mobile + barre desktop ── */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="btn btn-outline btn-sm mb-3 lg:hidden"
          aria-expanded={filtersOpen}
          aria-controls="packs-filters"
        >
          {filtersOpen ? (
            <X className="size-4" />
          ) : (
            <SlidersHorizontal className="size-4" />
          )}
          {filtersOpen ? "Fermer les filtres" : "Filtrer"}
        </button>

        <div
          id="packs-filters"
          className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${
            filtersOpen ? "block" : "hidden lg:block"
          }`}
        >
          <FilterBar />
        </div>
      </div>

      {/* ── Contenu ── */}
      {loading ? (
        <PackGridSkeleton />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : packs.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onReset={handleReset} />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {packs.length} pack{packs.length > 1 ? "s" : ""} disponible
              {packs.length > 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-accent"
              aria-label="Actualiser la liste"
            >
              <RefreshCw className="size-3.5" />
              Actualiser
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => (
              <PackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

/* ─────────── Sous-composants ─────────── */

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function PackGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
      <PackageOpen className="size-10 text-slate-400" aria-hidden="true" />
      <p className="mt-4 text-lg font-semibold text-slate-900">
        Aucun pack disponible
      </p>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        {hasFilters
          ? "Aucun pack ne correspond à vos critères. Essayez d'élargir vos dates ou de changer le type d'événement."
          : "Aucun pack n'est proposé pour le moment. Revenez bientôt."}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="btn btn-accent btn-sm mt-6"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-error/30 bg-error/5 px-6 py-12 text-center">
      <p className="text-lg font-semibold text-error">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="btn btn-accent btn-sm mt-4"
      >
        Réessayer
      </button>
    </div>
  );
}