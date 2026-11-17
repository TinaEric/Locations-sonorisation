// src/Client/utils/catalogue.js
import {
    Mic,
    PartyPopper,
    Heart,
    Guitar,
    Speaker,
    Lightbulb,
    SlidersHorizontal,
    Cable,
    MonitorSpeaker,
    Disc3,
    Box,
    Music,
  } from "lucide-react";
  
  /* ============ PACKS ============ */
  export const CATEGORIES_PACK = [
    { value: "conference", label: "Conférence", icon: Mic },
    { value: "soiree", label: "Soirée", icon: PartyPopper },
    { value: "mariage", label: "Mariage", icon: Heart },
    { value: "concert", label: "Concert", icon: Guitar },
  ];
  
  export const TYPES_LIEU = [
    { value: "interieur", label: "Intérieur" },
    { value: "exterieur", label: "Extérieur" },
    { value: "mixte", label: "Mixte" },
  ];
  
  export const USAGES_PACK = ["Discours", "DJ", "Musique de fond", "Live"];
  
  /* ============ MATÉRIEL ============ */
  export const TYPES_CATEGORIE_BACKEND = {
    sonorisation: "Sonorisation",
    eclairage: "Éclairage",
    instrument: "Instruments",
    dj: "DJ",
  };
  
  /**
   * Sous-catégories affichables côté UI.
   * Le champ `icon` contient directement le composant Lucide à rendre.
   */
  export const SOUS_CATEGORIES = [
    {
      slug: "enceintes",
      label: "Enceintes",
      icon: Speaker,
      test: (m) => /enceinte|caisson|subwoofer|speaker/i.test(m.designation),
    },
    {
      slug: "caissons",
      label: "Caissons de basses",
      icon: Speaker,
      test: (m) => /caisson|subwoofer|sub\b/i.test(m.designation),
    },
    {
      slug: "consoles",
      label: "Consoles",
      icon: SlidersHorizontal,
      test: (m) => /console|table.*mix|mixage|equaliseur|equalizer/i.test(m.designation),
    },
    {
      slug: "micros",
      label: "Micros",
      icon: Mic,
      test: (m) => /micro/i.test(m.designation),
    },
    {
      slug: "pieds",
      label: "Pieds",
      icon: MonitorSpeaker,
      test: (m) => /pied|stand|trépied|trepied/i.test(m.designation),
    },
    {
      slug: "cables",
      label: "Câbles",
      icon: Cable,
      test: (m) => /cable|câble|xrl|jack/i.test(m.designation),
    },
    {
      slug: "retours",
      label: "Retours de scène",
      icon: MonitorSpeaker,
      test: (m) => /retour|monitor|wedge/i.test(m.designation),
    },
    {
      slug: "eclairage",
      label: "Éclairage",
      icon: Lightbulb,
      test: (m, c) => c?.typeCategorie === "eclairage" || /led|projecteur|lyre|par\b|chauvet/i.test(m.designation),
    },
    {
      slug: "instruments",
      label: "Instruments",
      icon: Guitar,
      test: (m, c) => c?.typeCategorie === "instrument" || /guitare|clavier|batterie|bass|piano/i.test(m.designation),
    },
    {
      slug: "dj",
      label: "DJ",
      icon: Disc3,
      test: (m, c) => c?.typeCategorie === "dj" || /dj|platine|pioneer/i.test(m.designation),
    },
    {
      slug: "accessoires",
      label: "Accessoires",
      icon: Box,
      test: () => true,
    },
  ];
  
  /* ============ TRIS ============ */
  export const TRIS = [
    { value: "pertinence", label: "Pertinence" },
    { value: "prix_asc", label: "Prix croissant" },
    { value: "prix_desc", label: "Prix décroissant" },
  ];