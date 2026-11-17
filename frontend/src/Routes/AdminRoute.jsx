import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "../layouts/LayoutAdmin";
import NotFound from "../layouts/NotFound";
import Dashboard from "../Admin/Pages/Dashboard";
import Reservations from "../Admin/Pages/Reservations";
import Retraits from "../Admin/Pages/Retraits";
import Retours from "../Admin/Pages/Retours";
import Materiels from "../Admin/Pages/materiel/Materiels";
import Categories from "../Admin/Pages/categorie/Categories";
import Notifications from "../Admin/Pages/Notifications";
import CategorieDetail from "../Admin/Pages/categorie/CategorieDetail";
import MaterielDetail from "../Admin/Pages/materiel/MaterielDetail";
import Packs from "../Admin/Pages/Pack/Packs";
import PackDetail from "../Admin/Pages/Pack/PackDetail";
import ReservationsList from "../Admin/Pages/reservation/ReservationList";
import ReservationDetail from "../Admin/Pages/reservation/ReservationDetail";
import RetraitsList from "../Admin/Pages/retrait/RetraitsList";
import RetraitDetail from "../Admin/Pages/retrait/RetraitDetail";
import RetoursList from "../Admin/Pages/retour/RetoursList";
import RetourDetail from "../Admin/Pages/retour/RetourDetail";
import AdminDashboard from "../Admin/Pages/dashboard/AdminDashboard";
import Calendrier from "../Admin/Pages/dashboard/Calendrier";
import Utilisateurs from "../Admin/Pages/utilisateur/Utilisateurs";
import UtilisateurDetail from "../Admin/Pages/utilisateur/UtilisateurDetail";

const AdminRoute = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="calendrier" element={<Calendrier />} />

        <Route path="categories" element={<Categories />} />
        <Route path="categories/detailCategorie" element={<CategorieDetail />} />

        <Route path="materiels" element={<Materiels />} />
        <Route path="materiels/detailMateriel" element={<MaterielDetail />} />

        <Route path="packs" element={<Packs />} />
        <Route path="packs/detailPack" element={<PackDetail />} />

        <Route path="reservations" element={<ReservationsList />} />
        <Route path="reservations/detailReservation" element={<ReservationDetail />} />

        <Route path="retraits" element={<RetraitsList />} />
        <Route path="retraits/detailRetrait" element={<RetraitDetail />} />
        
        <Route path="retours" element={<RetoursList />} />
        <Route path="retours/detailRetour" element={<RetourDetail />} />

        <Route path="users" element={<Utilisateurs />} />
        <Route path="users/detailUsers" element={<UtilisateurDetail />} />
       
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AdminRoute;
