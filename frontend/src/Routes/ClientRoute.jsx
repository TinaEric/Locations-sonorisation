import React from 'react'
import { Route, Routes } from 'react-router-dom';
import Layout from '../layouts/LayoutClient'
import Home from '../Client/Pages/Home'
import Information from '../Client/Pages/Information'
import Connexion from '../Client/Pages/Connexion'
import Aide from '../Client/Pages/Aide';
import Reservation from '../Client/pages/Reservation';
import NotFound from '../layouts/NotFound';
import PayMvola from '../Client/Pages/PayMvola';

const ClientRoute = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="reservation" element={<Reservation />} />
        <Route path="information" element={<Information />} />
        <Route path="aide" element={<Aide />} />
        <Route path="connexion" element={<PayMvola />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default ClientRoute