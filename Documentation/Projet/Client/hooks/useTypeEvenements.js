import { useEffect, useState } from 'react';
import { getCategories } from '../../data/PackService';

let cache = null;
let promise = null;
const subscribers = new Set();

const notify = (value) => subscribers.forEach((s) => s(value));

const load = () => {
  if (cache) return Promise.resolve(cache.data);
  if (promise) return promise;

  promise = getCategories()
    .then((data) => {
      const list = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
      cache = { data: list };
      notify({ categories: list, loading: false, error: null });
      return list;
    })
    .catch((err) => {
      promise = null;
      throw err;
    });

  return promise;
};

export const invalidateCategoriesCache = () => {
  cache = null;
  promise = null;
};

export function useCategories() {
  const [state, setState] = useState(() => ({
    categories: cache?.data ?? [],
    loading: !cache,
    error: null,
  }));

  useEffect(() => {
    let cancelled = false;
    const handler = (value) => { if (!cancelled) setState(value); };
    subscribers.add(handler);

    if (cache) {
      setState({ categories: cache.data, loading: false, error: null });
    } else {
      load()
        .then((categories) => {
          if (!cancelled) setState({ categories, loading: false, error: null });
        })
        .catch(() => {
          if (!cancelled) setState({
            categories: [],
            loading: false,
            error: 'Erreur lors du chargement des catégories.',
          });
        });
    }

    return () => {
      cancelled = true;
      subscribers.delete(handler);
    };
  }, []);

  return state;
}