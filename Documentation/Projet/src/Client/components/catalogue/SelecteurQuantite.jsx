// Client/components/catalogue/SelecteurQuantite.jsx
import { Minus, Plus } from "lucide-react";

export default function SelecteurQuantite({ valeur, onChange, max, taille = "md" }) {
  const classeTaille = taille === "sm" ? "btn-xs" : "btn-sm";
  const limiteAtteinte = max != null && valeur >= max;

  return (
    <div className="join items-center">
      <button
        type="button"
        className={`btn btn-outline join-item ${classeTaille}`}
        disabled={valeur <= 1}
        onClick={() => onChange(valeur - 1)}
        aria-label="Diminuer la quantité"
      >
        <Minus className="size-3.5" />
      </button>
      <span className={`join-item flex min-w-10 items-center justify-center border border-base-300 px-2 font-semibold ${taille === "sm" ? "h-6 text-xs" : "h-8 text-sm"}`}>
        {valeur}
      </span>
      <button
        type="button"
        className={`btn btn-outline join-item ${classeTaille}`}
        disabled={limiteAtteinte}
        onClick={() => onChange(valeur + 1)}
        aria-label="Augmenter la quantité"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
