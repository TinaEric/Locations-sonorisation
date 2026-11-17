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
import { useEffect } from "react";

export default function ClientRoute() {
  useEffect(() => {
    console.log("[ClientRoute] location =", window.location.pathname);
  }, []);

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
        <Route path="paiement" element={<ExigerConnexion><PaiementMvola /></ExigerConnexion>} />
         <Route path="confirmation/:numReservation" element={<ExigerConnexion><ConfirmationReservation /></ExigerConnexion>} />
        <Route path="profil" element={<ExigerConnexion><ProfilClient /></ExigerConnexion>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}



// import React from 'react'
// import { Route, Routes } from 'react-router-dom';
// import LayoutClient from '../layouts/LayoutClient'
// import Home from '../Client/Pages/home/Home'
// import Information from '../Client/Pages/Information'
// import Aide from '../Client/Pages/Aide';
// import NotFound from '../layouts/NotFound';
// import PayMvola from '../Client/Pages/PayMvola';
// import Catalogue from '../Client/Pages/catalogue/Catalogue';
// import PackDetailPublic from '../Client/Pages/catalogue/PackDetailPublic';
// import DemandeReservationPage from '../Client/Pages/catalogue/DemandeReservationPage';
// import ProtectedRoute from './ProtectedRoute';
// import PacksPage from '../Client/Pages/catalogues/PacksPage';
// import PackDetailPage from '../Client/Pages/catalogues/PackDetailPage';
// import MaterielsPage from '../Client/Pages/catalogues/MaterielsPage';
// import MaterielDetailPage from '../Client/Pages/catalogues/MaterielDetailPage';

// const ClientRoute = () => {
//   return (
//     <Routes>
//       <Route element={<LayoutClient />}>
//         <Route index element={<Home />} />
//         <Route path="/reservation" element={<Catalogue />} />
//         <Route path="/packs/:codePack/detail-public" element={<PackDetailPublic />} />

//         <Route path="/packs" element={<PacksPage /> } />
//         <Route path="/packs/:codePack" element={<PackDetailPublic /> } />
//         <Route path="/materiels" element={<MaterielsPage /> } />
//         <Route path="/materiels/:codeMateriel" element={<MaterielDetailPage />} />
//         <Route
//           path="/reservation/demande"
//           element={
//             <ProtectedRoute
//               allowedRoles={["LOCATAIRE", "ADMIN", "GESTIONNAIRE"]}
//             >
//               <DemandeReservationPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route path="information" element={<Information />} />
//         <Route path="aide" element={<Aide />} />
//         <Route path="connexion" element={<PayMvola />} />
//         <Route path="*" element={<NotFound />} />
//       </Route>
//     </Routes>
//   )
// }

// export default ClientRoute
