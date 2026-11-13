
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

// export async function verifierReponse(urlAxios) {
//     try{
//         const result = await urlAxios();
//         const requete = result.data;

//         console.log("REQUETE OBTENUS: ", requete)

//         if (requete){
//             return requete
//         }
//         return null;
//     }
//     catch(erreur){
//         console.log("ERREUR INTERNE: ", erreur)
//         return null;
//         // return {data : null, error : code, statut : "error" , message : "Problème Serveur! Antsoy i TINA ijery anazy akaiky" }
//     } 
// }
