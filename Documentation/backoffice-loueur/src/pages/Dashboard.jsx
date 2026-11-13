import { Link } from "react-router-dom";
import { Boxes, CalendarClock, PackageCheck, PackageOpen } from "lucide-react";
import { statsService } from "../api/services";
import { useFetch } from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import DataState from "../components/DataState";
import { formatMoney } from "../utils/format";

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch(() => statsService.get(), []);

  const cards = [
    { label: "Exemplaires disponibles", value: data?.itemsDisponibles, icon: Boxes, to: "/materiels", color: "text-success" },
    { label: "Réservations en attente", value: data?.reservationsEnAttente, icon: CalendarClock, to: "/reservations", color: "text-warning" },
    { label: "Retraits à effectuer", value: data?.retraitsAFaire, icon: PackageOpen, to: "/retraits", color: "text-info" },
    { label: "Retours attendus", value: data?.retoursAttendus, icon: PackageCheck, to: "/retours", color: "text-primary" },
  ];

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de votre activité de location" />
      <DataState loading={loading} error={error} onRetry={reload}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, to, color }) => (
            <Link key={label} to={to} className="stats bg-base-100 shadow transition hover:shadow-md">
              <div className="stat">
                <div className={`stat-figure ${color}`}>
                  <Icon size={30} />
                </div>
                <div className="stat-title">{label}</div>
                <div className="stat-value">{value ?? 0}</div>
              </div>
            </Link>
          ))}
        </div>

        {data?.chiffreAffaires !== undefined && (
          <div className="stats bg-base-100 shadow mt-4">
            <div className="stat">
              <div className="stat-title">Chiffre d'affaires du mois</div>
              <div className="stat-value text-primary">{formatMoney(data.chiffreAffaires)}</div>
              {data.penalitesMois !== undefined && (
                <div className="stat-desc">dont pénalités : {formatMoney(data.penalitesMois)}</div>
              )}
            </div>
          </div>
        )}
      </DataState>
    </>
  );
}
