/**
 * Entri serverless untuk Vercel (plain JS agar @vercel/nft bisa parse).
 * Vercel menjalankan file di dalam `api/` sebagai fungsi serverless.
 * File ini membungkus aplikasi Express yang sudah dikompilasi ke `dist/`.
 */

import { buatAplikasi } from '../dist/app.js';
import { siapkanFolderUnggahan } from '../dist/utils/berkas.js';
import { inisialisasiAdminAwal } from '../dist/layanan/autentikasi-layanan.js';
import { logger } from '../dist/utils/logger.js';
import { pastikanBucketTersedia } from '../dist/config/storage.js';

// Buat aplikasi Express sekali saja agar dipakai ulang antar invocasi
const aplikasi = buatAplikasi();

let sudahDiinisialisasi = false;
let janjiInisialisasi = null;

async function inisialisasiSekali() {
  if (sudahDiinisialisasi) return;
  if (janjiInisialisasi) return janjiInisialisasi;
  // Paralelkan semua tugas boot agar cold start lebih cepat (sebelumnya sequential 3x await)
  janjiInisialisasi = Promise.allSettled([
    siapkanFolderUnggahan(),
    pastikanBucketTersedia(),
    inisialisasiAdminAwal(),
  ]).then((hasil) => {
    hasil.forEach((r, idx) => {
      if (r.status === 'rejected') {
        const label = ['folder unggahan', 'bucket Supabase', 'admin awal'][idx];
        logger.warn(
          { kesalahan: r.reason instanceof Error ? r.reason.message : String(r.reason) },
          `Gagal inisialisasi ${label} di Vercel`
        );
      }
    });
    sudahDiinisialisasi = true;
  });
  return janjiInisialisasi;
}

export default async function handler(permintaan, tanggapan) {
  await inisialisasiSekali();
  return aplikasi(permintaan, tanggapan);
}
