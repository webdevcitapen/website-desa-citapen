/**
 * Koneksi ke database postgresql menggunakan kumpulan koneksi (pool).
 * Pool membuat aplikasi hemat memori dan cepat karena koneksi
 * dipakai ulang, tidak dibuat baru setiap permintaan.
 */

import { Pool } from 'pg';
import { lingkungan } from './env.js';
import { logger } from '../utils/logger.js';

/** Kumpulan koneksi postgresql yang dipakai seluruh aplikasi. */
export const kumpulanKoneksi = new Pool({
  connectionString: lingkungan.DATABASE_URL,
  // Jumlah maksimal koneksi yang dibuka sekaligus (hemat sumber daya)
  max: 10,
  // Koneksi yang menganggur lebih dari 30 detik ditutup
  idleTimeoutMillis: 30000,
  // Batas waktu menunggu koneksi tersedia
  connectionTimeoutMillis: 5000,
});

// Supabase membutuhkan koneksi ssl, aktifkan otomatis jika perlu
if (lingkungan.DATABASE_URL.includes('supabase')) {
  kumpulanKoneksi.options.ssl = { rejectUnauthorized: false };
}

// Catat kejadian error tak terduga di tingkat koneksi database
kumpulanKoneksi.on('error', (kesalahan: Error) => {
  logger.error(
    { kesalahan: kesalahan.message },
    'Terjadi kesalahan tak terduga pada koneksi database',
  );
});

/**
 * Memeriksa apakah database dapat dijangkau.
 * Dipakai oleh endpoint kesehatan agar klien (frontend) tahu
 * status database, sekaligus membuat database yang tertidur
 * (supabase) menjadi aktif kembali.
 */
export async function periksaKesehatanDatabase(): Promise<boolean> {
  try {
    await kumpulanKoneksi.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
