/**
 * Layanan UMKM: mengelola daftar nama UMKM beserta nomor hp dan alamat.
 * Hanya admin desa yang boleh menambah, mengubah, menghapus UMKM.
 * Produk dapat dikaitkan ke UMKM sehingga hp & alamat terisi otomatis.
 */

import type { BerkasUnggahan, DataUmkm } from '../types/index.js';
import {
  KesalahanKonflik,
  KesalahanTidakDitemukan,
} from '../utils/kesalahan.js';
import { kompresGambar } from '../utils/kompresi-gambar.js';
import { hapusBerkas, simpanBerkas, dapatkanUrlBerkasUntukKlien } from '../utils/berkas.js';
import { logger } from '../utils/logger.js';
import {
  buatUmkm as buatUmkmRepo,
  daftarUmkm as daftarUmkmRepo,
  hapusUmkm as hapusUmkmRepo,
  hitungUmkm,
  perbaruiUmkm as perbaruiUmkmRepo,
  temukanUmkmBerdasarkanId,
  temukanUmkmBerdasarkanNama,
} from '../repositori/umkm-repositori.js';

/** Data untuk membuat atau memperbarui UMKM. */
export interface DataSimpanUmkm {
  nama: string;
  nomorHp: string | null;
  alamat: string | null;
  deskripsi: string | null;
}

/** Mengubah path foto UMKM menjadi URL CDN. */
function perkayaFotoUmkm<T extends { foto: string | null }>(item: T): T {
  return {
    ...item,
    foto: dapatkanUrlBerkasUntukKlien(item.foto) as T['foto'],
  };
}

/** Mengambil daftar UMKM untuk publik dan admin. */
export async function ambilDaftarUmkm(): Promise<DataUmkm[]> {
  const daftar = await daftarUmkmRepo();
  return daftar.map((item) => perkayaFotoUmkm({
    id: item.id,
    nama: item.nama,
    nomorHp: item.nomorHp,
    alamat: item.alamat,
    deskripsi: item.deskripsi,
    foto: item.foto,
    pemilikId: item.pemilikId,
    dibuatPada: item.dibuatPada,
    diperbaruiPada: item.diperbaruiPada,
  }));
}

/** Mengambil detail satu UMKM. */
export async function ambilDetailUmkm(id: number): Promise<DataUmkm> {
  const umkm = await temukanUmkmBerdasarkanId(id);
  if (!umkm) {
    throw new KesalahanTidakDitemukan('UMKM tidak ditemukan');
  }
  return perkayaFotoUmkm({
    id: umkm.id,
    nama: umkm.nama,
    nomorHp: umkm.nomorHp,
    alamat: umkm.alamat,
    deskripsi: umkm.deskripsi,
    foto: umkm.foto,
    pemilikId: umkm.pemilikId,
    dibuatPada: umkm.dibuatPada,
    diperbaruiPada: umkm.diperbaruiPada,
  });
}

/** Membuat UMKM baru oleh admin desa. */
export async function tambahUmkm(
  pemilikId: number,
  data: DataSimpanUmkm,
  berkasFoto?: BerkasUnggahan,
): Promise<DataUmkm> {
  // Cek duplikat nama UMKM (case-insensitive)
  const sudahAda = await temukanUmkmBerdasarkanNama(data.nama);
  if (sudahAda) {
    throw new KesalahanKonflik('Nama UMKM sudah dipakai');
  }

  let foto: string | null = null;
  if (berkasFoto) {
    const hasilKompresi = await kompresGambar(berkasFoto.buffer);
    foto = await simpanBerkas(hasilKompresi.buffer, 'umkm', hasilKompresi.ekstensi);
  }

  try {
    const umkm = await buatUmkmRepo({
      nama: data.nama,
      nomorHp: data.nomorHp && data.nomorHp !== '' ? data.nomorHp : null,
      alamat: data.alamat && data.alamat !== '' ? data.alamat : null,
      deskripsi: data.deskripsi && data.deskripsi !== '' ? data.deskripsi : null,
      foto,
      pemilikId,
    });

    logger.info({ umkmId: umkm.id, nama: umkm.nama }, 'UMKM baru berhasil dibuat');

    return perkayaFotoUmkm({
      id: umkm.id,
      nama: umkm.nama,
      nomorHp: umkm.nomorHp,
      alamat: umkm.alamat,
      deskripsi: umkm.deskripsi,
      foto: umkm.foto,
      pemilikId: umkm.pemilikId,
      dibuatPada: umkm.dibuatPada,
      diperbaruiPada: umkm.diperbaruiPada,
    });
  } catch (kesalahan) {
    if (foto) {
      await hapusBerkas(foto);
    }
    throw kesalahan;
  }
}

