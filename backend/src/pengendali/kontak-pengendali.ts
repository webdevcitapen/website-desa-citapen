/**
 * Pengendali kontak admin publik.
 * Menyediakan nomor WhatsApp admin desa yang selalu mengikuti
 * data terbaru di tabel pengguna (peran = admin), sehingga
 * halaman login / informasi-pendaftaran tidak perlu hardcode.
 */

import type { NextFunction, Request, Response } from 'express';
import { bungkusHandler } from '../middleware/penangan-kesalahan.js';
import { kirimSukses } from '../utils/respons.js';
import { ambilKontakAdmin } from '../layanan/pengguna-layanan.js';

/** Menangani permintaan kontak admin untuk publik (tanpa auth). */
export const ambilKontakAdminPublik = bungkusHandler(
  async (_permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const kontak = await ambilKontakAdmin();

    // Selalu 200, data null jika belum ada admin dengan nomorHp
    kirimSukses(
      tanggapan,
      kontak,
      kontak?.nomorHp
        ? 'Kontak admin berhasil diambil'
        : 'Kontak admin belum tersedia',
    );
  },
);
