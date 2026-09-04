/**
 * Pembantu pengamanan kata sandi menggunakan bcrypt.
 * Bcrypt menambahkan garam (salt) otomatis sehingga kata sandi
 * yang sama tetap menghasilkan hash yang berbeda setiap kali.
 */

import bcrypt from 'bcryptjs';

/** Banyaknya putaran kerja bcrypt (10 = aman dan tetap cepat). */
const JUMLAH_PUTARAN_GARAM = 10;

/** Mengubah kata sandi polos menjadi hash bcrypt yang aman. */
export async function hashKataSandi(kataSandiPolos: string): Promise<string> {
  return bcrypt.hash(kataSandiPolos, JUMLAH_PUTARAN_GARAM);
}

/** Membandingkan kata sandi polos dengan hash yang tersimpan. */
export async function bandingkanKataSandi(
  kataSandiPolos: string,
  kataSandiHash: string,
): Promise<boolean> {
  return bcrypt.compare(kataSandiPolos, kataSandiHash);
}
