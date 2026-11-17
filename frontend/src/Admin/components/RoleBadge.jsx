import { ShieldCheck, User, Wrench } from "lucide-react";

export const ROLE_MAP = {
  ADMIN: { label: "Admin", icon: ShieldCheck, cls: "badge-primary" },
  GESTIONNAIRE: { label: "Gestionnaire", icon: Wrench, cls: "badge-secondary" },
  LOCATAIRE: { label: "Locataire", icon: User, cls: "badge-ghost" },
};

export const STATUT_COMPTE_MAP = {
  ACTIF: { label: "Actif", cls: "badge-success" },
  INACTIF: { label: "Inactif", cls: "badge-ghost" },
};

export default function RoleBadge({ role }) {
  const info = ROLE_MAP[role] ?? { label: role, icon: User, cls: "badge-outline" };
  const Icon = info.icon;
  return (
    <span className={`badge ${info.cls} gap-1`}>
      <Icon size={12} />
      {info.label}
    </span>
  );
}