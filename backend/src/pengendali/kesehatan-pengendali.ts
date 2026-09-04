/**
 * Pengendali kesehatan dan beranda.
 * Endpoint kesehatan dipakai frontend untuk membangunkan server
 * dan database yang tertidur (render dan supabase) sekaligus
 * memeriksa kesiapan layanan.
 */

import type { NextFunction, Request, Response } from 'express';
import { bungkusHandler } from '../middleware/penangan-kesalahan.js';
import { kirimSukses } from '../utils/respons.js';
import { periksaKesehatanDatabase } from '../config/database.js';
import { susunDataBeranda } from '../layanan/beranda-layanan.js';

/** Menangani permintaan pemeriksaan kesehatan server dan database. */
export const periksaKesehatan = bungkusHandler(
  async (_permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    // Cek koneksi database; sekaligus membangunkan database yang tertidur
    const databaseSehat = await periksaKesehatanDatabase();

    kirimSukses(
      tanggapan,
      {
        layanan: 'backend-desa-citapen',
        database: databaseSehat ? 'terhubung' : 'tidak terhubung',
        waktu: new Date().toISOString(),
      },
      databaseSehat
        ? 'Layanan berjalan normal dan database terhubung'
        : 'Layanan berjalan tetapi database belum terhubung',
      databaseSehat ? 200 : 503,
    );
  },
);

/** Menangani permintaan data halaman beranda untuk publik. */
export const ambilBeranda = bungkusHandler(
  async (_permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const dataBeranda = await susunDataBeranda();

    kirimSukses(tanggapan, dataBeranda, 'Data beranda berhasil diambil');
  },
);
