import axios from 'axios';

const api = axios.create({
  // VITE_API_URL ya vale "/api" en producción → baseURL = "/api/"
  // En local sin la variable → baseURL = "http://localhost:3001/api/"
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/`
    : 'http://localhost:3001/api/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors para CSRF y Autenticación JWT
api.interceptors.request.use((config) => {
  // 1. Obtener Token de Acceso desde localStorage
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Obtener Token CSRF desde cookie (si existe)
  const csrfToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (csrfToken) {
    config.headers['X-XSRF-TOKEN'] = csrfToken;
  }
  
  return config;
});

// Interceptor global para manejar respuestas HTTP
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Evitamos loops infinitos indicando que ya reintentamos
    const isAuthRoute = window.location.pathname.includes('login') || window.location.pathname.includes('staff-gate') || window.location.pathname.includes('portal');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Intentar obtener un nuevo par de tokens usando Axios independiente sin interceptores (para evitar loops)
          const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken
          });
          
          // Guardar el nuevo token
          localStorage.setItem('accessToken', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          
          // Actualizar el Header Authorization de la petición fallida y volver a intentar
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error("Refresh token inválido o expirado. Redirigiendo a inicio de sesión...");
        }
      }
      
      // Si el refresh token falla o no existe, limpiamos local storage obligatoriamente y redirigimos
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      const loginUrl = window.location.pathname.startsWith('/dashboard') ? '/staff-gate?expired=true' : '/portal?expired=true';
      window.location.href = loginUrl;
    }
    
    return Promise.reject(error);
  }
);

export default api;
