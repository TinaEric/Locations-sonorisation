import axios from 'axios';

//  const API_URL = ' http://192.168.1.159:3000';
// agaba david
// const API_URL = ' http://192.168.21.143:3000';
// const API_URL = ' http://192.168.43.143:3000';
const API_URL = ' http://localhost:3000';

const api =  axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
});

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

export default api;