import { useEffect, useState } from 'react';
import { getTypeEvenement } from '../../data/PackService';

let cache = null;
let promise = null;
const subscribers = new Set();

const notify = (value) => subscribers.forEach((s) => s(value));

const load = () => {
  if (cache) return Promise.resolve(cache.data);
  if (promise) return promise;

  promise = getTypeEvenement()
    .then((data) => {
      const list = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
      cache = { data: list };
      notify({ types: list, loading: false, error: null });
      return list;
    })
    .catch((err) => {
      promise = null;
      throw err;
    });

  return promise;
};

export const invalidateTypeEvenementsCache = () => {
  cache = null;
  promise = null;
};

export function useTypeEvenements() {
  const [state, setState] = useState(() => ({
    types: cache?.data ?? [],
    loading: !cache,
    error: null,
  }));

  useEffect(() => {
    let cancelled = false;
    const handler = (value) => { if (!cancelled) setState(value); };
    subscribers.add(handler);

    if (cache) {
      setState({ types: cache.data, loading: false, error: null });
    } else {
      load()
        .then((types) => {
          if (!cancelled) setState({ types, loading: false, error: null });
        })
        .catch(() => {
          if (!cancelled) setState({
            types: [],
            loading: false,
            error: 'Erreur lors du chargement des types.',
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