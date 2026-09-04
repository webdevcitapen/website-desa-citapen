/**
 * Rute UMKM.
 * Membaca daftar dan detail UMKM tersedia untuk publik,
 * sedangkan menambah, mengubah, menghapus hanya untuk admin desa.
 * Mendukung alur: admin pilih nama UMKM -> nomor hp & alamat terisi otomatis saat tambah produk.
 */

import { Router } from 'express';
import { autentikasi } from '../middleware/autentikasi.js';
import { izinkanPeran } from '../middleware/otorisasi.js';
import { buatMiddlewareUnggah } from '../middleware/unggah-berkas.js';
import { validasiBadan, validasiParameter } from '../middleware/validasi.js';
import { SkemaIdRute, SkemaUmkm } from '../validasi/skema.js';
import {
  buatUmkm,
  daftarUmkm,
  detailUmkm,
  hapusUmkm,
  perbaruiUmkm,
} from '../pengendali/umkm-pengendali.js';

/** Rute UMKM. */
export const ruteUmkm = Router();

// Daftar UMKM untuk publik (dipakai dropdown pilih UMKM saat tambah produk)
ruteUmkm.get('/', daftarUmkm);

// Detail UMKM untuk publik
ruteUmkm.get('/:id', validasiParameter(SkemaIdRute), detailUmkm);

// Tambah UMKM baru oleh admin desa (admin kelola nama UMKM beserta nomor hp & alamat)
ruteUmkm.post(
  '/',
  autentikasi,
  izinkanPeran('admin'),
  buatMiddlewareUnggah('foto'),
  validasiBadan(SkemaUmkm),
  buatUmkm,
);

// Ubah UMKM oleh admin desa
ruteUmkm.put(
  '/:id',
  autentikasi,
  izinkanPeran('admin'),
  validasiParameter(SkemaIdRute),
  buatMiddlewareUnggah('foto'),
  validasiBadan(SkemaUmkm),
  perbaruiUmkm,
);

// Hapus UMKM oleh admin desa
ruteUmkm.delete(
  '/:id',
  autentikasi,
  izinkanPeran('admin'),
  validasiParameter(SkemaIdRute),
  hapusUmkm,
);
