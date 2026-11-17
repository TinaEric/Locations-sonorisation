// layouts/LayoutClient.jsx
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu, Music, ShoppingCart, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePanier } from "../Client/contexts/PanierContext";
import ScrollEnHaut from "../Client/components/commun/ScrollEnHaut";
import { NOM_PLATEFORME } from "../Client/utils/constantes";

const LIENS = [
  { vers: "/", libelle: "Accueil", exact: true },
  { vers: "/catalogue", libelle: "Catalogue" },
];

export default function LayoutClient() {
  const { isAuthenticated, user, role, logout } = useAuth();
  const { nombreArticles } = usePanier();
  const navigate = useNavigate();

  const seDeconnecter = () => {
    logout();
    navigate("/");
  };

  const estPersonnel = role === "ADMIN" || role === "GESTIONNAIRE";
  const classeLien = ({ isActive }) => (isActive ? "font-semibold text-primary" : "");

  return (
    <div className="flex min-h-screen flex-col bg-base-200/40">
      <ScrollEnHaut />

      <header className="navbar sticky top-0 z-30 bg-base-100 px-4 shadow-sm">
        <div className="navbar-start">
          <div className="dropdown lg:hidden">
            <button type="button" tabIndex={0} className="btn btn-ghost btn-square" aria-label="Menu">
              <Menu className="size-5" />
            </button>
            <ul tabIndex={0} className="menu dropdown-content z-10 mt-3 w-52 rounded-box bg-base-100 p-2 shadow">
              {LIENS.map((lien) => (
                <li key={lien.vers}>
                  <NavLink to={lien.vers} end={lien.exact} className={classeLien}>{lien.libelle}</NavLink>
                </li>
              ))}
            </ul>
          </div>
          <Link to="/" className="flex items-center gap-2 px-2 text-xl font-bold text-primary">
            <Music className="size-6" /> {NOM_PLATEFORME}
          </Link>
        </div>

        <nav className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal gap-1 px-1">
            {LIENS.map((lien) => (
              <li key={lien.vers}>
                <NavLink to={lien.vers} end={lien.exact} className={classeLien}>{lien.libelle}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="navbar-end gap-1">
          <Link to="/panier" className="btn btn-ghost btn-circle" aria-label="Panier">
            <div className="indicator">
              <ShoppingCart className="size-5" />
              {nombreArticles > 0 && <span className="badge badge-primary badge-xs indicator-item">{nombreArticles}</span>}
            </div>
          </Link>

          {isAuthenticated ? (
            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="btn btn-ghost gap-2">
                <User className="size-5" />
                <span className="hidden max-w-32 truncate sm:inline">{user?.prenom ?? user?.nom ?? "Mon compte"}</span>
              </button>
              <ul tabIndex={0} className="menu dropdown-content z-10 mt-3 w-52 rounded-box bg-base-100 p-2 shadow">
                <li><Link to="/profil">Mon profil et mes réservations</Link></li>
                {estPersonnel && <li><Link to="/admin/">Espace administration</Link></li>}
                <li>
                  <button type="button" onClick={seDeconnecter}>
                    <LogOut className="size-4" /> Déconnexion
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <Link to="/auth/login" className="btn btn-primary btn-sm">Connexion</Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="footer footer-center bg-base-100 p-6 text-sm text-base-content/60">
        <p>© {new Date().getFullYear()} {NOM_PLATEFORME} — Location de matériel de sonorisation</p>
      </footer>
    </div>
  );
}
