/**
 * Rute kategori produk.
 * Membaca kategori tersedia untuk publik, sedangkan menambah dan
 * menghapus kategori hanya untuk admin desa (full akses UMKM).
 */

import { Router } from 'express';
import { autentikasi } from '../middleware/autentikasi.js';
import { izinkanPeran } from '../middleware/otorisasi.js';
import { validasiBadan, validasiParameter } from '../middleware/validasi.js';
import { SkemaIdRute, SkemaKategori } from '../validasi/skema.js';
import {
  buatKategori,
  daftarKategori,
  hapusKategori,
} from '../pengendali/kategori-pengendali.js';

/** Rute kategori produk. */
export const ruteKategori = Router();

// Daftar kategori untuk publik
ruteKategori.get('/', daftarKategori);

// Tambah kategori produk baru oleh admin desa
ruteKategori.post(
  '/',
  autentikasi,
  izinkanPeran('admin'),
  validasiBadan(SkemaKategori),
  buatKategori,
);

// Hapus kategori produk oleh admin desa
ruteKategori.delete(
  '/:id',
  autentikasi,
  izinkanPeran('admin'),
  validasiParameter(SkemaIdRute),
  hapusKategori,
);
