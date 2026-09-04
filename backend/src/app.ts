/**
 * Perakitan aplikasi express.
 * Berisi semua middleware keamanan dan performa, rute, serta
 * penangan kesalahan terpusat. Dibuat sebagai fungsi pabrik agar
 * mudah diuji (misalnya untuk pengujian keamanan dan beban).
 */

import path from 'node:path';
import express from 'express';
import type { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import { daftarAsalDiizinkan } from './config/env.js';
import { logger } from './utils/logger.js';
import { FOLDER_UNGGUHAN } from './utils/berkas.js';
import { ruteUtama } from './rute/indeks.js';
import {
  tanganiKesalahan,
  tanganiRuteTidakDikenal,
} from './middleware/penangan-kesalahan.js';
import { buatPembatasLajuLogin, pembatasLajuUmum } from './middleware/pembatas-laju.js';

/** Opsi tambahan untuk membuat aplikasi (dipakai pengujian). */
export interface OpsiAplikasi {
  /** Batas permintaan login per ip (untuk pengujian keamanan). */
  batasLajuLogin?: number;
  /** Batas permintaan unggah per ip (untuk pengujian keamanan). */
  batasLajuUnggah?: number;
}

/**
 * Membuat dan merakit aplikasi express.
 * Dipanggil oleh server utama maupun oleh pengujian.
 */
export function buatAplikasi(opsi: OpsiAplikasi = {}): Application {
  const aplikasi = express();

  // Sembunyikan identitas server agar sulit diserang
  aplikasi.disable('x-powered-by');

  // Keamanan header http (helmet) - crossOriginResourcePolicy false agar <img> dari frontend (port berbeda) bisa load /unggahan
  aplikasi.use(helmet({
    crossOriginResourcePolicy: false,
  }));

  // Izinkan akses dari frontend dengan pengaturan asal yang ketat
  aplikasi.use(
    cors({
      origin: (asal, selesai) => {
        // Izinkan semua asal ketika memakai tanda bintang
        if (daftarAsalDiizinkan[0] === '*') {
          selesai(null, true);
          return;
        }
        // Hanya izinkan asal yang terdaftar
        if (!asal || daftarAsalDiizinkan.includes(asal)) {
          selesai(null, true);
          return;
        }
        selesai(new Error('Asal tidak diizinkan'));
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Kompresi tanggapan agar transfer data lebih kecil dan cepat
  aplikasi.use(compression());

  // Pencatatan log setiap permintaan masuk
  aplikasi.use(
    pinoHttp({
      logger,
      // Jangan catat permintaan kesehatan agar log tidak penuh
      autoLogging: {
        ignore: (permintaan) => permintaan.url === '/api/kesehatan',
      },
    }),
  );

  // Batasi ukuran badan permintaan agar hemat memori
  aplikasi.use(express.json({ limit: '1mb' }));
  aplikasi.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Sajikan berkas unggahan dengan cache agar cepat diakses
  aplikasi.use(
    `/${FOLDER_UNGGUHAN}`,
    express.static(path.resolve(FOLDER_UNGGUHAN), {
      maxAge: '7d',
      immutable: true,
      fallthrough: true,
    }),
  );

  // Pembatas laju umum untuk seluruh rute api
  aplikasi.use('/api', pembatasLajuUmum);

  // Pembatas laju khusus untuk proses masuk (anti brute force)
  aplikasi.use(
    '/api/autentikasi/masuk',
    buatPembatasLajuLogin(opsi.batasLajuLogin),
  );

  // Semua rute aplikasi berada di bawah /api
  aplikasi.use('/api', ruteUtama);

  // Penangan rute yang tidak dikenal
  aplikasi.use(tanganiRuteTidakDikenal);

  // Penangan kesalahan terpusat
  aplikasi.use(tanganiKesalahan);

  return aplikasi;
}
