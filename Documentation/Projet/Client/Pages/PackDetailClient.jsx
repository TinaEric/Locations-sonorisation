import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, Package, ShieldCheck, ShoppingCart } from 'lucide-react';
import DataState from '../../Admin/components/DataState';
import { ImageUrl } from '../../components/ImageUrl';
import { formatMoney } from '../../utils/format';
import { getPackDetail } from '../../data/reservationService';
import { useCart } from '../contexts/CartContext';

export default function PackDetailClient() {
  const { codePack } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupération des filtres depuis l'URL
  const dateDebut = searchParams.get('dateDebut');
  const dateFin = searchParams.get('dateFin');

  const fetchPack = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await getPackDetail(codePack);
      setPack(resp);
    } catch (err) {
      setError("Impossible de charger le détail de ce pack.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPack();
  }, [codePack]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  // Calcul du nombre de jours
  const nbJours = (dateDebut && dateFin) 
    ? Math.max(1, Math.ceil((new Date(dateFin) - new Date(dateDebut)) / (1000 * 60 * 60 * 24)) + 1) 
    : 1;

  const totalEstime = pack ? Number(pack.tarifJournalier) * nbJours : 0;

  const handleAjouterAuPanier = () => {
    // Ajout au CartContext avec le type "PACK"
    addItem(
      {
        codePack: pack.codePack,
        libelle: pack.libelle,
        tarifJournalier: pack.tarifJournalier,
        imageUrl: pack.imageUrl,
      },
      'PACK'
    );
    
    // Redirection directe vers le panier/checkout
    navigate('/reservation/checkout');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link 
        to={`/reservation?dateDebut=${dateDebut}&dateFin=${dateFin}`} 
        className="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-primary mb-6"
      >
        <ArrowLeft size={16} /> Retour au catalogue
      </Link>

      <DataState loading={loading} error={error} onRetry={fetchPack}>
        {pack && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Colonne Gauche : Détails du pack */}
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-xl overflow-hidden bg-base-200 border border-base-200">
                <ImageUrl 
                  src={pack.imageUrl} 
                  alt={pack.libelle} 
                  className="w-full h-80 object-cover" 
                />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-neutral">{pack.libelle}</h1>
                <p className="mt-2 text-lg text-base-content/70">{pack.description}</p>
              </div>

              <div className="divider"></div>

              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <Package size={20} className="text-primary" /> Contenu du pack
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pack.composants?.map((comp) => (
                    <div key={comp.idComposant || comp.materiel?.CodeMateriel} className="flex items-center gap-3 rounded-lg border border-base-200 p-3 bg-base-100">
                      <ImageUrl src={comp.materiel?.imageURL} alt={comp.materiel?.designation} className="h-12 w-12 rounded object-cover" />
                      <div>
                        <p className="font-medium text-sm">{comp.materiel?.designation}</p>
                        <p className="text-xs text-base-content/60">Quantité : {comp.quantite}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Colonne Droite : Récapitulatif et Action (Sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-base-300 bg-base-100 p-6 shadow-lg">
                <h2 className="text-xl font-bold mb-4">Récapitulatif</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Tarif journalier</span>
                    <span className="font-medium">{formatMoney(pack.tarifJournalier)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Durée</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar size={14} /> {nbJours} jour(s)
                    </span>
                  </div>
                  <div className="flex justify-between text-base-content/60">
                    <span>Du</span>
                    <span>{formatDate(dateDebut)}</span>
                  </div>
                  <div className="flex justify-between text-base-content/60">
                    <span>Au</span>
                    <span>{formatDate(dateFin)}</span>
                  </div>
                </div>

                <div className="divider my-4"></div>

                <div className="flex justify-between items-end mb-6">
                  <span className="text-base-content/60 font-medium">Total estimé</span>
                  <span className="text-2xl font-bold text-primary">{formatMoney(totalEstime)}</span>
                </div>

                <button 
                  onClick={handleAjouterAuPanier}
                  className="btn btn-accent btn-lg w-full gap-2"
                >
                  <ShoppingCart size={20} /> Ajouter au panier
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-base-content/50">
                  <ShieldCheck size={14} /> Paiement sécurisé & Caution remboursable
                </div>
              </div>
            </div>
          </div>
        )}
      </DataState>
    </div>
  );
}