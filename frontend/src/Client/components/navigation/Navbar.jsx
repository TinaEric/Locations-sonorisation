import { Link, NavLink } from 'react-router-dom';
import { AudioLines, Menu, UserCheck, UserLock, UserRound } from 'lucide-react';
import { BRAND, NAV_LINKS } from '../../../utils/content.js';
import { useAuth } from '../../../contexts/AuthContext.jsx';

const desktopLink = ({ isActive }) =>
  `border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'border-accent text-white'
      : 'border-transparent text-neutral-content/75 hover:text-white'
  }`;

const closeMenu = () => {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
};

export default function Navbar() {
  const {logout,role,user, isAuthenticated} = useAuth()

  return (
    <header className="sticky top-0 z-30 bg-neutral text-neutral-content">
      <div className="navbar mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="navbar-start gap-1">
          <div className="dropdown lg:hidden">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-ghost btn-square text-neutral-content"
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <ul
              tabIndex={0}
              onClick={closeMenu}
              className="menu dropdown-content z-40 mt-3 w-56 rounded-sm border border-base-300 bg-base-100 p-2 text-base-content shadow-lg"
            >
              {NAV_LINKS.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end}>
                    {label}
                  </NavLink>
                </li>
              ))}
              <li>
              {isAuthenticated ? (
                  role === "LOCATAIRE" ? (
                    <div onClick={() => logout()}> 
                      <UserCheck className="size-4" aria-hidden="true" />
                       {user.nomComplet}
                    </div>
                  ):(
                    <Link  to="/admin/">
                       <UserLock className="size-4" aria-hidden="true" />
                       Administration
                    </Link>
                  )
              ):(
                <Link to="/auth/login">Se connecter</Link>
              )}
              </li>
            </ul>
          </div>

          <Link to="/" className="flex items-center gap-2" aria-label={`${BRAND.name}, retour à l’accueil`}>
            <span className="grid size-9 place-items-center rounded-sm bg-accent text-accent-content">
              <AudioLines className="size-5" aria-hidden="true" />
            </span>
            <span className="display text-lg text-white">{BRAND.name}</span>
          </Link>
        </div>

        <nav aria-label="Navigation principale" className="navbar-center hidden lg:flex">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={desktopLink}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-end gap-2">
          {isAuthenticated ? (
             role === "LOCATAIRE" ? (
              <Link to="/" className="btn btn-ghost btn-sm hidden text-neutral-content sm:inline-flex">
                <UserCheck className="size-4" aria-hidden="true" />
                {user.nomComplet}
              </Link>
             ):(
              <Link to="/admin/" className="btn btn-ghost btn-sm hidden text-neutral-content sm:inline-flex">
                <UserLock className="size-4" aria-hidden="true" />
                Administration
              </Link>
             )
          ):(
          <Link to="/auth/login" className="btn btn-ghost btn-sm hidden text-neutral-content sm:inline-flex">
            <UserRound className="size-4" aria-hidden="true" />
            Se connecter
          </Link>
          )}
          <Link to="/reservation" className="btn btn-accent btn-sm">
            Réserver
          </Link>
        </div>
      </div>
    </header>
  );
}

