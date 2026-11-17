import { useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  Eye,
  KeyRound,
  Power,
  Users,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataState from "../../components/DataState";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { useToast } from "../../../contexts/ToastContext";
import { asList, useFetch } from "../../hooks/useFetch";
import { userService } from "../../../data/UserService";
import RoleBadge, {
  ROLE_MAP,
  STATUT_COMPTE_MAP,
} from "../../components/RoleBadge";
import { formatDateTime } from "../../../utils/format";
import { ChampText } from "../../../components/ChampInput";

const EMPTY_FORM = {
  nomComplet: "",
  adresse: "",
  telephone: "",
  email: "",
  motDePasse: "",
  role: "LOCATAIRE",
  statutCompte: "ACTIF",
};

export default function Utilisateurs() {
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [roleFiltre, setRoleFiltre] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("");
  const [form, setForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [mdpForm, setMdpForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useFetch(
    () => userService.list(),
    []
  );
  const users = asList(data);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const liste = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!roleFiltre || u.role === roleFiltre) &&
        (!statutFiltre || u.statutCompte === statutFiltre) &&
        (!q ||
          [u.idUser, u.nomComplet, u.email, u.telephone].some((v) =>
            v?.toLowerCase().includes(q)
          ))
    );
  }, [users, search, roleFiltre, statutFiltre]);

  /* --------- Création / modification --------- */
  const openCreate = () => setForm({ ...EMPTY_FORM });

  const openEdit = (u) =>
    setForm({
      idUser: u.idUser,
      nomComplet: u.nomComplet || "",
      adresse: u.adresse || "",
      telephone: u.telephone || "",
      email: u.email || "",
      motDePasse: "", // vide = pas de changement
      role: u.role,
      statutCompte: u.statutCompte,
    });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (form.idUser) {
        const { idUser, motDePasse, ...rest } = form;
        const payload = motDePasse?.trim() ? { ...rest, motDePasse } : rest;
        await userService.update(idUser, payload);
        toast.success(`Utilisateur '${idUser}' modifié`);
      } else {
        await userService.create(form);
        toast.success("Utilisateur créé");
      }
      setForm(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* --------- Statut --------- */
  const toggleStatut = async (u) => {
    setBusy(true);
    try {
      const nouveau = u.statutCompte === "ACTIF" ? "INACTIF" : "ACTIF";
      await userService.setStatut(u.idUser, nouveau);
      toast.success(nouveau === "ACTIF" ? "Compte activé" : "Compte désactivé");
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* --------- Mot de passe --------- */
  const openChangePassword = (u) =>
    setMdpForm({
      idUser: u.idUser,
      nomComplet: u.nomComplet,
      ancienPassword: "",
      newPassword: "",
      confirm: "",
    });

  const submitPassword = async (e) => {
    e.preventDefault();
    if (mdpForm.newPassword !== mdpForm.confirm) {
      toast.warning("Les mots de passe ne correspondent pas");
      return;
    }
    setBusy(true);
    try {
      await userService.changePassword({
        idUser: mdpForm.idUser,
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

  /* --------- Suppression --------- */
  const supprimer = async () => {
    setBusy(true);
    try {
      const res = await userService.remove(toDelete.idUser);
      toast.success(res.message);
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle="Locataires, gestionnaires et administrateurs"
      >
        <button className="btn btn-accent" onClick={openCreate}>
          <Plus size={18} /> Ajouter un utilisateur
        </button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="input input-bordered flex items-center gap-2 w-full sm:w-72">
          <Search size={16} className="opacity-50" />
          <input
            type="search"
            className="grow"
            placeholder="Nom, email, téléphone, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <select
          className="select select-bordered"
          value={roleFiltre}
          onChange={(e) => setRoleFiltre(e.target.value)}
        >
          <option value="">Tous les rôles</option>
          {Object.entries(ROLE_MAP).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        <select
          className="select select-bordered"
          value={statutFiltre}
          onChange={(e) => setStatutFiltre(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_COMPTE_MAP).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card bg-base-100 shadow">
        <DataState
          loading={loading}
          error={error}
          empty={!users.length}
          onRetry={reload}
        >
          {!liste.length ? (
            <p className="py-8 text-center text-base-content/50">
              Aucune utilisateur trouvé pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th>Contact</th>
                    <th>Réservations</th>
                    <th>Statut</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {liste.map((u) => {
                    const notifNonLues = (u.notifications ?? []).filter(
                      (n) => n.etatNotification === "non lue"
                    ).length;
                    return (
                      <tr
                        key={u.idUser}
                        className="cursor-pointer hover:bg-base-200/50"
                        onClick={() =>
                          navigate("/admin/users/detailUsers", {
                            state: u.idUser,
                          })
                        }
                      >
                        <td className="font-mono text-xs">{u.idUser}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="avatar placeholder">
                              <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 flex items-center justify-center text-xs">
                                {(u.nomComplet || "?")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">{u.nomComplet}</div>
                              <div className="text-xs opacity-60">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="text-sm">
                          {u.telephone || "—"}
                          <div className="text-xs opacity-60">
                            {u.adresse || ""}
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Users size={14} className="opacity-60" />
                            {(u.reservations ?? []).length}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              STATUT_COMPTE_MAP[u.statutCompte]?.cls ??
                              "badge-ghost"
                            }`}
                          >
                            {STATUT_COMPTE_MAP[u.statutCompte]?.label ??
                              u.statutCompte}
                          </span>
                        </td>
                        <td
                          className="text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="btn btn-ghost btn-sm btn-square"
                            title={
                              u.statutCompte === "ACTIF"
                                ? "Désactiver"
                                : "Activer"
                            }
                            onClick={() => toggleStatut(u)}
                            disabled={busy}
                          >
                            <Power size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm btn-square"
                            title="Réinitialiser le mot de passe"
                            onClick={() => openChangePassword(u)}
                          >
                            <KeyRound size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm btn-square"
                            onClick={() => openEdit(u)}
                            aria-label="Modifier"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm btn-square text-error"
                            onClick={() => setToDelete(u)}
                            aria-label="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DataState>
      </div>

      {/* ---------- Modal Ajout / Modification ---------- */}
      <Modal
        open={!!form}
        title={form?.idUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        onClose={() => setForm(null)}
      >
        {form && (
          <form onSubmit={save} className="grid gap-3 px-2 sm:grid-cols-2">
            {form.idUser && (
              <label className="form-control sm:col-span-2">
                <span className="label-text mb-1">ID utilisateur</span>
                <input
                  disabled
                  className="input input-bordered w-full font-mono"
                  value={form.idUser}
                />
              </label>
            )}

            <ChampText
              id="user-nom"
              name="nomComplet"
              label="Nom complet *"
              icon={UserIcon}
              required
              value={form.nomComplet}
              onChange={set("nomComplet")}
            />

            <ChampText
              id="user-email"
              name="email"
              label="Email *"
              icon={UserIcon}
              type="email"
              required
              value={form.email}
              onChange={set("email")}
              disabled={!!form.idUser}
            />

            <ChampText
              id="user-tel"
              name="telephone"
              label="Téléphone"
              icon={UserIcon}
              value={form.telephone || ""}
              onChange={set("telephone")}
            />

            <ChampText
              id="user-adresse"
              name="adresse"
              label="Adresse"
              icon={UserIcon}
              value={form.adresse || ""}
              onChange={set("adresse")}
            />

            <label className="form-control">
              <span className="label-text mb-1">Rôle *</span>
              <select
                required
                className="select select-bordered w-full"
                value={form.role}
                onChange={set("role")}
                disabled={!!form.idUser}
              >
                {Object.entries(ROLE_MAP).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text mb-1">Statut *</span>
              <select
                required
                className="select select-bordered w-full"
                value={form.statutCompte}
                onChange={set("statutCompte")}
              >
                {Object.entries(STATUT_COMPTE_MAP).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>

            {!form.idUser && (
              <label className="form-control sm:col-span-2">
                <span className="label-text mb-1">Mot de passe *</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="input input-bordered w-full"
                  value={form.motDePasse}
                  onChange={set("motDePasse")}
                  placeholder="Au moins 6 caractères"
                />
              </label>
            )}

            {form.idUser && (
              <label className="form-control sm:col-span-2">
                <span className="label-text mb-1">
                  Nouveau mot de passe (optionnel)
                </span>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={form.motDePasse}
                  onChange={set("motDePasse")}
                  placeholder="Laisser vide pour ne pas changer"
                />
              </label>
            )}

            <div className="modal-action sm:col-span-2">
              <button
                type="button"
                className="btn"
                onClick={() => setForm(null)}
              >
                Annuler
              </button>
              <button className="btn btn-accent" disabled={busy}>
                {busy && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---------- Modal changement de mot de passe ---------- */}
      <Modal
        open={!!mdpForm}
        title="Modifier le mot de passe"
        onClose={() => setMdpForm(null)}
      >
        {mdpForm && (
          <form onSubmit={submitPassword} className="grid gap-3 px-2">
            <p className="text-sm text-base-content/70">
              Utilisateur : <b>{mdpForm.nomComplet}</b> ({mdpForm.idUser})
            </p>
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
              <button
                type="button"
                className="btn"
                onClick={() => setMdpForm(null)}
              >
                Annuler
              </button>
              <button className="btn btn-primary" disabled={busy}>
                {busy && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Modifier
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ---------- Modal suppression ---------- */}
      <Modal
        open={!!toDelete}
        title="Supprimer cet utilisateur ?"
        supp
        onClose={() => setToDelete(null)}
        actions={
          <>
            <button className="btn" onClick={() => setToDelete(null)}>
              Annuler
            </button>
            <button
              className="btn btn-error"
              onClick={supprimer}
              disabled={busy}
            >
              {busy && <span className="loading loading-spinner loading-sm" />}
              Supprimer
            </button>
          </>
        }
      >
        <p>
          « <b>{toDelete?.nomComplet}</b> » ({toDelete?.idUser}) sera
          définitivement supprimé s'il n'a ni réservation ni notification
          active. Sinon, il sera déplacé dans la corbeille.
        </p>
      </Modal>
    </>
  );
}
