// export default function StatusBadge({ map, value }) {
//   const s = map[value] || { label: value || "—", cls: "badge-ghost" };
//   return <span className={`badge badge-sm ${s.cls}`}>{s.label}</span>;
// }

export const statusKey = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

export default function StatusBadge({ map, value }) {
  const s = map[statusKey(value)] || map[value] || { label: value || "—", cls: "badge-ghost" };
  return <span className={`badge badge-sm ${s.cls}`}>{s.label}</span>;
}
