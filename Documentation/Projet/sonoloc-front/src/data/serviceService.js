import { apiGet } from "./apiClient";

/** Services (livraison, installation, technicien…) : GET /services */
export const serviceService = {
  getServices(signal) {
    return apiGet("/services", { actif: true }, signal);
  },
};

/** Majorations et promotions actives : GET /tarification/majorations, /tarification/promotions */
export const tarificationService = {
  getMajorationsActives(signal) {
    return apiGet("/tarification/majorations", { actif: true }, signal);
  },
  getPromotionsActives(signal) {
    return apiGet("/tarification/promotions", { actif: true }, signal);
  },
};
