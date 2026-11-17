import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import PackCard from "./PackCard";
import { CardSkeleton, EmptyState, ErrorState } from "./CatalogueStates";
import { useAsync } from "./useAsync";
import { useCartAdapter } from "./useCartAdapter";
import { PackCatalogueService } from "../../../data/PackCatalogueService";

const TRIS = [
  { value: "pertinence", label: "Pertinence" },
  { value: "prix_asc", label: "Prix croissant" },
  { value: "prix_desc", label: "Prix décroissant" },
  { value: "capacite", label: "Capacité" },
];
const INITIAL = { dispoSeulement: true, capacite: "", typeLieu: "", prixMax: "", tri: "pertinence" };
const field = "mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export default function PacksTab({ dateDebut, dateFin, typeEvent, onSwitchToMateriel }) {
  const hasDates = Boolean(dateDebut && dateFin);
  const { addPack } = useCartAdapter();
  const [filters, setFilters] = useState(INITIAL);
  const [open, setOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const query = useMemo(
    () => ({
      dateDebut,
      dateFin,
      typeEvenement: typeEvent,
      capacite: filters.capacite,
      typeLieu: filters.typeLieu,
      prixMax: filters.prixMax,
      dispoSeulement: hasDates && filters.dispoSeulement ? true : undefined,
      tri: filters.tri,
    }),
    [dateDebut, dateFin, typeEvent, hasDates, filters]
  );

  const { data, loading, error } = useAsync((s) => PackCatalogueService.getPacks(query, s), [JSON.stringify(query), retry]);
  const nbDispo = data?.filter((p) => p.disponibilite === "disponible" || p.disponibilite === "stock_limite").length ?? 0;

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
            Nombre de personnes
            <input type="number" min="1" value={filters.capacite} onChange={(e) => set({ capacite: e.target.value })} placeholder="ex. 120" className={field} />
          </label>
          <label className="block text-sm font-semibold text-slate-900">
            Lieu
            <select value={filters.typeLieu} onChange={(e) => set({ typeLieu: e.target.value })} className={field}>
              <option value="">Indifférent</option>
              <option value="interieur">Intérieur</option>
              <option value="exterieur">Extérieur</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-900">
            Budget maximum (Ar)
            <input type="number" min="0" step="10000" value={filters.prixMax} onChange={(e) => set({ prixMax: e.target.value })} className={field} />
          </label>
          <button type="button" onClick={() => setFilters(INITIAL)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
            <RotateCcw className="size-3.5" /> Réinitialiser
          </button>
        </div>
      </aside>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600" aria-live="polite">
            {data ? `${data.length} pack${data.length > 1 ? "s" : ""}${hasDates ? ` · ${nbDispo} disponible${nbDispo > 1 ? "s" : ""} à ces dates` : ""}` : "Chargement…"}
          </p>
          <label className="text-sm text-slate-600">
            Tri{" "}
            <select value={filters.tri} onChange={(e) => set({ tri: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm">
              {TRIS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-5">
          {loading && <CardSkeleton />}
          {error && <ErrorState error={error} onRetry={() => setRetry((r) => r + 1)} />}
          {data?.length === 0 && (
            <EmptyState title="Aucun pack ne correspond" text="Retirez des filtres, essayez d'autres dates ou composez votre sono à la carte.">
              <button type="button" onClick={() => setFilters(INITIAL)} className="btn btn-outline btn-sm">Réinitialiser</button>
              <button type="button" onClick={onSwitchToMateriel} className="btn btn-accent btn-sm">Matériel à la carte</button>
            </EmptyState>
          )}
          {data?.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {data.map((p) => <PackCard key={p.id} pack={p} hasDates={hasDates} onChoose={addPack} />)}
            </div>
          )}
        </div>

        <p className="mt-8 text-sm text-slate-600">
          Besoin d'un ajout ?{" "}
          <button type="button" onClick={onSwitchToMateriel} className="font-semibold text-accent hover:underline">
            Ajouter du matériel à la carte
          </button>
        </p>
      </section>
    </div>
  );
}
