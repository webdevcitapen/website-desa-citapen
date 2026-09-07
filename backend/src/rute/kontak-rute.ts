/**
 * Rute publik untuk kontak admin desa.
 * Dipakai frontend di halaman Login -> InformasiPendaftaran
 * agar nomor WhatsApp selalu sinkron dengan nomor_hp admin
 * yang ada di database, bukan hardcode di frontend.
 */

import { Router } from 'express';
import { ambilKontakAdminPublik } from '../pengendali/kontak-pengendali.js';

/** Rute kontak admin (publik, tanpa autentikasi). */
export const ruteKontak = Router();

// GET /api/kontak-admin
ruteKontak.get('/', ambilKontakAdminPublik);
