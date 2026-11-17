import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircleAlert, RotateCw } from 'lucide-react';
import { usePacksDisponibles } from '../../hooks/usePacksDisponibles.js';
import { plural, rentalDays } from '../../../utils/format.js';
// import PackCard from '../../components/reservation/PackCard.jsx';
import PackCard from './PackCard.jsx';

const ROUTE_COMMANDE = '/commande';

function Chargement() {
  return (
    <section className="mt-10" aria-busy="true" aria-label="Recherche des packs disponibles">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="skeleton h-96 rounded-sm" />
        ))}
      </div>
    </section>
  );
}

function Erreur({ message, onRetry }) {
  return (
    <div className='flex justify-center w-full items-center p-2 mt-5'>
    <div role="alert" className="alert alert-error alert-soft mt-10 max-w-2xl">
      <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">Impossible de charger les packs.</p>
        <p className="text-sm">{message}</p>
      </div>
      <button type="button" className="btn btn-sm" onClick={onRetry}>
        <RotateCw className="size-4" aria-hidden="true" />
        Réessayer
      </button>
    </div>
    </div>
  );
}

function AucunPack({ showAllHref }) {
  return (
    <section className="mt-10 rounded-sm border border-dashed border-base-300 p-8 text-center">
      <p className="text-lg font-medium">Aucun pack disponible</p>
      <p className="mt-2 text-base-content/70">
        Aucun pack ne correspond à vos critères pour ces dates. Essayez d’autres dates
      </p>
      { showAllHref && (
        <Link to={showAllHref} className="btn btn-outline btn-sm mt-4">
          Voir tous les packs
        </Link>
      )}
    </section>
  );
}

export default function PacksDisponibles({ dateDebut, dateFin, type = '', showAllHref }) {
  const navigate = useNavigate();

  const { packs, loading, error, reload } = usePacksDisponibles({ dateDebut, dateFin, type });
  const [codeChoisi, setCodeChoisi] = useState(null);

  const nbJours = rentalDays(dateDebut, dateFin); 

  const packChoisi = packs.find((p) => p.codePack === codeChoisi) ?? null;

  const continuer = () => {
    const params = new URLSearchParams({ pack: packChoisi.codePack, dateDebut, dateFin });
    if (type) params.set('type', type);
    navigate(`${ROUTE_COMMANDE}?${params}`);
  };

  if (loading) return <Chargement />;
  if (error) return <Erreur message={error} onRetry={reload} />;
  if (packs.length === 0) return <AucunPack showAllHref={showAllHref} />;

  return (
    <section className="mt-10">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="display text-2xl">
            {packs.length} {plural(packs.length, 'pack disponible', 'packs disponibles')}
          </h2>
          <p className="mt-1 text-sm text-base-content/70">
            Pour {nbJours} {plural(nbJours, 'jour', 'jours')} de location
          </p>
        </div>

        { showAllHref && (
          <Link to={showAllHref} className="link link-accent text-sm">
            Voir tous les packs
          </Link>
        )}
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((pack) => (
          <PackCard
            pack={pack}
            key={pack.codePack}
          />
        ))}
      </div>

      {packChoisi && (
        <div className="mt-8 rounded-sm border border-accent bg-accent/5 p-5" role="status">
          <p className="text-sm font-medium">
            Pack sélectionné : <span className="font-bold text-accent">{packChoisi.libelle}</span>
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn btn-accent btn-sm" onClick={continuer}>
              Continuer vers la commande
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCodeChoisi(null)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </section>
  );
}


