// Client/utils/recherche.js
export const normaliserTexte = (texte = "") =>
  String(texte)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const contientTous = (termes, champs) => {
  const botteDeFoin = normaliserTexte(champs.filter(Boolean).join(" "));
  return termes.every((terme) => botteDeFoin.includes(terme));
};

const decouperTermes = (recherche) => normaliserTexte(recherche).split(/\s+/).filter(Boolean);

// Recherche par nom, marque, code matériel ou mot-clé (détail technique, catégorie)
export const materielCorrespond = (materiel, recherche) =>
  contientTous(decouperTermes(recherche), [
    materiel.designation,
    materiel.marque,
    materiel.CodeMateriel,
    materiel.detailTechnique,
    materiel.categorieLibelle,
  ]);

export const packCorrespond = (pack, recherche) =>
  contientTous(decouperTermes(recherche), [
    pack.libelle,
    pack.codePack,
    pack.description,
    pack.categoriePack,
    ...(pack.usages ?? []),
  ]);
