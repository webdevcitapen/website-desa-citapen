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
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { produk } from '../db/schema.js';
import { hitungProduk } from '../repositori/produk-repositori.js';

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

  // Cegah penghapusan kategori default "Umum" jika masih dipakai produk
  // dan sediakan fallback agar constraint NOT NULL tidak dilanggar
  const jumlahPemakaian = await hitungProduk(id);
  if (jumlahPemakaian > 0) {
    // Jika kategori yang dihapus adalah "Umum" dan masih ada produk,
    // pastikan ada kategori fallback "Umum" lain sebelum reassign
    if (kategori.nama.toLowerCase() === 'umum') {
      const daftar = await daftarKategoriRepositori();
      const umumLain = daftar.find(
        (k) => k.id !== id && k.nama.toLowerCase() === 'umum',
      );
      // Jika tidak ada Umum lain, jangan hapus - produk wajib punya kategori
      if (!umumLain) {
        throw new KesalahanKonflik(
          'Kategori Umum tidak boleh dihapus karena masih dipakai produk. Buat kategori lain terlebih dahulu atau pindahkan produk ke kategori lain.',
        );
      }
      // Pindahkan produk ke kategori Umum lain (via Drizzle)
      await db
        .update(produk)
        .set({ kategoriId: umumLain.id })
        .where(eq(produk.kategoriId, id));
    } else {
      // Untuk kategori selain Umum, pindahkan produk ke kategori Umum default
      let idUmumFallback: number | null = null;
      const daftar = await daftarKategoriRepositori();
      const umum = daftar.find((k) => k.nama.toLowerCase() === 'umum');
      if (umum) {
        idUmumFallback = umum.id;
      } else {
        // Buat kategori Umum jika belum ada
        const baru = await buatKategoriRepositori({ nama: 'Umum', pemilikId });
        idUmumFallback = baru.id;
      }
      // Pastikan tidak mereassign ke dirinya sendiri
      if (idUmumFallback !== id) {
        await db
          .update(produk)
          .set({ kategoriId: idUmumFallback })
          .where(eq(produk.kategoriId, id));
      }
    }
  }

  await hapusKategori(id);

  logger.info(
    { kategoriId: id, pemilikId },
    'Kategori produk berhasil dihapus',
  );
}
