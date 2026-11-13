import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Search } from 'lucide-react';
import { useTypeEvenements } from '../../hooks/useTypeEvenements.js';
import { getTypeEvenement } from '../../../data/PackService.js';
import { useNavbar } from '../../contexts/NavbarContext.jsx';

const todayIso = () => new Date().toLocaleDateString('en-CA');

/** Construit les paramètres d'adresse en ignorant les valeurs vides. */
const buildSearchParams = (valeurs) =>
  new URLSearchParams(Object.entries(valeurs).filter(([, v]) => v !== null && v !== undefined && v !== ''));

/** Un type peut être une chaîne ou un objet { id, libelle }. */
const versOption = (type) =>
  typeof type === 'object' ? { value: type.id, label: type.libelle } : { value: type, label: type };

function Field({ id, label, tilt = 0, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="tape self-start" style={{ transform: `rotate(${tilt}deg)` }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function FilterBar({ initial = {}, extra = {}, className = '' }) {
  const navigate = useNavigate();
  const {dateDebut, dateFin, typeEvent,resetValue, setDateDebut, setDateFin, setTypeEvent } = useNavbar()
  const uid = useId();
  const today = todayIso();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const fetchData = async () => {
      setLoading(true);
      try {
        const packResp = await getTypeEvenement();
        console.log("PatRepos: ", packResp)
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
  
    const reload = () => {
      setError(null)
      fetchData()
    }

  // const { types = [], loading, error: loadError } = useTypeEvenements();

  // const [form, setForm] = useState({
  //   dateDebut: initial.dateDebut ?? '',
  //   dateFin: initial.dateFin ?? '',
  //   type: initial.type ?? '',
  // });
  
  const [form, setForm] = useState({
    dateDebut: dateDebut ?? '',
    dateFin: dateFin ?? '',
    type: typeEvent ?? '',
  });

  const [validationError, setValidationError] = useState(null);

  const update = (champ) => (event) => {
    const valeur = event.target.value;
    setForm((actuel) => {
      const suivant = { ...actuel, [champ]: valeur };
      if (champ === 'dateDebut' && suivant.dateFin && suivant.dateFin < valeur) suivant.dateFin = valeur;
      return suivant;
    });
    setValidationError(null);
    switch(champ){
      case 'dateDebut':
        setDateDebut(valeur)
      case 'dateFin':
        setDateFin(valeur)
      case 'type':
        setTypeEvent(valeur)
      default:
    }
  };

  const reset = () => {
    setForm({ dateDebut: '', dateFin: '', type: '' });
    setValidationError(null);
    resetValue()
  };

  const onSubmit = (event) => {
    event.preventDefault();

    if (!form.dateDebut || !form.dateFin) {
      setValidationError('Indiquez la date de début et la date de fin de votre événement.');
      return;
    }
    if (form.dateFin < form.dateDebut) {
      setValidationError('La date de fin doit être égale ou postérieure à la date de début.');
      return;
    }

    navigate({ pathname: '/reservation', search: buildSearchParams({ ...extra, ...form }).toString() });
  };

  const hasFilters = Boolean(form.dateDebut || form.dateFin || form.type);
  const erreurId = `${uid}-error`;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Filtre rapide du matériel disponible"
      className={`rounded-sm border border-base-300 bg-base-100 p-5 sm:p-6 ${className}`}
    >
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-end">
        <Field id={`${uid}-debut`} label="Date de début" tilt={-1.2}>
          <input
            id={`${uid}-debut`}
            type="date"
            min={today}
            value={form.dateDebut}
            onChange={update('dateDebut')}
            required
            aria-invalid={Boolean(validationError) && !form.dateDebut}
            aria-describedby={validationError ? erreurId : undefined}
            className="input w-full"
          />
        </Field>

        <Field id={`${uid}-fin`} label="Date de fin" tilt={0.8}>
          <input
            id={`${uid}-fin`}
            type="date"
            min={form.dateDebut || today}
            value={form.dateFin}
            onChange={update('dateFin')}
            required
            aria-invalid={Boolean(validationError) && !form.dateFin}
            aria-describedby={validationError ? erreurId : undefined}
            className="input w-full"
          />
        </Field>

        <Field id={`${uid}-type`} label="Type d’événement" tilt={-0.6}>
          <select
            id={`${uid}-type`}
            value={form.type}
            onChange={update('type')}
            disabled={loading || Boolean(loadError)}
            className="select w-full"
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
        </Field>

        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
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
          <button type="submit" className="btn btn-accent btn-lg flex-1">
            <Search className="size-5" aria-hidden="true" />
            Voir les packs disponibles
          </button>
        </div>
      </div>

      {validationError && (
        <p id={erreurId} role="alert" className="mt-4 text-sm font-medium text-error">
          {validationError}
        </p>
      )}

      {loadError && !validationError && (
        <p role="alert" className="mt-4 text-sm font-medium text-warning">
          {/* {loadError} */}
        </p>
      )}

    </form>
  );
}