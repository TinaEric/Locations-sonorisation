// Routes/ClientRoute.jsx
import { Route, Routes } from "react-router-dom";
import LayoutClient from "../layouts/LayoutClient";
import NotFound from "../layouts/NotFound";
import ExigerConnexion from "../Client/components/commun/ExigerConnexion";
import Accueil from "../Client/pages/Accueil";
import Catalogue from "../Client/pages/Catalogue";
import ConfirmationReservation from "../Client/pages/ConfirmationReservation";
import DetailMateriel from "../Client/pages/DetailMateriel";
import DetailPack from "../Client/pages/DetailPack";
import FormulaireReservation from "../Client/pages/FormulaireReservation";
import PaiementMvola from "../Client/pages/PaiementMvola";
import Panier from "../Client/pages/Panier";
import ProfilClient from "../Client/pages/ProfilClient";

export default function ClientRoute() {
  return (
    <Routes>
      <Route element={<LayoutClient />}>
        {/* Pages publiques */}
        <Route index element={<Accueil />} />
        <Route path="catalogue" element={<Catalogue />} />
        <Route path="materiel/:codeMateriel" element={<DetailMateriel />} />
        <Route path="pack/:codePack" element={<DetailPack />} />
        <Route path="panier" element={<Panier />} />

        {/* Pages réservées aux clients connectés */}
        <Route path="reservation" element={<ExigerConnexion><FormulaireReservation /></ExigerConnexion>} />
        <Route path="paiement/:numReservation" element={<ExigerConnexion><PaiementMvola /></ExigerConnexion>} />
        <Route path="confirmation/:numReservation" element={<ExigerConnexion><ConfirmationReservation /></ExigerConnexion>} />
        <Route path="profil" element={<ExigerConnexion><ProfilClient /></ExigerConnexion>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
