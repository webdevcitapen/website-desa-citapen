/**
 * Layanan galeri desa: mengelola foto galeri di halaman profil desa.
 * Hanya admin desa yang boleh menambah dan menghapus galeri.
 * Mendukung format jpg, jpeg, png, heic, heif, webp.
 */

import type { BerkasUnggahan, DataGaleriDesa } from '../types/index.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';
import { kompresGambar } from '../utils/kompresi-gambar.js';
import { hapusBerkas, simpanBerkas } from '../utils/berkas.js';
import { logger } from '../utils/logger.js';
import {
  buatGaleri as buatGaleriRepo,
  daftarGaleri as daftarGaleriRepo,
  hapusGaleri as hapusGaleriRepo,
  temukanGaleriBerdasarkanId,
} from '../repositori/galeri-repositori.js';

/** Mengambil seluruh daftar galeri untuk publik. */
export async function ambilDaftarGaleri(): Promise<DataGaleriDesa[]> {
  const daftar = await daftarGaleriRepo();
  return daftar.map((item) => ({
    id: item.id,
    judul: item.judul,
    keterangan: item.keterangan,
    foto: item.foto,
    urutan: item.urutan,
    dibuatPada: item.dibuatPada,
    diperbaruiPada: item.diperbaruiPada,
  }));
}

/** Mengambil detail satu galeri untuk publik. */
export async function ambilDetailGaleri(id: number): Promise<DataGaleriDesa> {
  const galeri = await temukanGaleriBerdasarkanId(id);
  if (!galeri) {
    throw new KesalahanTidakDitemukan('Galeri tidak ditemukan');
  }
  return {
    id: galeri.id,
    judul: galeri.judul,
    keterangan: galeri.keterangan,
    foto: galeri.foto,
    urutan: galeri.urutan,
    dibuatPada: galeri.dibuatPada,
    diperbaruiPada: galeri.diperbaruiPada,
  };
}

/**
 * Menambah galeri baru oleh admin desa.
 * Foto wajib diunggah (jpg, jpeg, png, heic).
 */
export async function tambahGaleri(
  data: { judul?: string | null; keterangan?: string | null; urutan?: number },
  berkasFoto: BerkasUnggahan,
): Promise<DataGaleriDesa> {
  const hasilKompresi = await kompresGambar(berkasFoto.buffer);
  const pathFoto = await simpanBerkas(hasilKompresi.buffer, 'galeri', hasilKompresi.ekstensi);

  try {
    const galeri = await buatGaleriRepo({
      judul: data.judul ?? null,
      keterangan: data.keterangan ?? null,
      foto: pathFoto,
      urutan: data.urutan ?? 0,
    });

    logger.info({ galeriId: galeri.id }, 'Galeri baru berhasil ditambahkan');

    return {
      id: galeri.id,
      judul: galeri.judul,
      keterangan: galeri.keterangan,
      foto: galeri.foto,
      urutan: galeri.urutan,
      dibuatPada: galeri.dibuatPada,
      diperbaruiPada: galeri.diperbaruiPada,
    };
  } catch (kesalahan) {
    await hapusBerkas(pathFoto);
    throw kesalahan;
  }
}

/** Menghapus galeri oleh admin desa. */
export async function hapusGaleriDenganFoto(id: number): Promise<void> {
  const galeri = await temukanGaleriBerdasarkanId(id);
  if (!galeri) {
    throw new KesalahanTidakDitemukan('Galeri tidak ditemukan');
  }

  await hapusGaleriRepo(id);

  if (galeri.foto) {
    await hapusBerkas(galeri.foto);
  }

  logger.info({ galeriId: id }, 'Galeri berhasil dihapus');
}
