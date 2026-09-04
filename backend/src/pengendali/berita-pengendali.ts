/**
 * Pengendali berita: membuat, membaca, mengubah, dan menghapus berita.
 * Berita dapat dibuat oleh admin desa dan publikasi.
 */

import type { NextFunction, Request, Response } from 'express';
import { bungkusHandler } from '../middleware/penangan-kesalahan.js';
import { kirimSukses, kirimSuksesDibuat } from '../utils/respons.js';
import { buatParameterPaginasi } from '../utils/paginasi.js';
import {
  ambilDaftarBerita,
  ambilDetailBerita,
  hapusBeritaDenganPemeriksaan,
  tambahBerita,
  ubahBerita,
} from '../layanan/berita-layanan.js';
import { KesalahanAutentikasi } from '../utils/kesalahan.js';

/** Menangani pembuatan berita baru. */
export const buatBerita = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const { judul, isi } = permintaan.body as { judul: string; isi: string };

    const berita = await tambahBerita(
      permintaan.pengguna.id,
      { judul, isi },
      permintaan.file,
    );

    kirimSuksesDibuat(tanggapan, berita, 'Berita berhasil diterbitkan');
  },
);

/** Menangani permintaan daftar berita untuk publik. */
export const daftarBerita = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const kueri = permintaan.query as { halaman?: string; perHalaman?: string };

    const paginasi = buatParameterPaginasi(kueri.halaman, kueri.perHalaman);

    const hasil = await ambilDaftarBerita({
      halaman: paginasi.halaman,
      perHalaman: paginasi.perHalaman,
      lewati: paginasi.lewati,
      batas: paginasi.batas,
    });

    kirimSukses(tanggapan, hasil, 'Daftar berita berhasil diambil');
  },
);

/** Menangani permintaan detail satu berita untuk publik. */
export const detailBerita = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };

    const berita = await ambilDetailBerita(Number(id));

    kirimSukses(tanggapan, berita, 'Detail berita berhasil diambil');
  },
);

/** Menangani permintaan mengubah berita. */
export const perbaruiBerita = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const { id } = permintaan.params as { id: string };
    const { judul, isi } = permintaan.body as { judul: string; isi: string };

    const berita = await ubahBerita(
      Number(id),
      permintaan.pengguna.id,
      permintaan.pengguna.peran,
      { judul, isi },
      permintaan.file,
    );

    kirimSukses(tanggapan, berita, 'Berita berhasil diperbarui');
  },
);

/** Menangani permintaan menghapus berita. */
export const hapusBerita = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const { id } = permintaan.params as { id: string };

    await hapusBeritaDenganPemeriksaan(
      Number(id),
      permintaan.pengguna.id,
      permintaan.pengguna.peran,
    );

    kirimSukses(tanggapan, null, 'Berita berhasil dihapus');
  },
);
