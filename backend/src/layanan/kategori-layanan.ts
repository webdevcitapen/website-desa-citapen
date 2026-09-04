/**
 * Layanan kategori produk: membuat, membaca, dan menghapus kategori.
 * Setelah penghapusan peran umkm, kategori dikelola penuh oleh admin desa.
 */

import type { DataKategori, Peran } from '../types/index.js';
import {
  KesalahanKonflik,
  KesalahanOtorisasi,
  KesalahanTidakDitemukan,
} from '../utils/kesalahan.js';
import { logger } from '../utils/logger.js';
import {
  buatKategori as buatKategoriRepositori,
  daftarKategori as daftarKategoriRepositori,
  hapusKategori,
  temukanKategoriBerdasarkanId,
} from '../repositori/kategori-repositori.js';

/** Membuat kategori produk baru oleh admin desa. */
export async function tambahKategori(
  pemilikId: number,
  nama: string,
): Promise<DataKategori> {
  // Daftar kategori diperiksa untuk mencegah nama ganda
  const daftar = await daftarKategoriRepositori();
  const namaSama = daftar.some(
    (kategori) => kategori.nama.toLowerCase() === nama.toLowerCase(),
  );
  if (namaSama) {
    throw new KesalahanKonflik(
      `Kategori ${nama} sudah pernah dibuat, silakan pilih nama lain`,
    );
  }

  const kategori = await buatKategoriRepositori({ nama, pemilikId });

  logger.info(
    { kategoriId: kategori.id, pemilikId },
    'Kategori produk baru berhasil dibuat',
  );

  return kategori;
}

/** Mengambil seluruh daftar kategori untuk publik. */
export async function ambilDaftarKategori(): Promise<DataKategori[]> {
  return daftarKategoriRepositori();
}

/** Menghapus kategori oleh admin desa (full akses). */
export async function hapusKategoriDenganPemeriksaan(
  id: number,
  pemilikId: number,
  peran?: Peran,
): Promise<void> {
  const kategori = await temukanKategoriBerdasarkanId(id);
  if (!kategori) {
    throw new KesalahanTidakDitemukan('Kategori tidak ditemukan');
  }

  // Admin desa boleh menghapus kategori apapun
  if (peran !== 'admin' && kategori.pemilikId !== pemilikId) {
    throw new KesalahanOtorisasi('Anda hanya dapat menghapus kategori milik Anda');
  }

  await hapusKategori(id);

  logger.info(
    { kategoriId: id, pemilikId },
    'Kategori produk berhasil dihapus',
  );
}
