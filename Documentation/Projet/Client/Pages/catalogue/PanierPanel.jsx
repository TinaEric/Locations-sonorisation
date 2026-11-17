import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Trash2,
  ShieldCheck,
  ShoppingBag,
  LogIn,
  ExternalLink,
} from "lucide-react";
import { useCart } from "../../contexts/CartContext";

import { formatMoney } from "../../../utils/format";
import { ImageUrl } from "../../../components/ImageURL";
import { useAuth } from "../../../contexts/AuthContext";

export default function PanierPanel() {
  const {
    items,
    removeItem,
    panierOuvert,
    setPanierOuvert,
    clearCart,
    total,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ✅ Fermeture avec Échap (accessibilité)
  useEffect(() => {
    if (!panierOuvert) return;
    const onKey = (e) => {
      if (e.key === "Escape") setPanierOuvert(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panierOuvert, setPanierOuvert]);

  // ✅ Blocage du scroll du body quand le panier est ouvert
  useEffect(() => {
    document.body.style.overflow = panierOuvert ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [panierOuvert]);

  const nombreJours = useMemo(() => {
    if (!items.length) return 0;
    const { dateDebut, dateFin } = items[0];
    if (!dateDebut || !dateFin) return 1;
    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  }, [items]);

  const totalPeriode = total * nombreJours;
  const totalCaution = items.reduce(
    (s, i) => s + Number(i.prixCaution || 0),
    0
  );

  const fermer = () => setPanierOuvert(false);

  const passerReservation = () => {
    setPanierOuvert(false);

    if (!isAuthenticated) {
      const cible = "/reservation/demande";
      navigate(`/auth/login?redirect=${encodeURIComponent(cible)}`, {
        state: { from: { pathname: cible } },
      });
      return;
    }

    navigate("/reservation/demande");
  };

  // ✅ Navigation vers le détail
  const voirDetail = (item) => {
    setPanierOuvert(false);
    if (item.type === "PACK") {
      navigate(`/packs/${item.code}/detail-public`);
    } else {
      navigate(
        `/reservation?onglet=materiels&q=${encodeURIComponent(item.code)}`
      );
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 ${
        panierOuvert ? "" : "pointer-events-none"
      }`}
      aria-hidden={!panierOuvert}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          panierOuvert ? "opacity-100" : "opacity-0"
        }`}
        onClick={fermer}
      />

      {/* Panneau */}
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-base-100 shadow-xl transition-transform ${
          panierOuvert ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Panier"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-base-300 p-4">
          <h2 className="inline-flex items-center gap-2 text-lg font-bold">
            <ShoppingBag size={18} /> Mon panier
            {items.length > 0 && (
              <span className="badge badge-accent badge-sm">
                {items.length}
              </span>
            )}
          </h2>
          <button
            className="btn btn-ghost btn-sm btn-square"
            onClick={fermer}
            aria-label="Fermer le panier"
          >
            <X size={18} />
          </button>
        </header>

        {/* Corps */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!items.length && (
            <p className="py-12 text-center text-base-content/60">
              Votre panier est vide.
            </p>
          )}

          {items.length > 0 && (
            <div className="rounded-box bg-info/10 p-3 text-xs text-info">
              {items[0]?.type === "PACK"
                ? "Votre panier contient un pack. Vous ne pouvez pas ajouter de matériels séparément."
                : "Votre panier contient des matériels. Vous ne pouvez pas ajouter de pack."}
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.code}
              className="flex gap-3 rounded-box border border-base-300 p-3 transition hover:border-base-content/20"
            >
              {/* ✅ Image cliquable */}
              <button
                type="button"
                onClick={() => voirDetail(item)}
                className="shrink-0 overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`Voir le détail de ${item.designation}`}
              >
                <ImageUrl
                  src={item.photos || item.imageUrl}
                  alt={item.designation}
                  className="h-16 w-16 rounded-lg"
                />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {/* ✅ Titre cliquable */}
                    <button
                      type="button"
                      onClick={() => voirDetail(item)}
                      className="block max-w-full truncate text-left font-medium hover:text-primary hover:underline"
                    >
                      {item.designation}
                    </button>
                    <p className="text-xs text-base-content/60">
                      {item.type === "PACK" ? "Pack" : "Matériel"}
                      {item.marque ? ` · ${item.marque}` : ""}
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost btn-xs btn-square shrink-0 text-error"
                    onClick={() => removeItem(item.code)}
                    aria-label="Retirer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary">
                    {formatMoney(
                      item.tarifJournalier || item.prixLocation || 0
                    )}{" "}
                    Ar / jour
                  </p>
                  {/* ✅ Bouton "Voir" explicite */}
                  <button
                    type="button"
                    onClick={() => voirDetail(item)}
                    className="btn btn-ghost btn-xs inline-flex items-center gap-1 text-primary"
                  >
                    <ExternalLink size={12} />
                    Voir
                  </button>
                </div>

                {item.personnalisation?.length > 0 && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-base-content/60 hover:text-base-content">
                      Personnalisé ({item.personnalisation.length} ajustement
                      {item.personnalisation.length > 1 ? "s" : ""})
                    </summary>
                    <ul className="mt-1 space-y-0.5 pl-3 text-xs text-base-content/60">
                      {item.personnalisation.map((p) => (
                        <li
                          key={p.idComposant}
                          className="flex justify-between gap-2"
                        >
                          <span className="truncate">
                            {p.designation || `Composant #${p.idComposant}`}
                          </span>
                          <span className="whitespace-nowrap">
                            ×{p.quantite}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <footer className="space-y-2 border-t border-base-300 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-base-content/70">
                Durée ({nombreJours} jour{nombreJours > 1 ? "s" : ""})
              </span>
              <span>{formatMoney(totalPeriode)} Ar</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="inline-flex items-center gap-1 text-base-content/70">
                <ShieldCheck size={14} /> Caution
              </span>
              <span>{formatMoney(totalCaution)} Ar</span>
            </div>
            <div className="divider my-1" />
            <div className="flex justify-between text-base font-bold">
              <span>Total estimé</span>
              <span className="text-primary">
                {formatMoney(totalPeriode + totalCaution)} Ar
              </span>
            </div>
            <button
              className="btn btn-accent w-full"
              onClick={passerReservation}
            >
              Passer la réservation
            </button>
            <button
              className="btn btn-ghost btn-sm w-full"
              onClick={clearCart}
            >
              Vider le panier
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}