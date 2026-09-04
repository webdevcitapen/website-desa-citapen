/**
 * Repositori struktur organisasi desa.
 * Menyimpan daftar perangkat desa (Kepala Desa, Sekdes, Kasi, Kaur, Kadus).
 */

import { kumpulanKoneksi } from '../config/database.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Bentuk baris struktur organisasi dari postgresql. */
interface BarisStruktur {
  id: string;
  nama: string;
  jabatan: string;
  urutan: number;
  foto: string | null;
  dibuat_pada: Date;
  diperbarui_pada: Date;
}

/** Data untuk membuat struktur organisasi baru. */
export interface DataBuatStruktur {
  nama: string;
  jabatan: string;
  urutan: number;
  foto?: string | null;
}

/** Mengubah baris menjadi bentuk umum. */
function ubahKeStruktur(baris: BarisStruktur): {
  id: number;
  nama: string;
  jabatan: string;
  urutan: number;
  foto: string | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
} {
  return {
    id: Number(baris.id),
    nama: baris.nama,
    jabatan: baris.jabatan,
    urutan: Number(baris.urutan),
    foto: baris.foto,
    dibuatPada: baris.dibuat_pada,
    diperbaruiPada: baris.diperbarui_pada,
  };
}

/** Membuat anggota struktur baru. */
export async function buatStruktur(
  data: DataBuatStruktur,
): Promise<ReturnType<typeof ubahKeStruktur>> {
  const hasil = await kumpulanKoneksi.query<BarisStruktur>(
    `INSERT INTO struktur_organisasi (nama, jabatan, urutan, foto)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nama, jabatan, urutan, foto, dibuat_pada, diperbarui_pada`,
    [data.nama, data.jabatan, data.urutan, data.foto ?? null],
  );
  return ubahKeStruktur(hasil.rows[0]);
}

/** Mengambil semua anggota struktur terurut. */
export async function daftarStruktur(): Promise<
  ReturnType<typeof ubahKeStruktur>[]
> {
  const hasil = await kumpulanKoneksi.query<BarisStruktur>(
    `SELECT id, nama, jabatan, urutan, foto, dibuat_pada, diperbarui_pada
       FROM struktur_organisasi
      ORDER BY urutan ASC, id ASC`,
  );
  return hasil.rows.map(ubahKeStruktur);
}

/** Mencari struktur berdasarkan id. */
export async function temukanStrukturBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeStruktur> | null> {
  const hasil = await kumpulanKoneksi.query<BarisStruktur>(
    `SELECT id, nama, jabatan, urutan, foto, dibuat_pada, diperbarui_pada
       FROM struktur_organisasi
      WHERE id = $1
      LIMIT 1`,
    [id],
  );
  const baris = hasil.rows[0];
  return baris ? ubahKeStruktur(baris) : null;
}

/** Memperbarui struktur organisasi. */
export async function perbaruiStruktur(
  id: number,
  data: Partial<DataBuatStruktur>,
): Promise<ReturnType<typeof ubahKeStruktur>> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.nama !== undefined) {
    fields.push(`nama = $${idx++}`);
    values.push(data.nama);
  }
  if (data.jabatan !== undefined) {
    fields.push(`jabatan = $${idx++}`);
    values.push(data.jabatan);
  }
  if (data.urutan !== undefined) {
    fields.push(`urutan = $${idx++}`);
    values.push(data.urutan);
  }
  if (data.foto !== undefined) {
    fields.push(`foto = $${idx++}`);
    values.push(data.foto);
  }
  fields.push(`diperbarui_pada = NOW()`);

  values.push(id);
  const hasil = await kumpulanKoneksi.query<BarisStruktur>(
    `UPDATE struktur_organisasi
        SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, nama, jabatan, urutan, foto, dibuat_pada, diperbarui_pada`,
    values,
  );
  if (!hasil.rows[0]) {
    throw new KesalahanTidakDitemukan('Struktur organisasi tidak ditemukan');
  }
  return ubahKeStruktur(hasil.rows[0]);
}

/** Menghapus struktur organisasi. */
export async function hapusStruktur(id: number): Promise<void> {
  const hasil = await kumpulanKoneksi.query(
    `DELETE FROM struktur_organisasi
      WHERE id = $1`,
    [id],
  );
  if (!hasil.rowCount) {
    throw new KesalahanTidakDitemukan('Struktur organisasi tidak ditemukan');
  }
}
