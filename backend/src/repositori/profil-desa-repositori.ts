/**
 * Repositori profil desa: semua query ke tabel profil_desa.
 * Tabel ini hanya punya satu baris (singleton id=1) untuk
 * menyimpan letak geografis & wilayah desa Citapen.
 */

import { kumpulanKoneksi } from '../config/database.js';

/** Bentuk baris profil desa yang dikembalikan postgresql. */
interface BarisProfilDesa {
  id: number;
  luas_wilayah: string;
  batas_utara: string;
  batas_selatan: string;
  batas_barat: string;
  batas_timur: string;
  letak_geografis: string | null;
  deskripsi_wilayah: string | null;
  sejarah: string | null;
  visi: string | null;
  misi: string | null;
  diperbarui_pada: Date;
}

/** Data untuk memperbarui profil desa. */
export interface DataUbahProfilDesa {
  luasWilayah: string;
  batasUtara: string;
  batasSelatan: string;
  batasBarat: string;
  batasTimur: string;
  letakGeografis: string | null;
  deskripsiWilayah: string | null;
  sejarah: string | null;
  visi: string | null;
  misi: string | null;
}

/** Mengubah baris profil desa menjadi bentuk umum. */
function ubahKeProfilDesa(baris: BarisProfilDesa): {
  id: number;
  luasWilayah: string;
  batasUtara: string;
  batasSelatan: string;
  batasBarat: string;
  batasTimur: string;
  letakGeografis: string | null;
  deskripsiWilayah: string | null;
  sejarah: string | null;
  visi: string | null;
  misi: string | null;
  diperbaruiPada: Date;
} {
  return {
    id: Number(baris.id),
    luasWilayah: baris.luas_wilayah,
    batasUtara: baris.batas_utara,
    batasSelatan: baris.batas_selatan,
    batasBarat: baris.batas_barat,
    batasTimur: baris.batas_timur,
    letakGeografis: baris.letak_geografis,
    deskripsiWilayah: baris.deskripsi_wilayah,
    sejarah: baris.sejarah,
    visi: baris.visi,
    misi: baris.misi,
    diperbaruiPada: baris.diperbarui_pada,
  };
}

/** Mengambil profil desa (selalu id=1). */
export async function ambilProfilDesa(): Promise<
  ReturnType<typeof ubahKeProfilDesa> | null
> {
  const hasil = await kumpulanKoneksi.query<BarisProfilDesa>(
    `SELECT id, luas_wilayah, batas_utara, batas_selatan,
            batas_barat, batas_timur, letak_geografis,
            deskripsi_wilayah, sejarah, visi, misi, diperbarui_pada
       FROM profil_desa
      WHERE id = 1
      LIMIT 1`,
  );
  const baris = hasil.rows[0];
  return baris ? ubahKeProfilDesa(baris) : null;
}

/** Memperbarui profil desa (singleton). Membuat jika belum ada. */
export async function perbaruiProfilDesa(
  data: DataUbahProfilDesa,
): Promise<ReturnType<typeof ubahKeProfilDesa>> {
  const hasil = await kumpulanKoneksi.query<BarisProfilDesa>(
    `INSERT INTO profil_desa (
        id, luas_wilayah, batas_utara, batas_selatan,
        batas_barat, batas_timur, letak_geografis,
        deskripsi_wilayah, sejarah, visi, misi, diperbarui_pada
     ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     ON CONFLICT (id) DO UPDATE SET
        luas_wilayah = EXCLUDED.luas_wilayah,
        batas_utara = EXCLUDED.batas_utara,
        batas_selatan = EXCLUDED.batas_selatan,
        batas_barat = EXCLUDED.batas_barat,
        batas_timur = EXCLUDED.batas_timur,
        letak_geografis = EXCLUDED.letak_geografis,
        deskripsi_wilayah = EXCLUDED.deskripsi_wilayah,
        sejarah = EXCLUDED.sejarah,
        visi = EXCLUDED.visi,
        misi = EXCLUDED.misi,
        diperbarui_pada = NOW()
     RETURNING id, luas_wilayah, batas_utara, batas_selatan,
               batas_barat, batas_timur, letak_geografis,
               deskripsi_wilayah, sejarah, visi, misi, diperbarui_pada`,
    [
      data.luasWilayah,
      data.batasUtara,
      data.batasSelatan,
      data.batasBarat,
      data.batasTimur,
      data.letakGeografis,
      data.deskripsiWilayah,
      data.sejarah,
      data.visi,
      data.misi,
    ],
  );
  return ubahKeProfilDesa(hasil.rows[0]);
}

/** Memperbarui hanya kolom sejarah desa. */
export async function perbaruiSejarahDesa(
  sejarah: string,
): Promise<ReturnType<typeof ubahKeProfilDesa>> {
  const hasil = await kumpulanKoneksi.query<BarisProfilDesa>(
    `INSERT INTO profil_desa (id, luas_wilayah, batas_utara, batas_selatan, batas_barat, batas_timur, sejarah, diperbarui_pada)
     VALUES (1, '473,300 Ha', 'Desa Tundangan', 'Desa Pakembangan', 'Kecamatan Ciniru', 'Kecamatan Maleber', $1, NOW())
     ON CONFLICT (id) DO UPDATE SET
        sejarah = EXCLUDED.sejarah,
        diperbarui_pada = NOW()
     RETURNING id, luas_wilayah, batas_utara, batas_selatan,
               batas_barat, batas_timur, letak_geografis,
               deskripsi_wilayah, sejarah, visi, misi, diperbarui_pada`,
    [sejarah],
  );
  return ubahKeProfilDesa(hasil.rows[0]);
}

/** Memperbarui hanya kolom visi dan misi desa. */
export async function perbaruiVisiMisiDesa(
  visi: string,
  misi: string,
): Promise<ReturnType<typeof ubahKeProfilDesa>> {
  const hasil = await kumpulanKoneksi.query<BarisProfilDesa>(
    `INSERT INTO profil_desa (id, luas_wilayah, batas_utara, batas_selatan, batas_barat, batas_timur, visi, misi, diperbarui_pada)
     VALUES (1, '473,300 Ha', 'Desa Tundangan', 'Desa Pakembangan', 'Kecamatan Ciniru', 'Kecamatan Maleber', $1, $2, NOW())
     ON CONFLICT (id) DO UPDATE SET
        visi = EXCLUDED.visi,
        misi = EXCLUDED.misi,
        diperbarui_pada = NOW()
     RETURNING id, luas_wilayah, batas_utara, batas_selatan,
               batas_barat, batas_timur, letak_geografis,
               deskripsi_wilayah, sejarah, visi, misi, diperbarui_pada`,
    [visi, misi],
  );
  return ubahKeProfilDesa(hasil.rows[0]);
}
