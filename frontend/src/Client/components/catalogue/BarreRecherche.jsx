// Client/components/catalogue/BarreRecherche.jsx
// Recherche instantanée sur le texte, dates validées par le bouton.
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import SelecteurPeriode from "../commun/SelecteurPeriode";
import { useFilter } from "../../contexts/FilterContext";

export default function BarreRecherche({
  termeInitial = "",
  periodeInitiale,
  onRechercher,
  className = "",
}) {
  const { recherche, setRecherche } = useFilter();

  const [periode, setPeriode] = useState({
    dateDebut: periodeInitiale?.dateDebut ?? "",
    dateFin: periodeInitiale?.dateFin ?? "",
  });
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    setPeriode({
      dateDebut: periodeInitiale?.dateDebut ?? "",
      dateFin: periodeInitiale?.dateFin ?? "",
    });
  }, [periodeInitiale?.dateDebut, periodeInitiale?.dateFin]);

  const changerRecherche = (e) => {
    setRecherche(e.target.value);
    if (erreur) setErreur("");
  };

  const soumettre = (e) => {
    e.preventDefault();

    if (Boolean(periode.dateDebut) !== Boolean(periode.dateFin)) {
      setErreur("Renseignez la date de début et la date de fin.");
      return;
    }
    if (periode.dateDebut && periode.dateFin < periode.dateDebut) {
      setErreur("La date de fin doit être après la date de début.");
      return;
    }

    setErreur("");
    onRechercher({
      terme: recherche.trim(),
      dateDebut: periode.dateDebut,
      dateFin: periode.dateFin,
    });
  };

  return (
    <form
      onSubmit={soumettre}
      className={`rounded-box bg-base-100 p-4 shadow-lg ${className}`}
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <label className="form-control">
          <span className="mb-1 flex items-center gap-1 text-xs font-medium text-base-content/70">
            <Search className="size-3.5" /> Nom, marque, code ou mot-clé
          </span>
          <input
            type="search"
            className="input input-bordered w-full"
            placeholder="Ex : JBL, micro, CAT20001-MAT0001…"
            value={recherche}
            onChange={changerRecherche}
          />
        </label>
        <SelecteurPeriode
          {...periode}
          onChange={setPeriode}
          className="lg:w-96"
        />
        <button type="submit" className="btn btn-primary">
          <Search className="size-4" /> Rechercher
        </button>
      </div>
      {erreur && <p className="mt-2 text-sm text-error">{erreur}</p>}
    </form>
  );
}