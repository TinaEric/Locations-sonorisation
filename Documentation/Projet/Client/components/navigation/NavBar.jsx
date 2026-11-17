import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { BRAND, NAV_LINKS } from "../../../utils/content";
import {
  AudioLines,
  Bell,
  LogOut,
  Menu,
  UserLock,
  UserRound,
  ShoppingCart,
} from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function NavBar() {
  const { logout, role, user, loading, isAuthenticated } = useAuth();
  const { itemCount, setPanierOuvert } = useCart();

  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  // Nombre de notifications non lues (pour le badge dans le menu mobile)
  const unreadCount = (user?.notifications ?? []).filter(
    (n) => n.etatNotification === "non lue",
  ).length;

  const transparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  const closeMenu = () => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  };

  const textBase = transparent
    ? "text-white/90 hover:text-white"
    : "text-slate-700 hover:text-primary";

  const navLinkClass = ({ isActive }) =>
    `border-b-2 text-md font-medium transition-colors whitespace-nowrap ${
      isActive
        ? "border-primary text-primary"
        : `border-transparent ${textBase}`
    }`;

  const iconBtnClass = `relative rounded-lg p-2 transition shrink-0 ${
    transparent
      ? "text-white hover:bg-white/15"
      : "text-slate-700 hover:bg-slate-100"
  }`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        transparent
          ? "border-b border-transparent bg-transparent"
          : "border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md"
      }`}
    >
      <nav className="mx-auto grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-12">
        {/* ────────────────────────────────────────────── */}
        {/* GAUCHE : menu burger (mobile) + logo          */}
        {/* ────────────────────────────────────────────── */}
        <div className="flex min-w-0 items-center justify-start gap-1">
          <div className="dropdown lg:hidden">
            <button
              type="button"
              tabIndex={0}
              className={`btn btn-ghost btn-square ${
                transparent ? "text-white" : "text-slate-700"
              }`}
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

              {loading ? (
                <li className="flex items-center gap-2 text-sm">
                  <span className="loading loading-spinner loading-xs" />
                  <span>Vérification...</span>
                </li>
              ) : isAuthenticated ? (
                role === "LOCATAIRE" ? (
                  <>
                    <div className="border-t border-slate-300 px-4 py-2.5">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {user?.nomComplet}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user?.email}
                      </p>
                    </div>

                    <li>
                      <Link
                        to="/profil"
                        role="menuitem"
                        onClick={closeMenu}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <UserRound className="size-4" />
                        Mon profil
                      </Link>
                    </li>

                    {/* 🔔 Notifications (raccourci mobile) */}
                    <li>
                      <Link
                        to="/notifications"
                        role="menuitem"
                        onClick={closeMenu}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <Bell className="size-4" />
                        Notifications
                        {unreadCount > 0 && (
                          <span className="ml-auto badge badge-sm bg-primary text-white border-0">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                    </li>

                    <li>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <LogOut className="size-4" />
                        Se déconnecter
                      </button>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link to="/admin/">
                      <UserLock className="size-4" aria-hidden="true" />
                      Administration
                    </Link>
                  </li>
                )
              ) : (
                <li>
                  <Link to="/auth/login">Se connecter</Link>
                </li>
              )}
            </ul>
          </div>

          <Link
            to="/"
            className={`flex min-w-0 items-center gap-2 text-lg font-extrabold transition-colors ${
              transparent ? "text-white" : "text-slate-900"
            }`}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-white">
              <AudioLines className="size-5" aria-hidden="true" />
            </span>
            <span className="truncate">{BRAND.name}</span>
          </Link>
        </div>

        {/* ────────────────────────────────────────────── */}
        {/* CENTRE : liens desktop                         */}
        {/* ────────────────────────────────────────────── */}
        <div className="hidden min-w-0 items-center justify-center gap-6 md:flex">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* ────────────────────────────────────────────── */}
        {/* DROITE : actions (panier, notifs, user)        */}
        {/* ────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {/* 🔔 Notifications mobile — visible uniquement si locataire connecté */}
          {isAuthenticated && role === "LOCATAIRE" && (
            <div className="md:hidden">
              <NotificationBell transparent={transparent} />
            </div>
          )}

          {/* Panier mobile */}
          <button
            onClick={() => setPanierOuvert(true)}
            className={`${iconBtnClass} md:hidden`}
            aria-label={`Panier (${itemCount} article${
              itemCount > 1 ? "s" : ""
            })`}
          >
            <ShoppingCart className="size-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>

          {/* Actions desktop */}
          <div className="hidden items-center gap-3 md:flex">
            <div
              className={`h-5 w-px shrink-0 ${
                transparent ? "bg-white/30" : "bg-gray-400"
              }`}
            />

            {/* 🔔 Notifications desktop */}
            {isAuthenticated && role === "LOCATAIRE" && (
              <NotificationBell transparent={transparent} />
            )}

            {/* Panier desktop */}
            <button
              onClick={() => setPanierOuvert(true)}
              className={iconBtnClass}
              aria-label={`Panier (${itemCount} article${
                itemCount > 1 ? "s" : ""
              })`}
            >
              <ShoppingCart className="size-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Zone utilisateur */}
            {loading ? (
              <div
                className={`h-9 w-24 shrink-0 animate-pulse rounded-lg ${
                  transparent ? "bg-white/25" : "bg-slate-200"
                }`}
              />
            ) : isAuthenticated ? (
              role === "LOCATAIRE" ? (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      transparent
                        ? "text-white hover:bg-white/15"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                      {user?.nomComplet?.charAt(0)?.toUpperCase() ?? "U"}
                    </span>
                    <span className="max-w-[120px] truncate">
                      {user?.nomComplet ?? "Mon compte"}
                    </span>
                    <span
                      className={`shrink-0 text-xs ${
                        transparent ? "text-white/70" : "text-slate-400"
                      }`}
                    >
                      ▾
                    </span>
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                        aria-hidden="true"
                      />
                      <div
                        role="menu"
                        className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                      >
                        <div className="border-b border-slate-300 px-4 py-2.5">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {user?.nomComplet}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {user?.email}
                          </p>
                        </div>
                        <Link
                          to="/profil"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <UserRound className="size-4" />
                          Mon profil
                        </Link>

                        {/* 🔔 Lien notifications (desktop) */}
                        <Link
                          to="/notifications"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <Bell className="size-4" />
                          Notifications
                          {unreadCount > 0 && (
                            <span className="ml-auto badge badge-sm bg-primary text-white border-0">
                              {unreadCount}
                            </span>
                          )}
                        </Link>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <LogOut className="size-4" />
                          Se déconnecter
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/admin/"
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    transparent
                      ? "text-white hover:bg-white/15"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <UserLock className="size-4" aria-hidden="true" />
                  Administration
                </Link>
              )
            ) : (
              <Link
                to="/auth/login"
                className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  transparent
                    ? "text-white hover:bg-white/15"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <UserRound className="size-4" aria-hidden="true" />
                Se connecter
              </Link>
            )}

            <Link
              to="/reservation"
              className="btn btn-primary btn-sm shrink-0 whitespace-nowrap"
            >
              Réserver
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

// import { useEffect, useState } from "react";
// import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
// import { useAuth } from "../../../contexts/AuthContext";
// import { useCart } from "../../contexts/CartContext";
// import { BRAND, NAV_LINKS } from "../../../utils/content";
// import {
//   AudioLines,
//   LogOut,
//   Menu,
//   UserLock,
//   UserRound,
//   ShoppingCart,
// } from "lucide-react";

// export default function NavBar() {
//   const { logout, role, user, loading, isAuthenticated } = useAuth();
//   const { itemCount, setPanierOuvert } = useCart();

//   const navigate = useNavigate();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [userMenuOpen, setUserMenuOpen] = useState(false);
//   const [scrolled, setScrolled] = useState(false);
//   const { pathname } = useLocation();
//   const isHome = pathname === "/";

//   const transparent = isHome && !scrolled;

//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 24);
//     onScroll();
//     window.addEventListener("scroll", onScroll, { passive: true });
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   const handleLogout = async () => {
//     await logout();
//     setUserMenuOpen(false);
//     setMobileOpen(false);
//     navigate("/");
//   };

//   const closeMenu = () => {
//     if (document.activeElement instanceof HTMLElement)
//       document.activeElement.blur();
//   };

//   const textBase = transparent
//     ? "text-white/90 hover:text-white"
//     : "text-slate-700 hover:text-primary";

//   const navLinkClass = ({ isActive }) =>
//     `border-b-2 text-md font-medium transition-colors whitespace-nowrap ${
//       isActive
//         ? "border-primary text-primary"
//         : `border-transparent ${textBase}`
//     }`;

//   const iconBtnClass = `relative rounded-lg p-2 transition shrink-0 ${
//     transparent
//       ? "text-white hover:bg-white/15"
//       : "text-slate-700 hover:bg-slate-100"
//   }`;

//   return (
//     <header
//       className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
//         transparent
//           ? "border-b border-transparent bg-transparent"
//           : "border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md"
//       }`}
//     >
//       <nav className="mx-auto grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-12">
//         {/* Logo */}
//         <div className="flex min-w-0 items-center justify-start gap-1">
//           <div className="dropdown lg:hidden">
//             <button
//               type="button"
//               tabIndex={0}
//               className={`btn btn-ghost btn-square ${
//                 transparent ? "text-white" : "text-slate-700"
//               }`}
//               aria-label="Ouvrir le menu"
//             >
//               <Menu className="size-5" aria-hidden="true" />
//             </button>

//             <ul
//               tabIndex={0}
//               onClick={closeMenu}
//               className="menu dropdown-content z-40 mt-3 w-56 rounded-sm border border-base-300 bg-base-100 p-2 text-base-content shadow-lg"
//             >
//               {NAV_LINKS.map(({ to, label, end }) => (
//                 <li key={to}>
//                   <NavLink to={to} end={end}>
//                     {label}
//                   </NavLink>
//                 </li>
//               ))}

//               {loading ? (
//                 <li className="flex items-center gap-2 text-sm">
//                   <span className="loading loading-spinner loading-xs" />
//                   <span>Vérification...</span>
//                 </li>
//               ) : isAuthenticated ? (
//                 role === "LOCATAIRE" ? (
//                   <>
//                     <div className="border-t border-slate-300 px-4 py-2.5">
//                       <p className="truncate text-sm font-semibold text-slate-900">
//                         {user?.nomComplet}
//                       </p>
//                       <p className="truncate text-xs text-slate-500">
//                         {user?.email}
//                       </p>
//                     </div>
//                     <li>
//                       <Link
//                         to="/profil"
//                         role="menuitem"
//                         onClick={closeMenu}
//                         className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
//                       >
//                         <UserRound className="size-4" />
//                         Mon profil
//                       </Link>
//                     </li>
//                     <li>
//                       <button
//                         type="button"
//                         role="menuitem"
//                         onClick={handleLogout}
//                         className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
//                       >
//                         <LogOut className="size-4" />
//                         Se déconnecter
//                       </button>
//                     </li>
//                   </>
//                 ) : (
//                   <li>
//                     <Link to="/admin/">
//                       <UserLock className="size-4" aria-hidden="true" />
//                       Administration
//                     </Link>
//                   </li>
//                 )
//               ) : (
//                 <li>
//                   <Link to="/auth/login">Se connecter</Link>
//                 </li>
//               )}
//             </ul>
//           </div>

//           <Link
//             to="/"
//             className={`flex min-w-0 items-center gap-2 text-lg font-extrabold transition-colors ${
//               transparent ? "text-white" : "text-slate-900"
//             }`}
//           >
//             <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-white">
//               <AudioLines className="size-5" aria-hidden="true" />
//             </span>
//             <span className="truncate">{BRAND.name}</span>
//           </Link>
//         </div>

//         {/* Liens desktop */}
//         <div className="hidden min-w-0 items-center justify-center gap-6 md:flex">
//           {NAV_LINKS.map(({ to, label, end }) => (
//             <NavLink key={to} to={to} end={end} className={navLinkClass}>
//               {label}
//             </NavLink>
//           ))}
//         </div>

//         <div className="flex items-center justify-end gap-2 sm:gap-3">
//           {/* ✅ Panier mobile — md:hidden (plus de chevauchement) */}
//           <button
//             onClick={() => setPanierOuvert(true)}
//             className={`${iconBtnClass} md:hidden`}
//             aria-label={`Panier (${itemCount} article${
//               itemCount > 1 ? "s" : ""
//             })`}
//           >
//             <ShoppingCart className="size-5" />
//             {itemCount > 0 && (
//               <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
//                 {itemCount}
//               </span>
//             )}
//           </button>

//           {/* Actions desktop — md:flex */}
//           <div className="hidden items-center gap-3 md:flex">
//             <div
//               className={`h-5 w-px shrink-0 ${
//                 transparent ? "bg-white/30" : "bg-gray-400"
//               }`}
//             />

//             {/* ✅ Panier desktop — md:flex (cohérent avec le wrapper) */}
//             <button
//               onClick={() => setPanierOuvert(true)}
//               className={iconBtnClass}
//               aria-label={`Panier (${itemCount} article${
//                 itemCount > 1 ? "s" : ""
//               })`}
//             >
//               <ShoppingCart className="size-5" />
//               {itemCount > 0 && (
//                 <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
//                   {itemCount}
//                 </span>
//               )}
//             </button>

//             {loading ? (
//               <div
//                 className={`h-9 w-24 shrink-0 animate-pulse rounded-lg ${
//                   transparent ? "bg-white/25" : "bg-slate-200"
//                 }`}
//               />
//             ) : isAuthenticated ? (
//               role === "LOCATAIRE" ? (
//                 <div className="relative shrink-0">
//                   <button
//                     type="button"
//                     onClick={() => setUserMenuOpen((v) => !v)}
//                     className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
//                       transparent
//                         ? "text-white hover:bg-white/15"
//                         : "text-slate-700 hover:bg-slate-100"
//                     }`}
//                     aria-haspopup="menu"
//                     aria-expanded={userMenuOpen}
//                   >
//                     <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
//                       {user?.nomComplet?.charAt(0)?.toUpperCase() ?? "U"}
//                     </span>
//                     <span className="max-w-[120px] truncate">
//                       {user?.nomComplet ?? "Mon compte"}
//                     </span>
//                     <span
//                       className={`shrink-0 text-xs ${
//                         transparent ? "text-white/70" : "text-slate-400"
//                       }`}
//                     >
//                       ▾
//                     </span>
//                   </button>

//                   {userMenuOpen && (
//                     <>
//                       <div
//                         className="fixed inset-0 z-40"
//                         onClick={() => setUserMenuOpen(false)}
//                         aria-hidden="true"
//                       />
//                       <div
//                         role="menu"
//                         className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
//                       >
//                         <div className="border-b border-slate-300 px-4 py-2.5">
//                           <p className="truncate text-sm font-semibold text-slate-900">
//                             {user?.nomComplet}
//                           </p>
//                           <p className="truncate text-xs text-slate-500">
//                             {user?.email}
//                           </p>
//                         </div>
//                         <Link
//                           to="/profil"
//                           role="menuitem"
//                           onClick={() => setUserMenuOpen(false)}
//                           className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
//                         >
//                           <UserRound className="size-4" />
//                           Mon profil
//                         </Link>
//                         <button
//                           type="button"
//                           role="menuitem"
//                           onClick={handleLogout}
//                           className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
//                         >
//                           <LogOut className="size-4" />
//                           Se déconnecter
//                         </button>
//                       </div>
//                     </>
//                   )}
//                 </div>
//               ) : (
//                 <Link
//                   to="/admin/"
//                   className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
//                     transparent
//                       ? "text-white hover:bg-white/15"
//                       : "text-slate-700 hover:bg-slate-100"
//                   }`}
//                 >
//                   <UserLock className="size-4" aria-hidden="true" />
//                   Administration
//                 </Link>
//               )
//             ) : (
//               <Link
//                 to="/auth/login"
//                 className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
//                   transparent
//                     ? "text-white hover:bg-white/15"
//                     : "text-slate-700 hover:bg-slate-100"
//                 }`}
//               >
//                 <UserRound className="size-4" aria-hidden="true" />
//                 Se connecter
//               </Link>
//             )}

//             <Link
//               to="/reservation"
//               className="btn btn-primary btn-sm shrink-0 whitespace-nowrap"
//             >
//               Réserver
//             </Link>
//           </div>
//         </div>
//       </nav>
//     </header>
//   );
// }
