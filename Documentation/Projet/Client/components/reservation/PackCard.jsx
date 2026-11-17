import { Link } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';
import { ImageUrl } from '../../../components/ImageUrl';
import { formatMoney } from '../../../utils/format';
import { useCart } from '../../contexts/CartContext';

export default function PackCard({ item, type, filters }) {
  const { addItem } = useCart();
  const isPack = type === 'packs';
  console.log("ITEM packCard: ", item)
  const code = isPack ? item.codePack : item.CodeMateriel;
  const title = isPack ? item.libelle : item.designation;
  const image = isPack ? item.imageUrl : item.imageURL;
  const price = isPack ? item.tarifJournalier : item.prixLocation;
  const description = isPack ? item.description : item.detailTechnique;

  const handleAddToCart = () => {
    addItem({ ...item, code }, type.toUpperCase());
  };

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow border border-base-200 flex flex-col">
      <figure className="h-48 w-full overflow-hidden bg-base-200">
        <ImageUrl src={image} alt={title} className="h-full w-full object-cover" />
      </figure>
      <div className="card-body p-5 flex flex-col flex-1">
        <h2 className="card-title text-lg font-bold line-clamp-1">{title}</h2>
        <p className="text-sm text-base-content/70 line-clamp-2 mt-1 flex-1">
          {description || "Aucune description disponible."}
        </p>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">{formatMoney(price)} <span className="text-xs font-normal text-base-content/60">/ jour</span></span>
        </div>

        <div className="card-actions mt-4 gap-2">
          <Link 
            to={`/reservation/${isPack ? 'pack' : 'materiel'}/${code}?${new URLSearchParams(filters).toString()}`}
            className="btn btn-outline btn-sm flex-1"
          >
            Détails
          </Link>
          <button onClick={handleAddToCart} className="btn btn-accent btn-sm btn-square" title="Ajouter au panier">
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}


// import { Check, Info, Shield } from 'lucide-react';
// import { Link } from 'react-router-dom';
// import { Photo } from './MaterielCard.jsx';
// import { formatMoney, plural } from '../../../utils/format.js';

// const MAX_COMPOSANTS_AFFICHES = 5;

// export default function PackCard({
//   pack,
//   nbJours = 0,
//   choisi = false,
//   onChoisir,
//   dateDebut = '',
//   dateFin = '',
// }) {
//   const { codePack, libelle, description, imageUrl, quantiteDisponible = 0 } = pack;

//   // le serveur renvoie null (et non undefined) quand le pack n'a pas de types
//   const typesEvenement = pack.typesEvenement ?? [];
//   const composants = pack.composants ?? [];

//   const tarif = Number(pack.tarifJournalier) || 0;
//   const caution = Number(pack.prixCaution) || 0;

//   const sommeMateriels = composants.reduce(
//     (total, c) => total + (Number(c.materiel?.prixLocation) || 0) * (c.quantite ?? 0),
//     0,
//   );
//   const economie = sommeMateriels - tarif;
//   const totalUnites = composants.reduce((total, c) => total + (c.quantite ?? 0), 0);

//   const visibles = composants.slice(0, MAX_COMPOSANTS_AFFICHES);
//   const masques = composants.length - visibles.length;

//   // lien vers le détail, avec les dates conservées
//   const query = new URLSearchParams(Object.entries({ dateDebut, dateFin }).filter(([, v]) => v)).toString();
//   const detailHref = `/packs/${codePack}${query ? `?${query}` : ''}`;

//   return (
//     <article
//       aria-label={`Pack ${libelle}`}
//       className={`flex flex-col overflow-hidden rounded-sm border bg-base-100 transition ${
//         choisi ? 'border-accent ring-1 ring-accent' : 'border-base-300 hover:shadow-md'
//       }`}
//     >
//       <Photo src={imageUrl} alt={libelle} />

//       <div className="flex flex-1 flex-col p-4">
//         <div className="flex items-start justify-between gap-3">
//           <h4 className="font-bold leading-snug">{libelle}</h4>
//           {quantiteDisponible > 0 && (
//             <span className="badge badge-soft badge-success shrink-0">
//               {quantiteDisponible} {plural(quantiteDisponible, 'disponible', 'disponibles')}
//             </span>
//           )}
//         </div>

//         {typesEvenement.length > 0 && (
//           <ul className="mt-2 flex flex-wrap gap-1" aria-label="Types d’événement">
//             {typesEvenement.map((type) => (
//               <li key={type} className="badge badge-soft badge-accent text-xs capitalize">
//                 {type}
//               </li>
//             ))}
//           </ul>
//         )}

//         {description && <p className="mt-2 text-sm text-base-content/75">{description}</p>}

//         {composants.length > 0 && (
//           <>
//             <p className="mt-3 text-xs text-base-content/60">
//               {composants.length} {plural(composants.length, 'matériel inclus', 'matériels inclus')}
//               {totalUnites !== composants.length && ` · ${totalUnites} unités au total`}
//             </p>

//             <ul className="mt-2 space-y-1 text-sm">
//               {visibles.map((c) => (
//                 <li key={c.idComposant} className="flex gap-2">
//                   <span className="shrink-0 font-semibold text-accent">{c.quantite}×</span>
//                   <span className="line-clamp-1">
//                     {c.materiel?.designation ?? 'Matériel inconnu'}
//                     {c.materiel?.marque && <span className="text-base-content/50"> · {c.materiel.marque}</span>}
//                   </span>
//                 </li>
//               ))}
//               {masques > 0 && (
//                 <li className="text-xs italic text-base-content/60">
//                   + {masques} {plural(masques, 'autre matériel', 'autres matériels')}
//                 </li>
//               )}
//             </ul>
//           </>
//         )}

//         <dl className="mt-4 space-y-1 border-t border-base-200 pt-3 text-sm">
//           <div className="flex justify-between gap-4">
//             <dt>Par jour</dt>
//             <dd className="font-semibold">{formatMoney(tarif)}</dd>
//           </div>

//           {nbJours > 0 && (
//             <div className="flex justify-between gap-4">
//               <dt>
//                 Pour {nbJours} {plural(nbJours, 'jour', 'jours')}
//               </dt>
//               <dd className="font-semibold text-accent">{formatMoney(tarif * nbJours)}</dd>
//             </div>
//           )}

//           <div className="flex justify-between gap-4 text-base-content/70">
//             <dt className="flex items-center gap-1">
//               <Shield className="size-3.5" aria-hidden="true" />
//               Caution
//             </dt>
//             <dd>{formatMoney(caution)}</dd>
//           </div>

//           {economie > 0 && (
//             <div className="flex justify-between gap-4 text-success">
//               <dt>Économie / jour</dt>
//               <dd className="font-semibold">{formatMoney(economie)}</dd>
//             </div>
//           )}
//         </dl>

//         <div className="mt-auto flex gap-2 pt-4">
//           <Link to={detailHref} className="btn btn-ghost btn-sm flex-1" aria-label={`Voir le détail du pack ${libelle}`}>
//             <Info className="size-4" aria-hidden="true" />
//             Détail
//           </Link>

//           <button
//             type="button"
//             className={`btn btn-sm flex-1 ${choisi ? 'btn-neutral' : 'btn-accent'}`}
//             onClick={() => onChoisir?.(codePack)}
//             aria-pressed={choisi}
//           >
//             {choisi ? (
//               <>
//                 <Check className="size-4" aria-hidden="true" />
//                 Choisi
//               </>
//             ) : (
//               'Choisir'
//             )}
//           </button>
//         </div>
//       </div>
//     </article>
//   );
// }