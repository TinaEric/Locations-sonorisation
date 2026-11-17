// Client/components/commun/EtapesReservation.jsx
const ETAPES = ["Panier", "Réservation", "Paiement", "Confirmation"];

// etapeActive : 1 à 4
export default function EtapesReservation({ etapeActive }) {
  return (
    <ul className="steps w-full text-xs sm:text-sm">
      {ETAPES.map((libelle, index) => (
        <li key={libelle} className={`step ${index + 1 <= etapeActive ? "step-primary" : ""}`}>
          {libelle}
        </li>
      ))}
    </ul>
  );
}
