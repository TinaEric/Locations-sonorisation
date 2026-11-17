// Client/hooks/useCatalogue.js
// Charge le catalogue statique : catégories, matériels à plat et packs actifs.
import { useEffect, useMemo, useState } from "react";
import { CatalogueService } from "../../data/CatalogueService";
import { PackService } from "../../data/PackService";
import { extraireMessageErreur } from "../utils/erreurs";
import { aplatirCategories, aplatirMateriels } from "../utils/formatage";

export default function useCatalogue() {
  const [arbre, setArbre] = useState([]);
  const [tousLesPacks, setTousLesPacks] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    let annule = false;
    const charger = async () => {
      try {
        const [arbreRecu, packsRecus] = await Promise.all([CatalogueService.arborescence(), PackService.list()]);
        if (annule) return;
        setArbre(Array.isArray(arbreRecu) ? arbreRecu : []);
        setTousLesPacks(Array.isArray(packsRecus) ? packsRecus : []);
      } catch (e) {
        if (!annule) setErreur(extraireMessageErreur(e, "Impossible de charger le catalogue."));
      } finally {
        if (!annule) setChargement(false);
      }
    };
    charger();
    return () => {
      annule = true;
    };
  }, []);

  const materiels = useMemo(() => aplatirMateriels(arbre), [arbre]);
  const categories = useMemo(() => aplatirCategories(arbre), [arbre]);
  const packs = useMemo(
    () => tousLesPacks.filter((p) => String(p.statutPack ?? "actif").toLowerCase() === "actif"),
    [tousLesPacks],
  );

  return { materiels, categories, packs, chargement, erreur };
}
