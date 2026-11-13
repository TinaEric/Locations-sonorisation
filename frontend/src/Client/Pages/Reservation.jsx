import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FilterBar from '../components/navigation/FilterBar.jsx';
import PacksDisponibles from '../components/reservation/PacksDisponibles.jsx';
import { formatDate } from '../../utils/format.js';
import { useCategories } from '../hooks/useCategories.js';
import { useNavbar } from '../contexts/NavbarContext.jsx';

/** Adresse de la page sans les paramètres vides. */
const adresseReservation = (criteres) => {
  const search = new URLSearchParams(Object.entries(criteres).filter(([, valeur]) => valeur)).toString();
  return search ? `/reservation?${search}` : '/reservation';
};

export default function Reservation() {
  const {dateDebut, dateFin, typeEvent,resetValue, setDateDebut, setDateFin, setTypeEvent } = useNavbar()
    
  const [params] = useSearchParams();
  // const dateDebut = params.get('dateDebut') ?? '';
  // const dateFin = params.get('dateFin') ?? '';
  // const type = params.get('type') ?? '';
  const categorie = params.get('categorie') ?? '';

  const { categories } = useCategories();

  const hasDates = Boolean(dateDebut && dateFin);
  const datesValides = hasDates && dateFin >= dateDebut;

  const categorieLibelle = categories.find((c) => c.codeCategorie === categorie)?.libelle;

  const criteres = [
    hasDates && `Du ${formatDate(dateDebut)} au ${formatDate(dateFin)}`,
    typeEvent && `Type : ${typeEvent}`,
    categorieLibelle,
  ].filter(Boolean);

  // « Voir tous les packs » : mêmes dates et type, sans le filtre de catégorie
  const showAllHref = useMemo(
    () => adresseReservation({ dateDebut, dateFin, typeEvent }),
    [dateDebut, dateFin, typeEvent],
  );

  // Clé unique pour réinitialiser le formulaire si l'utilisateur change d'URL manuellement
  const filterFormKey = `${dateDebut}-${dateFin}-${typeEvent}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <h1 className="display text-3xl sm:text-4xl">
        {categorieLibelle ? `Packs ${categorieLibelle}` : 'Choisissez votre pack'}
      </h1>
      <p className="mt-4 max-w-xl text-base-content/75">
        Indiquez les dates de votre événement pour découvrir les packs adaptés à votre besoin.
      </p>

      <FilterBar
        key={filterFormKey}
        initial={{ dateDebut, dateFin, typeEvent }}
        extra={{ categorie }}
        className="mt-8"
      />

      {criteres.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Critères choisis">
          {criteres.map((critere, index) => (
            <li key={`${critere}-${index}`} className="badge badge-neutral badge-lg">
              {critere}
            </li>
          ))}
        </ul>
      )}

      {datesValides && (
        <PacksDisponibles
          dateDebut={dateDebut}
          dateFin={dateFin}
          type={typeEvent}
          categorie={categorie}
          showAllHref={showAllHref}
        />
      )}

      {hasDates && !datesValides && (
        <p role="alert" className="mt-10 font-medium text-error">
          La date de fin doit être égale ou postérieure à la date de début.
        </p>
      )}

      {!hasDates && (
        <p className="mt-10 text-base-content/75">
          Besoin d’aide pour choisir ?{' '}
          <Link to="/aide" className="link link-accent">Consultez l’aide</Link> ou{' '}
          <Link to="/information" className="link link-accent">le fonctionnement d’une location</Link>.
        </p>
      )}
    </div>
  );
}
