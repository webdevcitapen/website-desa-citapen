/**
 * Pengendali struktur organisasi desa.
 * Publik boleh membaca, hanya admin desa yang boleh CRUD.
 */

import type { NextFunction, Request, Response } from 'express';
import { bungkusHandler } from '../middleware/penangan-kesalahan.js';
import { kirimSukses, kirimSuksesDibuat } from '../utils/respons.js';
import {
  ambilDaftarStruktur,
  ambilDetailStruktur,
  hapusStrukturDenganId,
  tambahStruktur,
  ubahStruktur,
} from '../layanan/struktur-organisasi-layanan.js';

/** Daftar struktur untuk publik. */
export const daftarStrukturOrganisasi = bungkusHandler(
  async (_permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const daftar = await ambilDaftarStruktur();
    kirimSukses(tanggapan, daftar, 'Daftar struktur organisasi berhasil diambil');
  },
);

/** Detail struktur untuk publik. */
export const detailStrukturOrganisasi = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };
    const item = await ambilDetailStruktur(Number(id));
    kirimSukses(tanggapan, item, 'Detail struktur organisasi berhasil diambil');
  },
);

/** Buat struktur baru oleh admin desa. */
export const buatStrukturOrganisasi = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const data = permintaan.body as { nama: string; jabatan: string; urutan?: number };
    const item = await tambahStruktur({
      nama: data.nama,
      jabatan: data.jabatan,
      urutan: data.urutan ?? 0,
    });
    kirimSuksesDibuat(tanggapan, item, 'Struktur organisasi berhasil dibuat');
  },
);

/** Ubah struktur oleh admin desa. */
export const perbaruiStrukturOrganisasi = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };
    const data = permintaan.body as { nama: string; jabatan: string; urutan?: number };
    const item = await ubahStruktur(Number(id), {
      nama: data.nama,
      jabatan: data.jabatan,
      urutan: data.urutan ?? 0,
    });
    kirimSukses(tanggapan, item, 'Struktur organisasi berhasil diperbarui');
  },
);

/** Hapus struktur oleh admin desa. */
export const hapusStrukturOrganisasi = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };
    await hapusStrukturDenganId(Number(id));
    kirimSukses(tanggapan, null, 'Struktur organisasi berhasil dihapus');
  },
);
