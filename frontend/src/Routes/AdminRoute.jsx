import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "../layouts/LayoutAdmin";
import NotFound from "../layouts/NotFound";
import Dashboard from "../Admin/Pages/Dashboard";
import Reservations from "../Admin/Pages/Reservations";
import Retraits from "../Admin/Pages/Retraits";
import Retours from "../Admin/Pages/Retours";
import Materiels from "../Admin/Pages/Materiels";
import Categories from "../Admin/Pages/Categories";
import Notifications from "../Admin/Pages/Notifications";
import CategorieDetail from "../Admin/Pages/CategorieDetail";
import MaterielDetail from "../Admin/Pages/MaterielDetail";
import Packs from "../Admin/Pages/Pack/Packs";
import PackDetail from "../Admin/Pages/Pack/PackDetail";

const AdminRoute = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="retraits" element={<Retraits />} />
        <Route path="retours" element={<Retours />} />
        <Route path="materiels" element={<Materiels />} />
        <Route path="packs" element={<Packs />} />
        <Route path="categories" element={<Categories />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="detailCategorie" element={<CategorieDetail />} />
        <Route path="detailMateriel" element={<MaterielDetail />} />
        <Route path="detailPack" element={<PackDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AdminRoute;
