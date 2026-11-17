import { api } from "./Api";
import { verifierReponse } from "./verifierReponse";

export const paiementService = {
  listByReservation: async (numReservation) =>
    await verifierReponse(() => api.get(`/paiement/reservation/${numReservation}`)),
  create: async (data) =>
    await verifierReponse(() => api.post("/paiement", data)),
};