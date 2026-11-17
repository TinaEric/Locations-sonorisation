import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { redirectionRouteParRole, useAuth } from "../contexts/AuthContext";

/**
 * Route accessible uniquement aux visiteurs NON connectés.
 * Si l'utilisateur est déjà connecté :
 *  - s'il existe une URL de retour (`?redirect=` ou `state.from`), on l'utilise
 *  - sinon, on redirige vers son espace selon son rôle
 */
export default function ProtectLogin({ children }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <span className="loading loading-spinner text-accent"></span>
      </div>
    );
  }

  if (isAuthenticated) {
    const redirectFromQuery = params.get("redirect");
    const redirectFromState = location.state?.from?.pathname;
    const cible =
      redirectFromQuery ||
      redirectFromState ||
      redirectionRouteParRole(role);

    return <Navigate to={cible} replace />;
  }

  return children;
}

// import { Navigate } from 'react-router-dom';
// import { redirectionRouteParRole, useAuth } from '../contexts/AuthContext';

// export default function ProtectLogin({ children }) {
//   const { isAuthenticated, role, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen w-full">
//         <span className="loading loading-spinner text-accent"></span>
//       </div>
//     );
//   }

//   if (isAuthenticated) {
//     return <Navigate to={redirectionRouteParRole(role)} replace />;
//   }

//   return children;
// }