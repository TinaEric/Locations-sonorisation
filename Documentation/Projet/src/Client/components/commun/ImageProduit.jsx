// Client/components/commun/ImageProduit.jsx
import { useState } from "react";
import { Speaker } from "lucide-react";
import { urlImage } from "../../utils/formatage";

export default function ImageProduit({ nomFichier, alt, className = "" }) {
  const [enErreur, setEnErreur] = useState(false);
  const source = urlImage(nomFichier);

  if (!source || enErreur) {
    return (
      <div className={`flex items-center justify-center bg-base-200 text-base-content/30 ${className}`}>
        <Speaker className="size-1/3 min-w-8" />
      </div>
    );
  }

  return (
    <img src={source} alt={alt} loading="lazy" onError={() => setEnErreur(true)} className={`object-cover ${className}`} />
  );
}
