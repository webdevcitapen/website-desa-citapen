import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const FILE_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Cache sederhana di memori untuk GET publik (hemat request berulang dalam 60 detik)
const cacheGet = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL_MS = 60 * 1000;

api.interceptors.response.use(
  (response) => {
    // Simpan cache untuk GET sukses
    if (response.config.method === 'get' && response.status === 200) {
      const key = `${response.config.url}|${JSON.stringify(response.config.params)}`;
      cacheGet.set(key, { data: response, expiry: Date.now() + CACHE_TTL_MS });
      // Batasi ukuran cache 50 entri
      if (cacheGet.size > 50) {
        const firstKey = cacheGet.keys().next().value as string;
        cacheGet.delete(firstKey);
      }
    }
    return response;
  },
  (error) => {
    // Jangan cache error
    return Promise.reject(error);
  }
);

/**
 * Helper untuk mengambil dari cache jika masih valid (dipakai manual jika perlu)
 */
export function getCachedGet<T>(url: string, params?: unknown): T | null {
  const key = `${url}|${JSON.stringify(params)}`;
  const entry = cacheGet.get(key);
  if (entry && entry.expiry > Date.now()) return entry.data as T;
  if (entry) cacheGet.delete(key);
  return null;
}

export function clearApiCache(): void {
  cacheGet.clear();
}

export const getImageUrl = (pathRelatif: string | null | undefined, opsi?: { width?: number; quality?: number }): string => {
  if (!pathRelatif) return '/placeholder.svg';
  // Jika sudah URL absolut (dari Supabase CDN), pakai langsung
  // Untuk Supabase yang support image transformation, tambahkan query width/quality jika diminta
  if (pathRelatif.startsWith('http://') || pathRelatif.startsWith('https://')) {
    // Jika opsi width ada dan URL adalah Supabase storage public/render, tambahkan transform
    // Format transform Supabase: /storage/v1/render/image/public/<bucket>/<path>?width=600&quality=80
    // Jika URL sudah /object/public, kita bisa ubah ke render untuk optimasi (opsional, fallback tetap direct)
    if (opsi?.width && pathRelatif.includes('/storage/v1/object/public/')) {
      // Ubah ke render endpoint untuk resize on-the-fly (jika bucket punya transform enabled)
      // Jika transform tidak enabled, Supabase akan tetap serve original dengan ignore query
      const renderUrl = pathRelatif.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      const params = new URLSearchParams();
      params.set('width', String(opsi.width));
      if (opsi.quality) params.set('quality', String(opsi.quality));
      params.set('resize', 'contain');
      return `${renderUrl}?${params.toString()}`;
    }
    if (opsi?.width) {
      const sep = pathRelatif.includes('?') ? '&' : '?';
      return `${pathRelatif}${sep}width=${opsi.width}${opsi.quality ? `&quality=${opsi.quality}` : ''}`;
    }
    return pathRelatif;
  }
  // Bersihkan leading slash agar tidak dobel //unggahan
  const bersih = pathRelatif.replace(/^\/+/, '');
  return `${FILE_BASE_URL}/unggahan/${bersih}`;
};

export default api;
