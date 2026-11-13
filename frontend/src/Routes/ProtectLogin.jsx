import { Navigate } from 'react-router-dom';
import { redirectionRouteParRole, useAuth } from '../contexts/AuthContext';

/*
 * Route accessible uniquement aux visiteurs NON connectés.
 * Si l'utilisateur est déjà connecté, il est redirigé vers son espace.
 */
export default function ProtectLogin({ children }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <span className="loading loading-spinner text-accent"></span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectionRouteParRole(role)} replace />;
  }

  return children;
}