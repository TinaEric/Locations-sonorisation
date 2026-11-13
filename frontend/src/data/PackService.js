import api  from './Api';
import { verifierReponse } from './verifierReponse';

export const PackService = {
  list: async () => await verifierReponse(() => api.get("/pack")),
  detail: async (codePack) => await verifierReponse(() => api.get(`/pack/${codePack}`)),
  create: async (data) =>  await verifierReponse(() => api.post('/pack', data)),
  update: async (codePack, data) => await verifierReponse(() => api.patch(`/pack/${codePack}`, data)),
  remove: async (codePack) =>  await verifierReponse(() => api.delete(`/pack/${codePack}`)),
  setStatut: async (codePack, statut) =>  await verifierReponse(() =>  api.patch(`/pack/${codePack}`,  {statut})),
  getTypeEvenement: async () => await verifierReponse(() => api.get('/pack/typeEvenement')),
  packsDisponibles: async (data) => await verifierReponse(() => api.post('/pack/disponibles', data)),
  affecterMateriel: async (codePack, data) => await verifierReponse(() => api.post(`/pack/${codePack}/composants`, data)),
};

export const packsDisponibles = async (data) => {
  return await verifierReponse(() => api.post('/pack/disponibles', data));
};

export const listePacks = async () => {
  return await verifierReponse(() => api.get('/pack'));
};

export const detailPack = async (codePack) => {
  return await verifierReponse(() => api.get(`/pack/${codePack}`));
};

export const getTypeEvenement = async () => {
  return await verifierReponse(() => api.get('/pack/typeEvenement'));
};
