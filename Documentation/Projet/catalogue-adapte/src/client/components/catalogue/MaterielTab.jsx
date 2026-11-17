import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import MaterielCard from "./MaterielCard";
import { CardSkeleton, EmptyState, ErrorState } from "./CatalogueStates";
import { useAsync } from "./useAsync";
import { useCartAdapter } from "./useCartAdapter";
import { LIBELLE_CATEGORIE } from "./format";
import { MaterielService } from "../../../data/MaterielService";

const CATEGORIES = Object.keys(LIBELLE_CATEGORIE);
const INITIAL = { dispoSeulement: true, categorie: "", marque: "", puissanceMax: "", prixMax: "" };
const field = "mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export default function MaterielTab({ dateDebut, dateFin, onSwitchToPacks }) {
  const hasDates = Boolean(dateDebut && dateFin);
  const { addMateriel } = useCartAdapter();
  const [filters, setFilters] = useState(INITIAL);
  const [open, setOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const [info, setInfo] = useState("");
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const query = useMemo(
    () => ({
      dateDebut,
      dateFin,
      categorie: filters.categorie,
      marque: filters.marque,
      puissanceMax: filters.puissanceMax,
      prixMax: filters.prixMax,
      dispoSeulement: hasDates && filters.dispoSeulement ? true : undefined,
    }),
    [dateDebut, dateFin, hasDates, filters]
  );

  const { data, loading, error } = useAsync((s) => MaterielService.getMateriels(query, s), [JSON.stringify(query), retry]);
  const marques = useAsync((s) => MaterielService.getMarques(s), []);

  const handleAdd = (materiel, qte) => {
    addMateriel(materiel, qte);
    setInfo(`${qte} × ${materiel.designation} ajouté à votre sélection`);
    setTimeout(() => setInfo(""), 2500);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <aside>
        <button type="button" onClick={() => setOpen((o) => !o)} className="btn btn-outline mb-3 w-full lg:hidden">
          {open ? "Masquer les filtres" : "Filtrer"}
        </button>
        <div className={`${open ? "block" : "hidden"} space-y-5 rounded-xl border border-slate-200 bg-white p-4 lg:block`}>
          {hasDates && (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={filters.dispoSeulement} onChange={(e) => set({ dispoSeulement: e.target.checked })} className="checkbox checkbox-sm checkbox-accent" />
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
          <button type="button" onClick={() => setFilters(INITIAL)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
            <RotateCcw className="size-3.5" /> Réinitialiser
          </button>
        </div>
      </aside>

      <section>
        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          À la carte : flexibilité totale, mais pensez à vérifier la compatibilité (puissance, câbles, pieds).{" "}
          <button type="button" onClick={onSwitchToPacks} className="font-semibold text-accent hover:underline">Partir d'un pack</button>
        </div>

        <p className="mt-4 text-sm text-slate-600" aria-live="polite">
          {info || (data ? `${data.length} matériel${data.length > 1 ? "s" : ""}` : "Chargement…")}
        </p>

        <div className="mt-4">
          {loading && <CardSkeleton />}
          {error && <ErrorState error={error} onRetry={() => setRetry((r) => r + 1)} />}
          {data?.length === 0 && (
            <EmptyState title="Aucun matériel trouvé" text="Modifiez vos filtres ou vos dates.">
              <button type="button" onClick={() => setFilters(INITIAL)} className="btn btn-accent btn-sm">Réinitialiser</button>
            </EmptyState>
          )}
          {data?.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {data.map((m) => <MaterielCard key={m.id} materiel={m} hasDates={hasDates} onAdd={handleAdd} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
