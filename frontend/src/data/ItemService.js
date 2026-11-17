import { api } from "./Api";
import { verifierReponse } from './verifierReponse';

export const ItemService = {
  list: async (params) => await verifierReponse(() => api.get("/items", { params })),
  search: async (params) => await verifierReponse(() => api.get("/items/search", { params })),
  detail: async (id) => await verifierReponse(() => api.get(`/items/${id}`)),
  create: async (data) => await verifierReponse(() => api.post('/items', data)),
  update: async (id, data) => await verifierReponse(() => api.patch(`/items/${id}`, data)),
  remove: async (id) => await verifierReponse(() => api.delete(`/items/${id}`)),
  // Item n'a pas de "statutCategorie" — on change statutItem via update classique
  setStatut: async (id, statutItem) =>
    await verifierReponse(() => api.patch(`/items/${id}`, { statutItem })),
};