import { Navigate, useLocation } from "react-router-dom";
import { redirectionRouteParRole, useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner text-accent"></span>
          <p>Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(
          location.pathname + location.search
        )}`}
        state={{ from: location }}
        replace
      />
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={redirectionRouteParRole(role)} replace />;
  }

  return children;
}

// import { Navigate, useLocation } from 'react-router-dom';
// import { redirectionRouteParRole, useAuth } from '../contexts/AuthContext';

// export default function ProtectedRoute({ children, allowedRoles = []}) {
//   const { isAuthenticated, role, loading } = useAuth();
//   const location = useLocation();

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen w-full">
//         <div className="flex flex-col items-center gap-4">
//           <span className="loading loading-spinner text-accent"></span>
//           <p>Vérification des accès...</p>
//         </div>
//       </div>
//     );
//   }
//   if (!isAuthenticated) {
//       return <Navigate
//        to="/auth/login"
//         state={{ from: location }} replace />;
//   }

//   if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
//       return <Navigate to={redirectionRouteParRole(role)} replace />;
//   }

//   return children;
// }