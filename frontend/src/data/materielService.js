import api  from './Api';
import { verifierReponse } from './verifierReponse';

export const materielService = {
  list: async (params) => await verifierReponse(() => api.get("/materiel", params)),
  detail: async (id) => await verifierReponse(() => api.get(`/materiel/${id}`)),
  create: async (data) =>  await verifierReponse(() => api.post('/materiel', data)),
  update: async (id, data) => await verifierReponse(() => api.patch(`/materiel/${id}`, data)),
  remove: async (id) =>  await verifierReponse(() => api.delete(`/materiel/${id}`)),
  setStatut: async (id, statutCategorie) =>  await verifierReponse(() =>  api.patch(`/materiel/${id}`,  {statutCategorie})),
};

