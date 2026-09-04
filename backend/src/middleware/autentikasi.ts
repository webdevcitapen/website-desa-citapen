/**
 * Middleware autentikasi.
 * Memeriksa token jwt pada header Authorization lalu menyimpan
 * informasi pengguna ke dalam objek request untuk lapisan berikutnya.
 */

import type { NextFunction, Request, Response } from 'express';
import type { InfoPenggunaJwt } from '../types/index.js';
import { periksaToken } from '../utils/token.js';
import { KesalahanAutentikasi } from '../utils/kesalahan.js';

/**
 * Middleware autentikasi untuk rute yang hanya boleh diakses
 * oleh pengguna yang sudah masuk.
 */
export function autentikasi(
  permintaan: Request,
  _tanggapan: Response,
  berikutnya: NextFunction,
): void {
  // Ambil nilai header Authorization yang berbentuk "Bearer <token>"
  const headerOtorisasi = permintaan.header('Authorization');

  if (!headerOtorisasi || !headerOtorisasi.startsWith('Bearer ')) {
    throw new KesalahanAutentikasi(
      'Token tidak ditemukan, silakan masuk terlebih dahulu',
      'TOKEN_TIDAK_DITEMUKAN',
    );
  }

  // Ambil bagian token setelah kata "Bearer "
  const token = headerOtorisasi.slice(7).trim();

  if (token.length === 0) {
    throw new KesalahanAutentikasi(
      'Token kosong, silakan masuk terlebih dahulu',
      'TOKEN_KOSONG',
    );
  }

  // Periksa keabsahan token dan simpan data pengguna ke request
  const infoPengguna: InfoPenggunaJwt = periksaToken(token);
  permintaan.pengguna = infoPengguna;
  berikutnya();
}
