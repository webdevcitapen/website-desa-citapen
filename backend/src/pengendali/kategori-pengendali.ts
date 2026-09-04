/**
 * Pengendali kategori produk: membuat, membaca, dan menghapus kategori.
 * Kategori dibuat dan dihapus oleh admin desa, serta dapat dilihat publik.
 */

import type { NextFunction, Request, Response } from 'express';
import { bungkusHandler } from '../middleware/penangan-kesalahan.js';
import { kirimSukses, kirimSuksesDibuat } from '../utils/respons.js';
import {
  ambilDaftarKategori,
  hapusKategoriDenganPemeriksaan,
  tambahKategori,
} from '../layanan/kategori-layanan.js';
import { KesalahanAutentikasi } from '../utils/kesalahan.js';

/** Menangani pembuatan kategori produk baru oleh admin desa. */
export const buatKategori = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const { nama } = permintaan.body as { nama: string };

    const kategori = await tambahKategori(permintaan.pengguna.id, nama);

    kirimSuksesDibuat(tanggapan, kategori, 'Kategori produk berhasil dibuat');
  },
);

/** Menangani permintaan daftar kategori untuk publik. */
export const daftarKategori = bungkusHandler(
  async (_permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const daftar = await ambilDaftarKategori();

    kirimSukses(tanggapan, daftar, 'Daftar kategori berhasil diambil');
  },
);

/** Menangani permintaan menghapus kategori oleh admin desa. */
export const hapusKategori = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const { id } = permintaan.params as { id: string };

    await hapusKategoriDenganPemeriksaan(
      Number(id),
      permintaan.pengguna.id,
      permintaan.pengguna.peran,
    );

    kirimSukses(tanggapan, null, 'Kategori produk berhasil dihapus');
  },
);
