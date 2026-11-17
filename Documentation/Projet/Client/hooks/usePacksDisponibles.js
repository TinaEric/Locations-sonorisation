import { useEffect, useState } from 'react';
import { PackService } from '../../data/PackService';

export function usePacksDisponibles({ dateDebut, dateFin, typeEvent } = {}) {
  const [listePacks, setListePacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let annule = false;

    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        if (dateDebut && dateFin) {
          const data = {
            dateDebut,
            dateFin,
            typeEvenement: typeEvent,
          };
          const packResp = await PackService.packsDisponibles(data);
          console.log('LIST PACK FILTRE: ', packResp);

          if (!annule) {
            setListePacks(packResp ? packResp : []);
          }
        } else {
          const packResp = await PackService.list();
          console.log('LIST TOUS PACK: ', packResp);

          if (!annule) {
            setListePacks(packResp ? packResp : []);
          }
        }
      } catch (err) {
        if (!annule) {
          setLoadError('Erreur lors du chargement des packs.');
          setListePacks([]);
        }
      } finally {
        if (!annule) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      annule = true;
    };
  }, [dateDebut, dateFin, typeEvent, reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);

  return {
        packs: listePacks,
        error: loadError,
        loading: loading,
        reload: refetch,
  };
}


// import { useEffect, useState } from 'react';
// import { packsDisponibles } from '../../data/PackService.js';

// const versListe = (reponse) => (Array.isArray(reponse) ? reponse : (reponse?.data ?? []));

// export function usePacksDisponibles({ dateDebut, dateFin, type = '' }) {
//   const [essai, setEssai] = useState(0);
//   const [resultat, setResultat] = useState({ cle: null, packs: [], error: null });
//   const [loading, setLoading] = useState(false)
//   const [loadError, setLoadError] = useState(null)

//   const actif = Boolean(dateDebut && dateFin);
//   const cle = `${dateDebut}|${dateFin}|${type}|${essai}`;

//   const fetchData = async (annule) => {
//     setLoading(true);
//     try {
//       if (dateDebut && dateFin){
//         const data = {
//           dateDebut : dateDebut,
//           dateFin: dateFin,
//           typeEvenement: typeEvent
//         }
//         const packResp = await PackService.packsDisponibles(data);
//         console.log("LIST PACK FILTRE: ", packResp)

//         if (!annule) {
//           setResultat(() => {
//             if (packResp){
//               return { cle, packs: versListe(packResp), error: null }
//             }else{
//               return { 
//                 cle, packs: [],
//                 error: e?.message || 'Erreur lors du chargement des packs disponibles.',
//               }
//             }
//           });
//         }
//       }else{
//         const packResp = await PackService.list();
//         console.log("LIST TOUS PACK: ", packResp)
//         if (!annule) {
//           setResultat(() => {
//             if (packResp){
//               return { cle, packs: versListe(packResp), error: null }
//             }else{
//               return { 
//                 cle, packs: [],
//                 error: e?.message || 'Erreur lors du chargement des packs.',
//               }
//             }
//           });
//         }
//       }
//     } catch (err) {
//       setLoadError('Erreur lors du chargement des packs.');
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   useEffect(() => {
//     if (!actif) return undefined;
//     let annule = false;
//     fetchData(annule)
//     return () => {
//       annule = true;
//     };
//   }, [actif, dateDebut, dateFin, type, cle]);

//   return {
//     packs: actif ? resultat.packs : [],
//     error: actif ? resultat.error : null,
//     loading: actif && resultat.cle !== cle,
//     reload: () => setEssai((n) => n + 1),
//   };
// }