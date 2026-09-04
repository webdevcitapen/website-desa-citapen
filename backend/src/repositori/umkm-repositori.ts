/**
 * Repositori UMKM: semua query ke tabel umkm.
 * UMKM dikelola penuh oleh admin desa; publik boleh melihat daftar.
 * Setiap UMKM memiliki nama, nomor hp, alamat yang terisi otomatis saat menambah produk.
 */

import { kumpulanKoneksi } from '../config/database.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Bentuk baris UMKM yang dikembalikan postgresql. */
interface BarisUmkm {
  id: string;
  nama: string;
  nomor_hp: string | null;
  alamat: string | null;
  deskripsi: string | null;
  foto: string | null;
  pemilik_id: string | null;
  dibuat_pada: Date;
  diperbarui_pada: Date;
}

/** Data untuk membuat atau memperbarui UMKM. */
export interface DataUmkmTersimpan {
  nama: string;
  nomorHp: string | null;
  alamat: string | null;
  deskripsi: string | null;
  foto: string | null;
  pemilikId: number | null;
}

/** Mengubah baris UMKM dari database menjadi bentuk umum. */
function ubahKeUmkm(baris: BarisUmkm): {
  id: number;
  nama: string;
  nomorHp: string | null;
  alamat: string | null;
  deskripsi: string | null;
  foto: string | null;
  pemilikId: number | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
} {
  return {
    id: Number(baris.id),
    nama: baris.nama,
    nomorHp: baris.nomor_hp,
    alamat: baris.alamat,
    deskripsi: baris.deskripsi,
    foto: baris.foto,
    pemilikId: baris.pemilik_id ? Number(baris.pemilik_id) : null,
    dibuatPada: baris.dibuat_pada,
    diperbaruiPada: baris.diperbarui_pada,
  };
}

/** Membuat UMKM baru dan mengembalikan datanya. */
export async function buatUmkm(
  data: DataUmkmTersimpan,
): Promise<ReturnType<typeof ubahKeUmkm>> {
  const hasil = await kumpulanKoneksi.query<BarisUmkm>(
    `INSERT INTO umkm (nama, nomor_hp, alamat, deskripsi, foto, pemilik_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nama, nomor_hp, alamat, deskripsi, foto, pemilik_id, dibuat_pada, diperbarui_pada`,
    [data.nama, data.nomorHp, data.alamat, data.deskripsi, data.foto, data.pemilikId],
  );
  return ubahKeUmkm(hasil.rows[0]);
}

/** Mencari UMKM berdasarkan id. */
export async function temukanUmkmBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeUmkm> | null> {
  const hasil = await kumpulanKoneksi.query<BarisUmkm>(
    `SELECT id, nama, nomor_hp, alamat, deskripsi, foto, pemilik_id, dibuat_pada, diperbarui_pada
       FROM umkm
      WHERE id = $1
      LIMIT 1`,
    [id],
  );
  const baris = hasil.rows[0];
  return baris ? ubahKeUmkm(baris) : null;
}

/** Mencari UMKM berdasarkan nama (untuk cek duplikat). */
export async function temukanUmkmBerdasarkanNama(
  nama: string,
): Promise<ReturnType<typeof ubahKeUmkm> | null> {
  const hasil = await kumpulanKoneksi.query<BarisUmkm>(
    `SELECT id, nama, nomor_hp, alamat, deskripsi, foto, pemilik_id, dibuat_pada, diperbarui_pada
       FROM umkm
      WHERE LOWER(nama) = LOWER($1)
      LIMIT 1`,
    [nama],
  );
  const baris = hasil.rows[0];
  return baris ? ubahKeUmkm(baris) : null;
}

/** Mengambil seluruh daftar UMKM, diurutkan terbaru dulu. */
export async function daftarUmkm(): Promise<ReturnType<typeof ubahKeUmkm>[]> {
  const hasil = await kumpulanKoneksi.query<BarisUmkm>(
    `SELECT id, nama, nomor_hp, alamat, deskripsi, foto, pemilik_id, dibuat_pada, diperbarui_pada
       FROM umkm
      ORDER BY dibuat_pada DESC, id DESC`,
  );
  return hasil.rows.map(ubahKeUmkm);
}

/** Memperbarui UMKM dan mengembalikan data terbarunya. */
export async function perbaruiUmkm(
  id: number,
  data: Partial<DataUmkmTersimpan>,
): Promise<ReturnType<typeof ubahKeUmkm>> {
  const umkm = await temukanUmkmBerdasarkanId(id);
  if (!umkm) {
    throw new KesalahanTidakDitemukan('UMKM tidak ditemukan');
  }

  const hasil = await kumpulanKoneksi.query<BarisUmkm>(
    `UPDATE umkm
        SET nama = COALESCE($2, nama),
            nomor_hp = $3,
            alamat = $4,
            deskripsi = $5,
            foto = COALESCE($6, foto),
            diperbarui_pada = NOW()
      WHERE id = $1
      RETURNING id, nama, nomor_hp, alamat, deskripsi, foto, pemilik_id, dibuat_pada, diperbarui_pada`,
    [
      id,
      data.nama ?? null,
      data.nomorHp ?? null,
      data.alamat ?? null,
      data.deskripsi ?? null,
      data.foto ?? null,
    ],
  );

  // Karena COALESCE untuk nama/foto mempertahankan nilai lama jika null,
  // kita perlu penanganan khusus jika ingin menghapus; namun nama tidak boleh null.
  // Jika nama disediakan, paksa update nama.
  if (data.nama && hasil.rows[0].nama !== data.nama) {
    const hasil2 = await kumpulanKoneksi.query<BarisUmkm>(
      `UPDATE umkm SET nama = $2, diperbarui_pada = NOW() WHERE id = $1
       RETURNING id, nama, nomor_hp, alamat, deskripsi, foto, pemilik_id, dibuat_pada, diperbarui_pada`,
      [id, data.nama],
    );
    return ubahKeUmkm(hasil2.rows[0]);
  }

  // Untuk memastikan data nomor_hp/alamat terupdate meski null (menghapus), lakukan select ulang
  const terbaru = await temukanUmkmBerdasarkanId(id);
  if (!terbaru) {
    throw new KesalahanTidakDitemukan('UMKM tidak ditemukan');
  }
  return terbaru;
}

/** Menghapus UMKM berdasarkan id (wajib memakai klausa where). */
export async function hapusUmkm(id: number): Promise<void> {
  const hasil = await kumpulanKoneksi.query(
    `DELETE FROM umkm
      WHERE id = $1`,
    [id],
  );
  if (!hasil.rowCount) {
    throw new KesalahanTidakDitemukan('UMKM tidak ditemukan');
  }
}

/** Menghitung jumlah UMKM. */
export async function hitungUmkm(): Promise<number> {
  const hasil = await kumpulanKoneksi.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM umkm`,
  );
  return hasil.rows[0]?.total ?? 0;
}
