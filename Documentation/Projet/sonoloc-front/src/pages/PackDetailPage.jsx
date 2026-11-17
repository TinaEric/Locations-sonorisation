import { Link, useNavigate, useParams } from "react-router-dom";
import AvailabilityBadge, { isOrderable } from "../components/AvailabilityBadge";
import { CardSkeleton, ErrorState } from "../components/States";
import { useAsync } from "../hooks/useAsync";
import { useSearch } from "../context/SearchContext";
import { useCart } from "../context/CartContext";
import { packService } from "../data/packService";
import { LIBELLE_CATEGORIE, LIBELLE_LIEU, LIBELLE_UNITE, formatAr } from "../utils/format";

export default function PackDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dateDebut, dateFin, hasDates } = useSearch();
  const { choisirPack } = useCart();
  const { data: p, loading, error } = useAsync((s) => packService.getPackById(id, { dateDebut, dateFin }, s), [id, dateDebut, dateFin]);

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-8"><CardSkeleton count={1} /></div>;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-8"><ErrorState error={error} /></div>;

  const status = hasDates ? p.disponibilite : "inconnue";
  const orderable = isOrderable(status);
  const Section = ({ titre, children }) => (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-slate-900">{titre}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link to="/packs" className="text-sm font-semibold text-indigo-600 hover:underline">← Retour aux packs</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100">
            {p.photo_principale && <img src={p.photo_principale} alt={p.nom} className="h-full w-full object-cover" />}
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-indigo-600">{LIBELLE_CATEGORIE[p.categorie]}</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">{p.nom}</h1>
          <p className="mt-2 text-slate-600">{p.description_longue ?? p.description_courte}</p>

          <Section titre="Capacité et usage">
            <ul className="space-y-1 text-sm text-slate-700">
              <li>{p.capacite_min} à {p.capacite_max} personnes · {LIBELLE_LIEU[p.type_lieu]}</li>
              {p.usages && <li>Usages : {p.usages}</li>}
              {p.limites_usage && <li className="text-amber-700">Limites : {p.limites_usage}</li>}
            </ul>
          </Section>

          <Section titre="Composition">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr><th className="px-4 py-2">Matériel</th><th className="px-4 py-2">Marque / modèle</th><th className="px-4 py-2">Qté</th><th className="px-4 py-2">Puissance</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(p.composition ?? []).map((c) => (
                    <tr key={c.designation}>
                      <td className="px-4 py-2 font-medium text-slate-900">{c.designation}</td>
                      <td className="px-4 py-2 text-slate-600">{[c.marque, c.modele].filter(Boolean).join(" ") || "—"}</td>
                      <td className="px-4 py-2">{c.quantite}</td>
                      <td className="px-4 py-2">{c.puissance_w ? `${c.puissance_w} W` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section titre="Caractéristiques techniques">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {[
                ["Puissance totale", p.puissance_totale_w && `${p.puissance_totale_w} W`],
                ["Entrées", p.entrees_disponibles],
                ["Besoin électrique", p.besoin_electrique],
                ["Poids", p.poids_total_kg && `${p.poids_total_kg} kg`],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-50 p-3"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-900">{v}</dd></div>
              ))}
            </dl>
          </Section>

          <Section titre="Services">
            <ul className="space-y-2 text-sm">
              {(p.services ?? []).map((s) => (
                <li key={s.libelle} className="flex justify-between rounded-lg border border-slate-200 p-3">
                  <span>{s.libelle}</span>
                  <span className="font-medium">{s.inclus ? "Inclus" : formatAr(s.prix)}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section titre="Formules de prix">
            <ul className="space-y-2 text-sm">
              {(p.tarifs ?? []).map((t) => (
                <li key={t.formule} className="flex justify-between rounded-lg border border-slate-200 p-3">
                  <span className="capitalize">{t.formule} · {t.duree_incluse_h} h incluses</span>
                  <span className="font-semibold">{formatAr(t.prix_base)}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section titre="Options compatibles">
            <ul className="space-y-2 text-sm">
              {(p.options ?? []).filter((o) => o.compatible).map((o) => (
                <li key={o.id_materiel} className="flex justify-between rounded-lg border border-slate-200 p-3">
                  <span>{o.designation}</span>
                  <span>{formatAr(o.prix_option)} / {LIBELLE_UNITE[o.unite_tarif]}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section titre="Conditions">
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
              <li>Délai minimum de réservation : {p.delai_min_reservation_h} h</li>
              <li>Modification possible jusqu'à {p.delai_modification_j} jours avant l'événement</li>
              <li>Acompte : {p.acompte_pct} % du total</li>
            </ul>
          </Section>
        </div>

        {/* Encadré fixe */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <AvailabilityBadge status={status} />
            <p className="mt-3 text-sm text-slate-600">
              {hasDates ? `Du ${dateDebut} au ${dateFin}` : "Saisissez vos dates pour le prix exact"}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {formatAr(hasDates && p.prix_pour_dates != null ? p.prix_pour_dates : p.prix_a_partir_de)}
            </p>
            {p.majoration && <p className="text-sm font-medium text-amber-700">{p.majoration.libelle} : {p.majoration.valeur}</p>}

            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Caution : {formatAr(p.caution_montant)}</p>
              <p>Remboursable, hors prix. Demandée {p.caution_moment === "livraison" ? "à la livraison" : p.caution_moment === "veille" ? "avant l'événement" : "à la réservation"}. Rendue sous {p.delai_restitution_caution_j} jours.</p>
            </div>

            <button
              type="button"
              disabled={!orderable}
              onClick={() => { choisirPack(p); navigate("/personnalisation"); }}
              className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Choisir ce pack
            </button>
            {!orderable && p.raison_indisponibilite && <p className="mt-3 text-xs text-slate-600">{p.raison_indisponibilite}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
