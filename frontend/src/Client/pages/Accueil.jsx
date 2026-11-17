import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CalendarCheck, CreditCard, Search, ShoppingCart } from "lucide-react";
import BarreRecherche from "../components/catalogue/BarreRecherche";
import CartePack from "../components/catalogue/CartePack";
import ModalCalendrier from "../components/calendrier/ModalCalendrier";
import Chargement from "../components/commun/Chargement";
import MessageErreur from "../components/commun/MessageErreur";
import { usePanier } from "../contexts/PanierContext";
import useCatalogue from "../hooks/useCatalogue";
import useDisponibilites from "../hooks/useDisponibilites";
import { CalendrierService } from "../../data/CalendrierService";
import { useState } from "react";
import heroStage from "../../images/fond2.jpg";
import { useFilter } from "../contexts/FilterContext";

const ETAPES = [
  { Icone: Search, titre: "Découvrez", texte: "Parcourez matériels et packs, ou cherchez par nom, marque ou code." },
  { Icone: CalendarCheck, titre: "Choisissez vos dates", texte: "La disponibilité s'affiche en temps réel pour votre période." },
  { Icone: ShoppingCart, titre: "Composez votre panier", texte: "Ajoutez matériels ou pack, le total est calculé pour vous." },
  { Icone: CreditCard, titre: "Payez l'acompte", texte: "Réglez par Mvola et recevez la confirmation de votre réservation." },
];

export default function Accueil() {
  const navigate = useNavigate();
  const { periode , definirPeriode} = useFilter();
  
  const { packs, categories, chargement, erreur } = useCatalogue();
  const disponibilites = useDisponibilites(periode);
  const [calendrierCible, setCalendrierCible] = useState(null);

  const packsAlaUne = packs.slice(0, 3);
  const categoriesPrincipales = categories.filter((c) => c.niveau === 2).slice(0, 6);

  const lancerRecherche = ({ terme, dateDebut, dateFin }) => {
    definirPeriode({ dateDebut, dateFin });
    navigate(terme ? `/catalogue?q=${encodeURIComponent(terme)}` : "/catalogue");
  };

  const ouvrirCalendrierPack = (pack) =>
    setCalendrierCible({
      code: pack.codePack,
      titre: pack.libelle,
      chargerMois: CalendrierService.fabriquerChargeur("pack", pack.codePack),
    });

  return (
    <div className="space-y-12">
      <section className="relative isolate rounded-box px-6 py-12 text-primary-content sm:px-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroStage})` }}
        />
         <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/60 via-slate-950/60 to-slate-950/40"
          />
        <h1 className="max-w-2xl text-3xl font-extrabold sm:text-4xl">
          Louez le matériel de sonorisation de votre événement, en ligne.
        </h1>
        <p className="mt-3 max-w-xl text-primary-content/80">
          Enceintes, micros, consoles et packs clés en main pour mariages, concerts et conférences.
          Vérifiez la disponibilité, réservez et payez l'acompte en quelques minutes.
        </p>
        <BarreRecherche
          className="mt-8 text-base-content"
          periodeInitiale={periode}
          onRechercher={lancerRecherche}
        />
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold">Comment ça marche</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPES.map(({ Icone, titre, texte }, index) => (
            <li key={titre} className="card card-border bg-base-100">
              <div className="card-body gap-2 p-5">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icone className="size-5" />
                </span>
                <h3 className="font-semibold">{index + 1}. {titre}</h3>
                <p className="text-sm text-base-content/60">{texte}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Packs à la une</h2>
          <Link to="/catalogue?onglet=packs" className="btn btn-ghost btn-sm">
            Tous les packs <ArrowRight className="size-4" />
          </Link>
        </div>
        {chargement && <Chargement />}
        <MessageErreur message={erreur} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packsAlaUne.map((pack) => (
            <CartePack
              key={pack.codePack}
              pack={pack}
              disponibilite={disponibilites.obtenir("pack", pack.codePack)}
              onVoirCalendrier={ouvrirCalendrierPack}
            />
          ))}
        </div>
      </section>

      {categoriesPrincipales.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-bold">Parcourir par catégorie</h2>
          <div className="flex flex-wrap gap-3">
            {categoriesPrincipales.map((categorie) => (
              <Link
                key={categorie.idCategorie}
                to={`/catalogue?cat=${categorie.idCategorie}`}
                className="btn btn-outline"
              >
                {categorie.libelle}
              </Link>
            ))}
          </div>
        </section>
      )}

      <ModalCalendrier cible={calendrierCible} periode={periode} onFermer={() => setCalendrierCible(null)} />
    </div>
  );
}
