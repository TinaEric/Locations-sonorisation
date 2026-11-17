import FilterBar from "./FilterBar";
import heroStage from '../../../images/fond2.jpg';

const STEPS = ['Choisissez vos dates', 'Composez votre matériel', 'Confirmez votre réservation'];

export default function HeroPage() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-6 pt-20 pb-24">
      {/* Image de fond */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${heroStage})` }}

      />

      {/* Overlay dégradé pour la lisibilité */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/80 via-slate-950/70 to-slate-950/50"
      />

      {/* Contenu */}
      <div className="relative w-full max-w-4xl flex flex-col items-center text-center lg:gap-6 gap-4 text-white animate-[fadeUp_0.8s_ease-out_both]">
        {/* Badge */}
        <span className="inline-block rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-100 backdrop-blur-md">
          Location de sonorisation
        </span>

        {/* Titre */}
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
        Le son parfait pour vos événements
        </h1>

        {/* Description */}
        <p className="max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
        Louez facilement votre matériel de sonorisation pour vos mariages, conférences, anniversaires et concerts.
        </p>

        {/* FilterBar dans une carte blanche */}
        <div className="mt-2 w-full  rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-md sm:p-5">
          <FilterBar />
        </div>

        <ol className="mt-2 text-white/80 flex flex-wrap gap-x-10 gap-y-3 text-sm">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-3">
              <span className="grid size-6 place-items-center rounded-full bg-accent text-xs font-bold text-accent-content">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

      </div>
    </section>
  );
}