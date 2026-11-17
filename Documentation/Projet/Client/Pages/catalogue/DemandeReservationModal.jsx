import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { createReservation } from "../../../data/reservationService";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../../contexts/ToastContext";
import { useNavbar } from "../../contexts/NavbarContext";
import { formatMoney } from "../../../utils/format";
import { ChampText } from "../../../components/ChampInput";
import { useAuth } from "../../../contexts/AuthContext";

const initialForm = {
  nom: "",
  email: "",
  telephone: "",
  adresse: "",
  lieuEvenement: "",
  typeEvenement: "",
  message: "",
};


export default function DemandeReservationModal({ open, onClose }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const { dateDebut, dateFin, typeEvent } = useNavbar();

  const [form, setForm] = useState({
    ...initialForm,
    nom: user?.nomComplet ?? user?.nom ?? "",
    email: user?.email ?? "",
    telephone: user?.telephone ?? "",
    typeEvenement: typeEvent || "",
  });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const nombreJours = useMemo(() => {
    if (!dateDebut || !dateFin) return 1;
    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  }, [dateDebut, dateFin]);

  const totalPeriode = useMemo(
    () =>
      items.reduce((s, i) => {
        const prix = i.tarifJournalier || i.prixLocation || 0;
        return s + Number(prix) * nombreJours;
      }, 0),
    [items, nombreJours]
  );

  const totalCaution = useMemo(
    () => items.reduce((s, i) => s + Number(i.prixCaution || 0), 0),
    [items]
  );

  const soumettre = async (e) => {
    e.preventDefault();
    if (!items.length) {
      toast.warning("Votre panier est vide").bottom();
      return;
    }
    if (!dateDebut || !dateFin) {
      toast.warning("Veuillez sélectionner vos dates").bottom();
      return;
    }
    if (!user?.idUser) {
      toast.error("Vous devez être connecté").bottom();
      return;
    }

    setBusy(true);
    try {
      const packItem = items.find((i) => i.type === "PACK");
      const materielItems = items.filter((i) => i.type === "MATERIEL");

      let actionLocataire;
      let codePack;
      let materiels;

      if (packItem) {
        const estPersonnalise =
          packItem.estPersonnalise || packItem.personnalisation?.length > 0;
        actionLocataire = estPersonnalise ? "personnalise" : "pack";
        codePack = packItem.code;
        if (estPersonnalise) {
          materiels = packItem.personnalisation.map((p) => ({
            codeMateriel: p.codeMateriel,
            quantite: p.quantite,
          }));
        }
      } else {
        actionLocataire = "materiel";
        materiels = materielItems.map((m) => ({
          codeMateriel: m.code,
          quantite: m.quantite,
        }));
      }

      const payload = {
        idUser: user.idUser,
        dateDebutPrevue: dateDebut,
        dateFinPrevue: dateFin,
        lieuEvenement: form.lieuEvenement,
        remarques: form.message,
        modeRetrait: "SUR_PLACE",
        actionLocataire,
        codePack,
        materiels,
        quantitePack: actionLocataire === "pack" ? 1 : undefined,
      };

      await createReservation(payload);
      toast
        .success("Votre demande de réservation a été envoyée avec succès")
        .bottom();
      clearCart();
      onClose();
      navigate("/");
    } catch (err) {
      toast.error(err.message).bottom();
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
        <div className="relative w-full max-w-2xl rounded-2xl bg-base-100 shadow-xl">
          <div className="border-b border-base-300 p-5">
            <h2 className="text-xl font-bold">Demande de réservation</h2>
            <p className="mt-1 text-sm text-base-content/60">
              Complétez vos informations, nous reviendrons vers vous rapidement.
            </p>
          </div>

          <form onSubmit={soumettre} className="space-y-4 p-5">
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-base-content/70">
                Vos coordonnées
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <ChampText
                  id="nom"
                  name="nom"
                  label="Nom complet *"
                  icon={User}
                  required
                  value={form.nom}
                  onChange={set("nom")}
                />
                <ChampText
                  id="email"
                  name="email"
                  label="Email *"
                  icon={Mail}
                  type="email"
                  required
                  value={form.email}
                  onChange={set("email")}
                />
                <ChampText
                  id="telephone"
                  name="telephone"
                  label="Téléphone *"
                  icon={Phone}
                  required
                  value={form.telephone}
                  onChange={set("telephone")}
                />
                <ChampText
                  id="adresse"
                  name="adresse"
                  label="Adresse"
                  icon={MapPin}
                  value={form.adresse}
                  onChange={set("adresse")}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-base-content/70">
                Votre événement
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Date début</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={dateDebut || ""}
                    disabled
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Date fin</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={dateFin || ""}
                    disabled
                  />
                </div>
                <ChampText
                  id="lieuEvenement"
                  name="lieuEvenement"
                  label="Lieu de l'événement"
                  icon={MapPin}
                  value={form.lieuEvenement}
                  onChange={set("lieuEvenement")}
                />
                <ChampText
                  id="typeEvenement"
                  name="typeEvenement"
                  label="Type d'événement"
                  icon={Calendar}
                  value={form.typeEvenement}
                  onChange={set("typeEvenement")}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text inline-flex items-center gap-1">
                    <MessageSquare size={14} /> Message
                  </span>
                </label>
                <textarea
                  rows={3}
                  className="textarea textarea-bordered"
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Précisions sur votre événement…"
                />
              </div>
            </fieldset>

            <div className="rounded-box bg-base-200 p-4">
              <p className="mb-2 text-sm font-semibold">Récapitulatif</p>
              <ul className="space-y-1 text-sm">
                {items.map((i) => (
                  <li key={i.code} className="flex justify-between">
                    <span className="truncate">
                      {i.designation}{" "}
                      <span className="text-xs text-base-content/60">
                        ×{i.quantite}
                      </span>
                    </span>
                    <span>
                      {formatMoney(
                        (i.tarifJournalier || i.prixLocation || 0) *
                          nombreJours
                      )}{" "}
                      Ar
                    </span>
                  </li>
                ))}
              </ul>
              <div className="divider my-2" />
              <div className="flex justify-between text-sm">
                <span>Durée</span>
                <span>
                  {nombreJours} jour{nombreJours > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total location</span>
                <span>{formatMoney(totalPeriode)} Ar</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Caution</span>
                <span>{formatMoney(totalCaution)} Ar</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total estimé</span>
                <span className="text-primary">
                  {formatMoney(totalPeriode + totalCaution)} Ar
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn"
                onClick={onClose}
                disabled={busy}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-accent"
                disabled={busy || !items.length}
              >
                {busy ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <Send size={16} />
                )}
                Envoyer la demande
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


// export default function DemandeReservationModal({ open, onClose }) {
//   const toast = useToast();
//   const navigate = useNavigate();
//   const { items, clearCart } = useCart();
//   const { dateDebut, dateFin, typeEvent } = useNavbar();

//   const [form, setForm] = useState({
//     ...initialForm,
//     typeEvenement: typeEvent || "",
//   });
//   const [busy, setBusy] = useState(false);

//   const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

//   const nombreJours = useMemo(() => {
//     if (!dateDebut || !dateFin) return 1;
//     const d1 = new Date(dateDebut);
//     const d2 = new Date(dateFin);
//     const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
//     return Math.max(1, diff + 1);
//   }, [dateDebut, dateFin]);

//   const totalPeriode = useMemo(
//     () =>
//       items.reduce((s, i) => {
//         const prix = i.tarifJournalier || i.prixLocation || 0;
//         return s + Number(prix) * nombreJours;
//       }, 0),
//     [items, nombreJours]
//   );

//   const totalCaution = useMemo(
//     () => items.reduce((s, i) => s + Number(i.prixCaution || 0), 0),
//     [items]
//   );

//   const soumettre = async (e) => {
//     e.preventDefault();
//     if (!items.length) {
//       toast.warning("Votre panier est vide").bottom();
//       return;
//     }
//     if (!dateDebut || !dateFin) {
//       toast.warning("Veuillez sélectionner vos dates").bottom();
//       return;
//     }

//     setBusy(true);
//     try {
//       const payload = {
//         // Client
//         nom: form.nom,
//         email: form.email,
//         telephone: form.telephone,
//         adresse: form.adresse,
//         // Événement
//         lieuEvenement: form.lieuEvenement,
//         typeEvenement: form.typeEvenement,
//         message: form.message,
//         dateDebut,
//         dateFin,
//         // Détail
//         items: items.map((i) => ({
//           code: i.code,
//           type: i.type,
//           quantite: i.quantite,
//           prix: i.tarifJournalier || i.prixLocation || 0,
//           caution: i.prixCaution || 0,
//           personnalisation: i.personnalisation || [],
//         })),
//         totalPeriode,
//         totalCaution,
//       };

//       await createReservation(payload);
//       toast
//         .success("Votre demande de réservation a été envoyée avec succès")
//         .bottom();
//       clearCart();
//       onClose();
//       navigate("/");
//     } catch (err) {
//       toast.error(err.message).bottom();
//     } finally {
//       setBusy(false);
//     }
//   };

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50">
//       <div className="absolute inset-0 bg-black/50" onClick={onClose} />
//       <div className="absolute inset-0 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
//         <div className="relative w-full max-w-2xl rounded-2xl bg-base-100 shadow-xl">
//           <div className="border-b border-base-300 p-5">
//             <h2 className="text-xl font-bold">Demande de réservation</h2>
//             <p className="mt-1 text-sm text-base-content/60">
//               Complétez vos informations, nous reviendrons vers vous rapidement.
//             </p>
//           </div>

//           <form onSubmit={soumettre} className="space-y-4 p-5">
//             {/* Client */}
//             <fieldset className="space-y-3">
//               <legend className="text-sm font-semibold text-base-content/70">
//                 Vos coordonnées
//               </legend>
//               <div className="grid gap-3 sm:grid-cols-2">
//                 <ChampText
//                   id="nom"
//                   name="nom"
//                   label="Nom complet *"
//                   icon={User}
//                   required
//                   value={form.nom}
//                   onChange={set("nom")}
//                 />
//                 <ChampText
//                   id="email"
//                   name="email"
//                   label="Email *"
//                   icon={Mail}
//                   type="email"
//                   required
//                   value={form.email}
//                   onChange={set("email")}
//                 />
//                 <ChampText
//                   id="telephone"
//                   name="telephone"
//                   label="Téléphone *"
//                   icon={Phone}
//                   required
//                   value={form.telephone}
//                   onChange={set("telephone")}
//                 />
//                 <ChampText
//                   id="adresse"
//                   name="adresse"
//                   label="Adresse"
//                   icon={MapPin}
//                   value={form.adresse}
//                   onChange={set("adresse")}
//                 />
//               </div>
//             </fieldset>

//             {/* Événement */}
//             <fieldset className="space-y-3">
//               <legend className="text-sm font-semibold text-base-content/70">
//                 Votre événement
//               </legend>
//               <div className="grid gap-3 sm:grid-cols-2">
//                 <div className="form-control">
//                   <label className="label">
//                     <span className="label-text">Date début</span>
//                   </label>
//                   <input
//                     type="date"
//                     className="input input-bordered input-sm"
//                     value={dateDebut || ""}
//                     disabled
//                   />
//                 </div>
//                 <div className="form-control">
//                   <label className="label">
//                     <span className="label-text">Date fin</span>
//                   </label>
//                   <input
//                     type="date"
//                     className="input input-bordered input-sm"
//                     value={dateFin || ""}
//                     disabled
//                   />
//                 </div>
//                 <ChampText
//                   id="lieuEvenement"
//                   name="lieuEvenement"
//                   label="Lieu de l'événement"
//                   icon={MapPin}
//                   value={form.lieuEvenement}
//                   onChange={set("lieuEvenement")}
//                 />
//                 <ChampText
//                   id="typeEvenement"
//                   name="typeEvenement"
//                   label="Type d'événement"
//                   icon={Calendar}
//                   value={form.typeEvenement}
//                   onChange={set("typeEvenement")}
//                 />
//               </div>
//               <div className="form-control">
//                 <label className="label">
//                   <span className="label-text inline-flex items-center gap-1">
//                     <MessageSquare size={14} /> Message
//                   </span>
//                 </label>
//                 <textarea
//                   rows={3}
//                   className="textarea textarea-bordered"
//                   value={form.message}
//                   onChange={set("message")}
//                   placeholder="Précisions sur votre événement…"
//                 />
//               </div>
//             </fieldset>

//             {/* Récap panier */}
//             <div className="rounded-box bg-base-200 p-4">
//               <p className="mb-2 text-sm font-semibold">Récapitulatif</p>
//               <ul className="space-y-1 text-sm">
//                 {items.map((i) => (
//                   <li key={i.code} className="flex justify-between">
//                     <span className="truncate">
//                       {i.designation}{" "}
//                       <span className="text-xs text-base-content/60">
//                         ×{i.quantite}
//                       </span>
//                     </span>
//                     <span>
//                       {formatMoney(
//                         (i.tarifJournalier || i.prixLocation || 0) *
//                           nombreJours
//                       )}{" "}
//                       Ar
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//               <div className="divider my-2" />
//               <div className="flex justify-between text-sm">
//                 <span>Durée</span>
//                 <span>
//                   {nombreJours} jour{nombreJours > 1 ? "s" : ""}
//                 </span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span>Total location</span>
//                 <span>{formatMoney(totalPeriode)} Ar</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span>Caution</span>
//                 <span>{formatMoney(totalCaution)} Ar</span>
//               </div>
//               <div className="flex justify-between font-bold">
//                 <span>Total estimé</span>
//                 <span className="text-primary">
//                   {formatMoney(totalPeriode + totalCaution)} Ar
//                 </span>
//               </div>
//             </div>

//             <div className="flex justify-end gap-2 pt-2">
//               <button
//                 type="button"
//                 className="btn"
//                 onClick={onClose}
//                 disabled={busy}
//               >
//                 Annuler
//               </button>
//               <button
//                 type="submit"
//                 className="btn btn-accent"
//                 disabled={busy || !items.length}
//               >
//                 {busy ? (
//                   <span className="loading loading-spinner loading-sm" />
//                 ) : (
//                   <Send size={16} />
//                 )}
//                 Envoyer la demande
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }