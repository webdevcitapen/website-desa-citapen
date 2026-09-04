/**
 * Repositori kategori produk: semua query ke tabel kategori_produk.
 * Query selalu memakai parameter untuk mencegah sql injection.
 */

import { kumpulanKoneksi } from '../config/database.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Bentuk baris kategori yang dikembalikan postgresql. */
interface BarisKategori {
  id: string;
  nama: string;
  pemilik_id: string;
  dibuat_pada: Date;
}

/** Data untuk membuat kategori baru. */
export interface DataBuatKategori {
  nama: string;
  pemilikId: number;
}

/** Mengubah baris kategori dari database menjadi bentuk umum. */
function ubahKeKategori(baris: BarisKategori): {
  id: number;
  nama: string;
  pemilikId: number;
  dibuatPada: Date;
} {
  return {
    id: Number(baris.id),
    nama: baris.nama,
    pemilikId: Number(baris.pemilik_id),
    dibuatPada: baris.dibuat_pada,
  };
}

/** Membuat kategori baru dan mengembalikan datanya. */
export async function buatKategori(
  data: DataBuatKategori,
): Promise<ReturnType<typeof ubahKeKategori>> {
  const hasil = await kumpulanKoneksi.query<BarisKategori>(
    `INSERT INTO kategori_produk (nama, pemilik_id)
     VALUES ($1, $2)
     RETURNING id, nama, pemilik_id, dibuat_pada`,
    [data.nama, data.pemilikId],
  );
  return ubahKeKategori(hasil.rows[0]);
}

/** Mencari kategori berdasarkan id. */
export async function temukanKategoriBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeKategori> | null> {
  const hasil = await kumpulanKoneksi.query<BarisKategori>(
    `SELECT id, nama, pemilik_id, dibuat_pada
       FROM kategori_produk
      WHERE id = $1
      LIMIT 1`,
    [id],
  );
  const baris = hasil.rows[0];
  return baris ? ubahKeKategori(baris) : null;
}

/** Mengambil seluruh daftar kategori (jumlah kategori umumnya kecil). */
export async function daftarKategori(): Promise<ReturnType<typeof ubahKeKategori>[]> {
  const hasil = await kumpulanKoneksi.query<BarisKategori>(
    `SELECT id, nama, pemilik_id, dibuat_pada
       FROM kategori_produk
      ORDER BY id DESC
      LIMIT 200`,
  );
  return hasil.rows.map(ubahKeKategori);
}

/** Menghapus kategori berdasarkan id (wajib memakai klausa where). */
export async function hapusKategori(id: number): Promise<void> {
  const hasil = await kumpulanKoneksi.query(
    `DELETE FROM kategori_produk
      WHERE id = $1`,
    [id],
  );
  if (!hasil.rowCount) {
    throw new KesalahanTidakDitemukan('Kategori tidak ditemukan');
  }
}
