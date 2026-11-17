import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Boxes, CalendarDays, CalendarX, Eye, SearchX, SlidersHorizontal, TriangleAlert } from 'lucide-react';
import { packsDisponibles } from '../../data/reservationService.js';
import { getTypeEvenement } from '../../data/PackService.js';
import PackDetailModal from '../components/reservation/PackDetailModal.jsx';
import ReservationPackModal from '../components/reservation/ReservationPackModal.jsx';
import {
  Vignette,
  asArray,
  formatDateFr,
  formatMoney,
  nombreJours,
  pluriel,
} from '../components/reservation/reservationUi.jsx';

/** Même règle que FilterBar : un type peut être une chaîne ou { id, libelle }. */
const versOption = (type) =>
  typeof type === 'object' ? { value: type.id, label: type.libelle } : { value: type, label: type };

function Etat({ Icone, titre, children }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm border border-base-300 bg-base-100 px-6 py-14 text-center">
      <Icone className="size-12 text-base-content/30" aria-hidden="true" />
      <h2 className="text-xl font-semibold">{titre}</h2>
      <div className="max-w-md text-sm text-base-content/70">{children}</div>
    </div>
  );
}

function PackCard({ pack, jours, onDetail, onReserver }) {
  const types = [].concat(pack.typesEvenement ?? []);
  const total = Number(pack.tarifJournalier || 0) * jours;

  return (
    <article className="flex flex-col overflow-hidden rounded-sm border border-base-300 bg-base-100">
      <Vignette src={pack.imageUrl} alt={pack.libelle} className="aspect-video w-full !rounded-none" />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h2 className="text-lg font-bold">{pack.libelle}</h2>
          {types.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {types.map((t) => (
                <span key={t} className="badge badge-outline badge-sm capitalize">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {pack.description && <p className="line-clamp-2 text-sm text-base-content/70">{pack.description}</p>}

        <p className="inline-flex items-center gap-1 text-sm text-base-content/70">
          <Boxes className="size-4" aria-hidden="true" /> {pluriel(pack.composants?.length ?? 0, 'matériel')} inclus
        </p>

        <div className="mt-auto border-t border-base-300 pt-3">
          <p className="text-2xl font-bold text-accent">{formatMoney(total)}</p>
          <p className="text-xs text-base-content/60">
            {pluriel(jours, 'jour')} × {formatMoney(pack.tarifJournalier)} · caution {formatMoney(pack.prixCaution)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-outline" onClick={() => onDetail(pack)}>
            <Eye className="size-4" aria-hidden="true" /> Détail
          </button>
          <button type="button" className="btn btn-accent" onClick={() => onReserver(pack)}>
            Réserver
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * Packs disponibles pour les filtres saisis dans FilterBar.
 * Route : /reservation?dateDebut=YYYY-MM-DD&dateFin=YYYY-MM-DD[&type=…]
 */
export default function PacksDisponibles() {
  const [params] = useSearchParams();
  const dateDebut = params.get('dateDebut') ?? '';
  const dateFin = params.get('dateFin') ?? '';
  const type = params.get('type') ?? '';
  const jours = nombreJours(dateDebut, dateFin);
  const filtresValides = jours > 0;
  const filtres = { dateDebut, dateFin, jours };

  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(filtresValides);
  const [erreur, setErreur] = useState(null);
  const [essai, setEssai] = useState(0); // incrémenté pour relancer la recherche
  const [typeLabel, setTypeLabel] = useState('');
  const [detail, setDetail] = useState(null);
  const [reservation, setReservation] = useState(null);

  useEffect(() => {
    if (!filtresValides) return undefined;
    let annule = false;
    setLoading(true);
    setErreur(null);
    packsDisponibles({ dateDebut, dateFin, ...(type ? { typeEvenement: type } : {}) })
      .then((resp) => {
        if (!annule) setPacks(asArray(resp).filter((p) => p.statutPack !== 'inactif'));
      })
      .catch((err) => {
        if (!annule) setErreur(err?.message || 'Impossible de charger les packs disponibles.');
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });
    return () => {
      annule = true;
    };
  }, [dateDebut, dateFin, type, filtresValides, essai]);

  // Libellé lisible du type d'événement (l'URL ne contient que sa valeur)
  useEffect(() => {
    if (!type) {
      setTypeLabel('');
      return;
    }
    let annule = false;
    getTypeEvenement()
      .then((liste) => {
        const option = asArray(liste).filter(Boolean).map(versOption).find((o) => String(o.value) === type);
        if (!annule) setTypeLabel(option?.label ?? type);
      })
      .catch(() => !annule && setTypeLabel(type));
    return () => {
      annule = true;
    };
  }, [type]);

  const ouvrirReservation = (pack) => {
    setDetail(null);
    setReservation(pack);
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Packs disponibles</h1>
      <p className="mt-1 text-base-content/70">
        Choisissez le pack qui convient à votre événement, consultez son contenu, puis réservez.
      </p>

      {!filtresValides ? (
        <div className="mt-8">
          <Etat Icone={CalendarX} titre="Choisissez vos dates">
            <p>
              Indiquez la date de début et la date de fin de votre événement pour voir les packs disponibles.
            </p>
            <Link to="/" className="btn btn-accent mt-4">
              Choisir mes dates
            </Link>
          </Etat>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-3 rounded-sm border border-base-300 bg-base-100 p-4">
            <span className="inline-flex items-center gap-2 text-sm">
              <CalendarDays className="size-4 text-accent" aria-hidden="true" />
              Du <b>{formatDateFr(dateDebut)}</b> au <b>{formatDateFr(dateFin)}</b> · {pluriel(jours, 'jour')}
            </span>
            {type && <span className="badge badge-outline capitalize">{typeLabel || type}</span>}
            <Link to="/" className="btn btn-ghost btn-sm ml-auto">
              <SlidersHorizontal className="size-4" aria-hidden="true" /> Modifier la recherche
            </Link>
          </div>

          <div className="mt-6" aria-live="polite">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-96 rounded-sm" />
                ))}
              </div>
            ) : erreur ? (
              <div role="alert" className="alert alert-error alert-soft">
                <TriangleAlert className="size-5" aria-hidden="true" />
                <span>{erreur}</span>
                <button type="button" className="btn btn-sm" onClick={() => setEssai((n) => n + 1)}>
                  Réessayer
                </button>
              </div>
            ) : !packs.length ? (
              <Etat Icone={SearchX} titre="Aucun pack disponible">
                <p>
                  Aucun pack n'est libre
                  {type ? ` pour un événement de type « ${typeLabel || type} »` : ''} sur ces dates. Essayez d'autres
                  dates ou un autre type d'événement.
                </p>
                <Link to="/" className="btn btn-accent mt-4">
                  Modifier la recherche
                </Link>
              </Etat>
            ) : (
              <>
                <p className="mb-4 text-sm text-base-content/70">{pluriel(packs.length, 'pack')} disponible(s)</p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {packs.map((pack) => (
                    <PackCard
                      key={pack.codePack}
                      pack={pack}
                      jours={jours}
                      onDetail={setDetail}
                      onReserver={ouvrirReservation}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {detail && (
        <PackDetailModal pack={detail} filtres={filtres} onClose={() => setDetail(null)} onReserver={ouvrirReservation} />
      )}
      {reservation && (
        <ReservationPackModal
          pack={reservation}
          filtres={filtres}
          onClose={() => setReservation(null)}
          onCree={() => setEssai((n) => n + 1)}
        />
      )}
    </section>
  );
}
