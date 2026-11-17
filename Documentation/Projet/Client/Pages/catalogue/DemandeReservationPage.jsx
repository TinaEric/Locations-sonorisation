import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Package,
  AlertTriangle,
} from "lucide-react";
import {  ReservationService } from "../../../data/reservationService";
import { useCart } from "../../contexts/CartContext";
import { useNavbar } from "../../contexts/NavbarContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { formatMoney, formatDate } from "../../../utils/format";
import { ChampText } from "../../../components/ChampInput";
import { ImageUrl } from "../../../components/ImageURL";

const initialForm = {
  nom: "",
  email: "",
  telephone: "",
  adresse: "",
  lieuEvenement: "",
  typeEvenement: "",
  message: "",
};

export default function DemandeReservationPage() {
  const navigate = useNavigate();
  const toast = useToast();
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

  // Panier vide → retour catalogue
  useEffect(() => {
    if (!items.length) {
      navigate("/reservation", { replace: true });
    }
  }, [items.length, navigate]);

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

      await ReservationService.create(payload);
      toast
        .success("Votre demande de réservation a été envoyée avec succès")
        .bottom();
      clearCart();
      navigate("/");
    } catch (err) {
      toast.error(err.message).bottom();
    } finally {
      setBusy(false);
    }
  };

  if (!items.length) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <Link to="/reservation" className="btn btn-ghost btn-sm mb-6">
        <ArrowLeft size={16} /> Retour au catalogue
      </Link>

      <div className="mb-8">
        <h1 className="display text-3xl">Demande de réservation</h1>
        <p className="mt-2 max-w-xl text-base-content/70">
          Vérifiez votre panier, complétez vos informations et envoyez votre
          demande. Nous reviendrons vers vous rapidement.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vos coordonnées */}
          {/* <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-lg inline-flex items-center gap-2">
                <User size={18} /> Vos coordonnées
              </h2>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
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
            </div>
          </section> */}

          {/* Votre événement */}
          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-lg inline-flex items-center gap-2">
                <Calendar size={18} /> Votre événement
              </h2>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
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
                  placeholder="Ex: Salle des fêtes…"
                />
                <ChampText
                  id="typeEvenement"
                  name="typeEvenement"
                  label="Type d'événement"
                  icon={Calendar}
                  // value={form.typeEvenement}
                  // onChange={set("typeEvenement")}
                  placeholder="Ex: Mariage, Concert…"
                />
              </div>

              <div className="form-control mt-3 flex w-full flex-col">
                <label className="label">
                  <span className="label-text text-black inline-flex items-center gap-1">
                    <MessageSquare size={14} /> Message
                  </span>
                </label>
                <textarea
                  rows={4}
                  className="textarea textarea-bordered w-full resize-none"
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Précisions sur votre événement…"
                />
              </div>
            </div>
          </section>

          {/* Actions mobile */}
          <div className="flex justify-end gap-2 lg:hidden">
            <Link to="/reservation" className="btn">
              Annuler
            </Link>
            <button
              type="button"
              className="btn btn-accent"
              disabled={busy}
              onClick={soumettre}
            >
              {busy ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Send size={16} />
              )}
              Envoyer la demande
            </button>
          </div>
        </div>

        {/* Récapitulatif sticky */}
        <aside className="lg:col-span-1">
          <div className="card bg-base-100 shadow lg:sticky lg:top-4">
            <div className="card-body gap-3">
              <h2 className="card-title text-lg inline-flex items-center gap-2">
                <Package size={18} /> Récapitulatif
              </h2>

              {dateDebut && dateFin && (
                <div className="rounded-box bg-base-200 p-3 text-sm">
                  Du <strong>{formatDate(dateDebut)}</strong> au{" "}
                  <strong>{formatDate(dateFin)}</strong>
                  <span className="ml-1 text-base-content/60">
                    ({nombreJours} jour{nombreJours > 1 ? "s" : ""})
                  </span>
                </div>
              )}

              <ul className="space-y-2">
                {items.map((i) => (
                  <li key={i.code} className="flex items-start gap-3">
                    <ImageUrl
                      src={i.imageUrl}
                      alt={i.designation}
                      className="h-12 w-12 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {i.designation}
                      </p>
                      <p className="text-xs text-base-content/60">
                        {i.type === "PACK" ? "Pack" : "Matériel"}
                        {i.personnalisation?.length > 0 &&
                          ` · ${i.personnalisation.length} ajustement${
                            i.personnalisation.length > 1 ? "s" : ""
                          }`}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm">
                      {formatMoney(
                        (i.tarifJournalier || i.prixLocation || 0) * nombreJours
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="divider my-1" />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/70">Location</span>
                  <span>{formatMoney(totalPeriode)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-1 text-base-content/70">
                    <ShieldCheck size={14} /> Caution
                  </span>
                  <span>{formatMoney(totalCaution)}</span>
                </div>
                <div className="flex justify-between pt-1 text-base font-bold">
                  <span>Total estimé</span>
                  <span className="text-primary">
                    {formatMoney(totalPeriode + totalCaution)}
                  </span>
                </div>
              </div>

              <div className="alert alert-info alert-sm mt-2">
                <AlertTriangle size={14} />
                <span className="text-xs">
                  Le montant définitif sera confirmé par notre équipe.
                </span>
              </div>

              <button
                type="button"
                className="btn btn-accent w-full mt-1 hidden lg:inline-flex"
                disabled={busy}
                onClick={soumettre}
              >
                {busy ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <Send size={16} />
                )}
                Envoyer la demande
              </button>

              <Link
                to="/reservation"
                className="btn btn-ghost btn-sm w-full hidden lg:inline-flex"
              >
                Retour au catalogue
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// export default function DemandeReservationPage() {
//   const navigate = useNavigate();
//   const { items } = useCart();
//   const [open, setOpen] = useState(false);

//   useEffect(() => {
//     if (!items.length) {
//       navigate("/reservation", { replace: true });
//       return;
//     }
//     setOpen(true);
//   }, [items.length, navigate]);

//   return (
//     <div className="mx-auto max-w-3xl px-4 py-16 text-center">
//       <button
//         className="btn btn-ghost btn-sm mb-6"
//         onClick={() => navigate("/reservation")}
//       >
//         <ArrowLeft size={16} /> Retour au catalogue
//       </button>

//       <div className="inline-flex flex-col items-center gap-3">
//         <ShoppingBag size={48} className="text-primary" />
//         <p className="text-base-content/70">
//           Complétez le formulaire de demande de réservation.
//         </p>
//         <button className="btn btn-accent" onClick={() => setOpen(true)}>
//           Ouvrir le formulaire
//         </button>
//       </div>

//       <DemandeReservationModal
//         open={open}
//         onClose={() => {
//           setOpen(false);
//           navigate("/reservation");
//         }}
//       />
//     </div>
//   );
// }

