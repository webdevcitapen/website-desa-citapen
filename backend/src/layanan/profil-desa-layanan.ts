/**
 * Layanan profil desa: mengelola letak geografis & wilayah.
 * Hanya admin desa yang boleh mengubah, publik boleh membaca.
 */

import { logger } from '../utils/logger.js';
import {
  ambilProfilDesa as ambilProfilDesaRepo,
  perbaruiProfilDesa as perbaruiProfilDesaRepo,
  perbaruiSejarahDesa as perbaruiSejarahRepo,
  perbaruiVisiMisiDesa as perbaruiVisiMisiRepo,
} from '../repositori/profil-desa-repositori.js';
import type { DataProfilDesa } from '../types/index.js';

/** Mengambil profil desa untuk publik. */
export async function ambilProfilDesa(): Promise<DataProfilDesa> {
  const profil = await ambilProfilDesaRepo();
  if (profil) {
    return {
      id: profil.id,
      luasWilayah: profil.luasWilayah,
      batasUtara: profil.batasUtara,
      batasSelatan: profil.batasSelatan,
      batasBarat: profil.batasBarat,
      batasTimur: profil.batasTimur,
      letakGeografis: profil.letakGeografis,
      deskripsiWilayah: profil.deskripsiWilayah,
      sejarah: profil.sejarah,
      visi: profil.visi,
      misi: profil.misi,
      diperbaruiPada: profil.diperbaruiPada,
    };
  }
  // Jika belum ada, kembalikan default
  return {
    id: 1,
    luasWilayah: '473,300 Ha',
    batasUtara: 'Desa Tundangan',
    batasSelatan: 'Desa Pakembangan',
    batasBarat: 'Kecamatan Ciniru',
    batasTimur: 'Kecamatan Maleber',
    letakGeografis: null,
    deskripsiWilayah: null,
    sejarah: null,
    visi: null,
    misi: null,
    diperbaruiPada: new Date(),
  };
}

/** Memperbarui profil desa oleh admin desa (termasuk sejarah, visi, misi). */
export async function ubahProfilDesa(data: {
  luasWilayah: string;
  batasUtara: string;
  batasSelatan: string;
  batasBarat: string;
  batasTimur: string;
  letakGeografis: string | null;
  deskripsiWilayah: string | null;
  sejarah?: string | null;
  visi?: string | null;
  misi?: string | null;
}): Promise<DataProfilDesa> {
  // Ambil profil lama agar sejarah/visi/misi tidak hilang jika tidak dikirim
  const profilLama = await ambilProfilDesa();

  const profil = await perbaruiProfilDesaRepo({
    luasWilayah: data.luasWilayah,
    batasUtara: data.batasUtara,
    batasSelatan: data.batasSelatan,
    batasBarat: data.batasBarat,
    batasTimur: data.batasTimur,
    letakGeografis: data.letakGeografis,
    deskripsiWilayah: data.deskripsiWilayah,
    sejarah: data.sejarah !== undefined ? data.sejarah : profilLama.sejarah,
    visi: data.visi !== undefined ? data.visi : profilLama.visi,
    misi: data.misi !== undefined ? data.misi : profilLama.misi,
  });

  logger.info('Profil desa berhasil diperbarui oleh admin desa');

  return {
    id: profil.id,
    luasWilayah: profil.luasWilayah,
    batasUtara: profil.batasUtara,
    batasSelatan: profil.batasSelatan,
    batasBarat: profil.batasBarat,
    batasTimur: profil.batasTimur,
    letakGeografis: profil.letakGeografis,
    deskripsiWilayah: profil.deskripsiWilayah,
    sejarah: profil.sejarah,
    visi: profil.visi,
    misi: profil.misi,
    diperbaruiPada: profil.diperbaruiPada,
  };
}

/** Memperbarui hanya sejarah desa. */
export async function ubahSejarahDesa(sejarah: string): Promise<DataProfilDesa> {
  const profil = await perbaruiSejarahRepo(sejarah);
  logger.info('Sejarah desa berhasil diperbarui oleh admin desa');
  return {
    id: profil.id,
    luasWilayah: profil.luasWilayah,
    batasUtara: profil.batasUtara,
    batasSelatan: profil.batasSelatan,
    batasBarat: profil.batasBarat,
    batasTimur: profil.batasTimur,
    letakGeografis: profil.letakGeografis,
    deskripsiWilayah: profil.deskripsiWilayah,
    sejarah: profil.sejarah,
    visi: profil.visi,
    misi: profil.misi,
    diperbaruiPada: profil.diperbaruiPada,
  };
}

/** Memperbarui visi dan misi desa. */
export async function ubahVisiMisiDesa(
  visi: string,
  misi: string,
): Promise<DataProfilDesa> {
  const profil = await perbaruiVisiMisiRepo(visi, misi);
  logger.info('Visi misi desa berhasil diperbarui oleh admin desa');
  return {
    id: profil.id,
    luasWilayah: profil.luasWilayah,
    batasUtara: profil.batasUtara,
    batasSelatan: profil.batasSelatan,
    batasBarat: profil.batasBarat,
    batasTimur: profil.batasTimur,
    letakGeografis: profil.letakGeografis,
    deskripsiWilayah: profil.deskripsiWilayah,
    sejarah: profil.sejarah,
    visi: profil.visi,
    misi: profil.misi,
    diperbaruiPada: profil.diperbaruiPada,
  };
}
