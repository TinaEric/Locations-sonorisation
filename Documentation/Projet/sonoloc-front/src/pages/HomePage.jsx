import { Link } from "react-router-dom";
import DateSearchForm from "../components/DateSearchForm";
import { CardSkeleton, ErrorState } from "../components/States";
import { useAsync } from "../hooks/useAsync";
import { packService } from "../data/packService";
import { serviceService, tarificationService } from "../data/serviceService";
import { LIBELLE_CATEGORIE, formatAr } from "../utils/format";

const ETAPES = [
  { titre: "Choisissez", texte: "Indiquez vos dates et sélectionnez un pack." },
  { titre: "Personnalisez", texte: "Ajoutez options, matériel et services." },
  { titre: "Réservez", texte: "Payez l'acompte par Mobile Money, carte ou virement." },
  { titre: "Recevez", texte: "Profitez de votre événement, puis restituez le matériel." },
];

const FAQ = [
  { q: "Comment fonctionne la caution ?", r: "C'est une garantie, distincte du prix. Elle est rendue si le matériel revient complet et en bon état." },
  { q: "Quel acompte dois-je verser ?", r: "Une partie du total, indiquée sur le devis, à la réservation. Le solde est payé plus tard." },
  { q: "Puis-je modifier ou annuler ?", r: "Oui, selon la date limite de modification et la politique d'annulation du pack." },
  { q: "Quels moyens de paiement ?", r: "MVola, Orange Money, Airtel Money, carte et virement." },
  { q: "La livraison et l'installation sont-elles incluses ?", r: "Cela dépend du pack : inclus ou en option, indiqué sur chaque fiche." },
  { q: "Que se passe-t-il en cas de panne ?", r: "Un matériel de remplacement est proposé selon la politique du loueur." },
  { q: "Faut-il une assurance ?", r: "Le locataire est responsable du matériel : vérifiez que vous êtes assuré." },
];

export default function HomePage() {
  const packs = useAsync((s) => packService.getPacksAccueil(s), []);
  const services = useAsync((s) => serviceService.getServices(s), []);
  const majorations = useAsync((s) => tarificationService.getMajorationsActives(s), []);
  const promos = useAsync((s) => tarificationService.getPromotionsActives(s), []);

  const bandeau = majorations.data?.find((m) => m.type_condition === "saison");
  const promo = promos.data?.[0];

  return (
    <>
      {(bandeau || promo) && (
        <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          {bandeau && <span>{bandeau.libelle} : réservez tôt. </span>}
          {promo && <span className="font-semibold">{promo.libelle}</span>}
        </div>
      )}

      {/* 2. Bandeau principal + recherche par dates */}
      <section className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Louez la sono de votre événement en quelques clics
          </h1>
          <p className="mt-4 text-lg text-indigo-100">
            Mariage, soirée, conférence, concert : réservez en ligne, livraison et installation possibles.
          </p>
          <div className="mx-auto mt-8 max-w-2xl text-left">
            <DateSearchForm />
          </div>
        </div>
      </section>

      {/* 3. Assistant */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Pas sûr de votre besoin ? Répondez à 5 questions</h2>
            <p className="mt-1 text-sm text-slate-600">Type d'événement, nombre de personnes, lieu… Sans engagement, 1 minute.</p>
          </div>
          <Link to="/assistant" className="shrink-0 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
            Trouver mon pack
          </Link>
        </div>
      </section>

      {/* 4. Packs par situation */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Nos packs par situation</h2>
        <p className="mt-1 text-slate-600">Choisissez selon votre événement, pas selon la technique.</p>

        <div className="mt-6">
          {packs.loading && <CardSkeleton count={3} />}
          {packs.error && <ErrorState error={packs.error} />}
          {packs.data && (
            <ul className="flex snap-x gap-5 overflow-x-auto pb-4 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-5">
              {packs.data.map((p) => (
                <li key={p.id_pack} className="w-72 shrink-0 snap-start sm:w-auto">
                  <Link to={`/packs/${p.id_pack}`} className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                    <div className="aspect-[4/3] bg-slate-100">
                      {p.photo_principale && <img src={p.photo_principale} alt={p.nom} loading="lazy" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-xs font-semibold uppercase text-indigo-600">{LIBELLE_CATEGORIE[p.categorie] ?? p.categorie}</p>
                      <h3 className="mt-1 font-bold text-slate-900">{p.nom}</h3>
                      <p className="mt-1 text-sm text-slate-600">{p.description_courte}</p>
                      <p className="mt-2 text-sm text-slate-500">{p.capacite_min} à {p.capacite_max} personnes</p>
                      <p className="mt-auto pt-3 font-bold text-slate-900">
                        <span className="text-sm font-normal text-slate-500">à partir de </span>
                        {formatAr(p.prix_a_partir_de)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
          <Link to="/packs" className="text-indigo-600 hover:underline">Voir tous les packs →</Link>
          <Link to="/materiel" className="text-indigo-600 hover:underline">Matériel à la carte →</Link>
        </div>
      </section>

      {/* 5. Comment ça marche */}
      <section id="comment-ca-marche" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Comment ça marche</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPES.map((e, i) => (
            <li key={e.titre} className="rounded-2xl border border-slate-200 bg-white p-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-600 font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 font-bold text-slate-900">{e.titre}</h3>
              <p className="mt-1 text-sm text-slate-600">{e.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 6. Services */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Services</h2>
        <p className="mt-1 text-slate-600">Inclus ou en option selon le pack.</p>
        {services.error && <div className="mt-4"><ErrorState error={services.error} /></div>}
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(services.data ?? []).map((s) => (
            <li key={s.id_service} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-900">{s.libelle}</p>
              {s.description && <p className="mt-1 text-sm text-slate-600">{s.description}</p>}
            </li>
          ))}
        </ul>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="mx-auto mt-20 max-w-3xl scroll-mt-20 px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Questions fréquentes</h2>
        <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-slate-900">
                {f.q}
                <span className="text-slate-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-slate-600">{f.r}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
