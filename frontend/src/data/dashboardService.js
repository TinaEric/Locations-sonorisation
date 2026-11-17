import {api} from "./Api";
import { verifierReponse } from './verifierReponse';

export const DashboardService = {
    users: async () => await verifierReponse(() => api.get("/utilisateur/locataire")), 
    statsMateriel: async () => await verifierReponse(() => api.get("/categorie/coutMateriel")), 
    getStats: async () => await verifierReponse(() => api.get("/dashboard/stats")), // Retourne { totalReservations, chiffreAffaire, retraitsEnAttente, retoursEnAttente, ... }
    getReservationsRecentes: async () => await verifierReponse(() =>api.get("/reservations/recent")),
};