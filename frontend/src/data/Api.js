import axios from 'axios';

// export const API_URL = 'http://192.168.1.161:3000';
// export const API_URL = 'http://192.168.1.159:3000';
// export const API_URL = 'http://192.168.21.143:3000';
 export const API_URL = 'http://192.168.43.143:3000';
// export const API_URL = 'http://localhost:3000'

export const api =  axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
});

export const IMAGES_URL = `${API_URL}/uploads/images`;

export const apiModel = async (formData) => {
  const url = API_URL + '/categorie/copieImage';
  return await axios.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data', 
    },
  });
};


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; 
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const estConnexion = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !estConnexion) {
      console.error("Token expiré. Déconnexion.");
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  },
);

