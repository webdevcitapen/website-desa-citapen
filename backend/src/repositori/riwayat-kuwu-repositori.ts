/**
 * Repositori riwayat kepala desa (kuwu).
 * Menyimpan daftar kuwu dari masa ke masa secara berurutan.
 */

import { kumpulanKoneksi } from '../config/database.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Bentuk baris riwayat kuwu dari postgresql. */
interface BarisRiwayat {
  id: string;
  nama: string;
  masa_jabatan: string;
  urutan: number;
  keterangan: string | null;
  dibuat_pada: Date;
  diperbarui_pada: Date;
}

/** Data untuk membuat riwayat kuwu baru. */
export interface DataBuatRiwayat {
  nama: string;
  masaJabatan: string;
  urutan: number;
  keterangan?: string | null;
}

/** Mengubah baris menjadi bentuk umum. */
function ubahKeRiwayat(baris: BarisRiwayat): {
  id: number;
  nama: string;
  masaJabatan: string;
  urutan: number;
  keterangan: string | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
} {
  return {
    id: Number(baris.id),
    nama: baris.nama,
    masaJabatan: baris.masa_jabatan,
    urutan: Number(baris.urutan),
    keterangan: baris.keterangan,
    dibuatPada: baris.dibuat_pada,
    diperbaruiPada: baris.diperbarui_pada,
  };
}

/** Membuat riwayat kuwu baru. */
export async function buatRiwayat(
  data: DataBuatRiwayat,
): Promise<ReturnType<typeof ubahKeRiwayat>> {
  const hasil = await kumpulanKoneksi.query<BarisRiwayat>(
    `INSERT INTO riwayat_kuwu (nama, masa_jabatan, urutan, keterangan)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nama, masa_jabatan, urutan, keterangan, dibuat_pada, diperbarui_pada`,
    [data.nama, data.masaJabatan, data.urutan, data.keterangan ?? null],
  );
  return ubahKeRiwayat(hasil.rows[0]);
}

/** Mengambil semua riwayat kuwu terurut. */
export async function daftarRiwayat(): Promise<
  ReturnType<typeof ubahKeRiwayat>[]
> {
  const hasil = await kumpulanKoneksi.query<BarisRiwayat>(
    `SELECT id, nama, masa_jabatan, urutan, keterangan, dibuat_pada, diperbarui_pada
       FROM riwayat_kuwu
      ORDER BY urutan ASC, id ASC`,
  );
  return hasil.rows.map(ubahKeRiwayat);
}

/** Mencari riwayat berdasarkan id. */
export async function temukanRiwayatBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeRiwayat> | null> {
  const hasil = await kumpulanKoneksi.query<BarisRiwayat>(
    `SELECT id, nama, masa_jabatan, urutan, keterangan, dibuat_pada, diperbarui_pada
       FROM riwayat_kuwu
      WHERE id = $1
      LIMIT 1`,
    [id],
  );
  const baris = hasil.rows[0];
  return baris ? ubahKeRiwayat(baris) : null;
}

/** Memperbarui riwayat kuwu. */
export async function perbaruiRiwayat(
  id: number,
  data: Partial<DataBuatRiwayat>,
): Promise<ReturnType<typeof ubahKeRiwayat>> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.nama !== undefined) {
    fields.push(`nama = $${idx++}`);
    values.push(data.nama);
  }
  if (data.masaJabatan !== undefined) {
    fields.push(`masa_jabatan = $${idx++}`);
    values.push(data.masaJabatan);
  }
  if (data.urutan !== undefined) {
    fields.push(`urutan = $${idx++}`);
    values.push(data.urutan);
  }
  if (data.keterangan !== undefined) {
    fields.push(`keterangan = $${idx++}`);
    values.push(data.keterangan);
  }
  fields.push(`diperbarui_pada = NOW()`);

  values.push(id);
  const hasil = await kumpulanKoneksi.query<BarisRiwayat>(
    `UPDATE riwayat_kuwu
        SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, nama, masa_jabatan, urutan, keterangan, dibuat_pada, diperbarui_pada`,
    values,
  );
  if (!hasil.rows[0]) {
    throw new KesalahanTidakDitemukan('Riwayat kuwu tidak ditemukan');
  }
  return ubahKeRiwayat(hasil.rows[0]);
}

/** Menghapus riwayat kuwu. */
export async function hapusRiwayat(id: number): Promise<void> {
  const hasil = await kumpulanKoneksi.query(
    `DELETE FROM riwayat_kuwu
      WHERE id = $1`,
    [id],
  );
  if (!hasil.rowCount) {
    throw new KesalahanTidakDitemukan('Riwayat kuwu tidak ditemukan');
  }
}
