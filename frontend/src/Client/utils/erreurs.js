// Client/utils/erreurs.js
export const extraireMessageErreur = (erreur, defaut = "Une erreur est survenue. Réessayez.") => {
  const brut = erreur?.response?.data?.message ?? erreur?.message;
  if (Array.isArray(brut)) return brut.join(" · ");
  return typeof brut === "string" && brut ? brut : defaut;
};
