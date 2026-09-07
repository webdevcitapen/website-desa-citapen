/**
 * Pembantu avatar/fallback untuk foto yang belum tersedia.
 * Menghasilkan inisial dan warna avatar berdasarkan nama,
 * dipakai oleh struktur organisasi, pengguna, dan entitas lain
 * yang memiliki foto opsional.
 */

/** Daftar warna avatar yang konsisten dan ramah di mata (Tailwind-like). */
const PALET_WARNA_AVATAR: readonly string[] = [
  '#0A3D2D', // hijau tua desa
  '#1B4332',
  '#2D6A4F',
  '#40916C',
  '#3460DC', // biru
  '#1E40AF',
  '#7C3AED', // ungu
  '#DB2777', // pink
  '#D3602D', // oranye
  '#CA8A04', // kuning
  '#0E7490', // cyan
  '#334155', // slate
] as const;

/**
 * Menghasilkan inisial dari nama lengkap.
 * - Ambil huruf pertama setiap kata, maksimal 2 huruf
 * - Jika hanya 1 kata, ambil 2 huruf pertama
 * - Hasil selalu uppercase
 */
export function buatInisial(nama: string): string {
  if (!nama || typeof nama !== 'string') {
    return '??';
  }
  const bersih = nama.trim();
  if (bersih.length === 0) {
    return '??';
  }
  const kata = bersih.split(/\s+/).filter(Boolean);
  if (kata.length === 1) {
    const tunggal = kata[0];
    if (tunggal.length === 1) {
      return tunggal.toUpperCase();
    }
    return tunggal.slice(0, 2).toUpperCase();
  }
  // Ambil huruf pertama 2 kata pertama
  const inisial = kata.slice(0, 2).map((w) => w[0] ?? '').join('');
  return inisial.toUpperCase();
}

/**
 * Menghasilkan warna avatar yang konsisten berdasarkan hash nama.
 * Nama yang sama akan selalu menghasilkan warna yang sama.
 */
export function buatWarnaAvatar(nama: string): string {
  if (!nama || typeof nama !== 'string') {
    return PALET_WARNA_AVATAR[0];
  }
  let hash = 0;
  for (let i = 0; i < nama.length; i++) {
    hash = (hash * 31 + nama.charCodeAt(i)) >>> 0;
  }
  const indeks = hash % PALET_WARNA_AVATAR.length;
  return PALET_WARNA_AVATAR[indeks];
}

/**
 * Membuat data fallback avatar lengkap dari nama.
 */
export function buatAvatarFallback(nama: string): {
  inisial: string;
  warnaAvatar: string;
} {
  return {
    inisial: buatInisial(nama),
    warnaAvatar: buatWarnaAvatar(nama),
  };
}
