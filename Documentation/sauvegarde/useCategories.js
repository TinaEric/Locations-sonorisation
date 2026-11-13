// src/hooks/useCategories.js
import { useEffect, useState } from 'react';
import { categorieService } from '../../data/CategorieService';

// --- Cache module-level (persiste tant que l'onglet est ouvert) ---
let cache = null;         // { data: [...] } ou null
let promise = null;       // Promesse en cours pour éviter les appels parallèles
const subscribers = new Set(); // Composants abonnés au cache

/**
 * Notifie tous les abonnés quand le cache est mis à jour.
 */
const notifySubscribers = (value) => {
  subscribers.forEach((setter) => setter(value));
};

/**
 * Charge les catégories avec un cache partagé.
 * Plusieurs appels simultanés ne déclenchent qu'UNE seule requête.
 */
const loadCategories = () => {
  // Cas 1 : cache déjà prêt → on renvoie immédiatement
  if (cache) return Promise.resolve(cache.data);

  // Cas 2 : requête déjà en cours → on renvoie la même promesse
  if (promise) return promise;

  // Cas 3 : première requête → on la lance
  promise = categorieService.list()
    .then((data) => {
      cache = { data };
      notifySubscribers({ categories: data, loading: false, error: null });
      return data;
    })
    .catch((err) => {
      promise = null; // Permet de réessayer
      throw err;
    });

  return promise;
};

/**
 * Réinitialise le cache (utile après une erreur ou un logout).
 */
export const invalidateCategoriesCache = () => {
  cache = null;
  promise = null;
};

/**
 * Hook React qui expose les catégories avec cache partagé.
 */
export function useCategories() {
  const [state, setState] = useState(() => ({
    categories: cache?.data ?? [],
    loading: !cache,
    error: null,
  }));

  useEffect(() => {
    let cancelled = false;

    // S'abonner aux mises à jour du cache
    const handleUpdate = (value) => {
      if (!cancelled) setState(value);
    };
    subscribers.add(handleUpdate);

    // Si le cache est déjà prêt, on synchronise l'état
    if (cache) {
      setState({ categories: cache.data, loading: false, error: null });
    } else {
      // Sinon, on lance le chargement
      loadCategories()
        .then((data) => {
          if (!cancelled) {
            setState({ categories: data, loading: false, error: null });
          }
        })
        .catch(() => {
          if (!cancelled) {
            setState({
              categories: [],
              loading: false,
              error: 'Erreur lors du chargement des catégories.',
            });
          }
        });
    }

    return () => {
      cancelled = true;
      subscribers.delete(handleUpdate);
    };
  }, []);

  // Fonction pour forcer un rechargement (ex: bouton "Réessayer")
  const retry = () => {
    invalidateCategoriesCache();
    setState({ categories: [], loading: true, error: null });
    loadCategories()
      .then((data) => setState({ categories: data, loading: false, error: null }))
      .catch(() =>
        setState({
          categories: [],
          loading: false,
          error: 'Erreur lors du chargement des catégories.',
        }),
      );
  };

  return { ...state, retry };
}