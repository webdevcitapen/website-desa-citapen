/**
 * Pembantu penyimpanan berkas unggahan pengguna.
 * Nama berkas selalu dibuat oleh server (bukan dari nama asli klien)
 * agar aman dari serangan path traversal dan penamaan berbahaya.
 *
 * Versi baru: mendukung 2 mode penyimpanan:
 * 1) Supabase Storage (persisten, wajib untuk Vercel)
 *    Aktif jika SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY diisi.
 * 2) Filesystem lokal (untuk dev / Render dengan disk persisten)
 *    Fallback jika env Supabase tidak diisi.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from './logger.js';
import {
  apakahSupabaseAktif,
  dapatkanKlienSupabase,
  dapatkanNamaBucket,
  dapatkanUrlPublikSupabase,
} from '../config/storage.js';

/**
 * Nama folder utama tempat semua berkas unggahan disimpan (mode lokal).
 * Di Vercel sistem berkas bersifat read-only kecuali `/tmp`,
 * jadi kita tulis ke `/tmp/unggahan` saat berjalan di Vercel.
 * Di Render/lokal tetap ke `unggahan` relatif terhadap cwd.
 * Catatan: konstanta ini hanya dipakai sebagai filesystem path,
 * bukan sebagai mount route. Route selalu '/unggahan' (lihat app.ts).
 */
export const FOLDER_UNGGUHAN = process.env.VERCEL ? '/tmp/unggahan' : 'unggahan';

/** Sub folder yang diizinkan beserta fungsinya. */
export const DAFTAR_SUB_FOLDER = ['profil', 'produk', 'berita', 'galeri', 'umkm'] as const;

/** Jenis sub folder yang diizinkan. */
export type NamaSubFolder = (typeof DAFTAR_SUB_FOLDER)[number];

/**
 * Memastikan folder unggahan beserta sub foldernya tersedia.
 * Dipanggil sekali saat aplikasi dimulai.
 * Jika Supabase aktif, tidak perlu buat folder lokal (tapi tetap coba buat
 * agar fallback tetap siap saat dev).
 */
export async function siapkanFolderUnggahan(): Promise<void> {
  // Jika Supabase aktif, log saja (folder lokal tidak wajib di Vercel)
  if (apakahSupabaseAktif()) {
    logger.info('Mode Supabase Storage aktif — folder lokal tidak wajib, tapi tetap disiapkan sebagai fallback');
  }

  const janjiPembuatan: Promise<unknown>[] = DAFTAR_SUB_FOLDER.map(
    async (subFolder: NamaSubFolder) => {
      const folderTujuan = path.join(FOLDER_UNGGUHAN, subFolder);
      await fs.promises.mkdir(folderTujuan, { recursive: true });
    },
  );
  await Promise.all(janjiPembuatan);
  logger.info('Folder unggahan siap dipakai');
}

/** Menghasilkan nama berkas acak yang aman untuk disimpan. */
export function buatNamaBerkas(ekstensi: string): string {
  // Gabungkan waktu dan nilai acak agar tidak pernah bentrok
  const waktu = Date.now().toString(36);
  const acak = crypto.randomBytes(6).toString('hex');
  return `${waktu}-${acak}.${ekstensi}`;
}

/** Memeriksa apakah sebuah path relatif aman (tidak keluar dari folder unggahan). */
export function apakahPathUnggahanAman(pathRelatif: string): boolean {
  // Path harus selalu di dalam sub folder yang dikenal
  const bagian = pathRelatif.split('/');
  if (bagian.length !== 2) {
    return false;
  }
  const [subFolder, namaBerkas] = bagian;
  if (!DAFTAR_SUB_FOLDER.includes(subFolder as NamaSubFolder)) {
    return false;
  }
  // Nama berkas hanya berisi karakter aman
  return /^[a-z0-9-]+\.(jpg|png)$/.test(namaBerkas);
}

/**
 * Menyimpan berkas ke penyimpanan dan mengembalikan path relatifnya.
 * Jika Supabase aktif → upload ke Supabase Storage.
 * Jika tidak aktif → simpan ke filesystem lokal (/tmp/unggahan atau unggahan).
 */
export async function simpanBerkas(
  buffer: Buffer,
  subFolder: NamaSubFolder,
  ekstensi: string,
): Promise<string> {
  const namaBerkas = buatNamaBerkas(ekstensi);
  const pathRelatif = `${subFolder}/${namaBerkas}`;

  // Coba simpan ke Supabase Storage jika aktif
  if (apakahSupabaseAktif()) {
    try {
      const klien = dapatkanKlienSupabase();
      const bucket = dapatkanNamaBucket();
      if (!klien) throw new Error('Klien Supabase tidak tersedia');

      const contentType = ekstensi === 'png' ? 'image/png' : 'image/jpeg';

      const { error } = await klien.storage.from(bucket).upload(pathRelatif, buffer, {
        contentType,
        cacheControl: '604800', // 7 hari
        upsert: false,
      });

      if (error) {
        // Jika upload gagal karena bucket belum ada atau permission, log dan fallback ke lokal
        logger.warn(
          { kesalahan: error.message, pathRelatif, bucket },
          'Gagal upload ke Supabase Storage, fallback ke filesystem lokal',
        );
        // Fallback ke filesystem lokal
      } else {
        logger.info({ pathRelatif, bucket }, 'Berkas berhasil disimpan ke Supabase Storage');
        return pathRelatif;
      }
    } catch (kesalahan) {
      logger.warn(
        { kesalahan: kesalahan instanceof Error ? kesalahan.message : String(kesalahan), pathRelatif },
        'Gagal upload ke Supabase Storage (exception), fallback ke filesystem lokal',
      );
      // Lanjutkan ke fallback lokal
    }
  }

  // Fallback: simpan ke filesystem lokal
  const pathAbsolut = path.join(FOLDER_UNGGUHAN, pathRelatif);
  // Pastikan folder tujuan selalu tersedia sebelum menulis berkas
  await fs.promises.mkdir(path.dirname(pathAbsolut), { recursive: true });
  await fs.promises.writeFile(pathAbsolut, buffer);
  return pathRelatif;
}

