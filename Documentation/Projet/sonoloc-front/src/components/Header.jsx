import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext";

const MENU = [
  { to: "/", label: "Accueil", end: true },
  { to: "/packs", label: "Packs" },
  { to: "/materiel", label: "Matériel à la carte" },
  { to: "/assistant", label: "Trouver mon pack" },
  { to: "/#comment-ca-marche", label: "Comment ça marche", hash: true },
  { to: "/#faq", label: "FAQ", hash: true },
  { to: "/contact", label: "Contact" },
];

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:text-slate-900"
  }`;

export default function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">♪</span>
          Sono<span className="text-indigo-600">Loc</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {MENU.map((m) =>
            m.hash ? (
              <a key={m.to} href={m.to} className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                {m.label}
              </a>
            ) : (
              <NavLink key={m.to} to={m.to} end={m.end} className={linkClass}>
                {m.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/panier"
            className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100"
            aria-label={`Mon panier, ${count} élément${count > 1 ? "s" : ""}`}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.4 11h10.2L20 7H6.2" />
              <circle cx="9" cy="19" r="1.4" />
              <circle cx="17" cy="19" r="1.4" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-indigo-600 px-1 text-xs font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
          <Link to="/espace" className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">
            Mon espace
          </Link>
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Ouvrir le menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden" aria-label="Menu mobile">
          <ul className="space-y-1">
            {[...MENU, { to: "/espace", label: "Mon espace" }].map((m) => (
              <li key={m.to}>
                {m.hash ? (
                  <a href={m.to} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50">
                    {m.label}
                  </a>
                ) : (
                  <NavLink to={m.to} end={m.end} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50">
                    {m.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
