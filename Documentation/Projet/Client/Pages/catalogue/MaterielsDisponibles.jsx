import { useEffect, useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { materielDispo } from "../../../data/reservationService";
import { asList } from "../../../Admin/hooks/useFetch";
import MaterielCard from "../../components/catalogue/MaterielCard";


export default function MaterielsDisponibles({ dateDebut, dateFin }) {
  const [materiels, setMateriels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [q, setQ] = useState("");
  const [idCategorie, setIdCategorie] = useState("");

  useEffect(() => {
    if (!dateDebut || !dateFin) {
      setMateriels([]);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setErreur(null);

    materielDispo({ dateDebut, dateFin })
      .then((r) => {
        if (!alive) return;
        const cats = asList(r);
        const flat = cats.flatMap((cat) =>
          (cat.materiels || []).map((m) => ({
            ...m,
            idCategorie: cat.idCategorie,
            categorie: {
              idCategorie: cat.idCategorie,
              libelle: cat.libelle,
              codeCategorie: cat.codeCategorie,
            },
          }))
        );
        setMateriels(flat);
      })
      .catch((e) => alive && setErreur(e.message))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [dateDebut, dateFin]);

  const categoriesDispo = useMemo(() => {
    const map = new Map();
    materiels.forEach((m) => {
      if (m.categorie && !map.has(m.idCategorie)) {
        map.set(m.idCategorie, m.categorie);
      }
    });
    return [...map.values()].sort((a, b) =>
      (a.libelle || "").localeCompare(b.libelle || "")
    );
  }, [materiels]);

  const filtres = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return materiels.filter((m) => {
      if (idCategorie && String(m.idCategorie) !== String(idCategorie))
        return false;
      if (!needle) return true;
      return (
        m.designation?.toLowerCase().includes(needle) ||
        m.marque?.toLowerCase().includes(needle) ||
        m.CodeMateriel?.toLowerCase().includes(needle)
      );
    });
  }, [materiels, q, idCategorie]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="input input-bordered flex flex-1 items-center gap-2">
          <Search size={16} className="opacity-60" />
          <input
            type="search"
            className="grow"
            placeholder="Rechercher (désignation, marque, code)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          className="select select-bordered sm:w-64"
          value={idCategorie}
          onChange={(e) => setIdCategorie(e.target.value)}
          disabled={!categoriesDispo.length}
        >
          <option value="">Toutes les catégories</option>
          {categoriesDispo.map((c) => (
            <option key={c.idCategorie} value={c.idCategorie}>
              {c.libelle}
            </option>
          ))}
        </select>
      </div>

      {!loading && !erreur && materiels.length > 0 && (
        <p className="text-sm text-base-content/60">
          {filtres.length} matériel{filtres.length > 1 ? "s" : ""} disponible
          {filtres.length > 1 ? "s" : ""}
          {idCategorie || q ? " (filtré)" : ""}
        </p>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      {!loading && erreur && (
        <p className="py-8 text-center text-error">{erreur}</p>
      )}

      {!loading && !erreur && !filtres.length && (
        <p className="py-8 text-center text-base-content/60">
          {materiels.length === 0
            ? "Aucun matériel disponible sur cette période."
            : "Aucun matériel ne correspond à votre recherche."}
        </p>
      )}

      {!loading && !erreur && filtres.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtres.map((m) => (
            <MaterielCard
              key={m.CodeMateriel}
              materiel={m}
              dateDebut={dateDebut}
              dateFin={dateFin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// export default function MaterielsDisponibles({ dateDebut, dateFin }) {
//   const [materiels, setMateriels] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [erreur, setErreur] = useState(null);
//   const [q, setQ] = useState("");
//   const [idCategorie, setIdCategorie] = useState("");

//   // -------- Chargement --------
//   useEffect(() => {
//     if (!dateDebut || !dateFin) {
//       setMateriels([]);
//       setLoading(false);
//       return;
//     }

//     let alive = true;
//     setLoading(true);
//     setErreur(null);

//     materielDispo({ dateDebut, dateFin })
//       .then((r) => {
//         if (!alive) return;
//         const cats = asList(r);
//         const flat = cats.flatMap((cat) =>
//           (cat.materiels || []).map((m) => ({
//             ...m,
//             idCategorie: cat.idCategorie,
//             categorie: {
//               idCategorie: cat.idCategorie,
//               libelle: cat.libelle,
//               codeCategorie: cat.codeCategorie,
//             },
//           }))
//         );
//         setMateriels(flat);
//       })
//       .catch((e) => alive && setErreur(e.message))
//       .finally(() => alive && setLoading(false));

//     return () => {
//       alive = false;
//     };
//   }, [dateDebut, dateFin]);

//   // -------- Catégories présentes dans le résultat --------
//   const categoriesDispo = useMemo(() => {
//     const map = new Map();
//     materiels.forEach((m) => {
//       if (m.categorie && !map.has(m.idCategorie)) {
//         map.set(m.idCategorie, m.categorie);
//       }
//     });
//     return [...map.values()].sort((a, b) =>
//       (a.libelle || "").localeCompare(b.libelle || "")
//     );
//   }, [materiels]);

//   // -------- Filtres (recherche + catégorie) --------
//   const filtres = useMemo(() => {
//     const needle = q.trim().toLowerCase();
//     return materiels.filter((m) => {
//       if (idCategorie && String(m.idCategorie) !== String(idCategorie))
//         return false;
//       if (!needle) return true;
//       return (
//         m.designation?.toLowerCase().includes(needle) ||
//         m.marque?.toLowerCase().includes(needle) ||
//         m.CodeMateriel?.toLowerCase().includes(needle)
//       );
//     });
//   }, [materiels, q, idCategorie]);

//   // -------- Rendu --------
//   return (
//     <div className="space-y-4">
//       {/* Barre de recherche + filtre catégorie */}
//       <div className="flex flex-col gap-3 sm:flex-row">
//         <label className="input input-bordered flex flex-1 items-center gap-2">
//           <Search size={16} className="opacity-60" />
//           <input
//             type="search"
//             className="grow"
//             placeholder="Rechercher (désignation, marque, code)…"
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//           />
//         </label>
//         <select
//           className="select select-bordered sm:w-64"
//           value={idCategorie}
//           onChange={(e) => setIdCategorie(e.target.value)}
//           disabled={!categoriesDispo.length}
//         >
//           <option value="">Toutes les catégories</option>
//           {categoriesDispo.map((c) => (
//             <option key={c.idCategorie} value={c.idCategorie}>
//               {c.libelle}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Compteur */}
//       {!loading && !erreur && materiels.length > 0 && (
//         <p className="text-sm text-base-content/60">
//           {filtres.length} matériel{filtres.length > 1 ? "s" : ""} disponible
//           {filtres.length > 1 ? "s" : ""}
//           {idCategorie || q ? " (filtré)" : ""}
//         </p>
//       )}

//       {/* Loading */}
//       {loading && (
//         <div className="flex justify-center py-16">
//           <Loader2 className="animate-spin" size={28} />
//         </div>
//       )}

//       {/* Erreur */}
//       {!loading && erreur && (
//         <p className="py-8 text-center text-error">{erreur}</p>
//       )}

//       {/* Vide */}
//       {!loading && !erreur && !filtres.length && (
//         <p className="py-8 text-center text-base-content/60">
//           {materiels.length === 0
//             ? "Aucun matériel disponible sur cette période."
//             : "Aucun matériel ne correspond à votre recherche."}
//         </p>
//       )}

//       {/* Grille plate */}
//       {!loading && !erreur && filtres.length > 0 && (
//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//           {filtres.map((m) => (
//             <MaterielCard
//               key={m.CodeMateriel}
//               materiel={m}
//               dateDebut={dateDebut}
//               dateFin={dateFin}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
