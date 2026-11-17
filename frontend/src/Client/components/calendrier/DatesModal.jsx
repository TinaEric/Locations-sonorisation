// Client/components/calendrier/DatesModal.jsx
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePanier } from "../../contexts/PanierContext";
import { useToast } from "../../../contexts/ToastContext";
import { useFilter } from "../../contexts/FilterContext";

const today = () => new Date().toISOString().slice(0, 10);

function Modal({ open, title, subtitle, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-base-100 shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-start justify-between gap-2 border-b border-base-300 p-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs opacity-60">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export const DatesModal = ({ open, dateDebut, dateFin }) => {
  const [debut, setDebut] = useState(dateDebut || "");
  const [fin, setFin] = useState(dateFin || "");
  const [err, setErr] = useState("");
  const [verification, setVerification] = useState(false);
  
  const { definirPeriode } = useFilter();
  const { annulerDates, setOuvreDateModal  } = usePanier();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setDebut(dateDebut || "");
      setFin(dateFin || "");
      setErr("");
      setVerification(false);
    }
  }, [open, dateDebut, dateFin]);

  const valider = async () => {
    if (!debut || !fin) return setErr("Veuillez renseigner les deux dates.");
    if (debut < today()) return setErr("La date de début est déjà passée.");
    if (fin < debut) return setErr("La fin doit être après ou égale au début.");

    setErr("");
    setVerification(true);
    try {
      const resultat = await definirPeriode({
        dateDebut: debut,
        dateFin: fin,
      });
      setOuvreDateModal(false)
      if (!resultat.ok) {
        setErr(resultat.raison);
        toast.warning(resultat.raison);
        return;
      }

      if (resultat.article) {
        toast.info(`${resultat.article.designation} ajouté au panier`);
      }
    } finally {
      setVerification(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={annulerDates}
      title="Quand avez-vous besoin de l'article ?"
      subtitle="Nous vérifions la disponibilité sur ces dates."
    >
      <div className="space-y-3 p-4">
        <label className="form-control w-full">
          <span className="mb-1 text-sm font-medium">Début</span>
          <input
            type="date"
            className="input input-bordered w-full"
            min={today()}
            value={debut}
            onChange={(e) => {
              setDebut(e.target.value);
              if (fin && e.target.value > fin) setFin(e.target.value);
            }}
          />
        </label>
        <label className="form-control w-full">
          <span className="mb-1 text-sm font-medium">Fin</span>
          <input
            type="date"
            className="input input-bordered w-full"
            min={debut || today()}
            value={fin}
            onChange={(e) => setFin(e.target.value)}
          />
        </label>
        {err && <p className="text-sm text-error">{err}</p>}
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-ghost" onClick={annulerDates}>
            Plus tard
          </button>
          <button
            type="button"
            className="btn btn-accent"
            onClick={valider}
            disabled={verification}
          >
            {verification && (
              <span className="loading loading-spinner loading-sm" />
            )}
            Vérifier la disponibilité
          </button>
        </div>
      </div>
    </Modal>
  );
};


// import { X } from "lucide-react";
// import { useEffect, useState } from "react";
// import { usePanier } from "../../contexts/PanierContext";
// import { useToast } from "../../../contexts/ToastContext";
// import { DateAgenda } from "../../../components/DateAgenda";
// // import {DateAgenda  } from "../../../components/DateAgenda";

// const today = () => new Date().toISOString().slice(0, 10);

// function Modal({ open, title, subtitle, onClose, children }) {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
//       <div className="absolute inset-0 bg-black/50" onClick={onClose} />
//       <div className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-base-100 shadow-xl sm:max-w-lg sm:rounded-2xl">
//         <div className="flex items-start justify-between gap-2 border-b border-base-300 p-4">
//           <div className="min-w-0">
//             <h3 className="truncate text-base font-bold">{title}</h3>
//             {subtitle && (
//               <p className="mt-0.5 text-xs opacity-60">{subtitle}</p>
//             )}
//           </div>
//           <button
//             type="button"
//             className="btn btn-ghost btn-sm btn-square"
//             onClick={onClose}
//             aria-label="Fermer"
//           >
//             <X size={18} />
//           </button>
//         </div>
//         <div className="overflow-y-auto">{children}</div>
//       </div>
//     </div>
//   );
// }

// export const DatesModal = ({ open, dateDebut, dateFin }) => {
//   const [debut, setDebut] = useState(dateDebut || "");
//   const [fin, setFin] = useState(dateFin || "");
//   const [err, setErr] = useState("");
//   const [verification, setVerification] = useState(false);
//   const { finaliserDates, annulerDates } = usePanier();
//   const toast = useToast();

//   useEffect(() => {
//     if (open) {
//       setDebut(dateDebut || "");
//       setFin(dateFin || "");
//       setErr("");
//       setVerification(false);
//     }
//   }, [open, dateDebut, dateFin]);

//   const valider = async () => {
//     if (!debut || !fin) return setErr("Veuillez renseigner les deux dates.");
//     if (debut < today()) return setErr("La date de début est déjà passée.");
//     if (fin < debut) return setErr("La fin doit être après ou égale au début.");

//     setErr("");
//     setVerification(true);
//     try {
//       const resultat = await finaliserDates({
//         dateDebut: debut,
//         dateFin: fin,
//       });

//       if (!resultat.ok) {
//         // ❌ reste ouvert, affiche l'erreur
//         setErr(resultat.raison);
//         toast.warning(resultat.raison);
//         return;
//       }

//       if (resultat.article) {
//         toast.info(`${resultat.article.designation} ajouté au panier`);
//       }
//     } finally {
//       setVerification(false);
//     }
//   };

//   return (
//     <Modal
//       open={open}
//       onClose={annulerDates}
//       title="Quand avez-vous besoin du pack ?"
//       subtitle="Nous vérifions la disponibilité sur ces dates."
//     >
//       <div className="flex flex-col w-full gap-4 p-4">
//         <label className="form-control w-full">
//            <DateAgenda
//             label="Date debut"
//             value={debut}
//             onChange={(val) => {
//                 setDebut(val);
//                 if (fin && val > fin) setFin(val);
//             }}
//             placeholder="Ex: JJ/MMM/AAAA..."
//             />

//         </label>
//         <label className="form-control w-full">
            
//         </label>  
//         <label className="form-control w-full">
//             <DateAgenda
//                 label="Date Fin"
//                 minDate={debut || today()}
//                 value={fin}
//                 onChange={(val) => setFin(val)}
//                 placeholder="Ex: JJ/MMM/AAAA..."
//             />
//         </label>
//         {err && <p className="text-sm text-error">{err}</p>}
//         <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
//           <button
//             type="button"
//             className="btn btn-ghost"
//             onClick={annulerDates}
//           >
//             Plus tard
//           </button>
//           <button
//             type="button"
//             className="btn btn-accent"
//             onClick={valider}
//             disabled={verification}
//           >
//             {verification && (
//               <span className="loading loading-spinner loading-sm" />
//             )}
//             Vérifier la disponibilité
//           </button>
//         </div>
//       </div>
//     </Modal>
//   );
// };
