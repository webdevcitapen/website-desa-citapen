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
import {
  FOLDER_UNGGUHAN,
  apakahPathUnggahanAman,
} from './utils/berkas.js';
import { apakahSupabaseAktif, dapatkanUrlPublikSupabase } from './config/storage.js';
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

  // Penting untuk Vercel / proxy: dapatkan IP asli via X-Forwarded-For untuk rate limiter & logging
  aplikasi.set('trust proxy', 1);

  // ETag untuk cache validasi (hemat bandwidth 304)
  aplikasi.set('etag', 'strong');

  // Sembunyikan identitas server agar sulit diserang
  aplikasi.disable('x-powered-by');

  // Keamanan header http (helmet) - crossOriginResourcePolicy false agar <img> dari frontend (port berbeda) bisa load /unggahan
  // crossOriginEmbedderPolicy false agar Supabase CDN embed tidak blok
  aplikasi.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
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
  // Threshold 1kb: kompres JSON bahkan kecil; filter hindari gambar (sudah terkompres)
  aplikasi.use(compression({
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      // Jangan kompres image/video yang sudah terkompres
      const ct = res.getHeader('Content-Type') as string | undefined;
      if (ct && /image|video/.test(ct)) return false;
      return compression.filter(req, res);
    },
  }));

  // Pencatatan log setiap permintaan masuk - matikan autoLogging di produksi untuk irit CPU
  // Hanya log error & 4xx/5xx di produksi via custom level
  aplikasi.use(
    pinoHttp({
      logger,
      // Jangan catat permintaan kesehatan agar log tidak penuh
      autoLogging: {
        ignore: (permintaan) => permintaan.url === '/api/kesehatan',
      },
      // Di produksi, kurangi overhead log untuk GET public
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        if (process.env.VERCEL) return 'silent'; // hemat di serverless
        return 'info';
      },
    }),
  );

  // Batasi ukuran badan permintaan agar hemat memori
  aplikasi.use(express.json({ limit: '1mb' }));
  aplikasi.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Sajikan berkas unggahan dengan cache agar cepat diakses
  // FIX: route SELALU '/unggahan' (bukan `/${FOLDER_UNGGUHAN}`).
  // Sebelumnya: `/${FOLDER_UNGGUHAN}` di Vercel menjadi '//tmp/unggahan' -> frontend request '/unggahan/...' 404.
  // Sekarang: path filesystem tetap FOLDER_UNGGUHAN ('/tmp/unggahan' di Vercel, 'unggahan' di lokal), tapi route http tetap '/unggahan'.
  // Jika Supabase Storage aktif (untuk Vercel persisten), gambar diambil dari Supabase dulu lalu fallback ke lokal.

  // Handler untuk /unggahan: jika Supabase aktif -> REDIRECT 302 ke CDN (jauh lebih cepat daripada proxy download)
  // Proxy download membebani lambda (buffer image di memori) dan double-hop Supabase->Vercel->Browser.
  // Redirect memanfaatkan Supabase CDN (Cloudfront) yang sudah edge-cached dan tidak membebani lambda.
  if (apakahSupabaseAktif()) {
    logger.info('Mode Supabase Storage aktif — /unggahan akan REDIRECT ke Supabase CDN (performa tinggi)');
    aplikasi.get('/unggahan/:subFolder/:namaBerkas', (permintaan, tanggapan, berikutnya) => {
      const pathRelatif = `${permintaan.params.subFolder}/${permintaan.params.namaBerkas}`;
      if (!apakahPathUnggahanAman(pathRelatif)) {
        berikutnya();
        return;
      }
      const urlPublik = dapatkanUrlPublikSupabase(pathRelatif);
      if (urlPublik) {
        // Redirect permanen? Pakai 302 agar tetap bisa ganti bucket tanpa cache permanen
        // Tapi kasih CDN cache header untuk redirect itu sendiri (1 hari)
        tanggapan.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
        tanggapan.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        // Vercel edge cache redirect
        tanggapan.setHeader('CDN-Cache-Control', 'public, max-age=86400');
        tanggapan.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=86400');
        tanggapan.redirect(302, urlPublik);
        return;
      }
      berikutnya();
    });
  } else {
    logger.info({ folder: path.resolve(FOLDER_UNGGUHAN) }, 'Mode filesystem lokal aktif untuk unggahan');
  }

  // Static fallback untuk mode lokal (dan untuk file yang masih ada di /tmp sebelum migrasi / saat Supabase fallback)
  aplikasi.use(
    '/unggahan',
    express.static(path.resolve(FOLDER_UNGGUHAN), {
      maxAge: '7d',
      immutable: true,
      fallthrough: true,
      // Tambahkan header CORS agar <img> cross-origin tetap bisa
      setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      },
    }),
  );

  // Pembatas laju umum untuk seluruh rute api
  aplikasi.use('/api', pembatasLajuUmum);

  // Pembatas laju khusus untuk proses masuk (anti brute force)
  aplikasi.use(
    '/api/autentikasi/masuk',
    buatPembatasLajuLogin(opsi.batasLajuLogin),
  );

  // Middleware cache untuk GET publik - memanfaatkan Vercel Edge CDN / browser cache
  // Tanpa ini, setiap request selalu hit database meski data jarang berubah.
  aplikasi.use('/api', (permintaan, tanggapan, berikutnya) => {
    if (permintaan.method !== 'GET') {
      berikutnya();
      return;
    }
    const path = permintaan.path; // tanpa prefix /api karena sudah di-mount
    // Hanya cache endpoint publik (tidak cache auth/private)
    const apakahPublik =
      path.startsWith('/berita') ||
      path.startsWith('/produk') ||
      path.startsWith('/kategori') ||
      path.startsWith('/profil-desa') ||
      path.startsWith('/struktur-organisasi') ||
      path.startsWith('/riwayat-kuwu') ||
      path.startsWith('/galeri') ||
      path.startsWith('/umkm') ||
      path.startsWith('/beranda') ||
      path === '/kesehatan' ||
      path === '/';

    if (apakahPublik) {
      // Browser tidak cache (max-age=0), tapi CDN Vercel cache 60s dengan stale 5 menit
      // Ini menghemat DB hit untuk traffic tinggi tanpa bikin data basi lama
      tanggapan.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
      tanggapan.setHeader('CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      tanggapan.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      // Vary agar cache tidak tercampur antar origin
      tanggapan.setHeader('Vary', 'Accept-Encoding, Origin');
    }
    berikutnya();
  });

  // Semua rute aplikasi berada di bawah /api
  aplikasi.use('/api', ruteUtama);

  // Penangan rute yang tidak dikenal
  aplikasi.use(tanganiRuteTidakDikenal);

  // Penangan kesalahan terpusat
  aplikasi.use(tanganiKesalahan);

  return aplikasi;
}
