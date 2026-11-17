// Client HTTP autonome (n'importe rien du projet). Remplaçable par votre instance axios si vous en avez une.
const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach((x) => qs.append(k, x));
    else qs.append(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function httpGet(path, params, signal) {
  const res = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, {
    method: "GET",
    signal,
    credentials: "include", // cookies de session / JWT éventuels
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      message = (await res.json()).message ?? message;
    } catch {
      /* corps non JSON */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

/** Retourne la première clé définie : tolère snake_case et camelCase côté backend. */
export const pick = (obj, ...keys) => {
  for (const k of keys) if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  return undefined;
};
