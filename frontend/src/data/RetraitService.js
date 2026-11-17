import { api } from "./Api";
import { verifierReponse } from './verifierReponse';

export const retraitService = {
  list: async () => await verifierReponse(() => api.get("/reservation")),

  detail: async (numReservation) =>
    await verifierReponse(() => api.get(`/reservation/${numReservation}`)),

  itemsDisponiblesParLigne: async (numReservation) =>
    await verifierReponse(() =>
      api.get(`/reservation/${numReservation}/items-disponibles`)
    ),

  creerMouvements: async (numReservation, ligneId, payload) =>
    await verifierReponse(() =>
      api.post(`/reservation/${numReservation}/lignes/${ligneId}/mouvements`, payload)
    ),

  validerRetrait: async (numReservation) =>
    await verifierReponse(() =>
      api.patch(`/reservation/${numReservation}/statut`, {
        statutLocation: "EN_COURS",
      })
    ),

  marquerPrete: async (numReservation) =>
    await verifierReponse(() =>
      api.patch(`/reservation/${numReservation}/prete`)
    ),

  remplacerMateriel: async (numReservation, idLigne, data) =>
    await verifierReponse(() =>
      api.patch(`/reservation/${numReservation}/lignes/${idLigne}`, data)
    ),
};