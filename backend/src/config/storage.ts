/**
 * Konfigurasi penyimpanan Supabase Storage.
 * Dipakai oleh utils/berkas untuk menyimpan dan menghapus berkas
 * secara persisten (wajib untuk Vercel karena filesystem /tmp ephemeral).
 *
 * Jika SUPABASE_URL dan SERVICE_ROLE_KEY tidak diisi, modul ini
 * otomatis non-aktif dan aplikasi fallback ke filesystem lokal.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { lingkungan } from './env.js';
import { logger } from '../utils/logger.js';

/** Nama bucket default untuk unggahan. */
export const NAMA_BUCKET_DEFAULT = 'unggahan';

/** Klien Supabase yang sudah siap (atau null jika tidak dikonfig). */
let klienSupabase: SupabaseClient | null = null;

/** Apakah penyimpanan Supabase aktif (sudah dikonfigurasi). */
export function apakahSupabaseAktif(): boolean {
  // SUPABASE_URL wajib dan salah satu key wajib ada
  const url = lingkungan.SUPABASE_URL;
  const kunci = lingkungan.SUPABASE_SERVICE_ROLE_KEY ?? lingkungan.SUPABASE_ANON_KEY;
  return Boolean(url && kunci);
}

/** Mengembalikan klien Supabase atau null jika belum dikonfig. */
export function dapatkanKlienSupabase(): SupabaseClient | null {
  if (!apakahSupabaseAktif()) {
    return null;
  }
  if (klienSupabase) {
    return klienSupabase;
  }
  const url = lingkungan.SUPABASE_URL as string;
  const kunci = (lingkungan.SUPABASE_SERVICE_ROLE_KEY ??
    lingkungan.SUPABASE_ANON_KEY) as string;

  // Validasi panjang kunci agar tidak salah copy
  if (kunci.length < 20) {
    logger.warn('Kunci Supabase terlalu pendek, periksa SUPABASE_SERVICE_ROLE_KEY');
  }

  klienSupabase = createClient(url, kunci, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  logger.info(
    { bucket: lingkungan.SUPABASE_STORAGE_BUCKET },
    'Supabase Storage aktif untuk penyimpanan berkas',
  );
  return klienSupabase;
}

/** Mengembalikan nama bucket yang dipakai. */
export function dapatkanNamaBucket(): string {
  return lingkungan.SUPABASE_STORAGE_BUCKET ?? NAMA_BUCKET_DEFAULT;
}

/** Menghasilkan URL publik untuk sebuah path relatif (mis. produk/abc.jpg). */
export function dapatkanUrlPublikSupabase(pathRelatif: string): string | null {
  const klien = dapatkanKlienSupabase();
  if (!klien) return null;
  const bucket = dapatkanNamaBucket();
  const { data } = klien.storage.from(bucket).getPublicUrl(pathRelatif);
  return data.publicUrl;
}

/**
 * Memastikan bucket ada dan bersifat publik.
 * Dipanggil sekali saat startup jika Supabase aktif.
 * Jika bucket belum ada, coba buat (memerlukan service_role).
 * Jika gagal, hanya log warning agar server tetap jalan (upload nanti akan error jelas).
 */
export async function pastikanBucketTersedia(): Promise<void> {
  const klien = dapatkanKlienSupabase();
  if (!klien) return;
  const bucket = dapatkanNamaBucket();

  try {
    // Cek daftar bucket
    const { data: daftar, error: errDaftar } = await klien.storage.listBuckets();
    if (errDaftar) {
      logger.warn({ kesalahan: errDaftar.message }, 'Gagal memeriksa bucket Supabase');
      return;
    }
    const ada = daftar?.some((b) => b.name === bucket);
    if (ada) {
      logger.info({ bucket }, 'Bucket Supabase sudah tersedia');
      return;
    }

    // Coba buat bucket public
    logger.info({ bucket }, 'Bucket belum ada, mencoba membuat bucket public...');
    const { error: errBuat } = await klien.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB, sama dengan batas unggah
    });
    if (errBuat) {
      logger.warn(
        { kesalahan: errBuat.message, bucket },
        'Gagal membuat bucket Supabase otomatis. Buat manual di dashboard: Storage -> New bucket -> public',
      );
      return;
    }
    logger.info({ bucket }, 'Bucket Supabase berhasil dibuat (public)');
  } catch (kesalahan) {
    logger.warn(
      { kesalahan: kesalahan instanceof Error ? kesalahan.message : String(kesalahan) },
      'Gagal memastikan bucket Supabase tersedia',
    );
  }
}
