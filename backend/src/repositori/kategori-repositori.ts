/**
 * Repositori kategori produk: semua query ke tabel kategori_produk.
 * Migrasi ke Drizzle ORM.
 */

import { eq, desc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { kategoriProduk } from '../db/schema.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Data untuk membuat kategori baru. */
export interface DataBuatKategori {
  nama: string;
  pemilikId: number;
}

/** Mengubah baris drizzle menjadi bentuk umum. */
function ubahKeKategori(baris: typeof kategoriProduk.$inferSelect): {
  id: number;
  nama: string;
  pemilikId: number;
  dibuatPada: Date;
} {
  return {
    id: baris.id,
    nama: baris.nama,
    pemilikId: baris.pemilikId,
    dibuatPada: baris.dibuatPada,
  };
}

/** Membuat kategori baru dan mengembalikan datanya. */
export async function buatKategori(
  data: DataBuatKategori,
): Promise<ReturnType<typeof ubahKeKategori>> {
  const hasil = await db
    .insert(kategoriProduk)
    .values({ nama: data.nama, pemilikId: data.pemilikId })
    .returning();
  return ubahKeKategori(hasil[0]);
}

/** Mencari kategori berdasarkan id. */
export async function temukanKategoriBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeKategori> | null> {
  const baris = await db
    .select()
    .from(kategoriProduk)
    .where(eq(kategoriProduk.id, id))
    .limit(1);
  return baris[0] ? ubahKeKategori(baris[0]) : null;
}

/** Mengambil seluruh daftar kategori (jumlah kategori umumnya kecil). */
export async function daftarKategori(): Promise<ReturnType<typeof ubahKeKategori>[]> {
  const baris = await db
    .select()
    .from(kategoriProduk)
    .orderBy(desc(kategoriProduk.id))
    .limit(200);
  return baris.map(ubahKeKategori);
}

/** Menghapus kategori berdasarkan id (wajib memakai klausa where). */
export async function hapusKategori(id: number): Promise<void> {
  const hasil = await db
    .delete(kategoriProduk)
    .where(eq(kategoriProduk.id, id))
    .returning({ id: kategoriProduk.id });
  if (hasil.length === 0) {
    throw new KesalahanTidakDitemukan('Kategori tidak ditemukan');
  }
}
