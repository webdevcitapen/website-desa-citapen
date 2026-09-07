/**
 * Pengendali produk: membuat, membaca, mengubah, dan menghapus produk.
 * Produk dikelola penuh oleh admin desa dan dapat dilihat publik.
 */

import type { NextFunction, Request, Response } from 'express';
import { bungkusHandler } from '../middleware/penangan-kesalahan.js';
import { kirimSukses, kirimSuksesDibuat } from '../utils/respons.js';
import { buatParameterPaginasi } from '../utils/paginasi.js';
import {
  ambilDaftarProduk,
  ambilDetailProduk,
  hapusProdukDenganPemeriksaan,
  tambahProduk,
  ubahProduk,
} from '../layanan/produk-layanan.js';
import { KesalahanAutentikasi } from '../utils/kesalahan.js';
import { tambahHeaderGuard } from '../utils/guard-form.js';

/** Menangani pembuatan produk baru oleh admin desa. */
export const buatProduk = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    // Dukung kedua penamaan kategoriId/kategori_id dan umkmId/umkm_id dari frontend
    const data = permintaan.body as {
      nama: string;
      harga?: number | string | null;
      deskripsi: string;
      kategoriId?: number | string | null;
      kategori_id?: number | string | null;
      umkmId?: number | string | null;
      umkm_id?: number | string | null;
    };

    const kategoriIdRaw = data.kategoriId ?? data.kategori_id ?? null;
    const kategoriId = kategoriIdRaw !== null && kategoriIdRaw !== '' ? Number(kategoriIdRaw) : null;

    const umkmIdRaw = data.umkmId ?? data.umkm_id ?? null;
    const umkmId = umkmIdRaw !== null && umkmIdRaw !== '' ? Number(umkmIdRaw) : null;

    const hargaNum = data.harga !== undefined && data.harga !== null && data.harga !== '' ? Number(data.harga) : 0;

    const produk = await tambahProduk(
      permintaan.pengguna.id,
      {
        nama: data.nama,
        harga: Number.isNaN(hargaNum) ? 0 : hargaNum,
        deskripsi: data.deskripsi,
        kategoriId: kategoriId && Number.isNaN(kategoriId) ? null : kategoriId,
        umkmId: umkmId && Number.isNaN(umkmId) ? null : umkmId,
      },
      permintaan.file,
      permintaan.pengguna.peran,
    );

    kirimSuksesDibuat(tanggapan, produk, 'Produk berhasil ditambahkan');
  },
);

/** Menangani permintaan daftar produk untuk publik. */
export const daftarProduk = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const kueri = permintaan.query as {
      halaman?: string;
      perHalaman?: string;
      kategoriId?: string;
      pemilikId?: string;
      umkmId?: string;
      umkm_id?: string;
      cari?: string;
      q?: string;
    };

    const paginasi = buatParameterPaginasi(kueri.halaman, kueri.perHalaman);

    const umkmIdRaw = kueri.umkmId ?? kueri.umkm_id ?? undefined;
    const cari = (kueri.cari ?? kueri.q ?? '').trim() || undefined;

    const hasil = await ambilDaftarProduk({
      halaman: paginasi.halaman,
      perHalaman: paginasi.perHalaman,
      lewati: paginasi.lewati,
      batas: paginasi.batas,
      kategoriId: kueri.kategoriId ? Number(kueri.kategoriId) : undefined,
      pemilikId: kueri.pemilikId ? Number(kueri.pemilikId) : undefined,
      umkmId: umkmIdRaw ? Number(umkmIdRaw) : undefined,
      cari,
    });

    kirimSukses(tanggapan, hasil, 'Daftar produk berhasil diambil');
  },
);

/** Menangani permintaan detail satu produk untuk publik. */
export const detailProduk = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };

    const produk = await ambilDetailProduk(Number(id));

    // Guard: tambahkan ETag untuk mencegah overwrite bersamaan
    tambahHeaderGuard(tanggapan, produk);

    kirimSukses(tanggapan, produk, 'Detail produk berhasil diambil');
  },
);

/** Menangani permintaan mengubah produk oleh admin desa. */
export const perbaruiProduk = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const { id } = permintaan.params as { id: string };
    const data = permintaan.body as {
      nama: string;
      harga?: number | string | null;
      deskripsi: string;
      kategoriId?: number | string | null;
      kategori_id?: number | string | null;
      umkmId?: number | string | null;
      umkm_id?: number | string | null;
    };

    const kategoriIdRaw = data.kategoriId ?? data.kategori_id ?? null;
    const kategoriId = kategoriIdRaw !== null && kategoriIdRaw !== '' ? Number(kategoriIdRaw) : null;

    const umkmIdRaw = data.umkmId ?? data.umkm_id ?? null;
    const umkmId = umkmIdRaw !== null && umkmIdRaw !== '' ? Number(umkmIdRaw) : null;

    const hargaNum = data.harga !== undefined && data.harga !== null && data.harga !== '' ? Number(data.harga) : 0;

    const produk = await ubahProduk(
      Number(id),
      permintaan.pengguna.id,
      {
        nama: data.nama,
        harga: Number.isNaN(hargaNum) ? 0 : hargaNum,
        deskripsi: data.deskripsi,
        kategoriId: kategoriId && Number.isNaN(kategoriId) ? null : kategoriId,
        umkmId: umkmId && Number.isNaN(umkmId) ? null : umkmId,
      },
      permintaan.file,
      permintaan.pengguna.peran,
    );

    kirimSukses(tanggapan, produk, 'Produk berhasil diperbarui');
  },
);

/** Menangani permintaan menghapus produk oleh admin desa. */
export const hapusProduk = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const { id } = permintaan.params as { id: string };

    await hapusProdukDenganPemeriksaan(
      Number(id),
      permintaan.pengguna.id,
      permintaan.pengguna.peran,
    );

    kirimSukses(tanggapan, null, 'Produk berhasil dihapus');
  },
);
