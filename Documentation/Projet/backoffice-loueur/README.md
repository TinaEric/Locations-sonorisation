# Back Office Loueur

Interface d'administration du **Loueur** pour le système de gestion de location de matériel.
Stack : React 18, Vite, Tailwind CSS 4, daisyUI 5, lucide-react, react-router.

## Démarrage

```bash
npm install
cp .env.example .env     # adaptez VITE_PROXY_TARGET à votre backend
npm run dev
```

## Correspondance avec les diagrammes

| Cas d'utilisation / classe | Page |
|---|---|
| S'authentifier (Utilisateur) | `/login` |
| Gérer matériel (Materiel, Item) | `/materiels` : fiche matériel + exemplaires (n° de série, état, statut) |
| Catalogue (Categorie, Pack, ComposantPack) | `/categories`, `/packs` |
| Gérer réservation (Reservation, LigneLocation, Paiement) | `/reservations` : confirmation/refus, détail, paiements |
| Gérer retrait (Mouvement : etatDepart) | `/retraits` : affectation d'un Item à chaque unité louée |
| Gérer le retour (Mouvement : etatRetour) | `/retours` : contrôle de l'état + pénalité (extend) |
| Notification | `/notifications` |

## Contrat d'API

Toutes les routes et les formes de données attendues sont documentées en tête de `src/api/services.js`.
Les noms de champs suivent le diagramme de classes en camelCase ; la clé primaire est `id`.
