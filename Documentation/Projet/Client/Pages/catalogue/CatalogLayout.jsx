import { NavLink, Outlet } from "react-router-dom";
import SearchSummary from "../../components/catalogue/SearchSummary";

const tab = ({ isActive }) =>
  `border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
    isActive ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
  }`;

export default function CatalogLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <SearchSummary />
      <div className="mt-6 flex border-b border-slate-200" role="tablist">
        <NavLink to="/packs" className={tab}>Packs</NavLink>
        <NavLink to="/materiel" className={tab}>Matériel à la carte</NavLink>
      </div>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
