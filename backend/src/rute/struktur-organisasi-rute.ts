/**
 * Rute struktur organisasi desa.
 * Membaca tersedia untuk publik, CRUD hanya untuk admin desa.
 */

import { Router } from 'express';
import { autentikasi } from '../middleware/autentikasi.js';
import { izinkanPeran } from '../middleware/otorisasi.js';
import { validasiBadan, validasiParameter } from '../middleware/validasi.js';
import { SkemaIdRute, SkemaStrukturOrganisasi } from '../validasi/skema.js';
import {
  buatStrukturOrganisasi,
  daftarStrukturOrganisasi,
  detailStrukturOrganisasi,
  hapusStrukturOrganisasi,
  perbaruiStrukturOrganisasi,
} from '../pengendali/struktur-organisasi-pengendali.js';

/** Rute struktur organisasi. */
export const ruteStrukturOrganisasi = Router();

// Daftar untuk publik
ruteStrukturOrganisasi.get('/', daftarStrukturOrganisasi);

// Detail untuk publik
ruteStrukturOrganisasi.get(
  '/:id',
  validasiParameter(SkemaIdRute),
  detailStrukturOrganisasi,
);

// Tambah oleh admin desa
ruteStrukturOrganisasi.post(
  '/',
  autentikasi,
  izinkanPeran('admin'),
  validasiBadan(SkemaStrukturOrganisasi),
  buatStrukturOrganisasi,
);

// Ubah oleh admin desa
ruteStrukturOrganisasi.put(
  '/:id',
  autentikasi,
  izinkanPeran('admin'),
  validasiParameter(SkemaIdRute),
  validasiBadan(SkemaStrukturOrganisasi),
  perbaruiStrukturOrganisasi,
);

// Hapus oleh admin desa
ruteStrukturOrganisasi.delete(
  '/:id',
  autentikasi,
  izinkanPeran('admin'),
  validasiParameter(SkemaIdRute),
  hapusStrukturOrganisasi,
);
