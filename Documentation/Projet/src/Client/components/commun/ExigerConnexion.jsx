// Client/components/commun/ExigerConnexion.jsx
// Protège une page cliente : redirige vers la connexion, puis revient sur la page demandée.
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import Chargement from "./Chargement";

export default function ExigerConnexion({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Chargement message="Vérification de votre session…" />;
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
