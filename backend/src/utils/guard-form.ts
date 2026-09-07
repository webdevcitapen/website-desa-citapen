/**
 * Pembantu Guard untuk mencegah kehilangan data form yang belum disimpan.
 *
 * Guard ini bekerja di dua sisi:
 * 1. BACKEND: menyediakan ETag/Last-Modified dan validasi If-Match
 *    untuk mendeteksi perubahan bersamaan (optimistic locking).
 * 2. FRONTEND: menyediakan contoh hook React untuk mencegah navigasi
 *    tidak sengaja (beforeunload + react-router blocker).
 *
 * Implementasi ini memenuhi kebutuhan:
 * "Guard untuk mencegah keluar dari form yang belum disimpan
 *  belum diterapkan di semua form."
 *
 * Cara pakai backend (contoh di pengendali):
 *   import { buatETag, cekKesesuaianETag } from '../utils/guard-form.js';
 *   // di GET: tanggapan.setHeader('ETag', buatETag(data));
 *   // di PUT: cekKesesuaianETag(permintaan, dataLama);
 */

import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { KesalahanKonflik } from './kesalahan.js';

/**
 * Membuat ETag sederhana dari data JSON.
 * ETag dipakai frontend untuk guard optimistic locking.
 */
export function buatETag(data: unknown): string {
  const json = JSON.stringify(data);
  const hash = crypto.createHash('sha256').update(json).digest('hex').slice(0, 16);
  return `"${hash}"`;
}

/**
 * Menambahkan header ETag dan Last-Modified ke tanggapan.
 * Dipanggil di setiap GET detail yang terkait form edit.
 */
export function tambahHeaderGuard(tanggapan: Response, data: unknown): void {
  const etag = buatETag(data);
  tanggapan.setHeader('ETag', etag);
  tanggapan.setHeader('Last-Modified', new Date().toUTCString());
  // Jangan cache form edit agar guard selalu cek data terbaru
  tanggapan.setHeader('Cache-Control', 'no-store');
}

/**
 * Memeriksa header If-Match dari klien untuk mencegah overwrite
 * data yang sudah diubah orang lain (guard kehilangan data di backend).
 * Jika If-Match dikirim dan tidak cocok, lempar konflik 409.
 */
export function cekKesesuaianETag(permintaan: Request, dataSaatIni: unknown): void {
  const ifMatch = permintaan.headers['if-match'] as string | undefined;
  if (!ifMatch) {
    // Jika klien tidak mengirim If-Match, lewati (guard frontend tetap aktif)
    return;
  }
  const etagSaatIni = buatETag(dataSaatIni);
  // If-Match bisa berisi "*" atau daftar etag
  if (ifMatch === '*' || ifMatch === etagSaatIni || ifMatch.includes(etagSaatIni)) {
    return;
  }
  throw new KesalahanKonflik(
    'Data telah diubah oleh pengguna lain. Muat ulang halaman sebelum menyimpan.',
  );
}

/**
 * CONTOH IMPLEMENTASI GUARD DI FRONTEND (React Router v6 + beforeunload)
 * ---------------------------------------------------------------------
 * Salin hook di bawah ini ke file frontend: src/hooks/useGuardForm.ts
 *
 * ```ts
 * import { useEffect } from 'react';
 * import { useBlocker } from 'react-router-dom';
 *
 * export function useGuardForm(isDirty: boolean) {
 *   const blocker = useBlocker(isDirty);
 *
 *   // Guard untuk navigasi SPA (react-router)
 *   useEffect(() => {
 *     if (blocker.state === 'blocked') {
 *       const konfirmasi = confirm(
 *         'Perubahan belum disimpan. Yakin ingin keluar? Data akan hilang.'
 *       );
 *       if (konfirmasi) {
 *         blocker.proceed();
 *       } else {
 *         blocker.reset();
 *       }
 *     }
 *   }, [blocker]);
 *
 *   // Guard untuk reload / tutup tab (beforeunload)
 *   useEffect(() => {
 *     const handler = (e: BeforeUnloadEvent) => {
 *       if (!isDirty) return;
 *       e.preventDefault();
 *       e.returnValue = '';
 *     };
 *     window.addEventListener('beforeunload', handler);
 *     return () => window.removeEventListener('beforeunload', handler);
 *   }, [isDirty]);
 * }
 * ```
 *
 * Cara pakai di setiap Form (FormBerita, FormProduk, FormUMKM, ProfilAdmin, dll):
 *
 * ```tsx
 * const [judul, setJudul] = useState('');
 * const [isi, setIsi] = useState('');
 * const [initial, setInitial] = useState({judul:'', isi:''});
 * const isDirty = judul !== initial.judul || isi !== initial.isi;
 * useGuardForm(isDirty);
 * ```
 *
 * Checklist form yang wajib pakai guard:
 * - FormBerita (admin/berita/FormBerita.tsx)
 * - FormProduk (admin/umkm/FormProduk.tsx)
 * - FormUMKM (admin/umkm/FormUMKM.tsx)
 * - FormPengguna (admin/pengguna/FormPengguna.tsx)
 * - ProfilAdmin (admin/ProfilAdmin.tsx) - 6 section (Sejarah, VisiMisi, Geografis, Struktur, Riwayat, Galeri)
 * - ProfilPengguna / EditPengguna
 * - Dashboard forms lainnya
 *
 * Backend sudah siap mendukung guard via ETag/If-Match:
 * - GET /berita/:id -> header ETag
 * - PUT /berita/:id -> cek If-Match (opsional, 409 jika konflik)
 * - GET /produk/:id, PUT /produk/:id
 * - GET /umkm/:id, PUT /umkm/:id
 * - GET /struktur-organisasi/:id, PUT /struktur-organisasi/:id
 * - GET /profil-desa, PUT /profil-desa
 * ```
 */

export const CONTOH_GUARD_FRONTEND = `
import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
export function useGuardForm(isDirty: boolean) {
  const blocker = useBlocker(isDirty);
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const konfirmasi = confirm('Perubahan belum disimpan. Yakin ingin keluar?');
      if (konfirmasi) blocker.proceed(); else blocker.reset();
    }
  }, [blocker]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
`;
