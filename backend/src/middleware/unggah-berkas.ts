/**
 * Middleware unggah berkas memakai multer.
 * Berkas disimpan di memori sementara agar bisa dikompres
 * dengan sharp sebelum ditulis ke penyimpanan.
 */

import multer from 'multer';
import path from 'node:path';
import type { RequestHandler } from 'express';
import { KesalahanBerkas } from '../utils/kesalahan.js';

/** Ukuran maksimal berkas yang boleh diunggah (5 megabyte). */
const MAKSIMAL_UKURAN_BERKAS = 5 * 1024 * 1024;

/** Ekstensi berkas yang diizinkan (termasuk heic untuk galeri & profil). */
const DAFTAR_EKSTENSI_DIIZINKAN = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp']);

/** Jenis media yang diizinkan. */
const DAFTAR_JENIS_MEDIA_DIIZINKAN = new Set([
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/heic',
  'image/heif',
  'image/heif-sequence',
  'image/heic-sequence',
  'image/webp',
]);

/** Membuat middleware unggah berkas tunggal dengan nama kolom tertentu. */
export function buatMiddlewareUnggah(namaKolom: string): RequestHandler {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAKSIMAL_UKURAN_BERKAS,
      files: 1,
    },
    fileFilter: (_permintaan, berkas, terima) => {
      // Periksa jenis media berkas
      if (!DAFTAR_JENIS_MEDIA_DIIZINKAN.has(berkas.mimetype.toLowerCase())) {
        terima(new KesalahanBerkas('Hanya gambar jpg, jpeg, png, atau heic yang boleh diunggah'));
        return;
      }

      // Periksa ekstensi berkas
      const ekstensi = path.extname(berkas.originalname).toLowerCase();
      if (!DAFTAR_EKSTENSI_DIIZINKAN.has(ekstensi)) {
        terima(new KesalahanBerkas('Ekstensi berkas harus jpg, jpeg, png, atau heic'));
        return;
      }

      terima(null, true);
    },
  }).single(namaKolom);
}
