import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Boxes } from 'lucide-react';
import FilterPanel from '../components/reservation/FilterPanel'
import PackCard from '../components/reservation/PackCard';
import DataState from '../../Admin/components/DataState';
import { packsDisponibles, materielDispo } from '../../data/reservationService';
import { asList } from '../../Admin/hooks/useFetch';

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('packs');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filters = useMemo(() => ({
    dateDebut: searchParams.get('dateDebut') || '',
    dateFin: searchParams.get('dateFin') || '',
    type: searchParams.get('type') || '',
  }), [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!filters.dateDebut || !filters.dateFin) return;
      setLoading(true);
      setError(null);
      try {
        let resp;
        if (activeTab === 'packs') {
          resp = await packsDisponibles(filters);
        } else {
          resp = await materielDispo(filters);
        }
        setItems(asList(resp));
      } catch (err) {
        setError("Erreur lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, activeTab]);

  const handleFilterChange = (newFilters) => {
    setSearchParams(newFilters);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
      {/* Sidebar Filtres */}
      <aside className="w-full lg:w-1/4">
        <FilterPanel initialValues={filters} onFilterChange={handleFilterChange} />
      </aside>

      {/* Résultats */}
      <main className="w-full lg:w-3/4">
        <div role="tablist" className="tabs tabs-boxed mb-6 bg-base-200">
          <button 
            role="tab"
            className={`tab gap-2 ${activeTab === 'packs' ? 'tab-active bg-primary text-primary-content' : ''}`}
            onClick={() => setActiveTab('packs')}
          >
            <Package size={16} /> Packs Complets
          </button>
          <button 
            role="tab"
            className={`tab gap-2 ${activeTab === 'materiels' ? 'tab-active bg-primary text-primary-content' : ''}`}
            onClick={() => setActiveTab('materiels')}
          >
            <Boxes size={16} /> Matériel à la carte
          </button>
        </div>

        {!filters.dateDebut || !filters.dateFin ? (
          <div className="alert alert-info">
            <span>Veuillez sélectionner des dates pour voir les disponibilités.</span>
          </div>
        ) : (
          <DataState loading={loading} error={error} onRetry={() => {}}>
            {!items.length ? (
              <div className="text-center py-20 bg-base-100 rounded-xl border border-base-200">
                <p className="text-base-content/60">Aucun résultat pour ces critères.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {items.map(item => (
                  <PackCard 
                    key={item.codePack || item.CodeMateriel} 
                    item={item} 
                    type={activeTab} 
                    filters={filters} 
                  />
                ))}
              </div>
            )}
          </DataState>
        )}
      </main>
    </div>
  );
}