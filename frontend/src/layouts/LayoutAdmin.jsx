import { Link, NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  Calendar,
  ExternalLink,
  LogOut,
  Menu,
  Speaker,
} from "lucide-react";
import { NAV_LINKS_BACKS } from "../utils/content";
import Modal from "../Admin/components/Modal";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { marqueLue } from "../data/UserService";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const closeDrawer = () => {
  const el = document.getElementById("nav-drawer");
  if (el) el.checked = false;
};

const isUnread = (n) => n.etatNotification === "non lue";

const TYPE_BADGE = {
  Info: "badge-info",
  info: "badge-info",
  warning: "badge-warning",
  Warning: "badge-warning",
  Erreur: "badge-error",
  error: "badge-error",
  Succès: "badge-success",
  success: "badge-success",
};

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
};

// ─────────────────────────────────────────────
// SideMenu (inchangé sauf votre code existant)
// ─────────────────────────────────────────────
function SideMenu() {
  const { user, logout } = useAuth();
  const [toDelete, setToDelete] = useState(false);

  return (
    <>
      <aside className="flex h-full w-64 flex-col bg-base-100 border-r border-base-300">
        <div className="flex items-center gap-2 px-5 py-3 text-accent">
          <Speaker size={26} />
          <span className="text-lg font-bold">Back Office</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          {NAV_LINKS_BACKS.map((group, i) => (
            <ul key={i} className="menu w-full gap-1 p-0 mb-2">
              {group.title && <li className="menu-title">{group.title}</li>}
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      isActive ? "menu-active" : ""
                    }
                    onClick={closeDrawer}
                  >
                    <Icon size={18} />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          ))}
        </div>
        <div className="border-t border-base-300 p-4">
          <p className="truncate text-sm font-medium">
            {user?.nomComplet || "Loueur"}
          </p>
          <p className="truncate text-xs text-base-content/60 mb-3">
            {user?.email}
          </p>
          <button
            className="btn btn-outline btn-sm btn-block"
            onClick={() => setToDelete(true)}
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>
      <Modal
        open={!!toDelete}
        title="Déconnexion ?"
        onClose={() => setToDelete(false)}
        actions={
          <>
            <button className="btn" onClick={() => setToDelete(false)}>
              Annuler
            </button>
            <button
              className="btn btn-error"
              onClick={() => {
                logout();
                setToDelete(false);
              }}
            >
              Déconnecter
            </button>
          </>
        }
      >
        <p>Souhaitez-vous vraiment vous déconnecter ?</p>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────
//  Date du jour
// ─────────────────────────────────────────────
function TodayDate() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const formatted = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg  text-sm">
      <Calendar size={16} className="text-base-content/60" />
      <span className="text-base-content/80 capitalize">{formatted}</span>
    </div>
  );
}

