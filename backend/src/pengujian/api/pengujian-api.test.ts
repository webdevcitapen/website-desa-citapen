/**
 * Pengujian api (end-to-end) memakai supertest.
 * Menguji seluruh endpoint utama dari sisi permintaan http nyata:
 * masuk, manajemen pengguna oleh admin, produk, dan berita.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import { buatAplikasi } from '../../app.js';
import {
  buatPenggunaUji,
  buatUsernameUji,
  GAMBAR_PNG_UJI,
  bersihkanDataUji,
  dapatkanTokenAdmin,
  periksaKetersediaanDatabase,
} from '../bantuan.js';

// Seluruh pengujian di file ini membutuhkan database yang tersedia
const databaseTersedia = await periksaKetersediaanDatabase();

describe.skipIf(!databaseTersedia)('pengujian api', () => {
  let aplikasi: Application;
  let tokenAdmin: string;

  beforeAll(async () => {
    await bersihkanDataUji();
    aplikasi = buatAplikasi();
    tokenAdmin = await dapatkanTokenAdmin();
  });

  afterAll(async () => {
    await bersihkanDataUji();
  });

  it('mengambil informasi dasar layanan', async () => {
    const tanggapan = await request(aplikasi).get('/api');

    expect(tanggapan.status).toBe(200);
    expect(tanggapan.body.status).toBe('sukses');
    expect(tanggapan.body.data.nama).toBe('backend-desa-citapen');
  });

  it('admin dapat masuk melalui endpoint http', async () => {
    const tanggapan = await request(aplikasi)
      .post('/api/autentikasi/masuk')
      .send({ username: 'admin', kataSandi: 'AdminDesa123' });

    expect(tanggapan.status).toBe(200);
    expect(tanggapan.body.status).toBe('sukses');
    expect(tanggapan.body.data.token).toBeTruthy();
  });

  it('menolak masuk dengan kredensial salah melalui http', async () => {
    const tanggapan = await request(aplikasi)
      .post('/api/autentikasi/masuk')
      .send({ username: 'admin', kataSandi: 'KataSandiSalah99' });

    expect(tanggapan.status).toBe(401);
    expect(tanggapan.body.status).toBe('gagal');
  });

  it('admin dapat mendaftarkan pengguna publikasi baru melalui http', async () => {
    const username = buatUsernameUji('daftar');

    const tanggapan = await request(aplikasi)
      .post('/api/admin/pengguna')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        username,
        kataSandi: 'KataSandi123',
        namaLengkap: 'Publikasi Desa',
        peran: 'publikasi',
      });

    expect(tanggapan.status).toBe(201);
    expect(tanggapan.body.data.username).toBe(username);
    expect(tanggapan.body.data.peran).toBe('publikasi');
  });

  it('menolak pendaftaran pengguna tanpa token', async () => {
    const tanggapan = await request(aplikasi)
      .post('/api/admin/pengguna')
      .send({
        username: 'siapapun',
        kataSandi: 'KataSandi123',
        namaLengkap: 'Siapa pun',
        peran: 'publikasi',
      });

    expect(tanggapan.status).toBe(401);
  });

  it('menolak pendaftaran pengguna oleh pengguna biasa', async () => {
    // Buat pengguna publikasi lalu masuk sebagai publikasi
    const penggunaUji = await buatPenggunaUji('publikasi');
    const hasilMasuk = await request(aplikasi)
      .post('/api/autentikasi/masuk')
      .send({ username: penggunaUji.username, kataSandi: penggunaUji.kataSandi });
    const tokenPublikasi = hasilMasuk.body.data.token;

    const tanggapan = await request(aplikasi)
      .post('/api/admin/pengguna')
      .set('Authorization', `Bearer ${tokenPublikasi}`)
      .send({
        username: 'tidak-boleh',
        kataSandi: 'KataSandi123',
        namaLengkap: 'Tidak Boleh',
        peran: 'publikasi',
      });

    expect(tanggapan.status).toBe(403);
  });

  it('admin dapat melihat daftar pengguna melalui http', async () => {
    const tanggapan = await request(aplikasi)
      .get('/api/admin/pengguna?halaman=1&perHalaman=10')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(tanggapan.status).toBe(200);
    expect(tanggapan.body.data.daftar).toBeDefined();
    expect(tanggapan.body.data.totalHalaman).toBeDefined();
  });

  it('admin dapat menambah kategori produk melalui http', async () => {
    const namaUnik = `Oleh-Oleh Khas ${Date.now()}`;
    const tanggapan = await request(aplikasi)
      .post('/api/kategori')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nama: namaUnik });

    expect(tanggapan.status).toBe(201);
    expect(tanggapan.body.data.nama).toBe(namaUnik);
  });

  it('admin dapat menambah produk melalui http', async () => {
    // Unggah foto produk berupa png kecil oleh admin desa (full akses UMKM)
    const tanggapan = await request(aplikasi)
      .post('/api/produk')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .field('nama', 'Kue Lapis Citapen')
      .field('harga', '25000')
      .field('deskripsi', 'Kue lapis legit khas desa citapen yang lembut.')
      .attach(
        'foto',
        GAMBAR_PNG_UJI,
        'kue.png',
      );

    expect(tanggapan.status).toBe(201);
    expect(tanggapan.body.data.nama).toBe('Kue Lapis Citapen');
    expect(tanggapan.body.data.foto).toMatch(/^produk\//);
  });

  it('menolak unggah berkas yang bukan gambar melalui http', async () => {
    const tanggapan = await request(aplikasi)
      .post('/api/produk')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .field('nama', 'Produk Berbahaya')
      .field('harga', '1000')
      .field('deskripsi', 'Produk dengan berkas yang bukan gambar.')
      .attach('foto', Buffer.from('hello world ini teks biasa'), 'virus.txt');

    expect(tanggapan.status).toBe(400);
  });

  it('menolak publikasi menambah produk melalui http', async () => {
    const penggunaUji = await buatPenggunaUji('publikasi');
    const hasilMasuk = await request(aplikasi)
      .post('/api/autentikasi/masuk')
      .send({ username: penggunaUji.username, kataSandi: penggunaUji.kataSandi });
    const tokenPublikasi = hasilMasuk.body.data.token;

    const tanggapan = await request(aplikasi)
      .post('/api/produk')
      .set('Authorization', `Bearer ${tokenPublikasi}`)
      .field('nama', 'Produk Terlarang')
      .field('harga', '1000')
      .field('deskripsi', 'Publikasi tidak boleh menambah produk.')
      .attach('foto', GAMBAR_PNG_UJI, 'produk.png');

    expect(tanggapan.status).toBe(403);
  });

  it('menolak publikasi menambah kategori melalui http', async () => {
    const penggunaUji = await buatPenggunaUji('publikasi');
    const hasilMasuk = await request(aplikasi)
      .post('/api/autentikasi/masuk')
      .send({ username: penggunaUji.username, kataSandi: penggunaUji.kataSandi });
    const tokenPublikasi = hasilMasuk.body.data.token;

    const tanggapan = await request(aplikasi)
      .post('/api/kategori')
      .set('Authorization', `Bearer ${tokenPublikasi}`)
      .send({ nama: 'Kategori Terlarang' });

    expect(tanggapan.status).toBe(403);
  });

  it('publik dapat melihat daftar produk melalui http', async () => {
    const tanggapan = await request(aplikasi)
      .get('/api/produk?halaman=1&perHalaman=10');

    expect(tanggapan.status).toBe(200);
    expect(Array.isArray(tanggapan.body.data.daftar)).toBe(true);
  });

  it('publikasi dapat menambah berita melalui http', async () => {
    const penggunaUji = await buatPenggunaUji('publikasi');
    const hasilMasuk = await request(aplikasi)
      .post('/api/autentikasi/masuk')
      .send({ username: penggunaUji.username, kataSandi: penggunaUji.kataSandi });
    const tokenPublikasi = hasilMasuk.body.data.token;

    const tanggapan = await request(aplikasi)
      .post('/api/berita')
      .set('Authorization', `Bearer ${tokenPublikasi}`)
      .send({
        judul: 'Panen Raya Desa Citapen',
        isi: 'Warga desa citapen mengadakan panen raya dengan hasil melimpah.',
      });

    expect(tanggapan.status).toBe(201);
    expect(tanggapan.body.data.judul).toBe('Panen Raya Desa Citapen');
  });

  it('admin dapat menambah berita melalui http', async () => {
    const tanggapan = await request(aplikasi)
      .post('/api/berita')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        judul: 'Berita dari Admin',
        isi: 'Admin berhak menulis berita desa dengan isi yang cukup panjang agar valid.',
      });

    expect(tanggapan.status).toBe(201);
  });

  it('publik dapat melihat daftar berita melalui http', async () => {
    const tanggapan = await request(aplikasi)
      .get('/api/berita?halaman=1&perHalaman=10');

    expect(tanggapan.status).toBe(200);
    expect(Array.isArray(tanggapan.body.data.daftar)).toBe(true);
  });

  it('menolak permintaan dengan token yang rusak', async () => {
    const tanggapan = await request(aplikasi)
      .get('/api/autentikasi/saya')
      .set('Authorization', 'Bearer token.rusak.ini');

    expect(tanggapan.status).toBe(401);
  });

  it('menolak permintaan tanpa header authorization', async () => {
    const tanggapan = await request(aplikasi).get('/api/autentikasi/saya');

    expect(tanggapan.status).toBe(401);
  });
});
