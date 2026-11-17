# Module Client — notes d'intégration

## Fichiers (à copier dans `/src/`)

```
data/CatalogueService.js            arborescence catégories → matériels
data/CalendrierService.js           calendrier mensuel matériel / pack
layouts/LayoutClient.jsx            navbar (panier, connexion), footer, <Outlet/>
Routes/ClientRoute.jsx              routes client (publiques + protégées)
Routes/ClientProviders.jsx          PanierProvider
Client/
  contexts/PanierContext.jsx        panier + période (localStorage)
  hooks/useCatalogue.js             catégories, matériels à plat, packs actifs
  hooks/useDisponibilites.js        disponibilité de tout le catalogue sur une période
  utils/                            constantes, formatage, recherche, disponibilite,
                                    tarification, construireReservation, erreurs, sessionPaiement
  components/commun|catalogue|calendrier|panier/
  pages/                            Accueil, Catalogue, DetailMateriel, DetailPack, Panier,
                                    FormulaireReservation, PaiementMvola,
                                    ConfirmationReservation, ProfilClient
```

Routes : `/`, `/catalogue`, `/materiel/:code`, `/pack/:code`, `/panier`,
`/reservation`*, `/paiement/:numReservation`*, `/confirmation/:numReservation`*, `/profil`* (*connexion requise).

## Hypothèses à vérifier (ajustez si votre code diffère)

1. `verifierReponse` renvoie directement les données (pas l'objet axios).
2. `useToast` est exporté de `src/contexts/toastContext` (chemin/casse à adapter dans 4 fichiers : CarteMateriel, CartePack, pages).
3. `AuthProvider` et le provider de toast sont montés plus haut (main.jsx), comme pour l'admin.
4. `user.idUser` existe dans l'objet renvoyé par `profileClient`.
5. Réponse de `POST /reservation` : contient `numReservation` (sinon `id`).
6. `MODES_RETRAIT` (`utils/constantes.js`) : mettre les vraies valeurs de l'enum `ModeRetrait`.
7. `TAUX_ACOMPTE = 30 %` du total de location (`utils/constantes.js`). Durée = jours inclusifs (du 10 au 12 = 3 jours).
8. Devise affichée : Ar.
9. Paiement : `ReservationService.ajouterPaiement(num, { montant, modePaiement:"MVOLA", typePaiement:"ACOMPTE", numeroTelephone, referenceTransaction })` — adaptez au DTO réel.
10. Les endpoints `/categorie/arborescence`, `/pack`, `/pack/:code`, `/pack/disponibles`, `/reservation/materiels-disponibles` doivent être **publics** (sans JWT) pour les visiteurs non connectés.
11. Disponibilités : `normaliserDisponibilites` accepte une liste de codes, une liste d'objets (`disponible` / `quantiteDisponible`) ou une arborescence. **Un code absent de la réponse = indisponible.**
12. Un panier = soit **un pack**, soit des **matériels** (limite de `CreateReservationDto` ; le mode `personnalise` n'est pas géré côté interface).

## Retour après connexion (Login.jsx, à modifier)

Le panier envoie `navigate("/auth/login", { state: { from: "/reservation" } })`. Dans `layouts/Login.jsx` :

```jsx
const location = useLocation();
// après un login réussi :
const destination = resultat.role === "LOCATAIRE"
  ? (location.state?.from ?? "/")
  : redirectionRouteParRole(resultat.role);
navigate(destination, { replace: true });
```

(`ProtectLogin` doit aussi utiliser `location.state?.from` s'il redirige un utilisateur déjà connecté.)

## Endpoints à ajouter côté NestJS (calendrier)

```
GET /materiel/:codeMateriel/calendrier?mois=2026-11   (public)
GET /pack/:codePack/calendrier?mois=2026-11           (public)
```

Réponse attendue :

```json
{
  "quantiteTotale": 4,
  "jours": [
    { "date": "2026-11-20", "quantiteDisponible": 1 },
    { "date": "2026-11-21", "quantiteDisponible": 0 }
  ]
}
```

- Ne lister que les jours où `quantiteDisponible < quantiteTotale` ; les autres sont libres.
- Pour un jour J : `quantiteDisponible = quantiteTotale − Σ quantités des lignes de réservations actives (non annulées/refusées) dont [dateDebutPrevue, dateFinPrevue] contient J`.
- Pack : `min` sur ses composants de `floor(dispoMatériel / quantiteComposant)`.
- Le « temps réel » côté client = rafraîchissement toutes les 30 s (`INTERVALLE_TEMPS_REEL_MS`). Pour du push réel, réutilisez la gateway WebSocket `notifications`.

## Test rapide de la simulation Mvola

Numéro `034 12 345 67`, puis n'importe quel code à 4 chiffres. Code `0000` = paiement refusé.
