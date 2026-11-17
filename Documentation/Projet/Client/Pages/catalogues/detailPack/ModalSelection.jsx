import { useMemo } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { ImageUrl } from "../../../../components/ImageURL";
import { formatMoney } from "../../../../utils/format";
import { IMAGES_URL } from "../../../../data/Api";
import { toNumber } from "./utils/packHelpers";

export default function ModalSelection({
  open,
  title,
  onClose,
  recherche,
  setRecherche,
  materiels,
  loading,
  erreur,
  codesExclus,
  onSelect,
}) {
  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return materiels.filter((m) => {
      if (!q) return true;
      return (
        m.designation?.toLowerCase().includes(q) ||
        m.marque?.toLowerCase().includes(q) ||
        m.CodeMateriel?.toLowerCase().includes(q)
      );
    });
  }, [materiels, recherche]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto p-3 sm:p-8">
        <div className="relative w-full max-w-2xl rounded-2xl bg-base-100 shadow-xl">
          <div className="flex items-center justify-between border-b border-base-300 p-3 sm:p-4">
            <h3 className="text-base font-bold sm:text-lg">{title}</h3>
            <button
              className="btn btn-ghost btn-sm btn-square"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-3 sm:p-4">
            <label className="input input-bordered flex items-center gap-2">
              <Search size={16} className="opacity-60" />
              <input
                type="search"
                className="grow"
                placeholder="Rechercher un matériel…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                autoFocus
              />
            </label>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-3 pb-3 sm:px-4 sm:pb-4">
            {loading && (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin" size={24} />
              </div>
            )}
            {!loading && erreur && (
              <p className="py-8 text-center text-error">{erreur}</p>
            )}
            {!loading && !erreur && !filtres.length && (
              <p className="py-8 text-center text-base-content/60">
                Aucun matériel disponible.
              </p>
            )}
            {!loading && !erreur && filtres.length > 0 && (
              <ul className="space-y-2">
                {filtres.map((m) => {
                  const stock = toNumber(m.quantiteDisponible);
                  const deja = codesExclus.has(m.CodeMateriel);
                  return (
                    <li key={m.CodeMateriel}>
                      <button
                        type="button"
                        onClick={() => !deja && stock > 0 && onSelect(m)}
                        disabled={deja || stock <= 0}
                        className={`flex w-full items-center gap-3 rounded-box border p-3 text-left transition ${
                          deja || stock <= 0
                            ? "cursor-not-allowed border-base-300 opacity-60"
                            : "border-base-300 hover:border-primary hover:bg-primary/5"
                        }`}
                      >
                        <ImageUrl
                          src={`${IMAGES_URL}/${m.imageURL}`}
                          alt={m.designation}
                          className="h-12 w-12 shrink-0 rounded"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {m.designation}
                          </p>
                          <p className="truncate text-xs text-base-content/60">
                            {m.marque}
                            {m.marque && " · "}
                            {formatMoney(m.prixLocation)} / jour
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className={`badge badge-sm ${
                              stock > 0 ? "badge-success" : "badge-error"
                            }`}
                          >
                            {stock} dispo
                          </span>
                          {deja && (
                            <p className="mt-1 text-[10px] text-base-content/60">
                              Déjà présent
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}