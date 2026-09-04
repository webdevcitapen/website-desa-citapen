/**
 * Bantuan bersama untuk seluruh pengujian.
 * Menyediakan pemeriksaan ketersediaan database, pembuatan token,
 * pembuatan pengguna uji, dan pembersihan data uji.
 */

import { kumpulanKoneksi } from '../config/database.js';
import { masukPengguna } from '../layanan/autentikasi-layanan.js';
import { daftarkanPenggunaOlehAdmin } from '../layanan/pengguna-layanan.js';
import type { Peran } from '../types/index.js';

/** Awalan username pengguna uji agar mudah dibersihkan. */
export const AWALAN_USERNAME_UJI = 'uji_';

/** Kredensial admin awal yang dibuat oleh database/skema.sql. */
export const KREDENSIAL_ADMIN_UJI = {
  username: 'admin',
  kataSandi: 'AdminDesa123',
} as const;

/** Menghasilkan username unik untuk pengujian. */
export function buatUsernameUji(label: string): string {
  const waktu = Date.now().toString(36);
  const acak = Math.random().toString(36).slice(2, 8);
  return `${AWALAN_USERNAME_UJI}${label}_${waktu}${acak}`.slice(0, 50);
}

/** Gambar png kecil yang dipakai untuk menguji unggah berkas. */
export const GAMBAR_PNG_UJI: Buffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9aw' +
    'AAAABJRU5ErkJggg==',
  'base64',
);

/** Memeriksa apakah database dapat dijangkau untuk pengujian. */
export async function periksaKetersediaanDatabase(): Promise<boolean> {
  try {
    await kumpulanKoneksi.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/** Mendapatkan token masuk untuk akun admin uji. */
export async function dapatkanTokenAdmin(): Promise<string> {
  const hasil = await masukPengguna(
    KREDENSIAL_ADMIN_UJI.username,
    KREDENSIAL_ADMIN_UJI.kataSandi,
  );
  return hasil.token;
}

/** Mendapatkan token masuk untuk akun pengguna uji berdasarkan username. */
export async function dapatkanTokenPengguna(
  username: string,
  kataSandi: string,
): Promise<string> {
  const hasil = await masukPengguna(username, kataSandi);
  return hasil.token;
}

/**
 * Membuat pengguna uji dengan peran tertentu lalu mengembalikan
 * username, kata sandi, dan id penggunanya.
 */
export async function buatPenggunaUji(
  peran: Peran,
  kataSandi = 'KataSandiUji123',
): Promise<{ id: number; username: string; kataSandi: string; peran: Peran }> {
  const username = buatUsernameUji(peran);
  const pengguna = await daftarkanPenggunaOlehAdmin(
    {
      username,
      kataSandi,
      namaLengkap: 'Pengguna Uji Otomatis',
      email: null,
      nomorHp: null,
    },
    peran,
  );
  return {
    id: pengguna.id,
    username,
    kataSandi,
    peran,
  };
}

/** Menghapus seluruh data uji yang dibuat selama pengujian. */
export async function bersihkanDataUji(): Promise<void> {
  // Hapus produk uji yang dikaitkan ke UMKM uji (jika ada)
  await kumpulanKoneksi.query(
    `DELETE FROM produk
      WHERE nama LIKE $1`,
    [`${AWALAN_USERNAME_UJI}%`],
  );

  // Hapus UMKM uji
  await kumpulanKoneksi.query(
    `DELETE FROM umkm
      WHERE nama LIKE $1`,
    [`${AWALAN_USERNAME_UJI}%`],
  );

  // Hapus galeri uji (judul mengandung awalan uji)
  await kumpulanKoneksi.query(
    `DELETE FROM galeri_desa
      WHERE COALESCE(judul, '') LIKE $1`,
    [`${AWALAN_USERNAME_UJI}%`],
  );

  // Hapus berita yang ditulis pengguna uji (klausa where wajib dipakai)
  await kumpulanKoneksi.query(
    `DELETE FROM berita
      WHERE penulis_id IN (
        SELECT id
          FROM pengguna
         WHERE username LIKE $1
      )`,
    [`${AWALAN_USERNAME_UJI}%`],
  );

  // Hapus pengguna uji (produk dan kategori terhapus otomatis via cascade)
  await kumpulanKoneksi.query(
    `DELETE FROM pengguna
      WHERE username LIKE $1`,
    [`${AWALAN_USERNAME_UJI}%`],
  );
}
