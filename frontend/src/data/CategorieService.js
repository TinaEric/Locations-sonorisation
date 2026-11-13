import api  from './Api';
import { verifierReponse } from './verifierReponse';

export const categorieService = {
  list: async (params) => await verifierReponse(() => api.get("/categorie", params)),
  detail: async (id) => await verifierReponse(() => api.get(`/categorie/${id}`)),
  create: async (data) =>  await verifierReponse(() => api.post('/categorie', data)),
  update: async (id, data) => await verifierReponse(() => api.patch(`/categorie/${id}`, data)),
  remove: async (id) =>  await verifierReponse(() => api.delete(`/categorie/${id}`)),
  setStatut: async (id, statutCategorie) =>  await verifierReponse(() =>  api.patch(`/categorie/${id}`,  {statutCategorie})),
};