function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  // Sync avec l'utilisateur connecté
  useEffect(() => {
    setNotifications(user?.notifications ?? []);
  }, [user]);

  const sorted = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.dateCreation) - new Date(a.dateCreation),
      ),
    [notifications],
  );

  const unreadCount = sorted.filter(isUnread).length;

  // Ferme au clic extérieur
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, etatNotification: "lue" })),
    );
    const data = notifications.map((n) => {
      return {
        idNotification: n.idNotification,
        idUser: user.idUser
      }
    })
    const reps = await marqueLue(data)
    console.log("Notif: ", reps)
  };

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.idNotification === id ? { ...n, etatNotification: "lue" } : n,
      ),
    );
    const data = [{
      idNotification: id,
      idUser: user.idUser
    }]
    const reps = await marqueLue(data)
    console.log("Notif: ", reps)
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        className="btn btn-ghost btn-circle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <div className="indicator">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="badge badge-xs badge-error indicator-item">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto rounded-box bg-base-100 shadow-lg border border-base-300 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
            <span className="font-semibold text-sm">
              Notifications{" "}
              {unreadCount > 0 && (
                <span className="badge badge-sm badge-error ml-1">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                className="text-xs link link-primary"
                onClick={markAllAsRead}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {sorted.length === 0 ? (
            <p className="p-4 text-sm text-base-content/60 text-center">
              Aucune notification
            </p>
          ) : (
            <ul className="divide-y divide-base-300">
              {sorted.map((n) => (
                <li
                  key={n.idNotification}
                  onClick={() => isUnread(n) && markAsRead(n.idNotification)}
                  className={`px-4 py-3 text-sm cursor-pointer hover:bg-base-200/60 ${
                    isUnread(n) ? "bg-base-200/40" : "opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`badge badge-sm ${
                        TYPE_BADGE[n.typeNotification] ?? "badge-ghost"
                      }`}
                    >
                      {n.typeNotification}
                    </span>
                    <div className="flex-1">
                      <p>{n.message}</p>
                      <p className="text-xs text-base-content/50 mt-1">
                        {timeAgo(n.dateCreation)}
                      </p>
                    </div>
                    {isUnread(n) && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function Layout() {

  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200">
      <input id="nav-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex  flex-col">
        <header className="navbar bg-base-100 border-b border-base-300 gap-2 px-4">
          {/* Gauche : menu + titre */}
          <div className="flex-1 flex items-center gap-2">
            <label
              htmlFor="nav-drawer"
              className="btn btn-ghost btn-square lg:hidden"
              aria-label="Menu"
            >
              <Menu size={20} />
            </label>
            <span className="font-bold">Back Office Loueur</span>
          </div>

          {/* Droite : date + notifications */}
          <div className="flex items-center gap-2">
            <TodayDate />
            <NotificationBell />
            <Link
                  to="/"
                  title="Retour au site public"
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-200 text-sm"
                >
                  <ExternalLink size={16} className="text-base-content/60" />
                  <span className="text-base-content/80 capitalize">Public</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 lg:py-2 p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      <div className="drawer-side z-40">
        <label
          htmlFor="nav-drawer"
          className="drawer-overlay"
          aria-label="Fermer le menu"
        />
        <SideMenu />
      </div>
    </div>
  );
}


// import { NavLink, Outlet } from "react-router-dom";
// import {
//   Bell,
//   Boxes,
//   CalendarCheck,
//   LayoutDashboard,
//   LogOut,
//   Menu,
//   PackageCheck,
//   PackageOpen,
//   Package,
//   Speaker,
//   Tags,
// } from "lucide-react";
// import { useAuth } from "../contexts/AuthContext";
// import { NAV_LINKS_BACKS } from "../utils/content";
// import Modal from "../Admin/components/Modal";
// import { useState } from "react";

// const closeDrawer = () => {
//   const el = document.getElementById("nav-drawer");
//   if (el) el.checked = false;
// };

// function SideMenu() {
//   const { user, logout } = useAuth();
//   const [toDelete, setToDelete] = useState(false);
  
//   return (
//     <>
//       <aside className="flex h-full w-64 flex-col bg-base-100 border-r border-base-300">
//         <div className="flex items-center gap-2 px-5 py-5 text-accent">
//           <Speaker size={26} />
//           <span className="text-lg font-bold">Back Office</span>
//         </div>
//         <div className="flex-1 overflow-y-auto px-3">
//           {NAV_LINKS_BACKS.map((group, i) => (
//             <ul key={i} className="menu w-full gap-1 p-0 mb-2">
//               {group.title && <li className="menu-title">{group.title}</li>}
//               {group.items.map(({ to, label, icon: Icon, end }) => (
//                 <li key={to}>
//                   <NavLink
//                     to={to}
//                     end={end}
//                     className={({ isActive }) =>
//                       isActive ? "menu-active" : ""
//                     }
//                     onClick={closeDrawer}
//                   >
//                     <Icon size={18} />
//                     {label}
//                   </NavLink>
//                 </li>
//               ))}
//             </ul>
//           ))}
//         </div>
//         <div className="border-t border-base-300 p-4">
//           <p className="truncate text-sm font-medium">
//             {user?.nomComplet || "Loueur"}
//           </p>
//           <p className="truncate text-xs text-base-content/60 mb-3">
//             {user?.email}
//           </p>
//           <button className="btn btn-outline btn-sm btn-block" onClick={() => setToDelete(true)}>
//             <LogOut size={16} /> Déconnexion
//           </button>
//         </div>
//       </aside>
//       <Modal
//         open={!!toDelete}
//         title="Déconnexion ?"
//         onClose={() => setToDelete(false)}
//         actions={
//           <>
//             <button className="btn" onClick={() => setToDelete(false)}>
//               Annuler
//             </button>
//             <button
//               className="btn btn-error"
//               onClick={() =>{
//                 logout()
//                 setToDelete(null)
//               }}
//             >
//               Déconnecter
//             </button>
//           </>
//         }
//       >
//         <p>
//           Souhaitez-vous vraiment vous déconnecter ?
//         </p>
//       </Modal>
//     </>
//   );
// }

// export default function Layout() {
//   return (
//     <div className="drawer lg:drawer-open min-h-screen bg-base-200">
//       <input id="nav-drawer" type="checkbox" className="drawer-toggle" />
//       <div className="drawer-content flex flex-col">
//         <header className="navbar bg-base-100 border-b border-base-300 ">
//           <label
//             htmlFor="nav-drawer"
//             className="btn btn-ghost btn-square lg:hidden"
//             aria-label="Menu"
//           >
//             <Menu size={20} />
//           </label>
//           <span className="font-bold ">Back Office Loueur</span>
//         </header>
//         <main className="flex-1 lg:py-2 p-4 md:p-8">
//           <Outlet />
//         </main>
//       </div>
//       <div className="drawer-side z-40">
//         <label
//           htmlFor="nav-drawer"
//           className="drawer-overlay"
//           aria-label="Fermer le menu"
//         />
//         <SideMenu />
//       </div>
//     </div>
//   );
// }
