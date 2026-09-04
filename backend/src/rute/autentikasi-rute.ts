/**
 * Rute autentikasi dan pengelolaan akun diri sendiri.
 * Tersedia untuk peran: admin desa dan publikasi.
 */

import { Router } from 'express';
import { autentikasi } from '../middleware/autentikasi.js';
import { buatMiddlewareUnggah } from '../middleware/unggah-berkas.js';
import { validasiBadan } from '../middleware/validasi.js';
import {
  SkemaMasuk,
  SkemaUbahKataSandiDiri,
  SkemaUbahProfil,
  SkemaUbahUsernameDiri,
} from '../validasi/skema.js';
import {
  masuk,
  profilSaya,
  ubahFotoProfil,
  ubahKataSandi,
  ubahProfil,
  ubahUsername,
} from '../pengendali/autentikasi-pengendali.js';

/** Rute autentikasi dan akun diri. */
export const ruteAutentikasi = Router();

// Proses masuk, dilindungi pembatas laju agar sulit dibobol
ruteAutentikasi.post('/masuk', validasiBadan(SkemaMasuk), masuk);

// Ambil profil diri sendiri
ruteAutentikasi.get('/saya', autentikasi, profilSaya);

// Ubah data profil diri sendiri
ruteAutentikasi.put(
  '/profil',
  autentikasi,
  validasiBadan(SkemaUbahProfil),
  ubahProfil,
);

// Ubah foto profil diri sendiri (jpg, jpeg, atau png)
ruteAutentikasi.put(
  '/foto-profil',
  autentikasi,
  buatMiddlewareUnggah('foto'),
  ubahFotoProfil,
);

// Ubah kata sandi diri sendiri
ruteAutentikasi.put(
  '/kata-sandi',
  autentikasi,
  validasiBadan(SkemaUbahKataSandiDiri),
  ubahKataSandi,
);

// Ubah username diri sendiri
ruteAutentikasi.put(
  '/username',
  autentikasi,
  validasiBadan(SkemaUbahUsernameDiri),
  ubahUsername,
);
