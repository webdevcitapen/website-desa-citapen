/**
 * Middleware otorisasi.
 * Membatasi akses suatu rute hanya untuk peran-peran tertentu.
 * Dipasang setelah middleware autentikasi.
 */

import type { NextFunction, Request, Response } from 'express';
import type { Peran } from '../types/index.js';
import { KesalahanAutentikasi, KesalahanOtorisasi } from '../utils/kesalahan.js';

/**
 * Membuat middleware yang hanya mengizinkan peran yang didaftarkan.
 * Contoh pemakaian: izinkanPeran('admin', 'publikasi')
 */
export function izinkanPeran(...peranYangDiizinkan: Peran[]): (
  permintaan: Request,
  tanggapan: Response,
  berikutnya: NextFunction,
) => void {
  return (permintaan: Request, _tanggapan: Response, berikutnya: NextFunction) => {
    // Pastikan pengguna sudah terautentikasi
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    // Periksa apakah peran pengguna termasuk yang diizinkan
    const peranPengguna: Peran = permintaan.pengguna.peran;
    if (!peranYangDiizinkan.includes(peranPengguna)) {
      throw new KesalahanOtorisasi();
    }

    berikutnya();
  };
}
