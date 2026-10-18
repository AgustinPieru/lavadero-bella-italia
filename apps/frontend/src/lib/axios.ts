import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Etapa 2 (login) agrega acá el interceptor de access token + refresh
// automático en 401, siguiendo el mismo patrón que Akoch-inmobiliaria.

export default api;
