/**
 * Penangan kesalahan terpusat.
 * Semua kesalahan yang dilempar di dalam rute asinkron diarahkan
 * ke sini agar tanggapan error selalu berbentuk seragam dan
 * tidak pernah membocorkan detail internal server.
 */

import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { logger } from '../utils/logger.js';
import {
  KesalahanAplikasi,
  KesalahanBerkas,
  KesalahanTidakDitemukan,
} from '../utils/kesalahan.js';

/**
 * Membungkus penangan rute asinkron agar error diteruskan
 * ke penangan kesalahan terpusat secara otomatis.
 */
export function bungkusHandler<T>(penangan: (
  permintaan: Request,
  tanggapan: Response,
  berikutnya: NextFunction,
) => Promise<T> | T): (
  permintaan: Request,
  tanggapan: Response,
  berikutnya: NextFunction,
) => void {
  return (permintaan, tanggapan, berikutnya) => {
    try {
      const hasil = penangan(permintaan, tanggapan, berikutnya);
      if (hasil instanceof Promise) {
        hasil.catch(bacaErrorMengalir(berikutnya));
      }
    } catch (kesalahan) {
      berikutnya(kesalahan);
    }
  };
}

/** Membuat fungsi penangkap error yang meneruskan ke berikutnya. */
function bacaErrorMengalir(berikutnya: NextFunction): (kesalahan: unknown) => void {
  return (kesalahan: unknown) => berikutnya(kesalahan);
}

/** Penangan rute yang tidak dikenal (404). */
export function tanganiRuteTidakDikenal(
  _permintaan: Request,
  _tanggapan: Response,
  berikutnya: NextFunction,
): void {
  berikutnya(
    new KesalahanTidakDitemukan(
      'Alamat yang Anda minta tidak ditemukan',
      'RUTE_TIDAK_DITEMUKAN',
    ),
  );
}

/**
 * Penangan kesalahan terpusat yang menutup seluruh rute.
 * Mengubah setiap kesalahan menjadi tanggapan json yang rapi.
 */
export function tanganiKesalahan(
  kesalahan: unknown,
  permintaan: Request,
  tanggapan: Response,
  _berikutnya: NextFunction,
): void {
  // Kesalahan aplikasi yang sudah dikenal, kirim pesannya langsung
  if (kesalahan instanceof KesalahanAplikasi) {
    tanggapan.status(kesalahan.status).json({
      status: 'gagal',
      pesan: kesalahan.message,
      kode: kesalahan.kode,
      detail: kesalahan.detail ?? undefined,
    });
    return;
  }

  // Kesalahan berkas dari multer (misalnya berkas terlalu besar)
  if (kesalahan instanceof multer.MulterError) {
    const pesan =
      kesalahan.code === 'LIMIT_FILE_SIZE'
        ? 'Ukuran berkas terlalu besar, maksimal 5 megabyte'
        : 'Terjadi kesalahan saat mengunggah berkas';
    tanggapan.status(400).json({
      status: 'gagal',
      pesan,
      kode: 'KESALAHAN_BERKAS',
    });
    return;
  }

  if (kesalahan instanceof KesalahanBerkas) {
    tanggapan.status(400).json({
      status: 'gagal',
      pesan: kesalahan.message,
      kode: 'KESALAHAN_BERKAS',
    });
    return;
  }

  // Kesalahan json tidak valid dari express
  if (kesalahan instanceof SyntaxError && 'status' in kesalahan) {
    tanggapan.status(400).json({
      status: 'gagal',
      pesan: 'Format data json yang dikirim tidak valid',
      kode: 'JSON_TIDAK_VALID',
    });
    return;
  }

  // Kesalahan tak dikenal: catat ke log tanpa membocorkan detail
  logger.error(
    {
      jalur: permintaan.path,
      metode: permintaan.method,
      kesalahan:
        kesalahan instanceof Error ? kesalahan.message : 'kesalahan tak dikenal',
      tumpukan: kesalahan instanceof Error ? kesalahan.stack : undefined,
    },
    'Kesalahan tak terduga pada server',
  );

  tanggapan.status(500).json({
    status: 'gagal',
    pesan: 'Terjadi kesalahan di dalam server, silakan coba lagi',
    kode: 'KESALAHAN_SERVER',
  });
}
