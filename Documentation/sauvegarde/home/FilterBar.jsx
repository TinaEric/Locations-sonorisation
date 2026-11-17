//filterBar
import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavbar } from '../../contexts/NavbarContext';
import { RotateCcw, Search } from 'lucide-react';
import { PackService } from '../../../data/PackService';

const versOption = (type) =>
  typeof type === 'object' ? { value: type.id, label: type.libelle } : { value: type, label: type };

export default function FilterBar() {
  const navigate = useNavigate();
  const {dateDebut, dateFin, typeEvent,resetValue, setDateDebut, setDateFin, setTypeEvent } = useNavbar()
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [validationError, setValidationError] = useState(null);

   const fetchData = async () => {
        setLoading(true);
        try {
          const packResp = await PackService.getTypeEvenement();
          if (packResp){
            setTypes(packResp);
          }else{
            setTypes([])
          }
        } catch (err) {
          setLoadError('Erreur lors du chargement des packs.');
        } finally {
          setLoading(false);
        }
      };
    
      useEffect(() => {
        fetchData();
      }, []);

  const isComplete = dateDebut && dateFin;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!dateDebut || !dateFin) {
      setValidationError('Indiquez la date de début et la date de fin de votre événement.');
      return;
    }
    if (dateFin < dateDebut) {
      setValidationError('La date de fin doit être égale ou postérieure à la date de début.');
      return;
    }
    navigate('/reservation');
  };

  const reset = () => {
    setValidationError(null);
    resetValue()
  };

  const hasFilters = Boolean(dateDebut || dateFin || typeEvent);

  return (
    <div className='flex flex-col w-full'>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full gap-3 sm:flex-row sm:items-end"
      >
        {/* Date de début */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor="date-debut"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Date de début
          </label>
          <input
            id="date-debut"
            type="date"
            value={dateDebut ?? ''}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDateDebut(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            required
          />
        </div>

        {/* Date de fin */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor="date-fin"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Date de fin
          </label>
          <input
            id="date-fin"
            type="date"
            value={dateFin ?? ''}
            min={dateDebut || new Date().toISOString().split('T')[0]}
            onChange={(e) => setDateFin(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:bg-slate-100"
            disabled={!dateDebut}
            required
          />
        </div>

        {/* Type d'événement (optionnel, mais présent dans le hook) */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor="type-event"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Type d’événement
          </label>
          <select
            id="type-event"
            value={typeEvent ?? ''}
            onChange={(e) => setTypeEvent(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">Tous les types</option>
              {loading && <option disabled>Chargement…</option>}
              {loadError && <option disabled>Indisponible</option>}
              {!loading &&
                !loadError &&
                types.map(versOption).map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
          </select>
        </div>

        <div className="flex justify-between gap-2">
          {hasFilters && (
              <button
                type="button"
                className="btn btn-ghost btn-lg"
                onClick={reset}
                aria-label="Réinitialiser les filtres"
                title="Réinitialiser les filtres"
              >
                <RotateCcw className="size-5" aria-hidden="true" />
              </button>
            )}
          <button
              type="submit"
              disabled={!isComplete}
              className="btn btn-accent rounded-xl px-5 text-sm font-semibold shadow-sm"
              >
                <Search />
              Voir les packs
            </button>
        </div>
      </form>
      {validationError && (
          <p  role="alert" className="mt-4 text-sm font-medium text-error">
            {validationError}
          </p>
        )}
        {loadError && (   
          <p  role="alert" className="mt-4 text-sm font-medium text-error">
            {loadError}
          </p>)}
    </div>
  );
}