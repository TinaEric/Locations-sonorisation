// Client/components/calendrier/CalendrierDisponibilite.jsx
// Calendrier mensuel d'un matériel ou d'un pack, rafraîchi périodiquement (temps réel simplifié).
// chargerMois(moisISO "YYYY-MM") doit retourner { quantiteTotale, jours: [{ date, quantiteDisponible }] }.
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { INTERVALLE_TEMPS_REEL_MS } from "../../utils/constantes";
import { dateISO, normaliserCalendrier } from "../../utils/disponibilite";
import { aujourdhuiISO, remplirZero } from "../../utils/formatage";

const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const premierDuMois = (iso) => {
  if (iso) {
    const [annee, mois] = iso.split("-").map(Number);
    return new Date(annee, mois - 1, 1);
  }
  const maintenant = new Date();
  return new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
};

const CLASSES_JOUR = {
  passe: "opacity-30",
  libre: "bg-success/20",
  partiel: "bg-warning/30",
  complet: "bg-error/20 text-error line-through",
};

export default function CalendrierDisponibilite({ chargerMois, identifiant, dateDebut, dateFin }) {
  const [mois, setMois] = useState(() => premierDuMois(dateDebut));
  const [donnees, setDonnees] = useState({ quantiteTotale: null, jours: new Map() });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const chargeurRef = useRef(chargerMois);
  chargeurRef.current = chargerMois;

  const annee = mois.getFullYear();
  const indexMois = mois.getMonth();
  const moisISO = `${annee}-${remplirZero(indexMois + 1)}`;

  const charger = useCallback(
    async (silencieux = false) => {
      if (!silencieux) setChargement(true);
      try {
        setDonnees(normaliserCalendrier(await chargeurRef.current(moisISO)));
        setErreur(null);
      } catch {
        setErreur("Impossible de charger le calendrier.");
      } finally {
        setChargement(false);
      }
    },
    [moisISO],
  );

  useEffect(() => {
    charger();
    const minuteur = setInterval(() => charger(true), INTERVALLE_TEMPS_REEL_MS);
    return () => clearInterval(minuteur);
  }, [charger, identifiant]);

  const aujourdhui = aujourdhuiISO();
  const decalage = (new Date(annee, indexMois, 1).getDay() + 6) % 7; // semaine commençant le lundi
  const nbJoursMois = new Date(annee, indexMois + 1, 0).getDate();
  const titreMois = mois.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const evaluerJour = (date) => {
    if (date < aujourdhui) return { type: "passe" };
    const restant = donnees.jours.has(date) ? donnees.jours.get(date) : donnees.quantiteTotale;
    if (restant === null || restant === undefined) return { type: "libre" };
    if (restant <= 0) return { type: "complet", restant };
    if (donnees.quantiteTotale !== null && restant < donnees.quantiteTotale) return { type: "partiel", restant };
    return { type: "libre", restant };
  };

  const estDansSelection = (date) => dateDebut && dateFin && date >= dateDebut && date <= dateFin;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => setMois(new Date(annee, indexMois - 1, 1))} aria-label="Mois précédent">
          <ChevronLeft className="size-4" />
        </button>
        <h4 className="font-semibold capitalize">{titreMois}</h4>
        <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => setMois(new Date(annee, indexMois + 1, 1))} aria-label="Mois suivant">
          <ChevronRight className="size-4" />
        </button>
      </div>

      {erreur && <p className="mb-2 text-sm text-error">{erreur}</p>}

      <div className={`grid grid-cols-7 gap-1 text-center ${chargement ? "opacity-50" : ""}`}>
        {JOURS_SEMAINE.map((jour) => (
          <span key={jour} className="py-1 text-xs font-medium text-base-content/60">
            {jour}
          </span>
        ))}
        {Array.from({ length: decalage }, (_, i) => (
          <span key={`vide-${i}`} />
        ))}
        {Array.from({ length: nbJoursMois }, (_, i) => {
          const numero = i + 1;
          const date = dateISO(annee, indexMois, numero);
          const etat = evaluerJour(date);
          return (
            <div
              key={date}
              title={etat.restant != null ? `${etat.restant} disponible(s)` : undefined}
              className={`flex aspect-square flex-col items-center justify-center rounded-md text-sm ${CLASSES_JOUR[etat.type]} ${estDansSelection(date) ? "ring-2 ring-primary" : ""} ${date === aujourdhui ? "font-bold underline" : ""}`}
            >
              {numero}
              {etat.type === "partiel" && <span className="text-[10px] leading-none">{etat.restant} dispo</span>}
            </div>
          );
        })}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-content/70">
        <li className="flex items-center gap-1"><span className="size-3 rounded bg-success/30" /> Disponible</li>
        <li className="flex items-center gap-1"><span className="size-3 rounded bg-warning/40" /> Partiellement réservé</li>
        <li className="flex items-center gap-1"><span className="size-3 rounded bg-error/30" /> Complet</li>
        {dateDebut && dateFin && <li className="flex items-center gap-1"><span className="size-3 rounded ring-2 ring-primary" /> Votre période</li>}
      </ul>
    </div>
  );
}
