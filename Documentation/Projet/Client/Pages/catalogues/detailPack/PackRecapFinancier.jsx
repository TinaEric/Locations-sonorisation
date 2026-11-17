import { ShieldCheck, ShoppingCart, Info, AlertTriangle, X } from "lucide-react";
import { formatMoney } from "../../../../utils/format";

export default function PackRecapFinancier({
  avecDates,
  dateDebut,
  dateFin,
  totalUnites,
  totalPrix,
  totalCaution,
  hasMateriel,
  indisponible,
  dejaDansPanier,
  compositionModifiee,
  compositionLength,
  onAjouter,
  onReinitialiser,
}) {
  const disabled =
    !avecDates || indisponible || dejaDansPanier || hasMateriel || !compositionLength;

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm sm:p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck size={16} className="text-accent" />
        Récapitulatif
      </h3>

      {avecDates ? (
        <div className="mb-3 rounded-lg bg-base-200 p-2 text-xs">
          Période : <strong>{dateDebut}</strong> → <strong>{dateFin}</strong>
        </div>
      ) : (
        <div className="mb-3 rounded-lg bg-base-200 p-2 text-xs opacity-70">
          Aucune date sélectionnée — mode consultation
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="opacity-70">Composants ({totalUnites})</span>
          <span className="font-semibold">{formatMoney(totalPrix)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="opacity-70">Caution</span>
          <span>{formatMoney(totalCaution)}</span>
        </div>

        <div className="divider my-1" />

        <div className="flex justify-between text-base">
          <span className="font-semibold">Total / jour</span>
          <span className="font-bold text-accent">
            {formatMoney(totalPrix)}
          </span>
        </div>
      </div>

      {hasMateriel && avecDates && (
        <div className="alert alert-warning alert-sm mt-3">
          <AlertTriangle size={14} />
          <span className="text-xs">
            Des matériels sont dans votre panier. Videz-le pour ajouter ce pack.
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          className={`btn w-full ${disabled ? "btn-disabled" : "btn-accent"}`}
          onClick={onAjouter}
          disabled={disabled}
          title={
            !avecDates
              ? "Sélectionnez d'abord vos dates"
              : indisponible
              ? "Pack indisponible sur la période"
              : undefined
          }
        >
          <ShoppingCart size={16} />
          <span className="hidden sm:inline">
            {!avecDates
              ? "Sélectionnez vos dates"
              : dejaDansPanier
              ? "Déjà dans le panier"
              : hasMateriel
              ? "Panier occupé"
              : indisponible
              ? "Indisponible"
              : "Ajouter au panier"}
          </span>
          <span className="sm:hidden">
            {!avecDates
              ? "Dates requises"
              : dejaDansPanier
              ? "Dans le panier"
              : hasMateriel
              ? "Panier occupé"
              : indisponible
              ? "Indisponible"
              : "Ajouter"}
          </span>
        </button>

        {compositionModifiee && (
          <button
            type="button"
            className="btn btn-ghost btn-sm w-full"
            onClick={onReinitialiser}
          >
            <X size={14} /> Réinitialiser la composition
          </button>
        )}
      </div>

      <p className="mt-2 flex items-start gap-1 text-xs text-base-content/60">
        <Info size={12} className="mt-0.5 shrink-0" />
        Le montant final sera calculé dans le panier selon la durée.
      </p>
    </div>
  );
}