/**
 * Menghapus berkas unggahan berdasarkan path relatifnya dengan aman.
 * Jika Supabase aktif, hapus dari Supabase Storage DAN dari filesystem lokal (jika ada).
 */
export async function hapusBerkas(pathRelatif: string): Promise<void> {
  // Jangan pernah menghapus berkas di luar folder unggahan
  if (!apakahPathUnggahanAman(pathRelatif)) {
    return;
  }

  // Hapus dari Supabase Storage jika aktif (prioritas)
  if (apakahSupabaseAktif()) {
    try {
      const klien = dapatkanKlienSupabase();
      const bucket = dapatkanNamaBucket();
      if (klien) {
        const { error } = await klien.storage.from(bucket).remove([pathRelatif]);
        if (error) {
          logger.debug(
            { kesalahan: error.message, pathRelatif },
            'Gagal hapus dari Supabase Storage (mungkin sudah tidak ada)',
          );
        } else {
          logger.debug({ pathRelatif }, 'Berkas dihapus dari Supabase Storage');
        }
      }
    } catch (kesalahan) {
      logger.debug(
        { kesalahan: kesalahan instanceof Error ? kesalahan.message : String(kesalahan), pathRelatif },
        'Exception saat hapus dari Supabase Storage',
      );
    }
  }

  // Tetap coba hapus file lokal (untuk dev atau sisa file sebelum migrasi)
  const pathAbsolut = path.join(FOLDER_UNGGUHAN, pathRelatif);
  try {
    await fs.promises.unlink(pathAbsolut);
  } catch (kesalahan) {
    // Berkas mungkin sudah tidak ada, tidak perlu dianggap error
    logger.debug(
      { kesalahan: kesalahan instanceof Error ? kesalahan.message : 'unknown' },
      'Berkas lokal tidak ditemukan saat ingin dihapus',
    );
  }
}

/**
 * Mengubah path relatif (mis: "berita/abc.jpg") menjadi URL publik yang siap dipakai frontend.
 * - Jika Supabase aktif -> kembalikan URL CDN Supabase (https://xxx.supabase.co/storage/v1/object/public/unggahan/...)
 * - Jika Supabase tidak aktif -> kembalikan path relatif asli (nanti frontend prefix dengan /unggahan)
 * - Jika path sudah berupa URL absolut (http) -> kembalikan apa adanya (untuk kompatibilitas data lama)
 * Fungsi ini dipakai oleh semua layanan yang mengembalikan gambar/foto.
 */
export function dapatkanUrlBerkasUntukKlien(pathRelatif: string | null | undefined): string | null {
  if (!pathRelatif) return null;
  // Jika sudah URL penuh, jangan ubah lagi (hindari double transform)
  if (pathRelatif.startsWith('http://') || pathRelatif.startsWith('https://')) {
    return pathRelatif;
  }
  // Jika Supabase aktif, ubah ke URL publik CDN (jauh lebih cepat daripada proxy)
  if (apakahSupabaseAktif()) {
    const urlPublik = dapatkanUrlPublikSupabase(pathRelatif);
    if (urlPublik) return urlPublik;
  }
  // Fallback: kembalikan path relatif biar frontend bangun URL via FILE_BASE_URL/unggahan
  return pathRelatif;
}

/**
 * Mengambil buffer berkas dari penyimpanan.
 * Mencoba Supabase dulu jika aktif, lalu fallback ke filesystem lokal.
 * Dipakai oleh handler proxy gambar di app.ts.
 */
export async function ambilBerkas(pathRelatif: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!apakahPathUnggahanAman(pathRelatif)) {
    return null;
  }

  // Coba dari Supabase Storage dulu
  if (apakahSupabaseAktif()) {
    try {
      const klien = dapatkanKlienSupabase();
      const bucket = dapatkanNamaBucket();
      if (klien) {
        const { data, error } = await klien.storage.from(bucket).download(pathRelatif);
        if (!error && data) {
          const ab = await data.arrayBuffer();
          const buffer = Buffer.from(ab);
          const ekstensi = path.extname(pathRelatif).toLowerCase();
          const contentType = ekstensi === '.png' ? 'image/png' : 'image/jpeg';
          return { buffer, contentType };
        }
        // Jika error notFound, lanjutkan ke fallback lokal
        if (error) {
          logger.debug({ kesalahan: error.message, pathRelatif }, 'Gagal ambil dari Supabase, coba filesystem lokal');
        }
      }
    } catch (kesalahan) {
      logger.debug(
        { kesalahan: kesalahan instanceof Error ? kesalahan.message : String(kesalahan), pathRelatif },
        'Exception ambil dari Supabase, fallback ke lokal',
      );
    }
  }

  // Fallback: filesystem lokal
  const pathAbsolut = path.join(FOLDER_UNGGUHAN, pathRelatif);
  try {
    const buffer = await fs.promises.readFile(pathAbsolut);
    const ekstensi = path.extname(pathRelatif).toLowerCase();
    const contentType = ekstensi === '.png' ? 'image/png' : 'image/jpeg';
    return { buffer, contentType };
  } catch {
    return null;
  }
}
