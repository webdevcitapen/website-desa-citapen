/**
 * Layanan beranda: menyusun data ringkas untuk halaman utama
 * aplikasi. Data diambil dalam jumlah kecil (limit) sehingga
 * sangat cepat meskipun traffic sedang tinggi.
 */

import { periksaKesehatanDatabase } from '../config/database.js';
import {
  daftarBeritaTerbaru,
  hitungBerita,
} from '../repositori/berita-repositori.js';
import {
  daftarProdukTerbaru,
  hitungProduk,
} from '../repositori/produk-repositori.js';
import { hitungUmkm } from '../repositori/umkm-repositori.js';
import type { DataBeranda } from '../types/index.js';

/** Jumlah data terbaru yang ditampilkan di halaman beranda. */
const JUMLAH_DATA_BERANDA = 5;

/** Menyusun seluruh data untuk halaman beranda. */
export async function susunDataBeranda(): Promise<DataBeranda> {
  // Ambil data terbaru dengan jumlah terbatas agar cepat
  // jumlahUmkm kini menghitung tabel umkm (nama UMKM yang dikelola admin desa)
  const [beritaTerbaru, produkTerbaru, jumlahBerita, jumlahProduk, jumlahUmkm] =
    await Promise.all([
      daftarBeritaTerbaru(JUMLAH_DATA_BERANDA),
      daftarProdukTerbaru(JUMLAH_DATA_BERANDA),
      hitungBerita(),
      hitungProduk(),
      hitungUmkm(),
    ]);

  return {
    beritaTerbaru,
    produkTerbaru,
    jumlahBerita,
    jumlahProduk,
    jumlahUmkm,
    kesehatanDatabase: await periksaKesehatanDatabase(),
  };
}
