import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Materiels from "./pages/Materiels";
import Packs from "./pages/Packs";
import Reservations from "./pages/Reservations";
import Retraits from "./pages/Retraits";
import Retours from "./pages/Retours";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="retraits" element={<Retraits />} />
          <Route path="retours" element={<Retours />} />
          <Route path="materiels" element={<Materiels />} />
          <Route path="packs" element={<Packs />} />
          <Route path="categories" element={<Categories />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Route>
    </Routes>
  );
}
