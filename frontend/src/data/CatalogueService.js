import { api } from "./Api";
import { verifierReponse } from "./verifierReponse";

export const CatalogueService = {
  arborescence: async () => await verifierReponse(() => api.get("/categorie/arborescence")),
};
