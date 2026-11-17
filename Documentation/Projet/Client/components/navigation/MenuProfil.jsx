import { Link } from 'react-router-dom';
import { UserCheck, UserRound, LogOut, ChevronDown } from 'lucide-react';

export default function MenuProfil({ user, onLogout }) {
  // Ferme le dropdown DaisyUI en enlevant le focus de l'élément actif
  const fermerMenu = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    // dropdown-end aligne le menu sur le bord droit du bouton
    <div className="dropdown dropdown-end hidden sm:inline-block">
      {/* Bouton déclencheur */}
      <div 
        tabIndex={0} 
        role="button" 
        className="btn btn-ghost btn-sm text-neutral-content flex items-center gap-2"
      >
        <UserCheck className="size-4" />
        <span>{user?.nomComplet}</span>
        <ChevronDown className="size-3 opacity-60" />
      </div>

      {/* Contenu du menu affiché juste en dessous */}
      <div 
        tabIndex={0}
        className="dropdown-content z-40 mt-2 w-40 rounded-md border border-base-300 bg-base-100 p-1 text-base-content shadow-xl animate-fade-in"
      >
        <div className="px-4 py-2.5 border-b border-base-200 text-sm">
          <p className="font-semibold truncate">{user?.nomComplet}</p>
          {user?.email && <p className="text-xs opacity-60 truncate">{user.email}</p>}
        </div>

        <ul className="menu menu-sm p-1">
          <li className='w-full'>
            <Link to="/profil" onClick={fermerMenu} className="py-2">
              <UserRound className="size-4 opacity-70" /> Profil
            </Link>
          </li>
          <div className="divider my-1 before:bg-base-200 after:bg-base-200"></div>
          <li>
            <button 
              onClick={() => { onLogout(); fermerMenu(); }} 
              className="py-2 text-error hover:bg-error/10"
            >
              <LogOut className="size-4" /> Déconnecter
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
