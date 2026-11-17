
export async function verifierReponse(appel) {
    try {
      const result = await appel();
      return result.data ?? null;
    } catch (erreur) {
      console.log('ERREUR INTERNE: ', erreur);
      const brut = erreur.response?.data?.message;
      const message = Array.isArray(brut)
        ? brut.join(' · ')
        : (brut ?? (erreur.response ? `Erreur ${erreur.response.status} du serveur` : 'Le serveur ne répond pas'));
      const e = new Error(message);
      e.status = erreur.response?.status;
      throw e;
    }
  }
