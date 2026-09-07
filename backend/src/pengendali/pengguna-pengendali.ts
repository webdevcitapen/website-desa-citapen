/**
 * Pengendali manajemen pengguna oleh admin desa.
 * Menangani pendaftaran pengguna baru, daftar pengguna, detail,
 * ganti kata sandi, ganti username, dan penghapusan pengguna.
 */

import type { NextFunction, Request, Response } from 'express';
import { bungkusHandler } from '../middleware/penangan-kesalahan.js';
import { kirimSukses, kirimSuksesDibuat } from '../utils/respons.js';
import { buatParameterPaginasi } from '../utils/paginasi.js';
import {
  ambilDaftarPengguna,
  ambilDetailPenggunaOlehAdmin,
  daftarkanPenggunaOlehAdmin,
  hapusPenggunaOlehAdmin,
  ubahKataSandiOlehAdmin,
  ubahProfilOlehAdmin,
  ubahUsernameOlehAdmin,
} from '../layanan/pengguna-layanan.js';
import type { Peran } from '../types/index.js';

/** Menangani pendaftaran pengguna baru oleh admin desa. */
export const daftarkanPengguna = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    // Data sudah divalidasi oleh middleware validasi
    const data = permintaan.body as {
      username: string;
      kataSandi: string;
      namaLengkap: string;
      email: string | null;
      nomorHp: string | null;
      peran: Peran;
    };

    const pengguna = await daftarkanPenggunaOlehAdmin(data, data.peran);

    kirimSuksesDibuat(
      tanggapan,
      pengguna,
      `Pengguna ${pengguna.username} berhasil didaftarkan`,
    );
  },
);

/** Menangani permintaan daftar pengguna oleh admin desa. */
export const daftarPengguna = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    // Nilai kueri sudah divalidasi oleh middleware validasi
    const kueri = permintaan.query as { halaman?: string; perHalaman?: string; peran?: Peran };

    const paginasi = buatParameterPaginasi(kueri.halaman, kueri.perHalaman);

    const hasil = await ambilDaftarPengguna({
      halaman: paginasi.halaman,
      perHalaman: paginasi.perHalaman,
      lewati: paginasi.lewati,
      batas: paginasi.batas,
      peran: kueri.peran,
    });

    kirimSukses(tanggapan, hasil, 'Daftar pengguna berhasil diambil');
  },
);

/** Menangani permintaan detail pengguna oleh admin desa. */
export const detailPengguna = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    // Id sudah divalidasi oleh middleware validasi parameter
    const { id } = permintaan.params as { id: string };

    const pengguna = await ambilDetailPenggunaOlehAdmin(Number(id));

    kirimSukses(tanggapan, pengguna, 'Detail pengguna berhasil diambil');
  },
);

/** Menangani permintaan menghapus pengguna oleh admin desa. */
export const hapusPengguna = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };

    await hapusPenggunaOlehAdmin(Number(id));

    kirimSukses(tanggapan, null, 'Pengguna berhasil dihapus');
  },
);

/** Menangani permintaan ganti kata sandi pengguna oleh admin desa. */
export const ubahKataSandiPengguna = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };
    const { kataSandiBaru } = permintaan.body as { kataSandiBaru: string };
    const pemintaId = permintaan.pengguna?.id;

    await ubahKataSandiOlehAdmin(Number(id), kataSandiBaru, pemintaId);

    kirimSukses(tanggapan, null, 'Kata sandi pengguna berhasil diubah');
  },
);

/** Menangani permintaan ganti username pengguna oleh admin desa. */
export const ubahUsernamePengguna = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };
    const { usernameBaru } = permintaan.body as { usernameBaru: string };
    const pemintaId = permintaan.pengguna?.id;

    const pengguna = await ubahUsernameOlehAdmin(Number(id), usernameBaru, pemintaId);

    kirimSukses(tanggapan, pengguna, 'Username pengguna berhasil diubah');
  },
);

/** Menangani permintaan ubah profil pengguna oleh admin desa. */
export const ubahProfilPengguna = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const { id } = permintaan.params as { id: string };
    const data = permintaan.body as {
      namaLengkap: string;
      email: string | null;
      nomorHp: string | null;
    };
    const pemintaId = permintaan.pengguna?.id;

    const pengguna = await ubahProfilOlehAdmin(Number(id), data, pemintaId);

    kirimSukses(tanggapan, pengguna, 'Profil pengguna berhasil diubah');
  },
);
