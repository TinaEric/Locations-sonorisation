import { Dialog, Vignette, formatDateFr, formatMoney, pluriel } from './reservationUi.jsx';

function Chiffre({ label, children, fort = false }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-base-content/50">{label}</p>
      <p className={fort ? 'text-lg font-bold text-accent' : 'font-semibold'}>{children}</p>
    </div>
  );
}

/** Détail d'un pack : description, prix pour la période choisie et matériel inclus. */
export default function PackDetailModal({ pack, filtres, onClose, onReserver }) {
  const { dateDebut, dateFin, jours } = filtres;
  const composants = pack.composants ?? [];
  const types = [].concat(pack.typesEvenement ?? []);
  const total = Number(pack.tarifJournalier || 0) * jours;

  return (
    <Dialog titre={pack.libelle} onClose={onClose} large>
      <div className="space-y-5">
        {pack.imageUrl && <Vignette src={pack.imageUrl} alt={pack.libelle} className="aspect-video w-full" />}

        {types.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <span key={t} className="badge badge-outline capitalize">
                {t}
              </span>
            ))}
          </div>
        )}

        {pack.description && <p className="whitespace-pre-line text-base-content/80">{pack.description}</p>}

        <div className="grid gap-4 rounded-sm border border-base-300 bg-base-200/50 p-4 sm:grid-cols-3">
          <Chiffre label="Tarif par jour">{formatMoney(pack.tarifJournalier)}</Chiffre>
          <Chiffre label={`Total estimé · ${pluriel(jours, 'jour')}`} fort>
            {formatMoney(total)}
          </Chiffre>
          <Chiffre label="Caution">{formatMoney(pack.prixCaution)}</Chiffre>
        </div>
        <p className="-mt-3 text-xs text-base-content/60">
          Du {formatDateFr(dateDebut)} au {formatDateFr(dateFin)}. Le montant définitif est confirmé par le loueur.
        </p>

        <div>
          <h3 className="mb-2 font-semibold">Matériel inclus ({composants.length})</h3>
          {composants.length ? (
            <ul className="divide-y divide-base-300 rounded-sm border border-base-300">
              {composants.map((c) => {
                const m = c.materiel ?? {};
                return (
                  <li key={c.idComposant ?? m.CodeMateriel} className="flex items-center gap-3 p-3">
                    <Vignette src={m.imageURL} alt={m.designation} className="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{m.designation}</p>
                      <p className="truncate text-xs text-base-content/60">
                        {[m.marque, m.detailTechnique].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className="badge badge-ghost shrink-0">× {c.quantite}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-base-content/60">Le contenu de ce pack n'est pas détaillé.</p>
          )}
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Fermer
          </button>
          <button type="button" className="btn btn-accent" onClick={() => onReserver(pack)}>
            Réserver ce pack
          </button>
        </div>
      </div>
    </Dialog>
  );
}
