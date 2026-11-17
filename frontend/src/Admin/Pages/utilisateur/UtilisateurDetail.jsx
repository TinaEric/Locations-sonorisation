import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bell, Calendar, Clock, KeyRound, Mail, MapPin, Pencil,
  Phone, Power, ShieldCheck, Trash2, Users, XCircle,
} from "lucide-react";
import DataState from "../../components/DataState";
import Modal from "../../components/Modal";
import { useToast } from "../../../contexts/ToastContext";
import { userService } from "../../../data/UserService";
import RoleBadge, { ROLE_MAP, STATUT_COMPTE_MAP } from "../../components/RoleBadge";
import { formatDateTime, formatMoney } from "../../../utils/format";

const STATUT_RESERVATION = {
  EN_ATTENTE: { label: "En attente", cls: "badge-warning" },
  CONFIRMEE: { label: "Confirmée", cls: "badge-info" },
  EN_COURS: { label: "En cours", cls: "badge-primary" },
  TERMINEE: { label: "Terminée", cls: "badge-success" },
  ANNULEE: { label: "Annulée", cls: "badge-error" },
};

function Info({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={18} className="mt-0.5 text-base-content/50" />
      <div>
        <p className="text-xs uppercase tracking-wide text-base-content/50">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

export default function UtilisateurDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const idUser = location.state;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(false);
  const [mdpForm, setMdpForm] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await userService.detail(idUser);
      setUser(resp || null);
    } catch {
      setError("Impossible de charger l'utilisateur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idUser) fetchData();
  }, [idUser]);

  const toggleStatut = async () => {
    setBusy(true);
    try {
      const nouveau = user.statutCompte === "ACTIF" ? "INACTIF" : "ACTIF";
      await userService.setStatut(user.idUser, nouveau);
      toast.success(nouveau === "ACTIF" ? "Compte activé" : "Compte désactivé");
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const supprimer = async () => {
    setBusy(true);
    try {
      const res = await userService.remove(user.idUser);
      toast.success(res.message);
      navigate("/admin/users");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (mdpForm.newPassword !== mdpForm.confirm) {
      toast.warning("Les mots de passe ne correspondent pas");
      return;
    }
    setBusy(true);
    try {
      await userService.changePassword({
        idUser: user.idUser,
        ancienPassword: mdpForm.ancienPassword,
        newPassword: mdpForm.newPassword,
      });
      toast.success("Mot de passe modifié");
      setMdpForm(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reservations = user?.reservations ?? [];

  return (
    <>
      <div className="breadcrumbs mb-2 text-sm">
        <ul>
          <li>
            <Link to="/admin/users" className="inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Utilisateurs
            </Link>
          </li>
          <li>{user?.nomComplet ?? idUser}</li>
        </ul>
      </div>

      <DataState loading={loading} error={error} empty={!user} onRetry={fetchData}>
        {user && (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded-full w-16 h-16 flex items-center justify-center text-xl">
                        {(user.nomComplet || "?").slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{user.nomComplet}</h1>
                        <RoleBadge role={user.role} />
                        <span
                          className={`badge ${
                            STATUT_COMPTE_MAP[user.statutCompte]?.cls ?? "badge-ghost"
                          }`}
                        >
                          {STATUT_COMPTE_MAP[user.statutCompte]?.label ?? user.statutCompte}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-base-content/60">
                        {user.idUser}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="btn btn-sm"
                      onClick={() => setMdpForm({
                        ancienPassword: "",
                        newPassword: "",
                        confirm: "",
                      })}
                    >
                      <KeyRound size={16} /> Mot de passe
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={toggleStatut}
                      disabled={busy}
                    >
                      <Power size={16} />
                      {user.statutCompte === "ACTIF" ? "Désactiver" : "Activer"}
                    </button>
                    <button
                      className="btn btn-sm text-error"
                      onClick={() => setToDelete(true)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Info icon={Mail} label="Email">
                    <a href={`mailto:${user.email}`} className="link link-primary">
                      {user.email}
                    </a>
                  </Info>
                  <Info icon={Phone} label="Téléphone">
                    {user.telephone || "—"}
                  </Info>
                  <Info icon={MapPin} label="Adresse">
                    {user.adresse || "—"}
                  </Info>
                  <Info icon={Clock} label="Inscrit le">
                    {formatDateTime(user.createdAt)}
                  </Info>
                  <Info icon={Calendar} label="Réservations">
                        {reservations.length} réservation(s)
                  </Info>
                </div>
              </div>
            </div>

            {/* Réservations */}
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">
                  <Users size={18} /> Réservations récentes
                </h2>
                {!reservations.length ? (
                  <p className="py-8 text-center text-base-content/50">
                    Aucune réservation pour cet utilisateur.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Numéro</th>
                          <th>Période</th>
                          <th>Lieu</th>
                          <th>Statut</th>
                          <th className="text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.map((r) => (
                          <tr key={r.numReservation}>
                            <td className="font-mono text-xs">{r.numReservation}</td>
                            <td className="text-sm">
                              {r.dateDebutPrevue} → {r.dateFinPrevue}
                            </td>
                            <td className="text-sm max-w-xs truncate">{r.lieuEvenement || "—"}</td>
                            <td>
                              <span
                                className={`badge ${
                                  STATUT_RESERVATION[r.statutLocation]?.cls ?? "badge-ghost"
                                } badge-sm`}
                              >
                                {STATUT_RESERVATION[r.statutLocation]?.label ??
                                  r.statutLocation}
                              </span>
                            </td>
                            <td className="text-right font-medium">
                              {formatMoney(r.montantTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </DataState>

      {/* Modal mot de passe */}
      <Modal
        open={!!mdpForm}
        title="Modifier le mot de passe"
        onClose={() => setMdpForm(null)}
      >
        {mdpForm && (
          <form onSubmit={submitPassword} className="grid gap-3 px-2">
            <label className="form-control">
              <span className="label-text mb-1">Ancien mot de passe</span>
              <input
                type="password"
                required
                className="input input-bordered w-full"
                value={mdpForm.ancienPassword}
                onChange={(e) =>
                  setMdpForm({ ...mdpForm, ancienPassword: e.target.value })
                }
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Nouveau mot de passe *</span>
              <input
                type="password"
                required
                minLength={6}
                className="input input-bordered w-full"
                value={mdpForm.newPassword}
                onChange={(e) =>
                  setMdpForm({ ...mdpForm, newPassword: e.target.value })
                }
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Confirmation *</span>
              <input
                type="password"
                required
                minLength={6}
                className="input input-bordered w-full"
                value={mdpForm.confirm}
                onChange={(e) =>
                  setMdpForm({ ...mdpForm, confirm: e.target.value })
                }
              />
            </label>
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => setMdpForm(null)}>
                Annuler
              </button>
              <button className="btn btn-primary" disabled={busy}>
                {busy && <span className="loading loading-spinner loading-sm" />}
                Modifier
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal suppression */}
      <Modal
        open={toDelete}
        title="Supprimer cet utilisateur ?"
        supp
        onClose={() => setToDelete(false)}
        actions={
          <>
            <button className="btn" onClick={() => setToDelete(false)}>Annuler</button>
            <button className="btn btn-error" onClick={supprimer} disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" />}
              Supprimer
            </button>
          </>
        }
      >
        <p>
          « <b>{user?.nomComplet}</b> » ({user?.idUser}) sera supprimé. S'il possède des
          réservations ou notifications, il sera déplacé dans la corbeille.
        </p>
      </Modal>
    </>
  );
}