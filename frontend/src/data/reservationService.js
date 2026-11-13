import api  from './Api';
import { verifierReponse } from './verifierReponse';

export const materielDispo = async (data) => {
    console.log("DATA: ", data)
    return await verifierReponse(() => api.post('/reservation/materiels-disponibles',data));
};

export const packsDisponibles = async (data) => {
    return await verifierReponse(() => api.post('/pack/disponibles', data));
};

export const listePacks = async () => {
    return await verifierReponse(() => api.get('/pack'));
};

export const createReservation = async (data) => {
    return await verifierReponse(() => api.post('/reservation/creer',data));
};

export const listeReservation = async (data) => {
    return await verifierReponse(() => api.post('/reservation/',data));
};

export const ReservationService = {
    list: async (params) => await verifierReponse(() => api.get("/reservation", params)),
    detail: async (id) => await verifierReponse(() => api.get(`/reservation/${id}`)),
    create: async (data) =>  await verifierReponse(() => api.post('/reservation', data)),
    update: async (id, data) => await verifierReponse(() => api.patch(`/reservation/${id}`, data)),
    remove: async (id) =>  await verifierReponse(() => api.delete(`/reservation/${id}`)),
    setStatut: async (id, data) =>  await verifierReponse(() =>  api.patch(`/reservation/${id}`,  data)),
    ajouterPaiement: (id, data) => api.post(`/reservations/${id}/paiements`, data),
  };
  
//   export const reservationService = {
//     list: (params) => api.get("/reservations", params),
//     get: (id) => api.get(`/reservations/${id}`),
//     setStatut: (id, statutLocation) => api.patch(`/reservations/${id}`, { statutLocation }),
//     ajouterPaiement: (id, data) => api.post(`/reservations/${id}/paiements`, data),
//   };