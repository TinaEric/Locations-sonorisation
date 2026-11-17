import { Bell } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../../../contexts/AuthContext";


export const isUnread = (n) => n.etatNotification === "non lue";

export const TYPE_BADGE = {
  Info: "badge-info",
  info: "badge-info",
  warning: "badge-warning",
  Warning: "badge-warning",
  Erreur: "badge-error",
  error: "badge-error",
  Succès: "badge-success",
  success: "badge-success",
};

export const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
};

/**
 * @param {boolean} transparent - true si le NavBar est en mode transparent (home)
 */
export default function NotificationBell({ transparent = false }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setNotifications(user?.notifications ?? []);
  }, [user]);

  const sorted = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.dateCreation) - new Date(a.dateCreation),
      ),
    [notifications],
  );

  const unreadCount = sorted.filter(isUnread).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, etatNotification: "lue" })),
    );
     const data = notifications.map((n) => {
          return {
            idNotification: n.idNotification,
            idUser: user.idUser
          }
        })
        const reps = await marqueLue(data)
        console.log("Notif: ", reps)
  };

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.idNotification === id ? { ...n, etatNotification: "lue" } : n,
      ),
    );
    const data = [{
          idNotification: id,
          idUser: user.idUser
        }]
        const reps = await marqueLue(data)
        console.log("Notif: ", reps)
  };

  // Couleurs du bouton selon le mode transparent/solide (cohérent avec NavBar)
  const triggerClass = `relative rounded-lg p-2 transition shrink-0 ${
    transparent
      ? "text-white hover:bg-white/15"
      : "text-slate-700 hover:bg-slate-100"
  }`;

  return (
    <div className="relative shrink-0" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
        aria-label={`Notifications (${unreadCount} non lue${
          unreadCount > 1 ? "s" : ""
        })`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Overlay invisible (mobile : ferme au clic ailleurs) */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-80 sm:w-96 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 badge badge-sm bg-accent text-white border-0">
                    {unreadCount}
                  </span>
                )}
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {sorted.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 text-center">
                Aucune notification pour le moment
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sorted.map((n) => (
                  <li
                    key={n.idNotification}
                    onClick={() => isUnread(n) && markAsRead(n.idNotification)}
                    className={`px-4 py-3 text-sm cursor-pointer transition hover:bg-slate-50 ${
                      isUnread(n) ? "bg-accent/5" : "opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`badge badge-sm ${
                          TYPE_BADGE[n.typeNotification] ?? "badge-ghost"
                        } shrink-0`}
                      >
                        {n.typeNotification}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 break-words">
                          {n.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {timeAgo(n.dateCreation)}
                        </p>
                      </div>
                      {isUnread(n) && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}