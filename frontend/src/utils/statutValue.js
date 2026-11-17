
export const STATUT_LOCATION = {
  EN_ATTENTE:            { label: "En attente",            cls: "badge-warning" },
  EN_ATTENTE_ACOMPTE:    { label: "En attente d'acompte",  cls: "badge-info" },
  CONFIRMEE:             { label: "Confirmée",             cls: "badge-success" },
  PRETE:                 { label: "Prête",                 cls: "badge-accent" },
  EN_COURS:              { label: "En cours",              cls: "badge-primary" },
  RETOUR_A_CONTROLER:    { label: "Retour à contrôler",    cls: "badge-warning" },
  TERMINEE:              { label: "Clôturée",              cls: "badge-success" },
  ANNULEE:               { label: "Annulée",               cls: "badge-error" },
  REFUSEE:               { label: "Refusée",               cls: "badge-error" },
  EXPIREE:               { label: "Expirée",               cls: "badge-ghost" },
};

export const MODES_RETRAIT = {
  SUR_PLACE: "Sur place",
  LIVRAISON: "Livraison",
};

export const ETAT_ITEM = {
  NEUF:       { label: "Neuf",       cls: "badge-success" },
  BON:        { label: "Bon",        cls: "badge-success" },
  USE:        { label: "Usé",        cls: "badge-warning" },
  ENDOMMAGE:  { label: "Endommagé",  cls: "badge-error" },
  PERDU:      { label: "Perdu",      cls: "badge-error" },
};

export const STATUT_ITEM = {
  disponible: { label: "Disponible", cls: "badge-success" },
  loue: { label: "Loué", cls: "badge-primary" },
  maintenance: { label: "Maintenance", cls: "badge-warning" },
  hors_service: { label: "Hors service", cls: "badge-error" },
};

  // export const STATUT_LOCATION = {
  //   EN_ATTENTE: { label: "En attente", color: "badge-warning" },
  //   CONFIRMEE: { label: "Confirmée", color: "badge-info" },
  //   EN_COURS: { label: "En cours", color: "badge-info" },
  //   TERMINEE: { label: "Terminée", color: "badge-primary" },
  //   ANNULEE: { label: "Annulée", color: "badge-error" },
  // };

  // export const ETAT_ITEM = {
  //   neuf: { label: "Neuf", cls: "badge-success" },
  //   bon: { label: "Bon état", cls: "badge-success" },
  //   use: { label: "Usure normale", cls: "badge-warning" },
  //   endommage: { label: "Endommagé", cls: "badge-error" },
  //   perdu: { label: "Perdu / manquant", cls: "badge-error" },
  // };

  export const ETATS_DEPART = ["neuf", "bon", "use"];
  export const ETATS_RETOUR = ["bon", "use", "endommage", "perdu"];
  export const ETATS_PROBLEME = ["endommage", "perdu"];
  
  export const STATUT_CATEGORIE = {
    actif: { label: "Actif", cls: "badge-success" },
    inactif: { label: "Inactif", cls: "badge-error" },
  };
  
  export const STATUT_PAIEMENT = {
    en_attente: { label: "En attente", cls: "badge-warning" },
    valide: { label: "Validé", cls: "badge-success" },
    annule: { label: "Annulé", cls: "badge-neutral" },
  };
  export const TYPES_PAIEMENT = [
    { value: "acompte", label: "Acompte" },
    { value: "solde", label: "Solde" },
    { value: "caution", label: "Caution" },
    { value: "penalite", label: "Pénalité" },
  ];
  export const MODES_PAIEMENT = [
    { value: "especes", label: "Espèces" },
    { value: "mvola", label: "MVola" },
    { value: "orange_money", label: "Orange Money" },
    { value: "airtel_money", label: "Airtel Money" },
    { value: "virement", label: "Virement" },
    { value: "carte", label: "Carte bancaire" },
  ];

  // export const MODES_RETRAIT = {
  //   sur_place: "Retrait sur place",
  //   livraison: "Livraison",
  // };
