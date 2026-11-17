import { api } from "./Api";
import { verifierReponse } from './verifierReponse';

export const PackService = {
  list: async () => await verifierReponse(() => api.get("/pack")),
  detail: async (codePack) => await verifierReponse(() => api.get(`/pack/${codePack}`)),
  create: async (data) => await verifierReponse(() => api.post('/pack', data)),
  update: async (codePack, data) => await verifierReponse(() => api.patch(`/pack/${codePack}`, data)),
  remove: async (codePack) => await verifierReponse(() => api.delete(`/pack/${codePack}`)),

  addComposants: async (codePack, data) =>
    await verifierReponse(() => api.post(`/pack/${codePack}/composants`, data)),

  removeComposant: async (id) => await verifierReponse(() => api.delete(`/composant-pack/${id}`)),
  updateComposant: async (id, data) => await verifierReponse(() => api.patch(`/composant-pack/${id}`, data)),
  changeQuantite: async (data) => await verifierReponse(() => api.post('/composant-pack/change-quantite', data)),

  setStatut: async (codePack, statut) =>
    await verifierReponse(() => api.patch(`/pack/${codePack}`, { statutPack: statut })),
  getCategories: async () => await verifierReponse(() => api.get('/pack/categories')),
  packsDisponibles: async (data) => await verifierReponse(() => api.post('/pack/disponibles', data)),
  findOnePublic: async (codePack, data) =>
    await verifierReponse(() => api.post(`/pack/${codePack}/public`, data)),
};

// export const packsDisponibles = async (data) => await verifierReponse(() => api.post('/pack/disponibles', data));
// export const listePacks = async () => await verifierReponse(() => api.get('/pack'));
// export const detailPack = async (codePack) => await verifierReponse(() => api.get(`/pack/${codePack}`));
// export const getCategories = async () => await verifierReponse(() => api.get('/pack/categories'));