import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PackCard from "../components/PackCard";
import { CardSkeleton, EmptyState, ErrorState } from "../components/States";
import { useAsync } from "../hooks/useAsync";
import { useSearch } from "../context/SearchContext";
import { useCart } from "../context/CartContext";
import { packService } from "../data/packService";
import { LIBELLE_CATEGORIE } from "../utils/format";

const CATEGORIES = ["conference", "soiree", "mariage", "concert", "exterieur"];
const USAGES = ["discours", "dj", "musique de fond", "groupe live"];
const TRIS = [
  { value: "pertinence", label: "Pertinence" },
  { value: "prix_asc", label: "Prix croissant" },
  { value: "prix_desc", label: "Prix décroissant" },
  { value: "capacite", label: "Capacité" },
  { value: "disponibilite", label: "Disponibilité" },
];
const INITIAL = { dispoSeulement: true, categories: [], typeLieu: "", usage: "", capacite: "", prixMax: "", tri: "pertinence" };

export default function PacksPage() {
  const { dateDebut, dateFin, hasDates } = useSearch();
  const { choisirPack } = useCart();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(INITIAL);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compare, setCompare] = useState([]);
  const [retry, setRetry] = useState(0);

  const query = useMemo(
    () => ({
      dateDebut, dateFin,
      categorie: filters.categories,
      typeLieu: filters.typeLieu,
      usage: filters.usage,
      capacite: filters.capacite,
      prixMax: filters.prixMax,
      dispoSeulement: hasDates && filters.dispoSeulement ? true : undefined,
      tri: filters.tri,
    }),
    [dateDebut, dateFin, hasDates, filters]
  );

  const { data, loading, error } = useAsync((s) => packService.getPacks(query, s), [JSON.stringify(query), retry]);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const toggleCategorie = (c) =>
    set({ categories: filters.categories.includes(c) ? filters.categories.filter((x) => x !== c) : [...filters.categories, c] });
  const toggleCompare = (pack) =>
    setCompare((prev) =>
      prev.some((p) => p.id_pack === pack.id_pack)
        ? prev.filter((p) => p.id_pack !== pack.id_pack)
        : prev.length < 3 ? [...prev, pack] : prev
    );

  const choose = (pack) => { choisirPack(pack); navigate("/personnalisation"); };
  const nbDispo = data?.filter((p) => p.disponibilite === "disponible" || p.disponibilite === "stock_limite").length ?? 0;

  const pastille = "rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700";

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      {/* Filtres */}
      <aside>
        <button type="button" onClick={() => setFiltersOpen((o) => !o)} className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold lg:hidden">
          {filtersOpen ? "Masquer les filtres" : "Filtrer"}
        </button>
        <div className={`${filtersOpen ? "block" : "hidden"} space-y-6 rounded-xl border border-slate-200 bg-white p-4 lg:block`}>
          {hasDates && (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={filters.dispoSeulement} onChange={(e) => set({ dispoSeulement: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              Disponibles à mes dates seulement
            </label>
          )}

          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">Catégorie</legend>
            <div className="mt-2 space-y-2">
              {CATEGORIES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={filters.categories.includes(c)} onChange={() => toggleCategorie(c)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                  {LIBELLE_CATEGORIE[c]}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm font-semibold text-slate-900">
            Nombre de personnes
            <input type="number" min="1" value={filters.capacite} onChange={(e) => set({ capacite: e.target.value })} placeholder="ex. 120" className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" />
          </label>

          <label className="block text-sm font-semibold text-slate-900">
            Lieu
            <select value={filters.typeLieu} onChange={(e) => set({ typeLieu: e.target.value })} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal">
              <option value="">Indifférent</option>
              <option value="interieur">Intérieur</option>
              <option value="exterieur">Extérieur</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-900">
            Usage
            <select value={filters.usage} onChange={(e) => set({ usage: e.target.value })} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal">
              <option value="">Tous</option>
              {USAGES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-900">
            Budget maximum (Ar)
            <input type="number" min="0" step="10000" value={filters.prixMax} onChange={(e) => set({ prixMax: e.target.value })} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" />
          </label>

          <button type="button" onClick={() => setFilters(INITIAL)} className="text-sm font-semibold text-indigo-600 hover:underline">
            Réinitialiser
          </button>
        </div>
      </aside>

      {/* Résultats */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600" aria-live="polite">
            {data ? `${data.length} pack${data.length > 1 ? "s" : ""}${hasDates ? ` · ${nbDispo} disponible${nbDispo > 1 ? "s" : ""} à cette date` : ""}` : "Chargement…"}
          </p>
          <label className="text-sm text-slate-600">
            Tri{" "}
            <select value={filters.tri} onChange={(e) => set({ tri: e.target.value })} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              {TRIS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
        </div>

        {(filters.categories.length > 0 || filters.typeLieu || filters.usage) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.categories.map((c) => (
              <button key={c} type="button" onClick={() => toggleCategorie(c)} className={pastille}>{LIBELLE_CATEGORIE[c]} ✕</button>
            ))}
            {filters.typeLieu && <button type="button" onClick={() => set({ typeLieu: "" })} className={pastille}>{filters.typeLieu} ✕</button>}
            {filters.usage && <button type="button" onClick={() => set({ usage: "" })} className={pastille}>{filters.usage} ✕</button>}
          </div>
        )}

        <div className="mt-5">
          {loading && <CardSkeleton />}
          {error && <ErrorState error={error} onRetry={() => setRetry((r) => r + 1)} />}
          {data && data.length === 0 && (
            <EmptyState
              title="Aucun pack ne correspond"
              text="Retirez des filtres, essayez d'autres dates ou composez votre sono à la carte."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => setFilters(INITIAL)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Réinitialiser les filtres</button>
                  <Link to="/materiel" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Matériel à la carte</Link>
                </div>
              }
            />
          )}
          {data && data.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {data.map((p) => (
                <PackCard
                  key={p.id_pack}
                  pack={p}
                  hasDates={hasDates}
                  comparing={compare.some((c) => c.id_pack === p.id_pack)}
                  onToggleCompare={toggleCompare}
                  onChoose={choose}
                />
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-sm text-slate-600">
          Besoin d'un ajout ? <Link to="/materiel" className="font-semibold text-indigo-600 hover:underline">Ajouter du matériel à la carte</Link>
        </p>

        {compare.length >= 2 && (
          <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-slate-200 bg-white p-3 shadow-lg">
            <p className="truncate text-sm text-slate-700">{compare.map((p) => p.nom).join(" · ")}</p>
            <Link to={`/comparateur?ids=${compare.map((p) => p.id_pack).join(",")}`} className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
              Comparer ({compare.length})
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
