import { useEffect, useState } from 'react';
import { ImageOff, X } from 'lucide-react';

/** Une réponse de liste peut être un tableau ou { data | items | packs }. */
export const asArray = (resp) => (Array.isArray(resp) ? resp : (resp?.data ?? resp?.items ?? resp?.packs ?? []));

export const formatMoney = (n) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(n) || 0)} Ar`;

export const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

const JOUR = 86400000;

/** Nombre de jours de location, dates incluses : du 1er au 1er = 1 jour. 0 si les dates sont invalides. */
export const nombreJours = (debut, fin) => {
  if (!debut || !fin) return 0;
  const ecart = Math.round((new Date(fin) - new Date(debut)) / JOUR);
  return Number.isFinite(ecart) && ecart >= 0 ? ecart + 1 : 0;
};

/** '2026-11-01' -> '1 novembre 2026' (sans décalage de fuseau). */
export const formatDateFr = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

/** Image avec repli (icône) si l'URL est absente ou ne charge pas. */
export function Vignette({ src, alt, className = 'h-12 w-12' }) {
  const [echec, setEchec] = useState(false);
  if (!src || echec) {
    return (
      <div className={`${className} flex shrink-0 items-center justify-center rounded-sm bg-base-200 text-base-content/30`}>
        <ImageOff className="size-6" aria-hidden="true" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setEchec(true)}
      className={`${className} shrink-0 rounded-sm object-cover`}
    />
  );
}

/** Fenêtre modale (daisyUI) : fermeture par la croix, le fond ou la touche Échap. */
export function Dialog({ titre, onClose, children, large = false }) {
  useEffect(() => {
    const surTouche = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [onClose]);

  return (
    <dialog className="modal modal-open" aria-modal="true" aria-label={titre}>
      <div className={`modal-box rounded-sm ${large ? 'max-w-3xl' : 'max-w-xl'}`}>
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <h2 className="mb-4 pr-8 text-xl font-bold">{titre}</h2>
        {children}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
