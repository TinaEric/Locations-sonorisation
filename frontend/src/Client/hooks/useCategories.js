import { useEffect, useState } from 'react';
import { categorieService } from '../../data/CategorieService';

// Promesse partagée : plusieurs composants utilisant le hook ne déclenchent qu'une seule requête
let promesse = null;

const charger = () => {
  promesse ??= categorieService.list().catch((e) => {
    promesse = null; // permet de réessayer après une erreur
    throw e;
  });
  return promesse;
};

/** À appeler après une déconnexion ou une modification des catégories. */
export const invaliderCategories = () => {
  promesse = null;
};

const versListe = (reponse) => (Array.isArray(reponse) ? reponse : (reponse?.data ?? []));

export function useCategories() {
  const [essai, setEssai] = useState(0);
  const [etat, setEtat] = useState({ essai: -1, categories: [], error: null });

  useEffect(() => {
    let annule = false;

    charger()
      .then((reponse) => {
        if (!annule) setEtat({ essai, categories: versListe(reponse), error: null });
      })
      .catch(() => {
        if (!annule) setEtat({ essai, categories: [], error: 'Erreur lors du chargement des catégories.' });
      });

    return () => {
      annule = true;
    };
  }, [essai]);

  const retry = () => {
    invaliderCategories();
    setEssai((n) => n + 1);
  };

  return { categories: etat.categories, loading: etat.essai !== essai, error: etat.error, retry };
}