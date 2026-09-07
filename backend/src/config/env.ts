/**
 * Konfigurasi lingkungan aplikasi.
 * Semua nilai dibaca dari variabel lingkungan (file .env) lalu
 * divalidasi dengan zod agar aplikasi tidak berjalan dengan
 * konfigurasi yang salah.
 */

import { createRequire } from 'node:module';
import { z } from 'zod';

// Memuat file .env secara opsional.
// Di Vercel/Render variabel lingkungan sudah diinjeksi oleh platform,
// jadi dotenv tidak wajib ada di runtime. Bungkus dengan try-catch
// agar `ERR_MODULE_NOT_FOUND: Cannot find package 'dotenv'` tidak
// mematikan serverless lambda saat node_modules tidak terbundel sempurna.
try {
  const require = createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require('dotenv') as { config: () => void };
  dotenv.config();
} catch {
  // Abaikan jika dotenv tidak tersedia — process.env tetap terbaca
}

/** Skema zod untuk memvalidasi seluruh variabel lingkungan. */
const SkemaLingkungan = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  DATABASE_URL: z.string().min(1, 'URL database tidak boleh kosong'),
  // Konfigurasi SSL manual untuk Supabase.
  // - Jika diatur 'true'  => SSL aktif ({ rejectUnauthorized: false }) wajib untuk Supabase pooler (6543).
  // - Jika diatur 'false' => SSL non-aktif (untuk lokal tanpa SSL).
  // - Jika tidak diatur (undefined) => otomatis aktif saat DATABASE_URL mengandung 'supabase'
  //   atau 'sslmode=require', agar deploy ke Render/Supabase langsung jalan tanpa set manual.
  DATABASE_SSL: z
    .string()
    .optional()
    .transform((nilai) => {
      if (nilai === undefined || nilai.trim() === '') {
        return undefined;
      }
      const normalisasi = nilai.trim().toLowerCase();
      if (normalisasi === 'true' || normalisasi === '1' || normalisasi === 'require') {
        return true;
      }
      if (normalisasi === 'false' || normalisasi === '0' || normalisasi === 'disable') {
        return false;
      }
      // Nilai tidak dikenal -> anggap undefined agar fallback ke deteksi otomatis
      return undefined;
    }),
  JWT_RAHASIA: z.string().min(1, 'Rahasia jwt tidak boleh kosong'),
  JWT_KEDALUWARSA: z.string().min(1).default('1d'),
  ASAL_DIIZINKAN: z.string().default('*'),
  USERNAME_ADMIN_AWAL: z.string().min(1).default('admin'),
  SANDI_ADMIN_AWAL: z.string().min(8).default('AdminDesa123'),
  LOG_TINGKAT: z
    .enum(['trace', 'debug', 'info', 'warn', 'error'])
    .default('info'),
  BATAS_LAJU_UMUM: z.coerce.number().int().positive().default(300),
  BATAS_LAJU_LOGIN: z.coerce.number().int().positive().default(30),
  BATAS_LAJU_UNGGAH: z.coerce.number().int().positive().default(60),
  // ---------- Penyimpanan Supabase Storage (untuk Vercel produksi) ----------
  // Jika diisi, berkas akan disimpan ke Supabase Storage (persisten).
  // Jika kosong, fallback ke filesystem lokal (/tmp/unggahan di Vercel, unggahan di lokal).
  // - SUPABASE_URL: contoh https://xxxxxxxx.supabase.co
  // - SUPABASE_SERVICE_ROLE_KEY: kunci service_role dari dashboard Supabase (berawalan eyJ...)
  //   Alternatif: SUPABASE_ANON_KEY jika bucket public dengan policy yang mengizinkan.
  // - SUPABASE_STORAGE_BUCKET: nama bucket, default "unggahan"
  SUPABASE_URL: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('unggahan'),
});

/** Hasil validasi variabel lingkungan. */
const hasilValidasi = SkemaLingkungan.safeParse(process.env);

// Jika konfigurasi salah, hentikan aplikasi dengan pesan yang jelas
if (!hasilValidasi.success) {
  // eslint-disable-next-line no-console
  console.error('Konfigurasi lingkungan tidak valid:');
  // eslint-disable-next-line no-console
  console.error(hasilValidasi.error.flatten().fieldErrors);
  process.exit(1);
}

/** Nilai-nilai konfigurasi yang sudah tervalidasi dan siap dipakai. */
export const lingkungan = hasilValidasi.data;

/** Daftar asal (origin) yang diizinkan mengakses api. */
export const daftarAsalDiizinkan: readonly string[] =
  lingkungan.ASAL_DIIZINKAN === '*'
    ? ['*']
    : lingkungan.ASAL_DIIZINKAN.split(',').map((asal) => asal.trim());

/** Status produksi, bernilai benar jika aplikasi berjalan di produksi. */
export const apakahProduksi: boolean = lingkungan.NODE_ENV === 'production';
