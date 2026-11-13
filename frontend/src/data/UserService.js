import api  from './Api';
import { verifierReponse } from './verifierReponse';

export const connexion = async (data) => {
    return await verifierReponse(() => api.post('/auth/login', data));
};

export const profileClient = async (idUser) => {
    return await verifierReponse(() => api.get(`/utilisateur/${idUser}`));
};

export const inscription = async (data) => {
    return await verifierReponse(() => api.post('/utilisateur', data));
};

export const motDePasseOublie = async (data) => {
    return await verifierReponse(() => api.post('/auth/mot-de-passe-oublie', data));
};