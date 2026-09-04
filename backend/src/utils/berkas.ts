/**
 * Pembantu penyimpanan berkas unggahan pengguna.
 * Nama berkas selalu dibuat oleh server (bukan dari nama asli klien)
 * agar aman dari serangan path traversal dan penamaan berbahaya.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from './logger.js';

/** Nama folder utama tempat semua berkas unggahan disimpan. */
export const FOLDER_UNGGUHAN = 'unggahan';

/** Sub folder yang diizinkan beserta fungsinya. */
export const DAFTAR_SUB_FOLDER = ['profil', 'produk', 'berita', 'galeri', 'umkm'] as const;

/** Jenis sub folder yang diizinkan. */
export type NamaSubFolder = (typeof DAFTAR_SUB_FOLDER)[number];

/**
 * Memastikan folder unggahan beserta sub foldernya tersedia.
 * Dipanggil sekali saat aplikasi dimulai.
 */
export async function siapkanFolderUnggahan(): Promise<void> {
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

/** Menyimpan berkas ke folder unggahan dan mengembalikan path relatifnya. */
export async function simpanBerkas(
  buffer: Buffer,
  subFolder: NamaSubFolder,
  ekstensi: string,
): Promise<string> {
  const namaBerkas = buatNamaBerkas(ekstensi);
  const pathRelatif = `${subFolder}/${namaBerkas}`;
  const pathAbsolut = path.join(FOLDER_UNGGUHAN, pathRelatif);

  // Pastikan folder tujuan selalu tersedia sebelum menulis berkas
  await fs.promises.mkdir(path.dirname(pathAbsolut), { recursive: true });
  await fs.promises.writeFile(pathAbsolut, buffer);
  return pathRelatif;
}

/** Menghapus berkas unggahan berdasarkan path relatifnya dengan aman. */
export async function hapusBerkas(pathRelatif: string): Promise<void> {
  // Jangan pernah menghapus berkas di luar folder unggahan
  if (!apakahPathUnggahanAman(pathRelatif)) {
    return;
  }
  const pathAbsolut = path.join(FOLDER_UNGGUHAN, pathRelatif);
  try {
    await fs.promises.unlink(pathAbsolut);
  } catch (kesalahan) {
    // Berkas mungkin sudah tidak ada, tidak perlu dianggap error
    logger.debug(
      { kesalahan: kesalahan instanceof Error ? kesalahan.message : 'unknown' },
      'Berkas lama tidak ditemukan saat ingin dihapus',
    );
  }
}
