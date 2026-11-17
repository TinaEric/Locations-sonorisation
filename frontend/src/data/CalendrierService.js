import { api } from "./Api";
import { verifierReponse } from "./verifierReponse";


export const CalendrierService = {
  fabriquerChargeur(type, code) {
    return async (moisISO) => {
      const url =
        type === "pack"
          ? `/calendrier/pack/${encodeURIComponent(code)}`
          : `/calendrier/materiel/${encodeURIComponent(code)}`;
      return verifierReponse(() =>
        api.post(url, { mois: moisISO }),
      );
    };
  },
  materiel: async (codeMateriel, mois) =>
    await verifierReponse(() => api.get(`/materiel/${codeMateriel}/calendrier`, { params: { mois } })),

  pack: async (codePack, mois) =>
    await verifierReponse(() => api.get(`/pack/${codePack}/calendrier`, { params: { mois } })),
};
