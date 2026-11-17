import { Boxes, Package, Plus, Info, XCircle, FileText, ShoppingCart } from "lucide-react";
import { formatMoney } from "../../../../utils/format";
import ComposantRow from "./ComposantRow";

export default function PackCompositionPanel({
  avecDates,
  composition,
  totalUnites,
  totalPrix,
  totalCaution,
  compositionModifiee,
  indisponible,
  dejaDansPanier,
  hasMateriel,
  baseQuantiteParCode,
  onChangeQuantite,
  onRemplacer,
  onRetirer,
  onAjouterMateriel,
  onAjouterAuPanier,
}) {
  const disabledCta =
    !avecDates || indisponible || dejaDansPanier || hasMateriel || !composition.length;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm sm:p-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
            <Boxes size={18} className="text-accent" />
            Composition du pack ({composition.length})
          </h2>
          <p className="text-xs opacity-60 sm:text-sm">
            {avecDates
              ? "Ajoutez, remplacez, retirez ou ajustez les quantités. Le stock est vérifié à chaque étape."
              : "Mode consultation — sélectionnez des dates pour vérifier la disponibilité et personnaliser."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-outline gap-1">
            <Package size={12} /> {totalUnites} unité(s)
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={onAjouterMateriel}
            disabled={!avecDates}
            title={!avecDates ? "Sélectionnez vos dates" : undefined}
          >
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>

      {compositionModifiee && (
        <div className="alert alert-info alert-sm">
          <Info size={14} />
          <span>
            Composition modifiée : le tarif est recalculé en direct selon les
            matériels sélectionnés.
          </span>
        </div>
      )}

      {indisponible && avecDates && (
        <div className="alert alert-error alert-sm">
          <XCircle size={14} />
          <span>
            Ce pack n'est pas disponible sur la période sélectionnée. Vous
            pouvez ajuster la composition pour le rendre réservable.
          </span>
        </div>
      )}

      {composition.length === 0 ? (
        <div className="alert">
          <FileText size={18} />
          Ce pack ne contient aucun matériel.
        </div>
      ) : (
        <div className="scrollbar-auto max-h-[calc(100vh-260px)] space-y-2 overflow-y-auto pr-1 sm:pr-2">
          {composition.map((c, i) => {
            const code = c.materiel?.CodeMateriel;
            return (
              <ComposantRow
                key={`${c.idComposant}-${code ?? i}`}
                composant={c}
                quantite={c.quantite}
                baseQuantite={baseQuantiteParCode.get(code) ?? c.quantite}
                onChangeQuantite={(q) => onChangeQuantite(code, q - c.quantite)}
                onRemplacer={() => onRemplacer(c)}
                onRetirer={() => onRetirer(code)}
                peutRetirer={composition.length > 1}
                avecStock={avecDates}
              />
            );
          })}
        </div>
      )}

      {composition.length > 0 && (
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-accent/30 bg-base-100/95 p-2.5 shadow-lg backdrop-blur sm:bottom-4 sm:gap-3 sm:p-3">
          <div className="text-xs sm:text-sm">
            <div className="font-semibold">
              {totalUnites} unité(s) • {formatMoney(totalPrix)} / jour
            </div>
            <div className="text-[10px] opacity-70 sm:text-xs">
              Caution : {formatMoney(totalCaution)}
            </div>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${disabledCta ? "btn-disabled" : "btn-accent"}`}
            onClick={onAjouterAuPanier}
            disabled={disabledCta}
          >
            <ShoppingCart size={14} />
            <span className="hidden sm:inline">
              {!avecDates
                ? "Dates requises"
                : indisponible
                ? "Indisponible"
                : "Ajouter au panier"}
            </span>
          </button>
        </div>
      )}
    </section>
  );
}