import {api}  from '../../data/Api';
import { verifierReponse } from '../../data/verifierReponse';
/**
 * Contrat d'API attendu (adaptez les routes à votre backend).
 * Noms de champs en camelCase, d'après le diagramme de classes ; la clé primaire
 * de chaque ressource est `id`.
 *
 * AUTH
 *   POST   /auth/login                 { email, password } -> { token, user }
 *   GET    /auth/me                    -> Utilisateur
 *
 * CATÉGORIES            { id, codeCategorie, libelle, description, typeCategorie, statutCategorie }
 *   GET/POST /categories      PUT/DELETE /categories/:id      PATCH /categories/:id/statut { statutCategorie }
 *
 * MATÉRIELS             { id, codeMateriel, designation, marque, detailTechnique, imageUrl,
 *                         tarifJournalier, prixCaution, categorie, nbItems, nbItemsDisponibles }
 *   GET ?search=&idCategorie=   POST   PUT/DELETE /materiels/:id
 *   (écriture : idCategorie au lieu de categorie)
 *
 * ITEMS (exemplaires)   { id, numeroSerie, etatItem, statutItem, emplacement, materiel }
 *   GET /items?idMateriel=&statutItem=   POST   PUT/DELETE /items/:id
 *
 * PACKS                 { id, nomPack, description, prixBase, typeEvenement, capacitePersonne, actif,
 *                         composants: [{ id, materiel, quantite, obligatoire }] }
 *   GET/POST /packs   PUT/DELETE /packs/:id   (écriture : composants: [{ idMateriel, quantite, obligatoire }])
 *
 * RÉSERVATIONS          { id, numReservation, dateCreation, dateDebutPrevue, dateFinPrevue, statutLocation,
 *                         lieuEvenement, remarques, dateRetourReel, modeRetrait, fraisLivraison, montantTotal,
 *                         utilisateur, paiements: [...],
 *                         lignes: [{ id, quantite, tarifApplique, typeItem: 'materiel'|'pack',
 *                                    materiel?, pack?, mouvements: [{ id, dateMouvement, etatDepart,
 *                                    etatRetour, accessoire, item }] }] }
 *   GET /reservations?statutLocation=&search=     GET /reservations/:id
 *   PATCH /reservations/:id/statut   { statutLocation }  (confirmee | refusee | annulee)
 *   POST  /reservations/:id/paiements { typePaiement, modePaiement, montantPaye, referencePaiement }
 *
 * RETRAIT (crée les Mouvements, items -> loue, réservation -> en_cours)
 *   POST /reservations/:id/retrait { observations, mouvements: [{ idLigne, idItem, etatDepart, accessoire }] }
 *
 * RETOUR (renseigne etatRetour, items -> disponible/maintenance, réservation -> terminee ;
 *         une pénalité crée un Paiement de type "penalite")
 *   POST /reservations/:id/retour { dateRetourReel, observations,
 *           mouvements: [{ idMouvement, etatRetour, accessoire }], penalite?: { montant, motif } }
 *
 * NOTIFICATIONS         { id, dateCreate, message, lue, type }
 *   GET /notifications   PATCH /notifications/:id { lue }   DELETE /notifications/:id
 *
 * STATS
 *   GET /stats -> { itemsDisponibles, reservationsEnAttente, retraitsAFaire, retoursAttendus,
 *                   chiffreAffaires?, penalitesMois? }
 */

export const authService = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
};

export const statsService = { get: () => api.get("/stats") };

export const categorieService = {
  list: async (params) => await verifierReponse(() => api.get("/categorie", params)),
  detail: async (id) => await verifierReponse(() => api.get(`/categorie/${id}`)),
  create: async (data) =>  await verifierReponse(() => api.post('/categorie', data)),
  update: async (id, data) => await verifierReponse(() => api.patch(`/categorie/${id}`, data)),
  remove: async (id) =>  await verifierReponse(() => api.delete(`/categorie/${id}`)),
  setStatut: async (id, statutCategorie) =>  await verifierReponse(() =>  api.patch(`/categorie/${id}`,  {statutCategorie})),
};

export const materielService = {
  list: (params) => api.get("/materiel", params),
  create: (data) => api.post("/materiel", data),
  update: (id, data) => api.patch(`/materiel/${id}`, data),
  remove: (id) => api.delete(`/materiel/${id}`),
};

export const itemService = {
  list: (params) => api.get("/items", params),
  create: (data) => api.post("/items", data),
  update: (id, data) => api.patch(`/items/${id}`, data),
  remove: (id) => api.delete(`/items/${id}`),
};

export const packService = {
  list: (params) => api.get("/pack", params),
  create: (data) => api.post("/pack", data),
  update: (id, data) => api.patch(`/pack/${id}`, data),
  remove: (id) => api.delete(`/pack/${id}`),
};

export const reservationService = {
  list: (params) => api.get("/reservations", params),
  get: (id) => api.get(`/reservations/${id}`),
  setStatut: (id, statutLocation) => api.patch(`/reservations/${id}/statut`, { statutLocation }),
  ajouterPaiement: (id, data) => api.post(`/reservations/${id}/paiements`, data),
};

export const retraitService = {
  enregistrer: (reservationId, data) => api.post(`/reservations/${reservationId}/retrait`, data),
};

export const retourService = {
  enregistrer: (reservationId, data) => api.post(`/reservations/${reservationId}/retour`, data),
};

export const notificationService = {
  list: (params) => api.get("/notifications", params),
  setLue: (id, lue) => api.patch(`/notifications/${id}`, { lue }),
  remove: (id) => api.delete(`/notifications/${id}`),
};
