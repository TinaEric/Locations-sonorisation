// src/Client/Pages/catalogue/PacksTab.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Users,
  MapPin,
  Zap,
  Music,
} from "lucide-react";
import { packsDisponibles } from "../../../data/reservationService";
import PackCard from "../../components/catalogue/PackCard";
import { asList } from "../../../Admin/hooks/useFetch";
import {
  CATEGORIES_PACK,
  TYPES_LIEU,
  USAGES_PACK,
  TRIS,
} from "../../../utils/Catalogue";

const INITIAL = {
  categories: [],
  capacite: "",
  typeLieu: "",
  usage: "",
  prixMax: "",
  tri: "pertinence",
};

export default function PacksTab({ dateDebut, dateFin }) {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filters, setFilters] = useState(INITIAL);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErreur(null);
    packsDisponibles({ dateDebut, dateFin })
      .then((r) => alive && setPacks(asList(r)))
      .catch((e) => alive && setErreur(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [dateDebut, dateFin]);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const toggleCategorie = (c) =>
    set({
      categories: filters.categories.includes(c)
        ? filters.categories.filter((x) => x !== c)
        : [...filters.categories, c],
    });

  const filtered = useMemo(() => {
    let result = [...packs];
    if (filters.categories.length > 0) {
      result = result.filter(
        (p) => p.categoriePack && filters.categories.includes(p.categoriePack)
      );
    }
    if (filters.typeLieu) {
      result = result.filter((p) => p.typeLieu === filters.typeLieu);
    }
    if (filters.usage) {
      const q = filters.usage.toLowerCase();
      result = result.filter((p) =>
        (p.usages ?? []).some((u) => u.toLowerCase() === q)
      );
    }
    if (filters.capacite) {
      const n = Number(filters.capacite);
      if (Number.isFinite(n) && n > 0) {
        result = result.filter((p) => {
          const min = p.capaciteMin ?? 0;
          const max = p.capaciteMax ?? Infinity;
          return n >= min && n <= max;
        });
      }
    }
    if (filters.prixMax) {
      const n = Number(filters.prixMax);
      if (Number.isFinite(n) && n > 0) {
        result = result.filter((p) => Number(p.tarifJournalier) <= n);
      }
    }
    switch (filters.tri) {
      case "prix_asc":
        result.sort(
          (a, b) => Number(a.tarifJournalier) - Number(b.tarifJournalier)
        );
        break;
      case "prix_desc":
        result.sort(
          (a, b) => Number(b.tarifJournalier) - Number(a.tarifJournalier)
        );
        break;
    }
    return result;
  }, [packs, filters]);

  const nbActifs =
    filters.categories.length +
    (filters.typeLieu ? 1 : 0) +
    (filters.usage ? 1 : 0) +
    (filters.capacite ? 1 : 0) +
    (filters.prixMax ? 1 : 0);

  const pastille =
    "inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20";

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
      {/* -------- Filtres packs -------- */}
      <aside>
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="mb-3 flex w-full items-center justify-between rounded-lg border border-base-300 bg-base-100 px-4 py-2 text-sm font-semibold lg:hidden"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={16} /> Filtres packs
            {nbActifs > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-white">
                {nbActifs}
              </span>
            )}
          </span>
          <span>{filtersOpen ? "▲" : "▼"}</span>
        </button>

        <div
          className={`${
            filtersOpen ? "block" : "hidden"
          } space-y-5 rounded-2xl border border-base-300 bg-base-100 p-5 lg:block`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase">Filtres</h3>
            {nbActifs > 0 && (
              <button
                type="button"
                onClick={() => setFilters(INITIAL)}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Type d'événement */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">
              Type d'événement
            </legend>
            <div className="space-y-2">
              {CATEGORIES_PACK.map(({ value, label, emoji }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(value)}
                    onChange={() => toggleCategorie(value)}
                    className="h-4 w-4 rounded border-base-300 text-accent focus:ring-accent"
                  />
                  <span>
                    {emoji} {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Capacité */}
          <label className="block">
            <span className="mb-2 inline-flex items-center gap-1 text-sm font-semibold">
              <Users size={14} /> Nombre de personnes
            </span>
            <input
              type="number"
              min="1"
              value={filters.capacite}
              onChange={(e) => set({ capacite: e.target.value })}
              placeholder="ex. 120"
              className="block w-full rounded-lg border border-base-300 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          {/* Lieu */}
          <label className="block">
            <span className="mb-2 inline-flex items-center gap-1 text-sm font-semibold">
              <MapPin size={14} /> Type de lieu
            </span>
            <select
              value={filters.typeLieu}
              onChange={(e) => set({ typeLieu: e.target.value })}
              className="block w-full rounded-lg border border-base-300 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Indifférent</option>
              {TYPES_LIEU.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          {/* Usage */}
          <label className="block">
            <span className="mb-2 inline-flex items-center gap-1 text-sm font-semibold">
              <Music size={14} /> Usage
            </span>
            <select
              value={filters.usage}
              onChange={(e) => set({ usage: e.target.value })}
              className="block w-full rounded-lg border border-base-300 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Tous</option>
              {USAGES_PACK.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          {/* Budget */}
          <label className="block">
            <span className="mb-2 inline-flex items-center gap-1 text-sm font-semibold">
              <Zap size={14} /> Budget max / jour (Ar)
            </span>
            <input
              type="number"
              min="0"
              step="10000"
              value={filters.prixMax}
              onChange={(e) => set({ prixMax: e.target.value })}
              placeholder="ex. 500000"
              className="block w-full rounded-lg border border-base-300 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>
      </aside>

      {/* -------- Résultats -------- */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
          <p className="text-sm" aria-live="polite">
            {loading ? (
              "Chargement…"
            ) : erreur ? (
              "Erreur"
            ) : (
              <>
                <strong>{filtered.length}</strong> pack
                {filtered.length > 1 ? "s" : ""}
                {packs.length !== filtered.length && (
                  <span className="text-base-content/50">
                    {" "}
                    sur {packs.length}
                  </span>
                )}
              </>
            )}
          </p>
          <label className="inline-flex items-center gap-2 text-sm">
            <ArrowUpDown size={14} />
            <select
              value={filters.tri}
              onChange={(e) => set({ tri: e.target.value })}
              className="rounded-lg border border-base-300 px-2 py-1.5 text-sm"
            >
              {TRIS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {nbActifs > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.categories.map((c) => {
              const label =
                CATEGORIES_PACK.find((x) => x.value === c)?.label ?? c;
              return (
                <button
                  key={c}
                  onClick={() => toggleCategorie(c)}
                  className={pastille}
                >
                  {label} <X size={12} />
                </button>
              );
            })}
            {filters.typeLieu && (
              <button
                onClick={() => set({ typeLieu: "" })}
                className={pastille}
              >
                {TYPES_LIEU.find((t) => t.value === filters.typeLieu)?.label}
                <X size={12} />
              </button>
            )}
            {filters.usage && (
              <button onClick={() => set({ usage: "" })} className={pastille}>
                {filters.usage} <X size={12} />
              </button>
            )}
            {filters.capacite && (
              <button
                onClick={() => set({ capacite: "" })}
                className={pastille}
              >
                {filters.capacite} pers. <X size={12} />
              </button>
            )}
            {filters.prixMax && (
              <button
                onClick={() => set({ prixMax: "" })}
                className={pastille}
              >
                ≤ {filters.prixMax} Ar <X size={12} />
              </button>
            )}
          </div>
        )}

        <div className="mt-5">
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin" size={28} />
            </div>
          )}
          {erreur && (
            <p className="py-8 text-center text-error">{erreur}</p>
          )}
          {!loading && !erreur && filtered.length === 0 && (
            <p className="py-8 text-center text-base-content/60">
              Aucun pack ne correspond à vos critères.
            </p>
          )}
          {!loading && !erreur && filtered.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <PackCard
                  key={p.codePack}
                  pack={p}
                  dateDebut={dateDebut}
                  dateFin={dateFin}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}