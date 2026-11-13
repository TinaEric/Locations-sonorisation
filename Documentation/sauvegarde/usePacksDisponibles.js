import { useEffect, useState } from 'react';
import { listePacks, packsDisponibles } from '../../data/PackService.js';

export function usePacksDisponibles({ dateDebut, dateFin, type }) {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!dateDebut || !dateFin) {
      setPacks([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const donnees = {
            dateDebut: dateDebut,
            dateFin: dateFin,
            typeEvenement: type
        }
        const data = await packsDisponibles(donnees);
        if (cancelled) return;
        setPacks(Array.isArray(data) ? data : []);
      } catch {
        if (cancelled) return;
        setPacks([]);
        setError('Erreur lors du chargement des packs disponibles.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [dateDebut, dateFin, type]);

  return { packs, loading, error };
}