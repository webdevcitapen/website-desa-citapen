/**
 * Layanan struktur organisasi desa.
 * Hanya admin desa yang boleh mengubah, publik boleh membaca.
 */

import { logger } from '../utils/logger.js';
import {
  buatStruktur,
  daftarStruktur,
  hapusStruktur,
  perbaruiStruktur,
  temukanStrukturBerdasarkanId,
} from '../repositori/struktur-organisasi-repositori.js';
import type { DataStrukturOrganisasi } from '../types/index.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Mengambil semua struktur organisasi untuk publik. */
export async function ambilDaftarStruktur(): Promise<DataStrukturOrganisasi[]> {
  const daftar = await daftarStruktur();
  return daftar.map((item) => ({
    id: item.id,
    nama: item.nama,
    jabatan: item.jabatan,
    urutan: item.urutan,
    foto: item.foto,
    dibuatPada: item.dibuatPada,
    diperbaruiPada: item.diperbaruiPada,
  }));
}

/** Mengambil detail satu struktur. */
export async function ambilDetailStruktur(
  id: number,
): Promise<DataStrukturOrganisasi> {
  const item = await temukanStrukturBerdasarkanId(id);
  if (!item) {
    throw new KesalahanTidakDitemukan('Struktur organisasi tidak ditemukan');
  }
  return {
    id: item.id,
    nama: item.nama,
    jabatan: item.jabatan,
    urutan: item.urutan,
    foto: item.foto,
    dibuatPada: item.dibuatPada,
    diperbaruiPada: item.diperbaruiPada,
  };
}

/** Membuat struktur baru oleh admin desa. */
export async function tambahStruktur(data: {
  nama: string;
  jabatan: string;
  urutan: number;
}): Promise<DataStrukturOrganisasi> {
  const item = await buatStruktur({
    nama: data.nama,
    jabatan: data.jabatan,
    urutan: data.urutan,
  });
  logger.info({ strukturId: item.id }, 'Struktur organisasi berhasil dibuat');
  return {
    id: item.id,
    nama: item.nama,
    jabatan: item.jabatan,
    urutan: item.urutan,
    foto: item.foto,
    dibuatPada: item.dibuatPada,
    diperbaruiPada: item.diperbaruiPada,
  };
}

/** Mengubah struktur oleh admin desa. */
export async function ubahStruktur(
  id: number,
  data: { nama: string; jabatan: string; urutan: number },
): Promise<DataStrukturOrganisasi> {
  const item = await perbaruiStruktur(id, {
    nama: data.nama,
    jabatan: data.jabatan,
    urutan: data.urutan,
  });
  logger.info({ strukturId: id }, 'Struktur organisasi berhasil diperbarui');
  return {
    id: item.id,
    nama: item.nama,
    jabatan: item.jabatan,
    urutan: item.urutan,
    foto: item.foto,
    dibuatPada: item.dibuatPada,
    diperbaruiPada: item.diperbaruiPada,
  };
}

/** Menghapus struktur oleh admin desa. */
export async function hapusStrukturDenganId(id: number): Promise<void> {
  await hapusStruktur(id);
  logger.info({ strukturId: id }, 'Struktur organisasi berhasil dihapus');
}
