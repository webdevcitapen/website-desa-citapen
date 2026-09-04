/**
 * Layanan produk: membuat, membaca, mengubah, dan menghapus produk.
 * Setelah penghapusan peran umkm, setiap produk dikelola penuh
 * oleh admin desa (full akses CRUD tanpa batasan pemilik).
 * Pemeriksaan kepemilikan tetap ada untuk kompatibilitas tetapi
 * admin desa dapat mengelola semua produk.
 */

import type { BerkasUnggahan, DataProduk, Peran } from '../types/index.js';
import {
  KesalahanOtorisasi,
  KesalahanTidakDitemukan,
} from '../utils/kesalahan.js';
import { kompresGambar } from '../utils/kompresi-gambar.js';
import { hapusBerkas, simpanBerkas } from '../utils/berkas.js';
import { logger } from '../utils/logger.js';
import {
  buatProduk as buatProdukRepositori,
  daftarProduk as daftarProdukRepositori,
  hapusProduk,
  hitungProduk,
  perbaruiProduk,
  temukanProdukBerdasarkanId,
} from '../repositori/produk-repositori.js';
import { temukanKategoriBerdasarkanId } from '../repositori/kategori-repositori.js';
import { temukanUmkmBerdasarkanId } from '../repositori/umkm-repositori.js';
import type { HasilPaginasi } from '../types/index.js';
import { hitungTotalHalaman } from '../utils/paginasi.js';

/** Data untuk membuat atau memperbarui produk. */
export interface DataSimpanProduk {
  nama: string;
  harga: number;
  deskripsi: string;
  kategoriId: number | null;
  umkmId?: number | null;
}

/** Parameter untuk mengambil daftar produk. */
export interface ParameterDaftarProdukLayanan {
  halaman: number;
  perHalaman: number;
  lewati: number;
  batas: number;
  kategoriId?: number;
  pemilikId?: number;
  umkmId?: number;
}

/** Memeriksa bahwa kategori produk ada dan boleh dipakai. */
async function pastikanKategoriMilikPemilik(
  kategoriId: number | null,
  pemilikId: number,
  peran?: Peran,
): Promise<void> {
  if (kategoriId === null || kategoriId === undefined) {
    return;
  }

  const kategori = await temukanKategoriBerdasarkanId(kategoriId);
  if (!kategori) {
    throw new KesalahanTidakDitemukan('Kategori produk tidak ditemukan');
  }
  // Admin desa boleh memakai kategori milik siapapun (full akses)
  if (peran === 'admin') {
    return;
  }
  if (kategori.pemilikId !== pemilikId) {
    throw new KesalahanOtorisasi('Kategori tersebut bukan milik Anda');
  }
}

/** Memeriksa bahwa UMKM ada jika umkmId dikirim. */
async function pastikanUmkmAda(umkmId: number | null): Promise<void> {
  if (umkmId === null || umkmId === undefined) {
    return;
  }
  const umkm = await temukanUmkmBerdasarkanId(umkmId);
  if (!umkm) {
    throw new KesalahanTidakDitemukan('UMKM tidak ditemukan');
  }
}

/** Mengubah foto produk yang diunggah menjadi path yang aman. */
async function siapkanFotoProduk(
  berkas: BerkasUnggahan | undefined,
  fotoLama: string | null,
): Promise<string | null> {
  if (!berkas) {
    return fotoLama;
  }

  const hasilKompresi = await kompresGambar(berkas.buffer);
  const pathBaru = await simpanBerkas(
    hasilKompresi.buffer,
    'produk',
    hasilKompresi.ekstensi,
  );

  if (fotoLama) {
    await hapusBerkas(fotoLama);
  }

  return pathBaru;
}

/**
 * Membuat produk baru oleh admin desa.
 * Foto bersifat opsional; jika diunggah akan dikompres otomatis.
 */
