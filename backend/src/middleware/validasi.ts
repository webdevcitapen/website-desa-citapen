/**
 * Middleware validasi data masuk menggunakan zod.
 * Menyediakan validasi untuk isi badan (body), parameter (params),
 * dan parameter kueri (query) permintaan.
 */

import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny, ZodIssue } from 'zod';
import { KesalahanPermintaan } from '../utils/kesalahan.js';

/** Menerjemahkan kode kesalahan zod menjadi pesan singkat berbahasa Indonesia. */
function terjemahkanPesanZod(issue: ZodIssue): string {
  const letak = issue.path.length > 0 ? ` (kolom: ${issue.path.join('.')})` : '';

  // Terjemahkan kode kesalahan umum dari zod
  switch (issue.code) {
    case 'invalid_type':
      return `Jenis data tidak sesuai${letak}`;
    case 'too_small':
      return `Nilai terlalu kecil atau terlalu pendek${letak}`;
    case 'too_big':
      return `Nilai terlalu besar atau terlalu panjang${letak}`;
    case 'invalid_string':
      return `Format teks tidak valid${letak}`;
    case 'unrecognized_keys':
      return `Terdapat kolom yang tidak dikenal${letak}`;
    case 'custom':
      return issue.message || `Nilai tidak valid${letak}`;
    default:
      return issue.message || `Nilai tidak valid${letak}`;
  }
}

/** Mengubah daftar kesalahan zod menjadi detail berbentuk array. */
function buatDetailKesalahan(issues: ZodIssue[]): string[] {
  return issues.map(terjemahkanPesanZod);
}

/** Validasi isi badan (body) permintaan memakai skema zod. */
export function validasiBadan(skema: ZodTypeAny): (
  permintaan: Request,
  _tanggapan: Response,
  berikutnya: NextFunction,
) => void {
  return (permintaan: Request, _tanggapan: Response, berikutnya: NextFunction) => {
    const hasil = skema.safeParse(permintaan.body);
    if (!hasil.success) {
      throw new KesalahanPermintaan(
        'Data yang dikirim tidak valid, periksa kembali isian Anda',
        'DATA_TIDAK_VALID',
        buatDetailKesalahan(hasil.error.issues),
      );
    }
    permintaan.body = hasil.data;
    berikutnya();
  };
}

/** Validasi parameter rute (params) permintaan memakai skema zod. */
export function validasiParameter(skema: ZodTypeAny): (
  permintaan: Request,
  _tanggapan: Response,
  berikutnya: NextFunction,
) => void {
  return (permintaan: Request, _tanggapan: Response, berikutnya: NextFunction) => {
    const hasil = skema.safeParse(permintaan.params);
    if (!hasil.success) {
      throw new KesalahanPermintaan(
        'Parameter permintaan tidak valid',
        'PARAMETER_TIDAK_VALID',
        buatDetailKesalahan(hasil.error.issues),
      );
    }
    berikutnya();
  };
}

/** Validasi parameter kueri (query) permintaan memakai skema zod. */
export function validasiQuery(skema: ZodTypeAny): (
  permintaan: Request,
  _tanggapan: Response,
  berikutnya: NextFunction,
) => void {
  return (permintaan: Request, _tanggapan: Response, berikutnya: NextFunction) => {
    const hasil = skema.safeParse(permintaan.query);
    if (!hasil.success) {
      throw new KesalahanPermintaan(
        'Parameter pencarian tidak valid',
        'KUERI_TIDAK_VALID',
        buatDetailKesalahan(hasil.error.issues),
      );
    }
    berikutnya();
  };
}
