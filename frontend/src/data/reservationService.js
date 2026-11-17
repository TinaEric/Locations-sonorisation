import { api } from "./Api";
import { verifierReponse } from "./verifierReponse";

const normalizeDateRange = (data = {}) => ({
  dateDebut: data.dateDebut,
  dateFin: data.dateFin,
  ...(data.categoriePack || data.type ? { categoriePack: data.categoriePack ?? data.type } : {}),
});

export const materielDispo = async (data) =>
  await verifierReponse(() => api.post("/reservation/materiels-disponibles", normalizeDateRange(data)));

export const packsDisponibles = async (data) =>
  await verifierReponse(() => api.post("/pack/disponibles", normalizeDateRange(data)));

export const getPackDetail = async (id) => await verifierReponse(() => api.get(`/pack/${id}`));

export const ReservationService = {
  list: async (params) => await verifierReponse(() => api.get("/reservation", { params })),
  detail: async (id) => await verifierReponse(() => api.get(`/reservation/${id}`)),
  create: async (data) => await verifierReponse(() => api.post("/reservation", data)),
  update: async (id, data) => await verifierReponse(() => api.patch(`/reservation/${id}`, data)),
  remove: async (id) => await verifierReponse(() => api.delete(`/reservation/${id}`)),
  setStatut: async (id, statutLocation) =>
    await verifierReponse(() => api.patch(`/reservation/${id}/statut`, { statutLocation })),
  verifierDisponibilite: async (id) =>
    await verifierReponse(() => api.get(`/reservation/${id}/verifieDisponibilite`)),
  
  materielDispo : async (data) =>
    await verifierReponse(() => api.post("/reservation/materiels-disponibles", normalizeDateRange(data))),
  
  packsDisponibles: async (data) => {
    const payload = {
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
    };
    return verifierReponse(() => api.post("/pack/disponibles/confirmes", payload));
  },
  accepter: async (id, payload) =>
    await verifierReponse(() => api.patch(`/reservation/${id}/accepter`, payload)),

  refuser: async (id, motif) =>
    await verifierReponse(() => api.patch(`/reservation/${id}/refuser`, { motif })),

  annuler: async (id, motif) =>
    await verifierReponse(() => api.patch(`/reservation/${id}/annuler`, { motif })),

  marquerPrete: async (id) =>
    await verifierReponse(() => api.patch(`/reservation/${id}/prete`)),

  enregistrerSortie: async (id, payload) =>
    await verifierReponse(() => api.patch(`/reservation/${id}/sortie`, payload)),

  enregistrerRetour: async (id, payload) =>
    await verifierReponse(() => api.patch(`/reservation/${id}/retour`, payload)),

  cloturer: async (id) =>
    await verifierReponse(() => api.patch(`/reservation/${id}/cloturer`)),

  itemsDisponibles: async (id) =>
    await verifierReponse(() => api.get(`/reservation/${id}/items-disponibles`)),

  creerMouvements: async (numReservation, ligneId, payload) =>
    await verifierReponse(() => api.post(`/reservation/${numReservation}/lignes/${ligneId}/mouvements`, payload)),

  ajouterPaiement: async (data) =>
    await verifierReponse(() => api.post(`/paiement`, data)),
};
