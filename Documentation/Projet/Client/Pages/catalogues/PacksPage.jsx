import { useEffect, useMemo, useState } from "react";
import {
  CalendarX,
  Filter,
  Package,
  RotateCcw,
  Search,
} from "lucide-react";

import { useNavbar } from "../../contexts/NavbarContext";
import { useToast } from "../../../contexts/ToastContext";
import { ReservationService } from "../../../data/reservationService";
import DateFiltre from "./DateFiltre";
import PackDetaillee from "../../components/catalogue/PackDetaillee";

const typesEvenement = [
  "Mariage",
  "Conférence",
  "Soirée",
  "Concert",
  "Séminaire",
];

export default function PacksPage() {
  const { dateDebut, dateFin, datesCompletes } = useNavbar();
  const toast = useToast();

  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [recherche, setRecherche] = useState("");
  const [typeEvenement, setTypeEvenement] = useState("");
  const [lieu, setLieu] = useState("");
  const [nombrePersonnes, setNombrePersonnes] = useState("");

  const chargerPacks = async () => {
    setLoading(true);
    try {
      const response = datesCompletes
        ? await ReservationService.packsDisponibles({ dateDebut, dateFin })
        : await ReservationService.tousPack();

        const data = response.filter((pack) => pack.statutPack === "actif");
        setPacks(data ?? []);
    } catch (error) {
      toast.warning(
        error?.response?.data?.message ?? "Impossible de charger les packs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerPacks();
  }, [dateDebut, dateFin]);
  
  

  const packsFiltres = useMemo(() => {
    const rechercheNormalisee = recherche.trim().toLowerCase();

    return packs.filter((pack) => {
      const correspondRecherche =
        !rechercheNormalisee ||
        pack.libelle?.toLowerCase().includes(rechercheNormalisee) ||
        pack.description?.toLowerCase().includes(rechercheNormalisee) ||
        pack.codePack?.toLowerCase().includes(rechercheNormalisee) ||
        pack.composants?.some((c) =>
          c.materiel?.designation?.toLowerCase().includes(rechercheNormalisee)
        );

      const correspondEvenement =
        !typeEvenement || pack.usages?.includes(typeEvenement);

      const correspondLieu = !lieu || pack.typeLieu === lieu;

      const correspondCapacite =
        !nombrePersonnes ||
        (Number(pack.capaciteMin ?? 0) <= Number(nombrePersonnes) &&
          Number(pack.capaciteMax ?? Infinity) >= Number(nombrePersonnes));

      return (
        correspondRecherche &&
        correspondEvenement &&
        correspondLieu &&
        correspondCapacite
      );
    });
  }, [packs, recherche, typeEvenement, lieu, nombrePersonnes]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* ---------------- Filtres ---------------- */}
      <aside className="card h-fit bg-base-100 shadow-sm">
        <div className="card-body gap-4">
          <DateFiltre />

          <div className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 px-5 py-4 shadow-sm sm:px-6">
            <h2 className="card-title flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-accent" />
                Filtres
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setRecherche("");
                  setTypeEvenement("");
                  setLieu("");
                  setNombrePersonnes("");
                }}
              >
                <RotateCcw size={16} />
              </button>
            </h2>

            <label className="form-control">
              <span className="label-text">Recherche</span>
              <label className="input input-bordered flex items-center gap-2">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Mariage, JBL, micro..."
                  className="grow"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </label>
            </label>

            <label className="form-control">
              <span className="label-text">Type d'événement</span>
              <select
                className="select select-bordered"
                value={typeEvenement}
                onChange={(e) => setTypeEvenement(e.target.value)}
              >
                <option value="">Tous</option>
                {typesEvenement.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text">Nombre de personnes</span>
              <input
                type="number"
                min="1"
                placeholder="Exemple : 100"
                className="input input-bordered"
                value={nombrePersonnes}
                onChange={(e) => setNombrePersonnes(e.target.value)}
              />
            </label>
          </div>
        </div>
      </aside>

      {/* ---------------- Liste ---------------- */}
      <section className="space-y-4 py-4">
        <div className="flex items-center justify-between px-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Package size={22} className="text-accent" />
            Packs
          </h1>
          <span className="badge badge-accent">
            {packsFiltres.length} résultat(s)
          </span>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg text-accent" />
          </div>
        )}

        {!loading && packsFiltres.length === 0 && (
          <div className="alert alert-warning">
            <CalendarX size={18} />
            Aucun pack ne correspond à vos critères.
          </div>
        )}

      {!loading && packsFiltres.length > 0 && (
        <div className="scrollbar-auto max-h-[calc(100vh-150px)] overflow-y-auto px-4 pb-4 pr-2">
          <div className="space-y-3">
            {packsFiltres.map((pack) => (
              <PackDetaillee key={pack.codePack} pack={pack} />
            ))}
          </div>
        </div>
      )}

      </section>
    </div>
  );
}
