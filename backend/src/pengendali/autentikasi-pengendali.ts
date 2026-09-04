/**
 * Pengendali autentikasi dan pengelolaan akun diri sendiri.
 * Mengambil data dari permintaan lalu memanggil layanan terkait
 * dan mengirimkan tanggapan yang seragam.
 */

import type { NextFunction, Request, Response } from 'express';
import { bungkusHandler } from '../middleware/penangan-kesalahan.js';
import { kirimSukses } from '../utils/respons.js';
import {
  ambilProfilSaatIni,
  masukPengguna,
} from '../layanan/autentikasi-layanan.js';
import {
  ubahFotoProfilDiri,
  ubahKataSandiDiri,
  ubahProfilDiri,
  ubahUsernameDiri,
} from '../layanan/pengguna-layanan.js';
import { KesalahanAutentikasi } from '../utils/kesalahan.js';

/** Menangani permintaan masuk (login). */
export const masuk = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    // Data sudah divalidasi oleh middleware validasi
    const { username, kataSandi } = permintaan.body as {
      username: string;
      kataSandi: string;
    };

    const hasil = await masukPengguna(username, kataSandi);

    kirimSukses(
      tanggapan,
      hasil,
      'Selamat datang kembali di desa citapen',
    );
  },
);

/** Menangani permintaan mengambil profil diri sendiri. */
export const profilSaya = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const pengguna = await ambilProfilSaatIni(permintaan.pengguna.id);

    kirimSukses(tanggapan, pengguna, 'Profil Anda berhasil diambil');
  },
);

/** Menangani permintaan mengubah data profil diri sendiri. */
export const ubahProfil = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const data = permintaan.body as {
      namaLengkap: string;
      email: string | null;
      nomorHp: string | null;
    };

    const pengguna = await ubahProfilDiri(permintaan.pengguna.id, data);

    kirimSukses(tanggapan, pengguna, 'Profil berhasil diperbarui');
  },
);

/** Menangani permintaan mengubah foto profil diri sendiri. */
export const ubahFotoProfil = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }
    if (!permintaan.file) {
      throw new KesalahanAutentikasi('Berkas foto wajib diunggah');
    }

    const pengguna = await ubahFotoProfilDiri(
      permintaan.pengguna.id,
      permintaan.file,
    );

    kirimSukses(tanggapan, pengguna, 'Foto profil berhasil diperbarui');
  },
);

/** Menangani permintaan mengubah kata sandi diri sendiri. */
export const ubahKataSandi = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const { kataSandiLama, kataSandiBaru } = permintaan.body as {
      kataSandiLama: string;
      kataSandiBaru: string;
    };

    await ubahKataSandiDiri(
      permintaan.pengguna.id,
      kataSandiLama,
      kataSandiBaru,
    );

    kirimSukses(tanggapan, null, 'Kata sandi berhasil diubah');
  },
);

/** Menangani permintaan mengubah username diri sendiri. */
export const ubahUsername = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    if (!permintaan.pengguna) {
      throw new KesalahanAutentikasi();
    }

    const { usernameBaru } = permintaan.body as { usernameBaru: string };

    const pengguna = await ubahUsernameDiri(
      permintaan.pengguna.id,
      usernameBaru,
    );

    kirimSukses(tanggapan, pengguna, 'Username berhasil diubah');
  },
);
