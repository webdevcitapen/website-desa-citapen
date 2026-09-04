/**
 * Middleware pembatas laju permintaan (rate limiting).
 * Melindungi aplikasi dari serangan brute force dan serangan
 * membanjiri server (flood) dengan membatasi jumlah permintaan
 * per alamat ip dalam jangka waktu tertentu.
 */

import rateLimit from 'express-rate-limit';
import type { Request, RequestHandler, Response } from 'express';
import { lingkungan } from '../config/env.js';

/** Bentuk tanggapan ketika batas laju permintaan terlampaui. */
function buatTanggapanTerbatas(_permintaan: Request, tanggapan: Response): void {
  tanggapan.status(429).json({
    status: 'gagal',
    pesan: 'Terlalu banyak permintaan, silakan coba lagi beberapa saat',
    kode: 'TERLALU_BANYAK_PERMINTAAN',
  });
}

/** Pembatas laju umum untuk seluruh rute api. */
export const pembatasLajuUmum = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: lingkungan.BATAS_LAJU_UMUM,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: buatTanggapanTerbatas,
  // Jangan batasi endpoint kesehatan agar pengujian beban & monitoring dapat berjalan tanpa hambatan
  // Pengujian beban membanjiri /api/kesehatan dengan ratusan koneksi; jika dibatasi 300/15menit maka hampir semua permintaan akan 429
  // Juga skip preflight OPTIONS agar tidak menghabiskan kuota (frontend di 5173 -> 3000 beda port = selalu preflight)
  skip: (permintaan: Request) =>
    permintaan.method === 'OPTIONS' ||
    permintaan.url === '/kesehatan' ||
    permintaan.originalUrl === '/api/kesehatan' ||
    permintaan.originalUrl?.startsWith('/api/kesehatan?') === true,
});

/** Pembatas laju khusus untuk rute autentikasi (anti brute force). */
export function buatPembatasLajuLogin(batas?: number): RequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: batas ?? lingkungan.BATAS_LAJU_LOGIN,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: buatTanggapanTerbatas,
    skip: (permintaan: Request) => permintaan.method === 'OPTIONS',
  });
}

/** Pembatas laju khusus untuk rute unggah berkas. */
export function buatPembatasLajuUnggah(batas?: number): RequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: batas ?? lingkungan.BATAS_LAJU_UNGGAH,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: buatTanggapanTerbatas,
    skip: (permintaan: Request) => permintaan.method === 'OPTIONS',
  });
}
