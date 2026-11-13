// Tolère les variantes de noms de champs renvoyées par l'API (casse, alias).

export const categorieId = (c) => c?.idCategorie ?? c?.id;

export const normalizeMateriel = (m) => ({
  code: m.CodeMateriel ?? m.codeMateriel,
  designation: m.designation ?? m.Designation,
  marque: m.marque,
  detailTechnique: m.detailTechnique ?? m.detailtechnique,
  imageUrl: m.imageURL ?? m.imageUrl,
  prixLocation: Number(m.prixLocation ?? m.tarifJournalier ?? 0),
  prixCaution: Number(m.prixCaution ?? 0),
});

export const normalizeCategorie = (c) =>
  c && {
    id: categorieId(c),
    code: c.codeCategorie,
    libelle: c.libelle,
    description: c.descriptionCategorie ?? c.description,
    type: c.typeCategorie,
    statut: c.statutCategorie,
    materiels: (c.materiels || []).map(normalizeMateriel),
  };
