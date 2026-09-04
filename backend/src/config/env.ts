/**
 * Konfigurasi lingkungan aplikasi.
 * Semua nilai dibaca dari variabel lingkungan (file .env) lalu
 * divalidasi dengan zod agar aplikasi tidak berjalan dengan
 * konfigurasi yang salah.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Memuat file .env ke dalam proses jika tersedia
dotenv.config();

/** Skema zod untuk memvalidasi seluruh variabel lingkungan. */
const SkemaLingkungan = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  DATABASE_URL: z.string().min(1, 'URL database tidak boleh kosong'),
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
