/**
 * Rute produk.
 * Membaca produk tersedia untuk publik, sedangkan menambah,
 * mengubah, dan menghapus produk hanya untuk admin desa
 * (full akses CRUD UMKM).
 */

import { Router } from 'express';
import { autentikasi } from '../middleware/autentikasi.js';
import { izinkanPeran } from '../middleware/otorisasi.js';
import { buatMiddlewareUnggah } from '../middleware/unggah-berkas.js';
import { validasiBadan, validasiParameter, validasiQuery } from '../middleware/validasi.js';
import {
  SkemaDaftarProduk,
  SkemaIdRute,
  SkemaProduk,
} from '../validasi/skema.js';
import {
  buatProduk,
  daftarProduk,
  detailProduk,
  hapusProduk,
  perbaruiProduk,
} from '../pengendali/produk-pengendali.js';

/** Rute produk. */
export const ruteProduk = Router();

// Daftar produk untuk publik dengan penyaring
ruteProduk.get('/', validasiQuery(SkemaDaftarProduk), daftarProduk);

// Detail produk untuk publik
ruteProduk.get('/:id', validasiParameter(SkemaIdRute), detailProduk);

// Tambah produk baru oleh admin desa (full akses UMKM)
ruteProduk.post(
  '/',
  autentikasi,
  izinkanPeran('admin'),
  buatMiddlewareUnggah('foto'),
  validasiBadan(SkemaProduk),
  buatProduk,
);

// Ubah produk oleh admin desa
ruteProduk.put(
  '/:id',
  autentikasi,
  izinkanPeran('admin'),
  validasiParameter(SkemaIdRute),
  buatMiddlewareUnggah('foto'),
  validasiBadan(SkemaProduk),
  perbaruiProduk,
);

// Hapus produk oleh admin desa
ruteProduk.delete(
  '/:id',
  autentikasi,
  izinkanPeran('admin'),
  validasiParameter(SkemaIdRute),
  hapusProduk,
);
