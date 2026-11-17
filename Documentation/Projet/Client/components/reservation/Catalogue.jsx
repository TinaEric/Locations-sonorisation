import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterPanel from '../components/reservation/FilterPanel';
import PackCard from '../components/reservation/PackCard';
import { packsDisponibles, materielDispo } from '../../../data/reservationService';

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('packs'); // 'packs' ou 'materiels'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Les filtres sont lus depuis l'URL (partageable)
  const filters = {
    dateDebut: searchParams.get('dateDebut'),
    dateFin: searchParams.get('dateFin'),
    type: searchParams.get('type'),
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let resp;
        if (activeTab === 'packs') {
          resp = await packsDisponibles(filters);
        } else {
          resp = await materielDispo(filters);
        }
        setItems(resp || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (filters.dateDebut && filters.dateFin) fetchData();
  }, [filters.dateDebut, filters.dateFin, filters.type, activeTab]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col lg:flex-row gap-8">
      {/* Sidebar Filtres */}
      <aside className="w-full lg:w-1/4">
        <FilterPanel 
          initialValues={filters} 
          onFilterChange={(newFilters) => setSearchParams(newFilters)} 
        />
      </aside>

      {/* Grille de résultats */}
      <main className="w-full lg:w-3/4">
        {/* Onglets Packs / Matériels */}
        <div className="tabs tabs-boxed mb-6">
          <button 
            className={`tab ${activeTab === 'packs' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('packs')}
          >
            Packs Complets
          </button>
          <button 
            className={`tab ${activeTab === 'materiels' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('materiels')}
          >
            Matériel à la carte
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><span className="loading loading-spinner text-primary"></span></div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(item => (
              <PackCard key={item.codePack || item.CodeMateriel} item={item} type={activeTab} filters={filters} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}