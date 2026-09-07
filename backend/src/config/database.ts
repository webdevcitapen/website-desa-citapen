/**
 * Koneksi ke database postgresql menggunakan kumpulan koneksi (pool).
 * Pool membuat aplikasi hemat memori dan cepat karena koneksi
 * dipakai ulang, tidak dibuat baru setiap permintaan.
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { lingkungan } from './env.js';
import { logger } from '../utils/logger.js';
import * as skema from '../db/schema.js';

/**
 * Menentukan opsi SSL untuk koneksi database.
 * - Jika DATABASE_SSL=true  => pakai SSL { rejectUnauthorized: false } (wajib untuk Supabase pooler 6543)
 * - Jika DATABASE_SSL=false => tanpa SSL (untuk lokal tanpa SSL)
 * - Jika DATABASE_SSL undefined => deteksi otomatis dari DATABASE_URL:
 *     * mengandung 'supabase' atau 'pooler.supabase' => SSL aktif
 *     * mengandung 'sslmode=require' / 'ssl=true'    => SSL aktif
 *     * selain itu                                      => tanpa SSL (lokal)
 *
 * Kenapa rejectUnauthorized:false ?
 * Supabase memakai sertifikat yang tidak selalu dikenali oleh Node di Render/Vercel
 * tanpa CA tambahan. Mengatur rejectUnauthorized:false mencegah error
 * "self-signed certificate" / "self signed certificate in certificate chain"
 * sambil tetap memakai koneksi terenkripsi (SSL tetap aktif, hanya verifikasi CA dilonggarkan).
 */
export function tentukanOpsiSsl(): { rejectUnauthorized: boolean } | undefined {
  // 1. Prioritas tertinggi: konfigurasi manual via env DATABASE_SSL
  if (lingkungan.DATABASE_SSL === true) {
    return { rejectUnauthorized: false };
  }
  if (lingkungan.DATABASE_SSL === false) {
    return undefined;
  }

  // 2. Deteksi otomatis berdasarkan URL
  const urlLower = lingkungan.DATABASE_URL.toLowerCase();
  if (urlLower.includes('supabase') || urlLower.includes('pooler.supabase')) {
    return { rejectUnauthorized: false };
  }
  if (
    urlLower.includes('sslmode=require') ||
    urlLower.includes('sslmode=verify') ||
    urlLower.includes('ssl=true')
  ) {
    return { rejectUnauthorized: false };
  }

  // 3. Default: tanpa SSL (cocok untuk postgresql lokal homebrew)
  return undefined;
}

// Tentukan SSL sekali di awal agar Pool dibuat dengan opsi yang benar.
// JANGAN mutasi kumpulanKoneksi.options.ssl setelah Pool dibuat (tidak reliabel di pg 8.x).
const opsiSsl = tentukanOpsiSsl();

// Log status SSL saat boot agar mudah debug di Render/Supabase
if (opsiSsl) {
  logger.info('Koneksi database memakai SSL (konfigurasi manual/otomatis untuk Supabase)');
} else {
  logger.info('Koneksi database tanpa SSL (mode lokal)');
}

/** Apakah berjalan di Vercel serverless (ephemeral) -> pool harus irit. */
const apakahVercel = Boolean(process.env.VERCEL);

/** Kumpulan koneksi postgresql yang dipakai seluruh aplikasi. */
export const kumpulanKoneksi = new Pool({
  connectionString: lingkungan.DATABASE_URL,
  // Opsi SSL manual/otomatis — wajib diisi saat konstruksi Pool, bukan mutasi setelahnya
  ssl: opsiSsl,
  // Jumlah maksimal koneksi: di Vercel serverless pakai kecil (1-3) agar tidak boros
  // karena tiap lambda punya Pool sendiri; pgbouncer Supabase juga membatasi.
  // Di lokal/Render tradisional boleh 10.
  max: apakahVercel ? 3 : 10,
  min: 0,
  // Koneksi menganggur lebih dari 10 detik di Vercel langsung tutup (hemat memori lambda)
  idleTimeoutMillis: apakahVercel ? 10000 : 30000,
  // Batas waktu menunggu koneksi tersedia - kecil agar fail fast di serverless
  connectionTimeoutMillis: 5000,
  // Izinkan proses keluar meski pool masih idle (penting untuk serverless freeze)
  allowExitOnIdle: apakahVercel,
  // Keepalive untuk hindari idle disconnect di Supabase / pgbouncer
  keepAlive: true,
  // Timeout statement 15 detik agar query gantung tidak blok lambda
  statement_timeout: 15000,
  query_timeout: 15000,
} as unknown as ConstructorParameters<typeof Pool>[0]);

// Catat kejadian error tak terduga di tingkat koneksi database
kumpulanKoneksi.on('error', (kesalahan: Error) => {
  logger.error(
    { kesalahan: kesalahan.message },
    'Terjadi kesalahan tak terduga pada koneksi database',
  );
});

/**
 * Instance Drizzle ORM yang membungkus Pool yang sama.
 * Dipakai oleh semua repositori baru (pengguna, berita, produk, dll)
 * agar query type-safe, hemat memori, dan tetap memakai SSL manual
 * yang sudah dikonfigurasi di Pool.
 *
 * Contoh pakai:
 *   import { db } from '../config/database.js';
 *   import { pengguna } from '../db/schema.js';
 *   import { eq } from 'drizzle-orm';
 *   await db.select().from(pengguna).where(eq(pengguna.username, 'admin'));
 */
export const db = drizzle(kumpulanKoneksi, { schema: skema });

// Alias agar impor skema lebih ringkas di repositori: import { db, skema } ...
export { skema };

/**
 * Memeriksa apakah database dapat dijangkau.
 * Dipakai oleh endpoint kesehatan agar klien (frontend) tahu
 * status database, sekaligus membuat database yang tertidur
 * (supabase) menjadi aktif kembali.
 * Memakai drizzle sql agar tetap konsisten dengan ORM baru.
 */
export async function periksaKesehatanDatabase(): Promise<boolean> {
  try {
    // drizzle sql tetap memakai Pool yang sama di bawahnya
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}
