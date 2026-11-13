import api  from './Api';
import { verifierReponse } from './verifierReponse';

export const ItemService = {
  list: async (params) => await verifierReponse(() => api.get("/items", params)),
  detail: async (id) => await verifierReponse(() => api.get(`/items/${id}`)),
  create: async (data) =>  await verifierReponse(() => api.post('/items', data)),
  update: async (id, data) => await verifierReponse(() => api.patch(`/items/${id}`, data)),
  remove: async (id) =>  await verifierReponse(() => api.delete(`/items/${id}`)),
  setStatut: async (id, statutCategorie) =>  await verifierReponse(() =>  api.patch(`/items/${id}`,  {statutCategorie})),
};