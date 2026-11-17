// src/Client/Pages/catalogue/MaterielsTab.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { materielDispo } from "../../../data/reservationService";
import { asList } from "../../../Admin/hooks/useFetch";
import { SOUS_CATEGORIES, TRIS } from "../../../utils/Catalogue";
import MaterielCard from "../../components/catalogue/MaterielCard";

const INITIAL = { sousCategories: [], q: "", prixMax: "", tri: "pertinence" };

export default function MaterielsTab({ dateDebut, dateFin }) {
  const [materiels, setMateriels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filters, setFilters] = useState(INITIAL);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErreur(null);
    materielDispo({ dateDebut, dateFin })
      .then((r) => {
        if (!alive) return;
        const cats = asList(r);
        // Aplatir en une liste de matériels avec leur catégorie parent
        const flat = cats.flatMap((cat) =>
          (cat.materiels ?? []).map((m) => ({
            ...m,
            categorie: {
              idCategorie: cat.idCategorie,
              codeCategorie: cat.codeCategorie,
              libelle: cat.libelle,
              typeCategorie: cat.typeCategorie,
            },
          }))
        );
        setMateriels(flat);
      })
      .catch((e) => alive && setErreur(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [dateDebut, dateFin]);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const toggleSousCategorie = (slug) =>
    set({
      sousCategories: filters.sousCategories.includes(slug)
        ? filters.sousCategories.filter((x) => x !== slug)
        : [...filters.sousCategories, slug],
    });

  /** Compteur par sous-catégorie (basé sur les données réelles) */
  const counts = useMemo(() => {
    const map = {};
    for (const m of materiels) {
      for (const sc of SOUS_CATEGORIES) {
        if (sc.test(m, m.categorie)) {
          map[sc.slug] = (map[sc.slug] ?? 0) + 1;
          break; // une seule sous-catégorie par matériel
        }
      }
    }
    return map;
  }, [materiels]);

  const filtered = useMemo(() => {
    let result = [...materiels];

    if (filters.sousCategories.length > 0) {
      result = result.filter((m) => {
        const sc = SOUS_CATEGORIES.find(
          (s) => s.slug && filters.sousCategories.includes(s.slug) && s.test(m, m.categorie)
        );
        return !!sc;
      });
    }
    if (filters.q.trim()) {
      const q = filters.q.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.designation?.toLowerCase().includes(q) ||
          m.marque?.toLowerCase().includes(q) ||
          m.CodeMateriel?.toLowerCase().includes(q)
      );
    }
    if (filters.prixMax) {
      const n = Number(filters.prixMax);
      if (Number.isFinite(n) && n > 0) {
        result = result.filter((m) => Number(m.prixLocation) <= n);
      }
    }
    switch (filters.tri) {
      case "prix_asc":
        result.sort((a, b) => Number(a.prixLocation) - Number(b.prixLocation));
        break;
      case "prix_desc":
        result.sort((a, b) => Number(b.prixLocation) - Number(a.prixLocation));
        break;
    }
    return result;
  }, [materiels, filters]);

  const nbActifs =
    filters.sousCategories.length + (filters.q ? 1 : 0) + (filters.prixMax ? 1 : 0);

  const pastille =
    "inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20";

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
      {/* -------- Filtres matériel -------- */}
      <aside>
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="mb-3 flex w-full items-center justify-between rounded-lg border border-base-300 bg-base-100 px-4 py-2 text-sm font-semibold lg:hidden"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={16} /> Catégories
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
            <h3 className="text-sm font-bold uppercase">Catégories</h3>
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

          <ul className="space-y-1">
            {SOUS_CATEGORIES.map(({ slug, label }) => {
              const count = counts[slug] ?? 0;
              if (count === 0) return null;
              const actif = filters.sousCategories.includes(slug);
              return (
                <li key={slug}>
                  <button
                    type="button"
                    onClick={() => toggleSousCategorie(slug)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                      actif
                        ? "bg-accent text-white"
                        : "text-base-content hover:bg-base-200"
                    }`}
                  >
                    <span className="flex-1 text-left">{label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        actif
                          ? "bg-white/20"
                          : "bg-base-200 text-base-content/60"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Budget max / jour (Ar)
            </span>
            <input
              type="number"
              min="0"
              step="1000"
              value={filters.prixMax}
              onChange={(e) => set({ prixMax: e.target.value })}
              className="block w-full rounded-lg border border-base-300 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>
      </aside>

      {/* -------- Résultats -------- */}
      <section>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
          <label className="input input-bordered input-sm flex flex-1 items-center gap-2">
            <Search size={16} className="opacity-60" />
            <input
              type="search"
              className="grow bg-transparent"
              placeholder="Rechercher un matériel…"
              value={filters.q}
              onChange={(e) => set({ q: e.target.value })}
            />
          </label>
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

        <p className="mt-3 text-sm">
          <strong>{filtered.length}</strong> matériel
          {filtered.length > 1 ? "s" : ""}
          {materiels.length !== filtered.length && (
            <span className="text-base-content/50">
              {" "}
              sur {materiels.length}
            </span>
          )}
        </p>

        {nbActifs > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {filters.sousCategories.map((slug) => {
              const label =
                SOUS_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
              return (
                <button
                  key={slug}
                  onClick={() => toggleSousCategorie(slug)}
                  className={pastille}
                >
                  {label} <X size={12} />
                </button>
              );
            })}
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
              Aucun matériel ne correspond à vos critères.
            </p>
          )}
          {!loading && !erreur && filtered.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((m) => (
                <MaterielCard
                  key={m.CodeMateriel}
                  materiel={m}
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