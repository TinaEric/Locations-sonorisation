import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { packsDisponibles } from "../../../data/reservationService";
import PackCard from "../../components/catalogue/PackCard";
import { asList } from "../../../Admin/hooks/useFetch";

export default function PacksDisponibles({ dateDebut, dateFin, categoriePack }) {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    if (!dateDebut || !dateFin) {
      setPacks([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setErreur(null);

    // On n'envoie categoriePack que s'il est défini
    const payload = { dateDebut, dateFin };
    if (categoriePack) payload.categoriePack = categoriePack;

    packsDisponibles(payload)
      .then((r) => alive && setPacks(asList(r)))
      .catch((e) => alive && setErreur(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [dateDebut, dateFin, categoriePack]);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  if (erreur) return <p className="py-8 text-center text-error">{erreur}</p>;
  if (!packs.length)
    return (
      <p className="py-8 text-center text-base-content/60">
        Aucun pack disponible sur cette période.
      </p>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {packs.map((p) => (
        <PackCard
          key={p.codePack}
          pack={p}
          dateDebut={dateDebut}
          dateFin={dateFin}
        />
      ))}
    </div>
  );
}