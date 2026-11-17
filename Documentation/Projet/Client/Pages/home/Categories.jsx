import { Link } from 'react-router-dom';
import SectionHeading from '../../components/navigation/SectionHeading.jsx';
import { categorieService } from '../../../data/CategorieService.js';
import { FaMusic, FaMicrophone, FaLightbulb, FaBox } from 'react-icons/fa'; // Import des icônes
import { useEffect, useState } from 'react';
import {ChargementModule, ErreurModule} from '../../components/navigation/ErreurModule.jsx';

// Coins d'aluminium des flight cases
const CORNERS = [
  'left-2 top-2 border-l-2 border-t-2',
  'right-2 top-2 border-r-2 border-t-2',
  'bottom-2 left-2 border-b-2 border-l-2',
  'bottom-2 right-2 border-b-2 border-r-2',
];

// Correspondance entre typeCategorie et icône
const ICONS = {
  instrument: FaMusic,
  sonorisation: FaMicrophone,
  eclairage: FaLightbulb,
  autre: FaBox, // Icône par défaut pour les types inconnus
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const catResp = await categorieService.list();
      const data = catResp.filter(cat => cat.statutCategorie === 'actif');
      if(data){
        let val = [];
        data.map((valeur, index) => {
          if (index < 4) {
            val = [ ...val, valeur]
          }
        })
        console.log("LIST CAT HOME: ", val)
        setCategories(val);
      }
      else{
        setCategories([])
      }
    } catch (err) {
      setError('Erreur lors du chargement des catégories.');
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
  return (
    <section aria-labelledby="categories-title" className="border-t border-base-300 bg-base-200">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          id="categories-title"
          title="Parcourir par matériel"
          text="Accédez directement à la catégorie dont vous avez besoin."
        />
        {loading && <ChargementModule message={"Chargement des catégories..."}/>}
        {error && <ErreurModule message={error} onRetry={reload}/>}

        {!loading && !error && (
          <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {categories.map((cat) => {
              const Icon = ICONS[cat.typeCategorie] || ICONS['autre'];

              return (
                <li key={cat.idCategorie}>
                  <Link
                    to={`/reservation?categorie=${cat.idCategorie}`}
                    className="relative flex min-h-48 flex-col justify-between rounded-sm bg-neutral p-5 text-neutral-content transition-colors hover:bg-primary hover:text-primary-content sm:min-h-56"
                  >
                    {CORNERS.map((position) => (
                      <span
                        key={position}
                        aria-hidden="true"
                        className={`absolute size-3 border-neutral-content/40 ${position}`}
                      />
                    ))}
                    {/* Afficher l'icône */}
                    <Icon className="size-9 text-accent" aria-hidden="true" />
                    <div>
                      <h3 className="display break-words text-lg sm:text-xl">{cat.libelle}</h3>
                      <p className="mt-1 text-sm opacity-75">{cat.descriptionCategorie}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}