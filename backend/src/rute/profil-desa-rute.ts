/**
 * Rute profil desa (letak geografis & wilayah).
 * Membaca tersedia untuk publik, mengubah hanya untuk admin desa.
 */

import { Router } from 'express';
import { autentikasi } from '../middleware/autentikasi.js';
import { izinkanPeran } from '../middleware/otorisasi.js';
import { validasiBadan } from '../middleware/validasi.js';
import {
  SkemaProfilDesa,
  SkemaSejarahDesa,
  SkemaVisiMisiDesa,
} from '../validasi/skema.js';
import {
  dapatkanProfilDesa,
  perbaruiProfilDesa,
  perbaruiSejarah,
  perbaruiVisiMisi,
} from '../pengendali/profil-desa-pengendali.js';

/** Rute profil desa. */
export const ruteProfilDesa = Router();

// Ambil profil desa untuk publik
ruteProfilDesa.get('/', dapatkanProfilDesa);

// Ubah profil desa oleh admin desa (letak geografis, sejarah, visi misi lengkap)
ruteProfilDesa.put(
  '/',
  autentikasi,
  izinkanPeran('admin'),
  validasiBadan(SkemaProfilDesa),
  perbaruiProfilDesa,
);

// Ubah hanya sejarah desa (khusus halaman profil - sejarah)
ruteProfilDesa.put(
  '/sejarah',
  autentikasi,
  izinkanPeran('admin'),
  validasiBadan(SkemaSejarahDesa),
  perbaruiSejarah,
);

// Ubah hanya visi misi desa (khusus halaman profil - visi misi)
ruteProfilDesa.put(
  '/visi-misi',
  autentikasi,
  izinkanPeran('admin'),
  validasiBadan(SkemaVisiMisiDesa),
  perbaruiVisiMisi,
);
