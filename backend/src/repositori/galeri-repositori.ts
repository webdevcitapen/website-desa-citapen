/**
 * Repositori galeri desa: semua query ke tabel galeri_desa.
 * Galeri ditampilkan di halaman profil desa dan dikelola admin desa.
 */

import { kumpulanKoneksi } from '../config/database.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Bentuk baris galeri yang dikembalikan postgresql. */
interface BarisGaleri {
  id: string;
  judul: string | null;
  keterangan: string | null;
  foto: string;
  urutan: number;
  dibuat_pada: Date;
  diperbarui_pada: Date;
}

/** Data untuk membuat atau memperbarui galeri. */
export interface DataGaleriTersimpan {
  judul: string | null;
  keterangan: string | null;
  foto: string;
  urutan: number;
}

/** Mengubah baris galeri dari database menjadi bentuk umum. */
function ubahKeGaleri(baris: BarisGaleri): {
  id: number;
  judul: string | null;
  keterangan: string | null;
  foto: string;
  urutan: number;
  dibuatPada: Date;
  diperbaruiPada: Date;
} {
  return {
    id: Number(baris.id),
    judul: baris.judul,
    keterangan: baris.keterangan,
    foto: baris.foto,
    urutan: Number(baris.urutan),
    dibuatPada: baris.dibuat_pada,
    diperbaruiPada: baris.diperbarui_pada,
  };
}

/** Membuat item galeri baru dan mengembalikan datanya. */
export async function buatGaleri(
  data: DataGaleriTersimpan,
): Promise<ReturnType<typeof ubahKeGaleri>> {
  const hasil = await kumpulanKoneksi.query<BarisGaleri>(
    `INSERT INTO galeri_desa (judul, keterangan, foto, urutan)
     VALUES ($1, $2, $3, $4)
     RETURNING id, judul, keterangan, foto, urutan, dibuat_pada, diperbarui_pada`,
    [data.judul, data.keterangan, data.foto, data.urutan],
  );
  return ubahKeGaleri(hasil.rows[0]);
}

/** Mencari galeri berdasarkan id. */
export async function temukanGaleriBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeGaleri> | null> {
  const hasil = await kumpulanKoneksi.query<BarisGaleri>(
    `SELECT id, judul, keterangan, foto, urutan, dibuat_pada, diperbarui_pada
       FROM galeri_desa
      WHERE id = $1
      LIMIT 1`,
    [id],
  );
  const baris = hasil.rows[0];
  return baris ? ubahKeGaleri(baris) : null;
}

/** Mengambil seluruh daftar galeri, diurutkan berurutan lalu terbaru. */
export async function daftarGaleri(): Promise<ReturnType<typeof ubahKeGaleri>[]> {
  const hasil = await kumpulanKoneksi.query<BarisGaleri>(
    `SELECT id, judul, keterangan, foto, urutan, dibuat_pada, diperbarui_pada
       FROM galeri_desa
      ORDER BY urutan ASC, dibuat_pada DESC`,
  );
  return hasil.rows.map(ubahKeGaleri);
}

/** Menghapus galeri berdasarkan id (wajib memakai klausa where). */
export async function hapusGaleri(id: number): Promise<void> {
  const hasil = await kumpulanKoneksi.query(
    `DELETE FROM galeri_desa
      WHERE id = $1`,
    [id],
  );
  if (!hasil.rowCount) {
    throw new KesalahanTidakDitemukan('Galeri tidak ditemukan');
  }
}

/** Memperbarui galeri. */
export async function perbaruiGaleri(
  id: number,
  data: Partial<DataGaleriTersimpan>,
): Promise<ReturnType<typeof ubahKeGaleri>> {
  const galeri = await temukanGaleriBerdasarkanId(id);
  if (!galeri) {
    throw new KesalahanTidakDitemukan('Galeri tidak ditemukan');
  }

  await kumpulanKoneksi.query<BarisGaleri>(
    `UPDATE galeri_desa
        SET judul = $2,
            keterangan = $3,
            foto = COALESCE($4, foto),
            urutan = COALESCE($5, urutan),
            diperbarui_pada = NOW()
      WHERE id = $1
      RETURNING id, judul, keterangan, foto, urutan, dibuat_pada, diperbarui_pada`,
    [id, data.judul ?? null, data.keterangan ?? null, data.foto ?? null, data.urutan ?? null],
  );

  const terbaru = await temukanGaleriBerdasarkanId(id);
  if (!terbaru) {
    throw new KesalahanTidakDitemukan('Galeri tidak ditemukan');
  }

  return terbaru;
}
