/**
 * Pembantu pembuatan dan pemeriksaan token jwt.
 * Token dipakai untuk autentikasi tanpa menyimpan sesi di server,
 * sehingga hemat memori dan siap menghadapi traffic tinggi.
 */

import jwt from 'jsonwebtoken';
import { lingkungan } from '../config/env.js';
import type { InfoPenggunaJwt } from '../types/index.js';
import { KesalahanAutentikasi } from './kesalahan.js';

/** Membuat token jwt baru untuk seorang pengguna. */
export function buatToken(infoPengguna: InfoPenggunaJwt): string {
  // Token berisi identitas pengguna dan masa berlakunya
  const masaBerlaku: jwt.SignOptions['expiresIn'] =
    lingkungan.JWT_KEDALUWARSA as jwt.SignOptions['expiresIn'];

  return jwt.sign(infoPengguna, lingkungan.JWT_RAHASIA, {
    expiresIn: masaBerlaku,
    issuer: 'desa-citapen-backend',
  });
}

/**
 * Memeriksa dan menguraikan token jwt.
 * Melempar KesalahanAutentikasi jika token tidak sah atau sudah kedaluwarsa.
 */
export function periksaToken(token: string): InfoPenggunaJwt {
  try {
    const isiToken = jwt.verify(token, lingkungan.JWT_RAHASIA, {
      issuer: 'desa-citapen-backend',
    });

    // Pastikan isi token memiliki bentuk yang kita harapkan
    if (
      typeof isiToken === 'object' &&
      isiToken !== null &&
      typeof isiToken.id === 'number' &&
      (isiToken.peran === 'admin' ||
        isiToken.peran === 'publikasi')
    ) {
      return {
        id: isiToken.id,
        peran: isiToken.peran,
      };
    }

    throw new KesalahanAutentikasi(
      'Isi token tidak dikenali',
      'TOKEN_TIDAK_DIKENALI',
    );
  } catch (kesalahan) {
    // Kesalahan token kedaluwarsa diberi pesan khusus
    if (kesalahan instanceof KesalahanAutentikasi) {
      throw kesalahan;
    }
    if (kesalahan instanceof jwt.TokenExpiredError) {
      throw new KesalahanAutentikasi(
        'Sesi Anda sudah berakhir, silakan masuk kembali',
        'TOKEN_KEDALUWARSA',
      );
    }
    throw new KesalahanAutentikasi(
      'Token tidak sah, silakan masuk kembali',
      'TOKEN_TIDAK_SAH',
    );
  }
}
