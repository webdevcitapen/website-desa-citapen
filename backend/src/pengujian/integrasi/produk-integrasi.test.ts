/**
 * Pengujian integrasi: alur produk dan kategori.
 * Setelah penghapusan peran umkm, produk dan kategori
 * dikelola penuh oleh admin desa (full akses CRUD).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { kumpulanKoneksi } from '../../config/database.js';
import {
  buatPenggunaUji,
  GAMBAR_PNG_UJI,
  bersihkanDataUji,
  periksaKetersediaanDatabase,
  dapatkanTokenAdmin,
} from '../bantuan.js';
import {
  ambilDaftarProduk,
  ambilDetailProduk,
  hapusProdukDenganPemeriksaan,
  tambahProduk,
  ubahProduk,
} from '../../layanan/produk-layanan.js';
import {
  ambilDaftarKategori,
  hapusKategoriDenganPemeriksaan,
  tambahKategori,
} from '../../layanan/kategori-layanan.js';
import {
  KesalahanOtorisasi,
  KesalahanTidakDitemukan,
} from '../../utils/kesalahan.js';

// Seluruh pengujian di file ini membutuhkan database yang tersedia
const databaseTersedia = await periksaKetersediaanDatabase();

describe.skipIf(!databaseTersedia)('integrasi produk dan kategori', () => {
  let adminId: number;

  beforeAll(async () => {
    await bersihkanDataUji();
    // Ambil id admin dari token / database
    const hasil = await kumpulanKoneksi.query<{ id: string }>(
      `SELECT id FROM pengguna WHERE username = 'admin' LIMIT 1`,
    );
    adminId = Number(hasil.rows[0].id);
    // Pastikan token admin valid
    await dapatkanTokenAdmin();
  });

  afterAll(async () => {
    await bersihkanDataUji();
  });

  it('admin desa dapat membuat kategori produk', async () => {
    const namaUnik = `Makanan Ringan ${Date.now()}${Math.random().toString(36).slice(2,4)}`;
    const kategori = await tambahKategori(adminId, namaUnik);

    expect(kategori.nama).toBe(namaUnik);
    expect(kategori.pemilikId).toBe(adminId);
  });

  it('daftar kategori tersedia untuk dibaca publik', async () => {
    const daftar = await ambilDaftarKategori();

    expect(Array.isArray(daftar)).toBe(true);
    expect(daftar.length).toBeGreaterThanOrEqual(1);
  });

  it('admin desa dapat membuat produk dengan kategori miliknya', async () => {
    const namaKat = `Minuman Segar ${Date.now()}${Math.random().toString(36).slice(2,4)}`;
    const kategori = await tambahKategori(adminId, namaKat);

    // Produk memakai foto tiruan kecil
    const fotoTiruan = {
      fieldname: 'foto',
      originalname: 'produk.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: GAMBAR_PNG_UJI,
      size: 67,
    };

    const produk = await tambahProduk(
      adminId,
      {
        nama: 'Es Teh Manis',
        harga: 5000,
        deskripsi: 'Minuman teh manis segar khas desa citapen.',
        kategoriId: kategori.id,
      },
      fotoTiruan,
      'admin',
    );

    expect(produk.nama).toBe('Es Teh Manis');
    expect(produk.harga).toBe(5000);
    expect(produk.kategori?.id).toBe(kategori.id);
    expect(produk.pemilik?.id).toBe(adminId);
  });

  it('produk dapat dibuat tanpa foto (foto bersifat opsional)', async () => {
    const produk = await tambahProduk(
      adminId,
      {
        nama: 'Produk Tanpa Foto',
        harga: 10000,
        deskripsi: 'Produk yang tidak menyertakan foto.',
        kategoriId: null,
      },
      undefined,
      'admin',
    );

    expect(produk.nama).toBe('Produk Tanpa Foto');
    expect(produk.foto).toBeNull();
  });

  it('admin desa dapat memakai kategori apapun (full akses)', async () => {
    const namaKat = `Kerajinan Tangan Admin ${Date.now()}${Math.random().toString(36).slice(2,4)}`;
    const kategori = await tambahKategori(adminId, namaKat);

    const produk = await tambahProduk(
      adminId,
      {
        nama: 'Produk Memakai Kategori Full Akses',
        harga: 20000,
        deskripsi: 'Produk admin yang memakai kategori yang sama.',
        kategoriId: kategori.id,
      },
      undefined,
      'admin',
    );

    expect(produk.kategori?.id).toBe(kategori.id);
  });

  it('publikasi tidak dapat mengubah produk (hanya admin)', async () => {
    const produk = await tambahProduk(
      adminId,
      {
        nama: 'Produk Milik Admin',
        harga: 30000,
        deskripsi: 'Produk milik admin yang dijaga kepemilikannya.',
        kategoriId: null,
      },
      undefined,
      'admin',
    );

    const publikasi = await buatPenggunaUji('publikasi');

    await expect(
      ubahProduk(
        produk.id,
        publikasi.id,
        {
          nama: 'Produk Dicuri Publikasi',
          harga: 1000,
          deskripsi: 'Produk yang dicoba diubah oleh publikasi.',
          kategoriId: null,
        },
        undefined,
        'publikasi',
      ),
    ).rejects.toThrow(KesalahanOtorisasi);
  });

  it('admin desa dapat mengubah produk miliknya sendiri', async () => {
    const produk = await tambahProduk(
      adminId,
      {
        nama: 'Produk Awal',
        harga: 10000,
        deskripsi: 'Deskripsi produk awal sebelum diubah.',
        kategoriId: null,
      },
      undefined,
      'admin',
    );

    const hasil = await ubahProduk(
      produk.id,
      adminId,
      {
        nama: 'Produk Diubah',
        harga: 15000,
        deskripsi: 'Deskripsi produk yang sudah diubah.',
        kategoriId: null,
      },
      undefined,
      'admin',
    );

    expect(hasil.nama).toBe('Produk Diubah');
    expect(hasil.harga).toBe(15000);
  });

  it('daftar produk dapat disaring berdasarkan pemilik', async () => {
    // Bersihkan dulu produk lama agar count deterministik
    await kumpulanKoneksi.query(`DELETE FROM produk WHERE pemilik_id = $1`, [adminId]);
    for (let i = 0; i < 5; i += 1) {
      await tambahProduk(
        adminId,
        {
          nama: `Produk Uji ${i}`,
          harga: 1000 * i,
          deskripsi: `Deskripsi produk uji nomor ${i}.`,
          kategoriId: null,
        },
        undefined,
        'admin',
      );
    }

    const hasil = await ambilDaftarProduk({
      halaman: 1,
      perHalaman: 10,
      lewati: 0,
      batas: 10,
      pemilikId: adminId,
    });

    expect(hasil.daftar.length).toBe(5);
    expect(hasil.total).toBe(5);
    // Semua produk memang milik admin tersebut
    expect(hasil.daftar.every((produk) => produk.pemilik?.id === adminId)).toBe(
      true,
    );
  });

  it('detail produk dapat diambil berdasarkan id', async () => {
    const produk = await tambahProduk(
      adminId,
      {
        nama: 'Produk Detail',
        harga: 25000,
        deskripsi: 'Produk yang dipakai untuk uji ambil detail.',
        kategoriId: null,
      },
      undefined,
      'admin',
    );

    const detail = await ambilDetailProduk(produk.id);
    expect(detail.id).toBe(produk.id);
    expect(detail.harga).toBe(25000);
  });

  it('admin desa dapat menghapus produk miliknya sendiri', async () => {
    const produk = await tambahProduk(
      adminId,
      {
        nama: 'Produk Dihapus',
        harga: 5000,
        deskripsi: 'Produk yang akan dihapus oleh pemiliknya.',
        kategoriId: null,
      },
      undefined,
      'admin',
    );

    await hapusProdukDenganPemeriksaan(produk.id, adminId, 'admin');

    await expect(ambilDetailProduk(produk.id)).rejects.toThrow(
      KesalahanTidakDitemukan,
    );
  });

  it('publikasi tidak dapat menghapus produk milik admin', async () => {
    const produk = await tambahProduk(
      adminId,
      {
        nama: 'Produk Terjaga',
        harga: 5000,
        deskripsi: 'Produk yang tidak boleh dihapus publikasi.',
        kategoriId: null,
      },
      undefined,
      'admin',
    );

    const publikasi = await buatPenggunaUji('publikasi');

    await expect(
      hapusProdukDenganPemeriksaan(produk.id, publikasi.id, 'publikasi'),
    ).rejects.toThrow(KesalahanOtorisasi);
  });

  it('admin desa dapat menghapus kategori miliknya sendiri', async () => {
    const namaKat = `Kategori Dihapus ${Date.now()}${Math.random().toString(36).slice(2,4)}`;
    const kategori = await tambahKategori(adminId, namaKat);

    await hapusKategoriDenganPemeriksaan(kategori.id, adminId, 'admin');
  });

  it('publikasi tidak dapat menghapus kategori milik admin', async () => {
    const namaKat = `Kategori Terjaga ${Date.now()}${Math.random().toString(36).slice(2,4)}`;
    const kategori = await tambahKategori(adminId, namaKat);

    const publikasi = await buatPenggunaUji('publikasi');

    await expect(
      hapusKategoriDenganPemeriksaan(kategori.id, publikasi.id, 'publikasi'),
    ).rejects.toThrow(KesalahanOtorisasi);
  });
});
