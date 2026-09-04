/**
 * Pengendali galeri desa: membuat, membaca, dan menghapus galeri.
 * Galeri ditampilkan di halaman profil desa; Publik boleh membaca,
 * hanya admin desa yang boleh menambah dan menghapus.
 */

import type { NextFunction, Request, Response } from 'express';
import { bungkusHandler } from '../middleware/penangan-kesalahan.js';
import { kirimSukses, kirimSuksesDibuat } from '../utils/respons.js';
import {
  ambilDaftarGaleri,
  ambilDetailGaleri,
  hapusGaleriDenganFoto,
  tambahGaleri,
} from '../layanan/galeri-layanan.js';
import { KesalahanBerkas } from '../utils/kesalahan.js';

/** Menangani permintaan daftar galeri untuk publik. */
export const daftarGaleri = bungkusHandler(
  async (_permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const daftar = await ambilDaftarGaleri();
    kirimSukses(tanggapan, daftar, 'Daftar galeri berhasil diambil');
  },
);

/** Menangani permintaan detail satu galeri untuk publik. */
export const detailGaleri = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };
    const galeri = await ambilDetailGaleri(Number(id));
    kirimSukses(tanggapan, galeri, 'Detail galeri berhasil diambil');
  },
);

/** Menangani pembuatan galeri baru oleh admin desa (foto wajib). */
export const buatGaleri = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const data = permintaan.body as {
      judul?: string | null;
      keterangan?: string | null;
      urutan?: string | null;
    };

    if (!permintaan.file) {
      throw new KesalahanBerkas('Foto galeri wajib diunggah (jpg, jpeg, png, heic)');
    }

    const judul = data.judul ?? null;
    const keterangan = data.keterangan ?? null;
    const urutan = data.urutan ? Number(data.urutan) : 0;

    const galeri = await tambahGaleri(
      {
        judul: judul && judul !== '' ? judul : null,
        keterangan: keterangan && keterangan !== '' ? keterangan : null,
        urutan: Number.isNaN(urutan) ? 0 : urutan,
      },
      permintaan.file,
    );

    kirimSuksesDibuat(tanggapan, galeri, 'Galeri berhasil ditambahkan');
  },
);

/** Menangani permintaan menghapus galeri oleh admin desa. */
export const hapusGaleri = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };
    await hapusGaleriDenganFoto(Number(id));
    kirimSukses(tanggapan, null, 'Galeri berhasil dihapus');
  },
);