/** Mengubah UMKM oleh admin desa. */
export async function ubahUmkm(
  id: number,
  data: DataSimpanUmkm,
  berkasFoto?: BerkasUnggahan,
): Promise<DataUmkm> {
  const umkm = await temukanUmkmBerdasarkanId(id);
  if (!umkm) {
    throw new KesalahanTidakDitemukan('UMKM tidak ditemukan');
  }

  // Jika nama berubah, cek duplikat
  if (data.nama.toLowerCase() !== umkm.nama.toLowerCase()) {
    const sudahAda = await temukanUmkmBerdasarkanNama(data.nama);
    if (sudahAda) {
      throw new KesalahanKonflik('Nama UMKM sudah dipakai');
    }
  }

  let fotoBaru: string | null = umkm.foto;
  let fotoPerluHapusLama = false;

  if (berkasFoto) {
    const hasilKompresi = await kompresGambar(berkasFoto.buffer);
    fotoBaru = await simpanBerkas(hasilKompresi.buffer, 'umkm', hasilKompresi.ekstensi);
    fotoPerluHapusLama = true;
  }

  try {
    const umkmDiperbarui = await perbaruiUmkmRepo(id, {
      nama: data.nama,
      nomorHp: data.nomorHp && data.nomorHp !== '' ? data.nomorHp : null,
      alamat: data.alamat && data.alamat !== '' ? data.alamat : null,
      deskripsi: data.deskripsi && data.deskripsi !== '' ? data.deskripsi : null,
      foto: fotoBaru,
    });

    // Hapus foto lama jika ada foto baru
    if (fotoPerluHapusLama && umkm.foto && fotoBaru !== umkm.foto) {
      await hapusBerkas(umkm.foto);
    }

    logger.info({ umkmId: id }, 'UMKM berhasil diperbarui');

    return perkayaFotoUmkm({
      id: umkmDiperbarui.id,
      nama: umkmDiperbarui.nama,
      nomorHp: umkmDiperbarui.nomorHp,
      alamat: umkmDiperbarui.alamat,
      deskripsi: umkmDiperbarui.deskripsi,
      foto: umkmDiperbarui.foto,
      pemilikId: umkmDiperbarui.pemilikId,
      dibuatPada: umkmDiperbarui.dibuatPada,
      diperbaruiPada: umkmDiperbarui.diperbaruiPada,
    });
  } catch (kesalahan) {
    if (fotoPerluHapusLama && fotoBaru && fotoBaru !== umkm.foto) {
      await hapusBerkas(fotoBaru);
    }
    throw kesalahan;
  }
}

/** Menghapus UMKM oleh admin desa. */
export async function hapusUmkmDenganPemeriksaan(id: number): Promise<void> {
  const umkm = await temukanUmkmBerdasarkanId(id);
  if (!umkm) {
    throw new KesalahanTidakDitemukan('UMKM tidak ditemukan');
  }

  await hapusUmkmRepo(id);

  if (umkm.foto) {
    await hapusBerkas(umkm.foto);
  }

  logger.info({ umkmId: id }, 'UMKM berhasil dihapus');
}

/** Menghitung jumlah UMKM untuk beranda. */
export async function ambilJumlahUmkm(): Promise<number> {
  return hitungUmkm();
}
