import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import SectionHeading from "../../components/navigation/SectionHeading.jsx";
import { useEffect, useState } from "react";
import { Heart, PartyPopper, Presentation, Mic } from "lucide-react";
import {
  ChargementModule,
  ErreurModule,
} from "../../components/navigation/ErreurModule.jsx";
import { ImageUrl } from "../../../components/ImageURL.jsx";
import { IMAGES_URL } from "../../../data/Api.js";
import { PackService } from "../../../data/PackService.js";

// Icônes par catégorie de pack (nouvelle enum backend)
const ICONS = {
  conference: Presentation,
  soiree: PartyPopper,
  mariage: Heart,
  concert: Mic,
};

const LABELS_CATEGORIE = {
  conference: "Conférence",
  soiree: "Soirée",
  mariage: "Mariage",
  concert: "Concert",
};

export default function Packs() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const packResp = await PackService.list();
      const data = packResp.filter((pack) => pack.statutPack === "actif");
      if (data) {
        // On ne garde que les 4 premiers
        setPacks(data.slice(0, 4));
      } else {
        setPacks([]);
      }
    } catch (err) {
      setError("Erreur lors du chargement des packs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const reload = () => {
    setError(null);
    fetchData();
  };

  return (
    <section
      aria-labelledby="packs-title"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <SectionHeading
        id="packs-title"
        title="Packs clés en main"
        text="Un pack par catégorie d’événement : le matériel est déjà choisi pour la taille de votre public."
      />

      {loading && <ChargementModule message={"Chargement des packs..."} />}
      {error && <ErreurModule message={error} onRetry={reload} />}

      {!loading && !error && (
        <ul className="mt-10 divide-y divide-base-300 border-y border-base-300">
          {packs.map((pack) => {
            const include = (pack.composants ?? [])
              .map((comp) => `${comp.quantite}x ${comp.materiel?.designation}`)
              .join(", ");

            // Icône selon la nouvelle enum categoriePack
            const Icon = ICONS[pack.categoriePack] || ICONS["autre"] || Mic;

            return (
              <li key={pack.codePack}>
                <Link
                  to={`/reservation?pack=${pack.codePack}`}
                  className="grid items-center gap-4 px-2 py-6 transition-colors hover:bg-base-200 md:grid-cols-12"
                >
                  <div className="flex items-center gap-4 md:col-span-4">
                    {/* <span className="grid size-12 shrink-0 place-items-center rounded-sm bg-neutral text-accent">
                      <Icon className="size-6" aria-hidden="true" />
                    </span> */}
                    <ImageUrl
                      src={`${IMAGES_URL}/${pack.photos}`}
                      alt={pack.libelle}
                    />
                    <div>
                      <h3 className="display text-xl">{pack.libelle}</h3>
                      {pack.categoriePack && (
                        <span className="text-xs font-medium uppercase tracking-wide text-base-content/60">
                          {LABELS_CATEGORIE[pack.categoriePack] ??
                            pack.categoriePack}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-base-content/75 md:col-span-5">
                    {include}
                  </p>
                  <div className="flex items-center justify-between gap-3 md:col-span-3 md:justify-end">
                    <span className="font-medium">{pack.description}</span>
                    <ChevronRight className="size-5" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
