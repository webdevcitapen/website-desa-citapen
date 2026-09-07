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
import { cariKontakAdmin } from '../repositori/pengguna-repositori.js';
import type { DataBeranda } from '../types/index.js';
import { dapatkanUrlBerkasUntukKlien } from '../utils/berkas.js';

/** Jumlah data terbaru yang ditampilkan di halaman beranda. */
const JUMLAH_DATA_BERANDA = 5;

/** Menyusun seluruh data untuk halaman beranda. */
export async function susunDataBeranda(): Promise<DataBeranda> {
  // Ambil data terbaru dengan jumlah terbatas agar cepat
  // jumlahUmkm kini menghitung tabel umkm (nama UMKM yang dikelola admin desa)
  // Semua query diparalelkan termasuk cek kesehatan agar latency minimal
  const [
    beritaTerbaru,
    produkTerbaru,
    jumlahBerita,
    jumlahProduk,
    jumlahUmkm,
    kontakAdmin,
    kesehatanDatabase,
  ] = await Promise.all([
    daftarBeritaTerbaru(JUMLAH_DATA_BERANDA),
    daftarProdukTerbaru(JUMLAH_DATA_BERANDA),
    hitungBerita(),
    hitungProduk(),
    hitungUmkm(),
    cariKontakAdmin(),
    periksaKesehatanDatabase(),
  ]);

  // Transform gambar/foto ke URL CDN agar frontend langsung pakai CDN tanpa proxy
  const beritaDenganUrl = beritaTerbaru.map((b) => ({
    ...b,
    gambar: dapatkanUrlBerkasUntukKlien(b.gambar) as string | null,
  }));
  const produkDenganUrl = produkTerbaru.map((p) => ({
    ...p,
    foto: dapatkanUrlBerkasUntukKlien(p.foto) as string | null,
  }));

  return {
    beritaTerbaru: beritaDenganUrl,
    produkTerbaru: produkDenganUrl,
    jumlahBerita,
    jumlahProduk,
    jumlahUmkm,
    kesehatanDatabase,
    kontakAdmin: kontakAdmin ?? null,
  };
}
