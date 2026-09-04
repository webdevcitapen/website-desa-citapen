/**
 * Rute galeri desa.
 * Membaca galeri tersedia untuk publik, sedangkan menambah
 * dan menghapus galeri hanya untuk admin desa.
 */

import { Router } from 'express';
import { autentikasi } from '../middleware/autentikasi.js';
import { izinkanPeran } from '../middleware/otorisasi.js';
import { buatMiddlewareUnggah } from '../middleware/unggah-berkas.js';
import { validasiBadan, validasiParameter } from '../middleware/validasi.js';
import { SkemaGaleriDesa, SkemaIdRute } from '../validasi/skema.js';
import {
  buatGaleri,
  daftarGaleri,
  detailGaleri,
  hapusGaleri,
} from '../pengendali/galeri-pengendali.js';

/** Rute galeri desa. */
export const ruteGaleri = Router();

// Daftar galeri untuk publik
ruteGaleri.get('/', daftarGaleri);

// Detail galeri untuk publik
ruteGaleri.get('/:id', validasiParameter(SkemaIdRute), detailGaleri);

// Tambah galeri baru oleh admin desa (foto wajib, dukung jpg jpeg png heic)
ruteGaleri.post(
  '/',
  autentikasi,
  izinkanPeran('admin'),
  buatMiddlewareUnggah('foto'),
  validasiBadan(SkemaGaleriDesa),
  buatGaleri,
);

// Hapus galeri oleh admin desa
ruteGaleri.delete(
  '/:id',
  autentikasi,
  izinkanPeran('admin'),
  validasiParameter(SkemaIdRute),
  hapusGaleri,
);
