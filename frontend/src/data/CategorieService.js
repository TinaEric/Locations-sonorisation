import { api, apiModel } from "./Api";
import { verifierReponse } from './verifierReponse';

export const categorieService = {
  list: async (params) => await verifierReponse(() => api.get("/categorie", { params })),
  listDispo: async () => await verifierReponse(() => api.get("/categorie/toPack")),
  detail: async (id) => await verifierReponse(() => api.get(`/categorie/${id}`)),

  parents: async () => await verifierReponse(() => api.get("/categorie/parents")),
  arborescence: async () => await verifierReponse(() => api.get("/categorie/arborescence")),
  enfants: async (idParent) => await verifierReponse(() => api.get(`/categorie/${idParent}/enfants`)),
  search: async (params) => await verifierReponse(() => api.get("/categorie/search", { params })),

  create: async (data) => await verifierReponse(() => api.post('/categorie', data)),
  createMany: async (data) => await verifierReponse(() => api.post('/categorie/bulk', data)),
  update: async (id, data) => await verifierReponse(() => api.patch(`/categorie/${id}`, data)),
  remove: async (id) => await verifierReponse(() => api.delete(`/categorie/${id}`)),
  setStatut: async (id, etat) =>
    await verifierReponse(() => api.patch(`/categorie/${id}/statut`, { etat })),
  copierImage: async (data) => await verifierReponse(() => apiModel(data)),
  compteurs: async () => await verifierReponse(() => api.get("/categorie/coutMateriel")),
};