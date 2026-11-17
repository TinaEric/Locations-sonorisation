import { api } from "./Api";
import { verifierReponse } from "./verifierReponse";

export const retourService = {
  list: async () => await verifierReponse(() => api.get("/reservation")),
  detail: async (numReservation) =>
    await verifierReponse(() => api.get(`/reservation/${numReservation}`)),

  enregistrerRetourItem: async (numReservation, ligneId, payload) =>
    await verifierReponse(() =>
      api.post(
        `/reservation/${numReservation}/lignes/${ligneId}/retour`,
        payload
      )
    ),

  validerRetour: async (numReservation) =>
    await verifierReponse(() =>
      api.patch(`/reservation/${numReservation}/statut`, {
        statutLocation: "TERMINEE",
      })
    ),

  marquerIndisponible: async (numeroSerie, payload) =>
    await verifierReponse(() => api.patch(`/items/${numeroSerie}`, payload)),

  enregistrerSortie: async (numReservation) =>
    await verifierReponse(() =>
      api.patch(`/reservation/${numReservation}/statut`, {
        statutLocation: "EN_COURS",
      })
    ),

  enregistrerRetourGlobal: async (numReservation, dateRetourReel) =>
    await verifierReponse(() =>
      api.patch(`/reservation/${numReservation}/statut`, {
        statutLocation: "RETOUR_A_CONTROLER",
        dateRetourReel,
      })
    ),
    
  enregistrerRetour: async (idMouvement, payload) =>
    await verifierReponse(() =>
      api.patch(`/mouvements/${idMouvement}/retour`, payload)
    ),

  cloturer: async (numReservation) =>
    await verifierReponse(() =>
      api.patch(`/reservation/${numReservation}/cloturer`)
    ),
};
