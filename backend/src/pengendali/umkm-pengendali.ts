/**
 * Pengendali UMKM: membuat, membaca, mengubah, menghapus UMKM.
 * Publik boleh membaca daftar dan detail; hanya admin desa yang boleh menulis.
 */

import type { NextFunction, Request, Response } from 'express';
import { bungkusHandler } from '../middleware/penangan-kesalahan.js';
import { kirimSukses, kirimSuksesDibuat } from '../utils/respons.js';
import {
  ambilDaftarUmkm,
  ambilDetailUmkm,
  hapusUmkmDenganPemeriksaan,
  tambahUmkm,
  ubahUmkm,
} from '../layanan/umkm-layanan.js';
import { KesalahanAutentikasi } from '../utils/kesalahan.js';

/** Menangani permintaan daftar UMKM untuk publik. */
export const daftarUmkm = bungkusHandler(
  async (_permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const daftar = await ambilDaftarUmkm();
    kirimSukses(tanggapan, daftar, 'Daftar UMKM berhasil diambil');
  },
);

/** Menangani permintaan detail satu UMKM untuk publik. */
export const detailUmkm = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };
    const umkm = await ambilDetailUmkm(Number(id));
    kirimSukses(tanggapan, umkm, 'Detail UMKM berhasil diambil');
  },
);

/** Menangani pembuatan UMKM baru oleh admin desa. */
export const buatUmkm = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const data = permintaan.body as {
      nama: string;
      nomorHp?: string | null;
      nomor_hp?: string | null;
      alamat?: string | null;
      deskripsi?: string | null;
    };

    const nomorHpRaw = data.nomorHp ?? data.nomor_hp ?? null;

    const umkm = await tambahUmkm(
      permintaan.pengguna.id,
      {
        nama: data.nama,
        nomorHp: nomorHpRaw,
        alamat: data.alamat ?? null,
        deskripsi: data.deskripsi ?? null,
      },
      permintaan.file,
    );

    kirimSuksesDibuat(tanggapan, umkm, 'UMKM berhasil ditambahkan');
  },
);

/** Menangani permintaan mengubah UMKM oleh admin desa. */
export const perbaruiUmkm = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const { id } = permintaan.params as { id: string };
    const data = permintaan.body as {
      nama: string;
      nomorHp?: string | null;
      nomor_hp?: string | null;
      alamat?: string | null;
      deskripsi?: string | null;
    };

    const nomorHpRaw = data.nomorHp ?? data.nomor_hp ?? null;

    const umkm = await ubahUmkm(
      Number(id),
      {
        nama: data.nama,
        nomorHp: nomorHpRaw,
        alamat: data.alamat ?? null,
        deskripsi: data.deskripsi ?? null,
      },
      permintaan.file,
    );

    kirimSukses(tanggapan, umkm, 'UMKM berhasil diperbarui');
  },
);

/** Menangani permintaan menghapus UMKM oleh admin desa. */
export const hapusUmkm = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const { id } = permintaan.params as { id: string };
    await hapusUmkmDenganPemeriksaan(Number(id));
    kirimSukses(tanggapan, null, 'UMKM berhasil dihapus');
  },
);