export async function tambahProduk(
  pemilikId: number,
  data: DataSimpanProduk,
  berkasFoto?: BerkasUnggahan,
  peran?: Peran,
): Promise<DataProduk> {
  await pastikanKategoriMilikPemilik(data.kategoriId ?? null, pemilikId, peran);
  await pastikanUmkmAda(data.umkmId ?? null);

  let foto: string | null = null;
  try {
    foto = await siapkanFotoProduk(berkasFoto, null);
    const produk = await buatProdukRepositori({
      nama: data.nama,
      harga: data.harga ?? 0,
      deskripsi: data.deskripsi,
      foto,
      pemilikId,
      kategoriId: data.kategoriId ?? null,
      umkmId: data.umkmId ?? null,
    });

    logger.info(
      { produkId: produk.id, pemilikId },
      'Produk baru berhasil dibuat',
    );

    return produk;
  } catch (kesalahan) {
    if (foto) {
      await hapusBerkas(foto);
    }
    throw kesalahan;
  }
}

/** Mengambil daftar produk dengan paginasi untuk publik. */
export async function ambilDaftarProduk(
  parameter: ParameterDaftarProdukLayanan,
): Promise<HasilPaginasi<DataProduk>> {
  const daftar = await daftarProdukRepositori({
    batas: parameter.batas,
    lewati: parameter.lewati,
    kategoriId: parameter.kategoriId,
    pemilikId: parameter.pemilikId,
    umkmId: parameter.umkmId,
  });

  const total = await hitungProduk(parameter.kategoriId, parameter.pemilikId, parameter.umkmId);

  return {
    daftar,
    halaman: parameter.halaman,
    perHalaman: parameter.perHalaman,
    total,
    totalHalaman: hitungTotalHalaman(total, parameter.perHalaman),
  };
}

/** Mengambil detail satu produk untuk publik. */
export async function ambilDetailProduk(id: number): Promise<DataProduk> {
  const produk = await temukanProdukBerdasarkanId(id);
  if (!produk) {
    throw new KesalahanTidakDitemukan('Produk tidak ditemukan');
  }
  return produk;
}

/** Mengubah produk oleh admin desa (full akses). */
export async function ubahProduk(
  id: number,
  pemilikId: number,
  data: DataSimpanProduk,
  berkasFoto?: BerkasUnggahan,
  peran?: Peran,
): Promise<DataProduk> {
  const produk = await temukanProdukBerdasarkanId(id);
  if (!produk) {
    throw new KesalahanTidakDitemukan('Produk tidak ditemukan');
  }

  // Admin desa boleh mengubah semua produk; non-admin harus pemilik
  if (peran !== 'admin' && produk.pemilik?.id !== pemilikId) {
    throw new KesalahanOtorisasi('Anda hanya dapat mengubah produk milik Anda');
  }

  await pastikanKategoriMilikPemilik(data.kategoriId ?? null, pemilikId, peran);
  await pastikanUmkmAda(data.umkmId ?? null);

  let foto = produk.foto;
  try {
    foto = await siapkanFotoProduk(berkasFoto, produk.foto);
    const produkDiperbarui = await perbaruiProduk(id, {
      nama: data.nama,
      harga: data.harga ?? 0,
      deskripsi: data.deskripsi,
      foto,
      kategoriId: data.kategoriId ?? null,
      umkmId: data.umkmId ?? null,
    });

    logger.info(
      { produkId: id, pemilikId },
      'Produk berhasil diperbarui',
    );

    return produkDiperbarui;
  } catch (kesalahan) {
    if (berkasFoto && foto !== produk.foto && foto) {
      await hapusBerkas(foto);
    }
    throw kesalahan;
  }
}

/** Menghapus produk oleh admin desa (full akses). */
export async function hapusProdukDenganPemeriksaan(
  id: number,
  pemilikId: number,
  peran?: Peran,
): Promise<void> {
  const produk = await temukanProdukBerdasarkanId(id);
  if (!produk) {
    throw new KesalahanTidakDitemukan('Produk tidak ditemukan');
  }

  // Admin desa boleh menghapus semua produk; non-admin harus pemilik
  if (peran !== 'admin' && produk.pemilik?.id !== pemilikId) {
    throw new KesalahanOtorisasi('Anda hanya dapat menghapus produk milik Anda');
  }

  await hapusProduk(id);

  if (produk.foto) {
    await hapusBerkas(produk.foto);
  }

  logger.info(
    { produkId: id, pemilikId },
    'Produk berhasil dihapus',
  );
}
