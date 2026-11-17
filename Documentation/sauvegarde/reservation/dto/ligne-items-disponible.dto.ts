import { Materiel } from '../../../Catalogue/materiel/entities/materiel.entity.js';
import { Item } from '../../../Catalogue/item/entities/item.entity.js';

export interface LigneItemsDisponibles {
  ligneId: number;
  quantite: number;                 // nombre d'items à remettre
  materiel: Materiel;
  itemsDisponibles: Item[];
  nombreDisponible: number;
  suffisant: boolean;               // false => retrait impossible tel quel
}