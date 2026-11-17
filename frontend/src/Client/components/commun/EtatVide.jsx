// Client/components/commun/EtatVide.jsx
import { PackageOpen } from "lucide-react";

export default function EtatVide({ Icone = PackageOpen, titre, message, children }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-box border border-dashed border-base-300 px-6 py-14 text-center">
      <Icone className="size-12 text-base-content/30" />
      <h3 className="text-lg font-semibold">{titre}</h3>
      {message && <p className="max-w-md text-sm text-base-content/60">{message}</p>}
      {children}
    </div>
  );
}
