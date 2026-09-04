/**
 * Pembantu pembagian halaman (paginasi).
 * Semua daftar data di aplikasi ini WAJIB memakai paginasi agar
 * query database tidak pernah mengambil seluruh isi tabel besar.
 */

import { KesalahanPermintaan } from './kesalahan.js';

/** Parameter paginasi yang sudah dihitung dan siap dipakai query. */
export interface ParameterPaginasi {
  /** Nomor halaman yang diminta (dimulai dari 1). */
  halaman: number;
  /** Jumlah baris per halaman. */
  perHalaman: number;
  /** Jumlah baris yang dilewati (untuk klausa offset). */
  lewati: number;
  /** Jumlah baris yang diambil (untuk klausa limit). */
  batas: number;
}

/** Nilai default paginasi. */
const PAGINASI_DEFAULT: {
  HALAMAN: number;
  PER_HALAMAN: number;
  MAKSIMAL_PER_HALAMAN: number;
} = {
  HALAMAN: 1,
  PER_HALAMAN: 10,
  MAKSIMAL_PER_HALAMAN: 50,
};

/**
 * Membuat parameter paginasi dari nilai yang dikirim klien.
 * Nilai yang tidak valid atau tidak dikirim akan memakai nilai default.
 */
export function buatParameterPaginasi(
  halamanDariKlien?: unknown,
  perHalamanDariKlien?: unknown,
): ParameterPaginasi {
  // Validasi nilai halaman
  let halaman = PAGINASI_DEFAULT.HALAMAN;
  if (halamanDariKlien !== undefined && halamanDariKlien !== null) {
    const angkaHalaman = Number(halamanDariKlien);
    if (!Number.isInteger(angkaHalaman) || angkaHalaman < 1) {
      throw new KesalahanPermintaan(
        'Nomor halaman harus bilangan bulat lebih dari nol',
        'PAGINASI_TIDAK_VALID',
      );
    }
    halaman = angkaHalaman;
  }

  // Validasi nilai per halaman
  let perHalaman = PAGINASI_DEFAULT.PER_HALAMAN;
  if (perHalamanDariKlien !== undefined && perHalamanDariKlien !== null) {
    const angkaPerHalaman = Number(perHalamanDariKlien);
    if (
      !Number.isInteger(angkaPerHalaman) ||
      angkaPerHalaman < 1 ||
      angkaPerHalaman > PAGINASI_DEFAULT.MAKSIMAL_PER_HALAMAN
    ) {
      throw new KesalahanPermintaan(
        `Jumlah data per halaman harus antara 1 sampai ${PAGINASI_DEFAULT.MAKSIMAL_PER_HALAMAN}`,
        'PAGINASI_TIDAK_VALID',
      );
    }
    perHalaman = angkaPerHalaman;
  }

  // Hitung nilai lewati berdasarkan halaman yang diminta
  const lewati = (halaman - 1) * perHalaman;

  return {
    halaman,
    perHalaman,
    lewati,
    batas: perHalaman,
  };
}

/**
 * Menghitung jumlah total halaman dari jumlah data dan ukuran halaman.
 */
export function hitungTotalHalaman(
  totalData: number,
  perHalaman: number,
): number {
  if (totalData === 0) {
    return 0;
  }
  return Math.ceil(totalData / perHalaman);
}
