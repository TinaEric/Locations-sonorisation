import { api } from "./Api";
import { verifierReponse } from './verifierReponse';

const normalizeDateRange = (data = {}) => ({
  dateDebut: data.dateDebut,
  dateFin: data.dateFin,
});

export const materielDispo = async (data) => {
  const payload = normalizeDateRange(data);
  return await verifierReponse(() =>
    api.post("/reservation/materiels-disponibles", payload)
  );
};

export const materielService = {
  list: async (params) =>
    await verifierReponse(() => api.get("/materiel", { params })),

  listDispo: async () =>
    await verifierReponse(() => api.get("/materiel/toPack")),

  verifieSupp: async (id) =>
    await verifierReponse(() => api.get(`/materiel/${id}/verifieDelete`)),

  detail: async (id) =>
    await verifierReponse(() => api.get(`/materiel/${id}`)),

  // Filtres hiérarchiques
  search: async (params) =>
    await verifierReponse(() => api.get("/materiel/search", { params })),

  byCategorie: async (idCategorie) =>
    await verifierReponse(() =>
      api.get("/materiel/search", { params: { idCategorie } })
    ),

  byParent: async (idParent) =>
    await verifierReponse(() =>
      api.get("/materiel/search", { params: { idParent } })
    ),

  // Stock & remplacement
  stockReel: async (code) =>
    await verifierReponse(() => api.get(`/materiel/${code}/stock`)),

  similaires: async (code) =>
    await verifierReponse(() => api.get(`/materiel/${code}/similaires`)),

  arborescenceSimilaires: async (code) =>
    await verifierReponse(() =>
      api.get(`/materiel/${code}/arborescence-similaires`)
    ),

  // CRUD
  create: async (data) =>
    await verifierReponse(() => api.post('/materiel', data)),

  update: async (id, data) =>
    await verifierReponse(() => api.patch(`/materiel/${id}`, data)),

  remove: async (id) =>
    await verifierReponse(() => api.delete(`/materiel/${id}`)),
};