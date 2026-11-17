import { useCallback, useEffect, useState } from 'react';
import { materielDispo } from '../../data/reservationService.js';

// Accepte une réponse déjà extraite (tableau) ou une réponse axios ({ data: [...] })
const extraireListe = (reponse) => {
  if (Array.isArray(reponse)) return reponse;
  if (Array.isArray(reponse?.data)) return reponse.data;
  return [];
};

// Transforme n'importe quelle erreur en Error avec un message lisible
const versErreur = (e) => {
  if (e instanceof Error) return e;
  const message = e?.response?.data?.message ?? e?.message ?? e;
  return new Error(
    Array.isArray(message) ? message.join(', ') : typeof message === 'string' ? message : 'Le serveur ne répond pas',
  );
};


export function useMaterielsDisponibles(dateDebut, dateFin) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const charger = useCallback(async () => {
    if (!dateDebut || !dateFin) return;
    setLoading(true); setError(null);
    try {
      const reponse = await materielDispo({ dateDebutPrevue: dateDebut, dateFinPrevue: dateFin });
      setData(reponse?.data ?? reponse);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin]);

  useEffect(() => { charger(); }, [charger]);
  return {
    data: loading ? null : data,
    error: loading ? null : error,
    loading,
    reload: charger,
  };
}