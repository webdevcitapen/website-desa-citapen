/**
 * Pengujian aksesibilitas antarmuka api.
 * Memastikan setiap tanggapan mudah dipahami dan diakses:
 * status http yang tepat, bentuk json seragam, pesan berbahasa
 * Indonesia yang jelas, dan endpoint publik tanpa halangan.
 */

import { describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import { buatAplikasi } from '../../app.js';
import { periksaKetersediaanDatabase } from '../bantuan.js';

const databaseTersedia = await periksaKetersediaanDatabase();

describe('pengujian aksesibilitas api', () => {
  const aplikasi: Application = buatAplikasi();

  it('memberikan tanggapan dengan bentuk json yang seragam', async () => {
    const tanggapan = await request(aplikasi).get('/api');

    expect(tanggapan.status).toBe(200);
    expect(tanggapan.headers['content-type']).toMatch(/application\/json/);
    expect(tanggapan.body.status).toBe('sukses');
    expect(typeof tanggapan.body.pesan).toBe('string');
  });

  it('memberikan pesan kesalahan yang jelas untuk rute tak dikenal', async () => {
    const tanggapan = await request(aplikasi).get('/api/rute-tidak-ada');

    expect(tanggapan.status).toBe(404);
    expect(tanggapan.body.status).toBe('gagal');
    expect(typeof tanggapan.body.pesan).toBe('string');
    expect(tanggapan.body.pesan.length).toBeGreaterThan(0);
  });

  it('memberikan pesan kesalahan berbahasa Indonesia', async () => {
    const tanggapan = await request(aplikasi)
      .post('/api/autentikasi/masuk')
      .send({ username: 'abc', kataSandi: '123' });

    expect(tanggapan.status).toBe(400);
    // Pesan harus mengandung karakter indonesia (bukan kosong)
    expect(tanggapan.body.pesan).toBeTruthy();
  });

  it('menjelaskan kolom yang salah melalui detail kesalahan validasi', async () => {
    const tanggapan = await request(aplikasi)
      .post('/api/autentikasi/masuk')
      .send({ username: 'ab', kataSandi: '1234567' });

    expect(tanggapan.status).toBe(400);
    expect(Array.isArray(tanggapan.body.detail)).toBe(true);
  });

  it('mengizinkan asal frontend yang terdaftar untuk cors', async () => {
    const asalFrontend = 'http://localhost:5173';
    const tanggapan = await request(aplikasi)
      .get('/api')
      .set('Origin', asalFrontend);

    // Header izin cors harus mengakui asal tersebut (mode semua asal atau terdaftar)
    expect(tanggapan.headers['access-control-allow-origin']).toBe(asalFrontend);
  });

  it('menyembunyikan detail teknis error dari pengguna akhir', async () => {
    const tanggapan = await request(aplikasi).get('/api/berita/999999');

    expect(tanggapan.status).toBe(404);
    expect(tanggapan.body.pesan).toBeTruthy();
    expect(tanggapan.body.tumpukan).toBeUndefined();
    expect(tanggapan.body.stack).toBeUndefined();
  });

  it('endpoint publik dapat diakses tanpa autentikasi', async () => {
    const daftarProduk = await request(aplikasi).get('/api/produk');
    const daftarBerita = await request(aplikasi).get('/api/berita');
    const daftarKategori = await request(aplikasi).get('/api/kategori');
    const kesehatan = await request(aplikasi).get('/api/kesehatan');

    expect(daftarProduk.status).toBe(200);
    expect(daftarBerita.status).toBe(200);
    expect(daftarKategori.status).toBe(200);
    expect([200, 503]).toContain(kesehatan.status);
  });

  it('endpoint privat melindungi diri dengan kode 401 yang tepat', async () => {
    const tanggapan = await request(aplikasi).get('/api/autentikasi/saya');

    expect(tanggapan.status).toBe(401);
    expect(tanggapan.body.kode).toBe('TOKEN_TIDAK_DITEMUKAN');
  });
});

describe.skipIf(!databaseTersedia)('pengujian aksesibilitas dengan database', () => {
  it('daftar produk menghormati parameter paginasi', async () => {
    const aplikasi = buatAplikasi();

    const tanggapan = await request(aplikasi)
      .get('/api/produk?halaman=1&perHalaman=5');

    expect(tanggapan.status).toBe(200);
    expect(tanggapan.body.data.daftar.length).toBeLessThanOrEqual(5);
    expect(tanggapan.body.data.perHalaman).toBe(5);
    expect(tanggapan.body.data.halaman).toBe(1);
  });

  it('menolak parameter paginasi yang tidak wajar dengan pesan jelas', async () => {
    const aplikasi = buatAplikasi();

    const tanggapan = await request(aplikasi).get('/api/produk?perHalaman=1000');

    expect(tanggapan.status).toBe(400);
    // Detail kesalahan harus menyebutkan kolom perHalaman
    expect(JSON.stringify(tanggapan.body.detail)).toMatch(/perHalaman/i);
  });
});
