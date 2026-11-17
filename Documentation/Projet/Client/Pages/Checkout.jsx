import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatMoney } from '../../utils/format';
import { Calendar, CheckCircle2, CreditCard, Trash2, User } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, dates, total, removeItem, clearCart } = useCart();
  const [step, setStep] = useState(1);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // Redirection si le panier est vide
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Votre panier est vide</h1>
        <button onClick={() => navigate('/reservation')} className="btn btn-primary">
          Retour au catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ul className="steps steps-horizontal w-full mb-12">
        <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Vérification</li>
        <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Coordonnées</li>
        <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Paiement</li>
      </ul>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Formulaire (Étape en cours) */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <div className="card bg-base-100 shadow-md border border-base-200 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Calendar /> Détails de la réservation</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Date de début</span></label>
                  <input type="date" className="input input-bordered" defaultValue={dates.dateDebut || ''} disabled />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Date de fin</span></label>
                  <input type="date" className="input input-bordered" defaultValue={dates.dateFin || ''} disabled />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setStep(2)} className="btn btn-primary">Continuer</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card bg-base-100 shadow-md border border-base-200 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><User /> Vos coordonnées</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Nom complet" className="input input-bordered w-full" />
                <input type="email" placeholder="Email" className="input input-bordered w-full" />
                <input type="tel" placeholder="Téléphone" className="input input-bordered w-full" />
                <input type="text" placeholder="Adresse" className="input input-bordered w-full" />
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(1)} className="btn btn-ghost">Retour</button>
                <button onClick={() => setStep(3)} className="btn btn-primary">Continuer</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card bg-base-100 shadow-md border border-base-200 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CreditCard /> Paiement</h2>
              <div className="alert alert-info mb-4">
                <span>Le paiement en ligne n'est pas disponible. Vous réglerez sur place.</span>
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(2)} className="btn btn-ghost">Retour</button>
                <button 
                  onClick={() => { clearCart(); navigate('/client/mon-compte'); }} 
                  className="btn btn-success gap-2"
                >
                  <CheckCircle2 size={18} /> Confirmer la réservation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Récapitulatif Panier */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 card bg-base-100 shadow-lg border border-base-200 p-6">
            <h3 className="font-bold text-lg mb-4">Votre commande</h3>
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.code} className="flex justify-between items-start gap-3 text-sm border-b border-base-200 pb-3">
                  <div>
                    <p className="font-medium">{item.libelle || item.designation}</p>
                    <p className="text-xs text-base-content/60">Qté: {item.quantite}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatMoney(item.tarifJournalier || item.prixLocation)}</span>
                    <button onClick={() => removeItem(item.code)} className="btn btn-xs btn-ghost text-error">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="divider my-2"></div>
            <div className="flex justify-between font-bold text-xl mb-2">
              <span>Total</span>
              <span className="text-primary">{formatMoney(total)}</span>
            </div>
            <p className="text-xs text-base-content/50 text-right">Hors frais de livraison et caution</p>
          </div>
        </aside>
      </div>
    </div>
  );
}