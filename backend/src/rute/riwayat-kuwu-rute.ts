/**
 * Rute riwayat kepala desa (kuwu).
 * Membaca tersedia untuk publik, CRUD hanya untuk admin desa.
 */

import { Router } from 'express';
import { autentikasi } from '../middleware/autentikasi.js';
import { izinkanPeran } from '../middleware/otorisasi.js';
import { validasiBadan, validasiParameter } from '../middleware/validasi.js';
import { SkemaIdRute, SkemaRiwayatKuwu } from '../validasi/skema.js';
import {
  buatRiwayatKuwu,
  daftarRiwayatKuwu,
  detailRiwayatKuwu,
  hapusRiwayatKuwu,
  perbaruiRiwayatKuwu,
} from '../pengendali/riwayat-kuwu-pengendali.js';

/** Rute riwayat kuwu. */
export const ruteRiwayatKuwu = Router();

// Daftar untuk publik
ruteRiwayatKuwu.get('/', daftarRiwayatKuwu);

// Detail untuk publik
ruteRiwayatKuwu.get(
  '/:id',
  validasiParameter(SkemaIdRute),
  detailRiwayatKuwu,
);

// Tambah oleh admin desa
ruteRiwayatKuwu.post(
  '/',
  autentikasi,
  izinkanPeran('admin'),
  validasiBadan(SkemaRiwayatKuwu),
  buatRiwayatKuwu,
);

// Ubah oleh admin desa
ruteRiwayatKuwu.put(
  '/:id',
  autentikasi,
  izinkanPeran('admin'),
  validasiParameter(SkemaIdRute),
  validasiBadan(SkemaRiwayatKuwu),
  perbaruiRiwayatKuwu,
);

// Hapus oleh admin desa
ruteRiwayatKuwu.delete(
  '/:id',
  autentikasi,
  izinkanPeran('admin'),
  validasiParameter(SkemaIdRute),
  hapusRiwayatKuwu,
);
