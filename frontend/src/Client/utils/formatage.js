// Client/utils/formatage.js
import { IMAGES_URL } from "../../data/Api";
import { DEVISE } from "./constantes";

export const urlImage = (nomFichier) => (nomFichier ? `${IMAGES_URL}/${nomFichier}` : null);

export const formaterPrix = (valeur) =>
  `${new Intl.NumberFormat("fr-FR").format(Math.round(Number(valeur) || 0))} ${DEVISE}`;

// Accepte "YYYY-MM-DD" ou une date ISO complète
export const formaterDate = (iso) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

export const remplirZero = (nombre) => String(nombre).padStart(2, "0");

// "YYYY-MM-DD" en heure locale
export const aujourdhuiISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${remplirZero(d.getMonth() + 1)}-${remplirZero(d.getDate())}`;
};

// Nombre de jours de location, début et fin inclus (0 si période invalide)
export const nombreDeJours = (dateDebut, dateFin) => {
  if (!dateDebut || !dateFin) return 0;
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime()) || fin < debut) return 0;
  return Math.round((fin - debut) / 86400000) + 1;
};

// --- Arborescence catégories ---------------------------------------------

// Liste à plat des matériels, avec leur catégorie et les ids de leurs ancêtres
export const aplatirMateriels = (arbre = [], ancetres = []) =>
  arbre.flatMap((categorie) => {
    const ids = [...ancetres, categorie.idCategorie];
    const directs = (categorie.materiels ?? []).map((materiel) => ({
      ...materiel,
      categorieId: categorie.idCategorie,
      categorieLibelle: categorie.libelle,
      categorieIds: ids,
    }));
    return [...directs, ...aplatirMateriels(categorie.enfants ?? [], ids)];
  });

export const aplatirCategories = (arbre = []) =>
  arbre.flatMap((categorie) => [
    ...(categorie.statutCategorie === "actif" || !categorie.statutCategorie ? [categorie] : []),
    ...aplatirCategories(categorie.enfants ?? []),
  ]);
