import { Boxes, Music, Zap } from "lucide-react";

export const toNumber = (v) =>
  Number.isFinite(Number(v)) ? Number(v) : 0;

export const LABELS_CATEGORIE = {
  conference: "Conférence",
  soiree: "Soirée",
  mariage: "Mariage",
  concert: "Concert",
};

export const LABELS_TYPE_LIEU = {
  interieur: "Intérieur",
  exterieur: "Extérieur",
  mixte: "Mixte",
};

export const getMaterielIcon = (materiel) => {
  const code = `${materiel?.CodeMateriel ?? ""} ${
    materiel?.designation ?? ""
  }`.toUpperCase();
  if (
    code.includes("SON") ||
    code.includes("MICRO") ||
    code.includes("ENCEINTE") ||
    code.includes("MIXAGE")
  )
    return Music;
  if (
    code.includes("ECL") ||
    code.includes("LED") ||
    code.includes("PROJECTEUR")
  )
    return Zap;
  return Boxes;
};