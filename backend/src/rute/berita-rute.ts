/**
 * Rute berita.
 * Membaca berita tersedia untuk publik, sedangkan menulis,
 * mengubah, dan menghapus berita hanya untuk admin desa dan
 * publikasi (pemilik berita).
 */

import { Router } from 'express';
import { autentikasi } from '../middleware/autentikasi.js';
import { izinkanPeran } from '../middleware/otorisasi.js';
import { buatMiddlewareUnggah } from '../middleware/unggah-berkas.js';
import { validasiBadan, validasiParameter, validasiQuery } from '../middleware/validasi.js';
import {
  SkemaBerita,
  SkemaIdRute,
  SkemaPaginasi,
} from '../validasi/skema.js';
import {
  buatBerita,
  daftarBerita,
  detailBerita,
  hapusBerita,
  perbaruiBerita,
} from '../pengendali/berita-pengendali.js';

/** Rute berita. */
export const ruteBerita = Router();

// Daftar berita untuk publik
ruteBerita.get('/', validasiQuery(SkemaPaginasi), daftarBerita);

// Detail berita untuk publik
ruteBerita.get('/:id', validasiParameter(SkemaIdRute), detailBerita);

// Buat berita baru oleh admin desa atau publikasi
ruteBerita.post(
  '/',
  autentikasi,
  izinkanPeran('admin', 'publikasi'),
  buatMiddlewareUnggah('gambar'),
  validasiBadan(SkemaBerita),
  buatBerita,
);

// Ubah berita oleh penulisnya atau admin desa
ruteBerita.put(
  '/:id',
  autentikasi,
  izinkanPeran('admin', 'publikasi'),
  validasiParameter(SkemaIdRute),
  buatMiddlewareUnggah('gambar'),
  validasiBadan(SkemaBerita),
  perbaruiBerita,
);

// Hapus berita oleh penulisnya atau admin desa
ruteBerita.delete(
  '/:id',
  autentikasi,
  izinkanPeran('admin', 'publikasi'),
  validasiParameter(SkemaIdRute),
  hapusBerita,
);
