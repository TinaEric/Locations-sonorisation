
import FilterBar from "./FilterBar";
import heroStage from "../../../images/fond2.jpg";
import {
  CalendarCheck,
  Headphones,
  ShieldCheck,
  Zap,
} from "lucide-react";

const BENEFITS = [
  {
    icon: CalendarCheck,
    label: "Disponibilité vérifiée",
  },
  {
    icon: ShieldCheck,
    label: "Réservation simplifiée",
  },
  {
    icon: Headphones,
    label: "Matériel adapté à vos besoins",
  },
];

const STEPS = [
  "Choisissez vos dates",
  "Trouvez votre sonorisation",
  "Réservez en toute simplicité",
];

export default function HeroPage() {
  return (
    <section className="relative isolate flex min-h-[85vh] items-center overflow-hidden px-4 pb-12 pt-20 sm:px-6 lg:px-10">
      {/* Image de fond */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroStage})` }}
      />

      {/* Overlay pour améliorer la lisibilité */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/60 via-slate-950/60 to-slate-950/40"
      />

      {/* Contenu principal */}
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Présentation */}
          <div className="flex flex-col items-start text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-100 backdrop-blur-md">
              <Zap className="size-4 text-amber-300" />
              Votre événement mérite le meilleur son
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Faites vibrer vos événements
              <span className="mt-2 block text-accent">
                avec un son exceptionnel.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Mariage, anniversaire, conférence ou concert :
              trouvez la sonorisation qu’il vous faut.
              Choisissez vos dates, explorez nos matériels
              ou découvrez nos packs prêts à l’emploi.
            </p>

            {/* Avantages */}
            <div className="mt-8 flex flex-col gap-3">
              {BENEFITS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 text-sm text-white/90"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-accent">
                    <Icon className="size-4" />
                  </span>

                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Carte de recherche */}
          <div className="w-full">
           <div className="rounded-3xl border border-white/20 bg-transparent p-2 shadow-2xl shadow-black/20 sm:p-7">
              <div className="">
                <p className="text-sm font-semibold uppercase tracking-wider text-accent">
                  Commencez ici
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  Trouvez votre sonorisation
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  Indiquez la période de votre événement
                  pour découvrir les matériels et packs disponibles.
                </p>
              </div>

              <FilterBar />
            </div>

            {/* Étapes de réservation */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {STEPS.map((step, index) => (
                <div
                  key={step}
                  className="flex flex-col items-center gap-2 text-center text-xs text-white/85 sm:text-sm"
                >
                  <span className="grid size-6 place-items-center rounded-full border border-white/30 bg-white/10 font-bold backdrop-blur-sm">
                    {index + 1}
                  </span>

                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
