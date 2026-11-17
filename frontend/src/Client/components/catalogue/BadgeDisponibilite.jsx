// Client/components/catalogue/BadgeDisponibilite.jsx
import { AlertTriangle, CheckCircle, HelpCircle, XCircle } from "lucide-react";
import { STATUT_DISPONIBILITE as STATUT } from "../../utils/constantes";

const CONFIGURATION = {
  [STATUT.DISPONIBLE]: { classe: "badge-success", Icone: CheckCircle, libelle: "Disponible" },
  [STATUT.INDISPONIBLE]: { classe: "badge-error", Icone: XCircle, libelle: "Indisponible" },
  [STATUT.INSUFFISANT]: { classe: "badge-warning", Icone: AlertTriangle, libelle: "Stock insuffisant" },
  [STATUT.INCONNUE]: { classe: "badge-ghost", Icone: HelpCircle, libelle: "Choisir des dates" },
};

export default function BadgeDisponibilite({ statut, quantiteDisponible }) {
  const { classe, Icone, libelle } = CONFIGURATION[statut] ?? CONFIGURATION[STATUT.INCONNUE];
  
  const afficherQuantite =
    quantiteDisponible != null &&
    (statut === STATUT.DISPONIBLE || statut === STATUT.INSUFFISANT);

  return (
    <span className={`badge ${classe} badge-soft gap-1 whitespace-nowrap`}>
      <Icone className="size-3.5" />
      {libelle}
      {afficherQuantite && ` (${quantiteDisponible})`}
    </span>
  );
}
