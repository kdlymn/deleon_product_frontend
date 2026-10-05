import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const api = axios.create({ baseURL: API_URL + '/api' });

// ---- token storage ---------------------------------------------------------
export const tokens = {
  get access() { return localStorage.getItem('access_token'); },
  get refresh() { return localStorage.getItem('refresh_token'); },
  save(t) {
    localStorage.setItem('access_token', t.access_token);
    localStorage.setItem('refresh_token', t.refresh_token);
  },
  clear() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

// ---- attach the JWT to every request ---------------------------------------
api.interceptors.request.use((config) => {
  if (tokens.access) config.headers.Authorization = `Bearer ${tokens.access}`;
  return config;
});

// ---- on 401, try the refresh token once, then retry the request ------------
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.match(/\/(login|register|refresh)$/);

    if (error.response?.status === 401 && !original._retry && !isAuthCall && tokens.refresh) {
      original._retry = true;
      try {
        refreshing = refreshing || axios.post(`${API_URL}/api/refresh`, { refresh_token: tokens.refresh });
        const { data } = await refreshing;
        tokens.save(data.tokens);
        original.headers.Authorization = `Bearer ${data.tokens.access_token}`;
        return api(original);
      } catch {
        tokens.clear();
        window.dispatchEvent(new Event('auth:expired'));
      } finally {
        refreshing = null;
      }
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (err) =>
  err.response?.data?.error || err.message || 'Something went wrong.';

// ---- auth ------------------------------------------------------------------
export const register = (payload) => api.post('/register', payload);

export const login = async (username, password) => {
  const { data } = await api.post('/login', { username, password });
  tokens.save(data.tokens);
  return data.user;
};

export const logout = async () => {
  try { await api.post('/logout', { refresh_token: tokens.refresh }); } catch { /* ignore */ }
  tokens.clear();
};

export const me = async () => (await api.get('/me')).data.user;

// ---- products --------------------------------------------------------------
export const getProducts = async () => (await api.get('/products')).data.data;
export const createProduct = (p) => api.post('/products', p);
export const updateProduct = (id, p) => api.put(`/products/${id}`, p);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
