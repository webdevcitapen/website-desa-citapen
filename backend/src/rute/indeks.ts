/**
 * Rute utama yang menggabungkan seluruh rute aplikasi.
 * Semua rute dilindungi pembatas laju umum dan dirakit di sini.
 */

import { Router } from 'express';
import { ruteAutentikasi } from './autentikasi-rute.js';
import { rutePenggunaAdmin } from './pengguna-rute.js';
import { ruteBerita } from './berita-rute.js';
import { ruteProduk } from './produk-rute.js';
import { ruteKategori } from './kategori-rute.js';
import { ruteProfilDesa } from './profil-desa-rute.js';
import { ruteStrukturOrganisasi } from './struktur-organisasi-rute.js';
import { ruteRiwayatKuwu } from './riwayat-kuwu-rute.js';
import { ruteGaleri } from './galeri-rute.js';
import { ruteUmkm } from './umkm-rute.js';
import { ruteKontak } from './kontak-rute.js';
import { ambilBeranda, periksaKesehatan } from '../pengendali/kesehatan-pengendali.js';
import { kirimSukses } from '../utils/respons.js';

/** Rute utama api. */
export const ruteUtama = Router();

// Informasi dasar layanan untuk siapapun yang membuka akar api
ruteUtama.get('/', (_permintaan, tanggapan) => {
  kirimSukses(
    tanggapan,
    {
      nama: 'backend-desa-citapen',
      deskripsi:
        'Layanan web profil desa citapen dan katalog produk umkm',
    },
    'Layanan desa citapen siap dipakai',
  );
});

// Pemeriksaan kesehatan server dan database
ruteUtama.get('/kesehatan', periksaKesehatan);

// Data halaman beranda untuk publik
ruteUtama.get('/beranda', ambilBeranda);

// Kelompok rute autentikasi dan akun diri
ruteUtama.use('/autentikasi', ruteAutentikasi);

// Kelompok rute manajemen pengguna oleh admin desa
ruteUtama.use('/admin/pengguna', rutePenggunaAdmin);

// Kelompok rute berita
ruteUtama.use('/berita', ruteBerita);

// Kelompok rute produk
ruteUtama.use('/produk', ruteProduk);

// Kelompok rute kategori produk
ruteUtama.use('/kategori', ruteKategori);

// Kelompok rute profil desa (letak geografis & wilayah)
ruteUtama.use('/profil-desa', ruteProfilDesa);

// Kelompok rute struktur organisasi
ruteUtama.use('/struktur-organisasi', ruteStrukturOrganisasi);

// Kelompok rute riwayat kuwu
ruteUtama.use('/riwayat-kuwu', ruteRiwayatKuwu);

// Kelompok rute galeri desa (halaman profil desa - galeri)
ruteUtama.use('/galeri', ruteGaleri);

// Kelompok rute UMKM (daftar nama UMKM dengan nomor hp & alamat)
ruteUtama.use('/umkm', ruteUmkm);

// Kelompok rute kontak admin publik (WhatsApp pendaftaran)
// Endpoint: GET /api/kontak-admin
ruteUtama.use('/kontak-admin', ruteKontak);
