import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const FILE_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getImageUrl = (pathRelatif: string | null | undefined): string => {
  if (!pathRelatif) return '/placeholder.svg';
  return `${FILE_BASE_URL}/unggahan/${pathRelatif}`;
};

export default api;
