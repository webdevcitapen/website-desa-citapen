/**
 * Layanan riwayat kepala desa (kuwu).
 * Hanya admin desa yang boleh mengubah, publik boleh membaca.
 */

import { logger } from '../utils/logger.js';
import {
  buatRiwayat,
  daftarRiwayat,
  hapusRiwayat,
  perbaruiRiwayat,
  temukanRiwayatBerdasarkanId,
} from '../repositori/riwayat-kuwu-repositori.js';
import type { DataRiwayatKuwu } from '../types/index.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Mengambil semua riwayat kuwu untuk publik. */
export async function ambilDaftarRiwayat(): Promise<DataRiwayatKuwu[]> {
  const daftar = await daftarRiwayat();
  return daftar.map((item) => ({
    id: item.id,
    nama: item.nama,
    masaJabatan: item.masaJabatan,
    urutan: item.urutan,
    keterangan: item.keterangan,
    dibuatPada: item.dibuatPada,
    diperbaruiPada: item.diperbaruiPada,
  }));
}

/** Mengambil detail satu riwayat. */
export async function ambilDetailRiwayat(
  id: number,
): Promise<DataRiwayatKuwu> {
  const item = await temukanRiwayatBerdasarkanId(id);
  if (!item) {
    throw new KesalahanTidakDitemukan('Riwayat kuwu tidak ditemukan');
  }
  return {
    id: item.id,
    nama: item.nama,
    masaJabatan: item.masaJabatan,
    urutan: item.urutan,
    keterangan: item.keterangan,
    dibuatPada: item.dibuatPada,
    diperbaruiPada: item.diperbaruiPada,
  };
}

/** Membuat riwayat baru oleh admin desa. */
export async function tambahRiwayat(data: {
  nama: string;
  masaJabatan: string;
  urutan: number;
  keterangan?: string | null;
}): Promise<DataRiwayatKuwu> {
  const item = await buatRiwayat({
    nama: data.nama,
    masaJabatan: data.masaJabatan,
    urutan: data.urutan,
    keterangan: data.keterangan ?? null,
  });
  logger.info({ riwayatId: item.id }, 'Riwayat kuwu berhasil dibuat');
  return {
    id: item.id,
    nama: item.nama,
    masaJabatan: item.masaJabatan,
    urutan: item.urutan,
    keterangan: item.keterangan,
    dibuatPada: item.dibuatPada,
    diperbaruiPada: item.diperbaruiPada,
  };
}

/** Mengubah riwayat oleh admin desa. */
export async function ubahRiwayat(
  id: number,
  data: { nama: string; masaJabatan: string; urutan: number; keterangan?: string | null },
): Promise<DataRiwayatKuwu> {
  const item = await perbaruiRiwayat(id, {
    nama: data.nama,
    masaJabatan: data.masaJabatan,
    urutan: data.urutan,
    keterangan: data.keterangan ?? null,
  });
  logger.info({ riwayatId: id }, 'Riwayat kuwu berhasil diperbarui');
  return {
    id: item.id,
    nama: item.nama,
    masaJabatan: item.masaJabatan,
    urutan: item.urutan,
    keterangan: item.keterangan,
    dibuatPada: item.dibuatPada,
    diperbaruiPada: item.diperbaruiPada,
  };
}

/** Menghapus riwayat oleh admin desa. */
export async function hapusRiwayatDenganId(id: number): Promise<void> {
  await hapusRiwayat(id);
  logger.info({ riwayatId: id }, 'Riwayat kuwu berhasil dihapus');
}
