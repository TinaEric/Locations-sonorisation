import { useState } from 'react';
import { CheckCircle2, CreditCard, User, Calendar } from 'lucide-react';

export default function Checkout() {
  const [step, setStep] = useState(1);
  // 1 = Vérification dates & articles
  // 2 = Informations client
  // 3 = Paiement & Confirmation

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Indicateur d'étapes */}
      <ul className="steps steps-horizontal w-full mb-12">
        <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Détails</li>
        <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Coordonnées</li>
        <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Paiement</li>
      </ul>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Formulaire (Étape en cours) */}
        <div className="lg:col-span-2">
          {step === 1 && <StepDetails onNext={() => setStep(2)} />}
          {step === 2 && <StepInfos onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <StepPaiement onBack={() => setStep(2)} />}
        </div>

        {/* Panier Persistant (Sticky) */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 card bg-base-100 shadow-lg border border-base-200 p-6">
            <h3 className="font-bold text-lg mb-4">Votre réservation</h3>
            {/* Liste des items sélectionnés */}
            <div className="space-y-4 mb-6">
              {/* ... */}
            </div>
            <div className="divider"></div>
            <div className="flex justify-between font-bold text-xl">
              <span>Total</span>
              <span className="text-primary">150 000 Ar</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}