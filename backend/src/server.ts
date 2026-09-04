/**
 * Titik masuk server.
 * Menyiapkan folder unggahan, membuat admin awal jika belum ada,
 * lalu menjalankan server dengan pengaturan koneksi yang tahan
 * terhadap traffic tinggi (keep-alive) dan penutupan yang rapi.
 */

import http from 'node:http';
import { lingkungan } from './config/env.js';
import { logger } from './utils/logger.js';
import { buatAplikasi } from './app.js';
import { siapkanFolderUnggahan } from './utils/berkas.js';
import { inisialisasiAdminAwal } from './layanan/autentikasi-layanan.js';
import { kumpulanKoneksi } from './config/database.js';

/** Menjalankan seluruh proses persiapan lalu memulai server. */
async function jalankanServer(): Promise<void> {
  // Siapkan folder untuk menyimpan berkas unggahan
  await siapkanFolderUnggahan();

  // Buat akun admin awal jika belum ada
  await inisialisasiAdminAwal();

  // Rakit aplikasi express
  const aplikasi = buatAplikasi();

  // Mulai mendengarkan permintaan
  const server = http.createServer(aplikasi);

  // Atur keep-alive agar koneksi tidak terputus sebelum waktunya,
  // sangat penting di belakang proxy seperti render
  server.keepAliveTimeout = 65 * 1000;
  server.headersTimeout = 70 * 1000;
  server.requestTimeout = 60 * 1000;

  server.listen(lingkungan.PORT, () => {
    logger.info(
      { port: lingkungan.PORT },
      'Server desa citapen berjalan dan siap melayani permintaan',
    );
  });

  // Siapkan penutupan yang rapi saat server dimatikan
  aturPenutupanServer(server);
}

/** Menangani sinyal penutupan server dengan menyelesaikan koneksi dulu. */
function aturPenutupanServer(server: http.Server): void {
  let sedangMenutup = false;

  const tutupServer = (sinyal: string): void => {
    if (sedangMenutup) {
      return;
    }
    sedangMenutup = true;

    logger.info({ sinyal }, 'Menerima sinyal penutupan, menutup server...');

    // Tutup server dan koneksi database dengan batas waktu
    server.close(() => {
      void kumpulanKoneksi
        .end()
        .then(() => {
          logger.info('Server dan database berhasil ditutup');
          process.exit(0);
        })
        .catch(() => process.exit(1));
    });

    // Paksa berhenti jika penutupan memakan waktu terlalu lama
    setTimeout(() => {
      logger.warn('Penutupan memakan waktu lama, memaksa berhenti');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => tutupServer('SIGTERM'));
  process.on('SIGINT', () => tutupServer('SIGINT'));
}

// Tangani kesalahan di tingkat proses agar server tidak mati diam-diam
process.on('unhandledRejection', (kesalahan: unknown) => {
  logger.error(
    { kesalahan: kesalahan instanceof Error ? kesalahan.message : 'unknown' },
    'Janji yang tidak tertangani terdeteksi',
  );
});

process.on('uncaughtException', (kesalahan: Error) => {
  logger.error(
    { kesalahan: kesalahan.message, tumpukan: kesalahan.stack },
    'Pengecualian yang tidak tertangani terdeteksi',
  );
});

// Mulai server dan catat kesalahan saat persiapan
jalankanServer().catch((kesalahan: unknown) => {
  logger.error(
    { kesalahan: kesalahan instanceof Error ? kesalahan.message : 'unknown' },
    'Server gagal dimulai',
  );
  process.exit(1);
});
