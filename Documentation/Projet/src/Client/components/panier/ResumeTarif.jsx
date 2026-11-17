// Client/components/panier/ResumeTarif.jsx
import { formaterDate, formaterPrix } from "../../utils/formatage";

export default function ResumeTarif({ totaux, periode, children }) {
  return (
    <aside className="card card-border bg-base-100 shadow-sm lg:sticky lg:top-24">
      <div className="card-body gap-3">
        <h2 className="card-title text-lg">Récapitulatif</h2>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-base-content/60">Période</dt>
            <dd className="text-right font-medium">
              {totaux.nbJours > 0
                ? `${formaterDate(periode.dateDebut)} → ${formaterDate(periode.dateFin)}`
                : "À choisir"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-base-content/60">Durée</dt>
            <dd className="font-medium">{totaux.nbJours} jour(s)</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-base-content/60">Total location</dt>
            <dd className="font-semibold">{formaterPrix(totaux.totalLocation)}</dd>
          </div>
        </dl>

        <div className="divider my-0" />

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-base font-bold text-primary">
            <dt>Acompte à payer</dt>
            <dd>{formaterPrix(totaux.acompte)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-base-content/60">Reste à payer</dt>
            <dd>{formaterPrix(totaux.resteAPayer)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-base-content/60">Caution (à la remise)</dt>
            <dd>{formaterPrix(totaux.totalCaution)}</dd>
          </div>
        </dl>

        {children}
      </div>
    </aside>
  );
}
