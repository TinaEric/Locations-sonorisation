export default function StatusBadge({ map, value }) {
  const s = map[value] || { label: value || "—", cls: "badge-ghost" };
  return <span className={`badge badge-sm ${s.cls}`}>{s.label}</span>;
}
