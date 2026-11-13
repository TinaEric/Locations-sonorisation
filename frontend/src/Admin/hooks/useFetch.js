import { useCallback, useEffect, useState } from "react";

/**
 * Charge des données via une fonction asynchrone et expose
 * { data, loading, error, reload }.
 * `deps` déclenche un rechargement quand ils changent.
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(fetcher, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await load());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

/** Normalise une réponse liste : tableau direct ou { data: [...] } / { items: [...] } */
export const asList = (d) =>
  Array.isArray(d) ? d : d?.data || d?.items || d?.results || [];
