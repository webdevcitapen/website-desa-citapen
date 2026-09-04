/**
 * Rute manajemen pengguna khusus admin desa.
 * Hanya admin desa yang boleh mendaftarkan, menghapus, mengganti
 * kata sandi, dan mengganti username pengguna publikasi.
 * Peran umkm sudah dihapus.
 */

import { Router } from 'express';
import { autentikasi } from '../middleware/autentikasi.js';
import { izinkanPeran } from '../middleware/otorisasi.js';
import { validasiBadan, validasiParameter, validasiQuery } from '../middleware/validasi.js';
import {
  SkemaAdminUbahKataSandi,
  SkemaAdminUbahUsername,
  SkemaDaftarPengguna,
  SkemaIdRute,
  SkemaKueriDaftarPengguna,
} from '../validasi/skema.js';
import {
  daftarkanPengguna,
  daftarPengguna,
  detailPengguna,
  hapusPengguna,
  ubahKataSandiPengguna,
  ubahUsernamePengguna,
} from '../pengendali/pengguna-pengendali.js';

/** Rute manajemen pengguna oleh admin desa. */
export const rutePenggunaAdmin = Router();

// Seluruh rute di bawah ini wajib autentikasi dan peran admin desa
rutePenggunaAdmin.use(autentikasi, izinkanPeran('admin'));

// Daftarkan pengguna baru (hanya publikasi)
rutePenggunaAdmin.post(
  '/',
  validasiBadan(SkemaDaftarPengguna),
  daftarkanPengguna,
);

// Ambil daftar pengguna dengan paginasi
rutePenggunaAdmin.get(
  '/',
  validasiQuery(SkemaKueriDaftarPengguna),
  daftarPengguna,
);

// Ambil detail pengguna
rutePenggunaAdmin.get(
  '/:id',
  validasiParameter(SkemaIdRute),
  detailPengguna,
);

// Hapus pengguna
rutePenggunaAdmin.delete(
  '/:id',
  validasiParameter(SkemaIdRute),
  hapusPengguna,
);

// Ganti kata sandi pengguna
rutePenggunaAdmin.put(
  '/:id/kata-sandi',
  validasiParameter(SkemaIdRute),
  validasiBadan(SkemaAdminUbahKataSandi),
  ubahKataSandiPengguna,
);

// Ganti username pengguna
rutePenggunaAdmin.put(
  '/:id/username',
  validasiParameter(SkemaIdRute),
  validasiBadan(SkemaAdminUbahUsername),
  ubahUsernamePengguna,
);
