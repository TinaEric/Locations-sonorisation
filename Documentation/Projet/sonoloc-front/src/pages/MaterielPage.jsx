import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MaterielCard from "../components/MaterielCard";
import { CardSkeleton, EmptyState, ErrorState } from "../components/States";
import { useAsync } from "../hooks/useAsync";
import { useSearch } from "../context/SearchContext";
import { useCart } from "../context/CartContext";
import { materielService } from "../data/materielService";
import { LIBELLE_CATEGORIE } from "../utils/format";

const CATEGORIES = ["enceinte", "caisson", "console", "micro", "pied", "cable", "retour", "eclairage", "accessoire"];
const INITIAL = { dispoSeulement: true, categorie: "", marque: "", puissanceMax: "", prixMax: "" };

export default function MaterielPage() {
  const { dateDebut, dateFin, hasDates } = useSearch();
  const { ajouterMateriel } = useCart();
  const [filters, setFilters] = useState(INITIAL);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const [added, setAdded] = useState("");

  const query = useMemo(
    () => ({
      dateDebut, dateFin,
      categorie: filters.categorie,
      marque: filters.marque,
      puissanceMax: filters.puissanceMax,
      prixMax: filters.prixMax,
      dispoSeulement: hasDates && filters.dispoSeulement ? true : undefined,
    }),
    [dateDebut, dateFin, hasDates, filters]
  );

  const { data, loading, error } = useAsync((s) => materielService.getMateriels(query, s), [JSON.stringify(query), retry]);
  const marques = useAsync((s) => materielService.getMarques(s), []);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const handleAdd = (materiel, qte) => {
    ajouterMateriel(materiel, qte);
    setAdded(`${qte} × ${materiel.designation} ajouté à votre sélection`);
    setTimeout(() => setAdded(""), 2500);
  };

  const field = "mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal";

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <aside>
        <button type="button" onClick={() => setFiltersOpen((o) => !o)} className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold lg:hidden">
          {filtersOpen ? "Masquer les filtres" : "Filtrer"}
        </button>
        <div className={`${filtersOpen ? "block" : "hidden"} space-y-6 rounded-xl border border-slate-200 bg-white p-4 lg:block`}>
          {hasDates && (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={filters.dispoSeulement} onChange={(e) => set({ dispoSeulement: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              Disponibles à mes dates
            </label>
          )}
          <label className="block text-sm font-semibold text-slate-900">
            Catégorie
            <select value={filters.categorie} onChange={(e) => set({ categorie: e.target.value })} className={field}>
              <option value="">Toutes</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{LIBELLE_CATEGORIE[c]}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-900">
            Marque
            <select value={filters.marque} onChange={(e) => set({ marque: e.target.value })} className={field}>
              <option value="">Toutes</option>
              {(marques.data ?? []).map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-900">
            Puissance max (W)
            <input type="number" min="0" value={filters.puissanceMax} onChange={(e) => set({ puissanceMax: e.target.value })} className={field} />
          </label>
          <label className="block text-sm font-semibold text-slate-900">
            Prix max (Ar)
            <input type="number" min="0" step="5000" value={filters.prixMax} onChange={(e) => set({ prixMax: e.target.value })} className={field} />
          </label>
          <button type="button" onClick={() => setFilters(INITIAL)} className="text-sm font-semibold text-indigo-600 hover:underline">
            Réinitialiser
          </button>
        </div>
      </aside>

      <section className="pb-24">
        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          À la carte : flexibilité totale, mais pensez à vérifier la compatibilité (puissance, câbles, pieds).{" "}
          <Link to="/packs" className="font-semibold text-indigo-600 hover:underline">Partir d'un pack</Link>
        </div>

        <p className="mt-4 text-sm text-slate-600" aria-live="polite">
          {added || (data ? `${data.length} matériel${data.length > 1 ? "s" : ""}` : "Chargement…")}
        </p>

        <div className="mt-4">
          {loading && <CardSkeleton />}
          {error && <ErrorState error={error} onRetry={() => setRetry((r) => r + 1)} />}
          {data && data.length === 0 && (
            <EmptyState
              title="Aucun matériel trouvé"
              text="Modifiez vos filtres ou vos dates, ou demandez conseil au loueur."
              action={<button type="button" onClick={() => setFilters(INITIAL)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Réinitialiser</button>}
            />
          )}
          {data && data.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {data.map((m) => (
                <MaterielCard key={m.id_materiel} materiel={m} hasDates={hasDates} onAdd={handleAdd} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
