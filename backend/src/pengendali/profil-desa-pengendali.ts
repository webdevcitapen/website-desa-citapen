/**
 * Pengendali profil desa: letak geografis & wilayah.
 * Publik boleh membaca, hanya admin desa yang boleh mengubah.
 */

import type { NextFunction, Request, Response } from 'express';
import { bungkusHandler } from '../middleware/penangan-kesalahan.js';
import { kirimSukses } from '../utils/respons.js';
import { tambahHeaderGuard } from '../utils/guard-form.js';
import {
  ambilProfilDesa,
  ubahProfilDesa,
  ubahSejarahDesa,
  ubahVisiMisiDesa,
} from '../layanan/profil-desa-layanan.js';

/** Menangani permintaan ambil profil desa untuk publik. */
export const dapatkanProfilDesa = bungkusHandler(
  async (_permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const profil = await ambilProfilDesa();
    tambahHeaderGuard(tanggapan, profil);
    kirimSukses(tanggapan, profil, 'Profil desa berhasil diambil');
  },
);

/** Menangani permintaan ubah profil desa oleh admin desa. */
export const perbaruiProfilDesa = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const data = permintaan.body as {
      luasWilayah: string;
      batasUtara: string;
      batasSelatan: string;
      batasBarat: string;
      batasTimur: string;
      letakGeografis?: string | null;
      deskripsiWilayah?: string | null;
      sejarah?: string | null;
      visi?: string | null;
      misi?: string | null;
    };

    const profil = await ubahProfilDesa({
      luasWilayah: data.luasWilayah,
      batasUtara: data.batasUtara,
      batasSelatan: data.batasSelatan,
      batasBarat: data.batasBarat,
      batasTimur: data.batasTimur,
      letakGeografis: data.letakGeografis ?? null,
      deskripsiWilayah: data.deskripsiWilayah ?? null,
      sejarah: data.sejarah !== undefined ? data.sejarah : undefined,
      visi: data.visi !== undefined ? data.visi : undefined,
      misi: data.misi !== undefined ? data.misi : undefined,
    });

    kirimSukses(tanggapan, profil, 'Profil desa berhasil diperbarui');
  },
);

/** Menangani permintaan ubah sejarah desa oleh admin desa. */
export const perbaruiSejarah = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const data = permintaan.body as { sejarah: string };
    const profil = await ubahSejarahDesa(data.sejarah);
    kirimSukses(tanggapan, profil, 'Sejarah desa berhasil diperbarui');
  },
);

/** Menangani permintaan ubah visi misi desa oleh admin desa. */
export const perbaruiVisiMisi = bungkusHandler(
  async (permintaan: Request, tanggapan: Response, _berikutnya: NextFunction) => {
    const data = permintaan.body as { visi: string; misi: string };
    const profil = await ubahVisiMisiDesa(data.visi, data.misi);
    kirimSukses(tanggapan, profil, 'Visi misi desa berhasil diperbarui');
  },
);
