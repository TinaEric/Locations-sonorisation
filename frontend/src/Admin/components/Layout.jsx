import { NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  Boxes,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  PackageOpen,
  Package,
  Speaker,
  Tags,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  {
    items: [{ to: "/", label: "Tableau de bord", icon: LayoutDashboard, end: true }],
  },
  {
    title: "Opérations",
    items: [
      { to: "/reservations", label: "Réservations", icon: CalendarCheck },
      { to: "/retraits", label: "Retraits", icon: PackageOpen },
      { to: "/retours", label: "Retours", icon: PackageCheck },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { to: "/materiels", label: "Matériel", icon: Boxes },
      { to: "/packs", label: "Packs", icon: Package },
      { to: "/categories", label: "Catégories", icon: Tags },
    ],
  },
  {
    title: "Compte",
    items: [{ to: "/notifications", label: "Notifications", icon: Bell }],
  },
];

const closeDrawer = () => {
  const el = document.getElementById("nav-drawer");
  if (el) el.checked = false;
};

function SideMenu() {
  const { user, logout } = useAuth();
  return (
    <aside className="flex h-full w-64 flex-col bg-base-100 border-r border-base-300">
      <div className="flex items-center gap-2 px-5 py-5 text-primary">
        <Speaker size={26} />
        <span className="text-lg font-bold">Back Office</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        {NAV.map((group, i) => (
          <ul key={i} className="menu w-full gap-1 p-0 mb-2">
            {group.title && <li className="menu-title">{group.title}</li>}
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => (isActive ? "menu-active" : "")}
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
        <p className="truncate text-sm font-medium">{user?.nomComplet || "Loueur"}</p>
        <p className="truncate text-xs text-base-content/60 mb-3">{user?.email}</p>
        <button className="btn btn-outline btn-sm btn-block" onClick={logout}>
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}

export default function Layout() {
  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200">
      <input id="nav-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <header className="navbar bg-base-100 border-b border-base-300 lg:hidden">
          <label htmlFor="nav-drawer" className="btn btn-ghost btn-square" aria-label="Menu">
            <Menu size={20} />
          </label>
          <span className="font-bold text-primary">Back Office Loueur</span>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      <div className="drawer-side z-40">
        <label htmlFor="nav-drawer" className="drawer-overlay" aria-label="Fermer le menu" />
        <SideMenu />
      </div>
    </div>
  );
}
