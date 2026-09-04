/**
 * Pengendali riwayat kepala desa (kuwu).
 * Publik boleh membaca, hanya admin desa yang boleh CRUD.
 */

import type { NextFunction, Request, Response } from 'express';
import { bungkusHandler } from '../middleware/penangan-kesalahan.js';
import { kirimSukses, kirimSuksesDibuat } from '../utils/respons.js';
import {
  ambilDaftarRiwayat,
  ambilDetailRiwayat,
  hapusRiwayatDenganId,
  tambahRiwayat,
  ubahRiwayat,
} from '../layanan/riwayat-kuwu-layanan.js';

/** Daftar riwayat kuwu untuk publik. */
export const daftarRiwayatKuwu = bungkusHandler(
  async (_permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const daftar = await ambilDaftarRiwayat();
    kirimSukses(tanggapan, daftar, 'Daftar riwayat kuwu berhasil diambil');
  },
);

/** Detail riwayat kuwu untuk publik. */
export const detailRiwayatKuwu = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };
    const item = await ambilDetailRiwayat(Number(id));
    kirimSukses(tanggapan, item, 'Detail riwayat kuwu berhasil diambil');
  },
);

/** Buat riwayat baru oleh admin desa. */
export const buatRiwayatKuwu = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const data = permintaan.body as {
      nama: string;
      masaJabatan: string;
      urutan?: number;
      keterangan?: string | null;
    };
    const item = await tambahRiwayat({
      nama: data.nama,
      masaJabatan: data.masaJabatan,
      urutan: data.urutan ?? 0,
      keterangan: data.keterangan ?? null,
    });
    kirimSuksesDibuat(tanggapan, item, 'Riwayat kuwu berhasil dibuat');
  },
);

/** Ubah riwayat oleh admin desa. */
export const perbaruiRiwayatKuwu = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };
    const data = permintaan.body as {
      nama: string;
      masaJabatan: string;
      urutan?: number;
      keterangan?: string | null;
    };
    const item = await ubahRiwayat(Number(id), {
      nama: data.nama,
      masaJabatan: data.masaJabatan,
      urutan: data.urutan ?? 0,
      keterangan: data.keterangan ?? null,
    });
    kirimSukses(tanggapan, item, 'Riwayat kuwu berhasil diperbarui');
  },
);

/** Hapus riwayat oleh admin desa. */
export const hapusRiwayatKuwu = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };
    await hapusRiwayatDenganId(Number(id));
    kirimSukses(tanggapan, null, 'Riwayat kuwu berhasil dihapus');
  },
);
