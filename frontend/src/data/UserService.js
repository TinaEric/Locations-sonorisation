import { api } from "./Api";
import { verifierReponse } from './verifierReponse';

/* ---------- Auth ---------- */
export const connexion = async (data) => {
  return await verifierReponse(() => api.post('/auth/login', data));
};

export const motDePasseOublie = async (data) => {
  return await verifierReponse(() => api.post('/auth/mot-de-passe-oublie', data));
};

/* ---------- Notifications ---------- */
export const marqueLue = async (data) => {
  return await verifierReponse(() => api.post('/notifications/marqueLue', data));
};

export const listeNotification = async (idUser) => {
  return await verifierReponse(() => api.get(`/notifications/${idUser}/parUser`));
};

/* ---------- Utilisateur ---------- */
export const profileClient = async (idUser) => {
  return await verifierReponse(() => api.get(`/utilisateur/${idUser}`));
};

export const inscription = async (data) => {
  return await verifierReponse(() => api.post('/utilisateur', data));
};

export const userService = {
  // Lecture
  list: async () => await verifierReponse(() => api.get('/utilisateur')),
  listLocataires: async () => await verifierReponse(() => api.get('/utilisateur/locataire')),
  detail: async (idUser) => await verifierReponse(() => api.get(`/utilisateur/${idUser}`)),

  // Écriture
  create: async (data) => await verifierReponse(() => api.post('/utilisateur', data)),
  update: async (idUser, data) => await verifierReponse(() => api.patch(`/utilisateur/${idUser}`, data)),
  remove: async (idUser) => await verifierReponse(() => api.delete(`/utilisateur/${idUser}`)),

  // Mot de passe
  changePassword: async (data) => await verifierReponse(() => api.post('/utilisateur/changePassword', data)),

  // Profil (auth)
  profile: async () => await verifierReponse(() => api.get('/utilisateur/profile')),

  // Raccourcis statut (via PATCH classique)
  setStatut: async (idUser, statutCompte) =>
    await verifierReponse(() => api.patch(`/utilisateur/${idUser}`, { statutCompte })),
  setRole: async (idUser, role) =>
    await verifierReponse(() => api.patch(`/utilisateur/${idUser}`, { role })),
};