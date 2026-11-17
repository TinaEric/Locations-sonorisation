// Client HTTP commun à tous les services.
// L'URL du backend vient de VITE_API_URL (ex. https://api.monloueur.mg), sinon "/api".
const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, v));
    } else {
      qs.append(key, value);
    }
  });
  const str = qs.toString();
  return str ? `?${str}` : "";
}

async function request(method, path, { params, body, signal } = {}) {
  const res = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, {
    method,
    signal,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const data = await res.json();
      message = data.message ?? message;
    } catch {
      /* corps non JSON */
    }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return res.status === 204 ? null : res.json();
}

export const apiGet = (path, params, signal) => request("GET", path, { params, signal });
export const apiPost = (path, body, signal) => request("POST", path, { body, signal });
