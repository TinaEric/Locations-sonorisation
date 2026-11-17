import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatAr } from "../utils/format";

/** Panier flottant « Ma sélection » avec alerte de cohérence. */
export default function CartBar() {
  const { count, sousTotal, lignes, pack } = useCart();
  if (count === 0) return null;

  const categories = new Set(lignes.map((l) => l.materiel.categorie));
  const sansConsole = !pack && categories.has("enceinte") && !categories.has("console");

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] sm:left-auto sm:right-4 sm:bottom-24 sm:w-80 sm:rounded-xl sm:border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Ma sélection · {count} élément{count > 1 ? "s" : ""}</p>
          <p className="text-sm text-slate-600">Sous-total {formatAr(sousTotal)}</p>
        </div>
        <Link to="/personnalisation" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Continuer
        </Link>
      </div>
      {sansConsole && (
        <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
          Vous avez choisi des enceintes sans console de mixage. Voulez-vous en ajouter une ?
        </p>
      )}
    </div>
  );
}
