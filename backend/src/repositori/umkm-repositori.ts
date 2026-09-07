/**
 * Repositori UMKM: semua query ke tabel umkm.
 * Migrasi ke Drizzle ORM.
 */

import { eq, desc, count, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { umkm } from '../db/schema.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Data untuk membuat atau memperbarui UMKM. */
export interface DataUmkmTersimpan {
  nama: string;
  nomorHp: string | null;
  alamat: string | null;
  deskripsi: string | null;
  foto: string | null;
  pemilikId: number | null;
}

/** Mengubah baris menjadi bentuk umum. */
function ubahKeUmkm(baris: typeof umkm.$inferSelect): {
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
    id: baris.id,
    nama: baris.nama,
    nomorHp: baris.nomorHp,
    alamat: baris.alamat,
    deskripsi: baris.deskripsi,
    foto: baris.foto,
    pemilikId: baris.pemilikId,
    dibuatPada: baris.dibuatPada,
    diperbaruiPada: baris.diperbaruiPada,
  };
}

/** Membuat UMKM baru dan mengembalikan datanya. */
export async function buatUmkm(
  data: DataUmkmTersimpan,
): Promise<ReturnType<typeof ubahKeUmkm>> {
  const hasil = await db
    .insert(umkm)
    .values({
      nama: data.nama,
      nomorHp: data.nomorHp,
      alamat: data.alamat,
      deskripsi: data.deskripsi,
      foto: data.foto,
      pemilikId: data.pemilikId,
    })
    .returning();
  return ubahKeUmkm(hasil[0]);
}

/** Mencari UMKM berdasarkan id. */
export async function temukanUmkmBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeUmkm> | null> {
  const baris = await db.select().from(umkm).where(eq(umkm.id, id)).limit(1);
  return baris[0] ? ubahKeUmkm(baris[0]) : null;
}

/** Mencari UMKM berdasarkan nama (untuk cek duplikat). */
export async function temukanUmkmBerdasarkanNama(
  nama: string,
): Promise<ReturnType<typeof ubahKeUmkm> | null> {
  // drizzle lower: sql`lower(nama) = lower($1)`
  const baris = await db
    .select()
    .from(umkm)
    .where(sql`lower(${umkm.nama}) = lower(${nama})`)
    .limit(1);
  return baris[0] ? ubahKeUmkm(baris[0]) : null;
}

/** Mengambil seluruh daftar UMKM, diurutkan terbaru dulu. */
export async function daftarUmkm(): Promise<ReturnType<typeof ubahKeUmkm>[]> {
  const baris = await db.select().from(umkm).orderBy(desc(umkm.dibuatPada), desc(umkm.id));
  return baris.map(ubahKeUmkm);
}

/** Memperbarui UMKM dan mengembalikan data terbarunya. */
export async function perbaruiUmkm(
  id: number,
  data: Partial<DataUmkmTersimpan>,
): Promise<ReturnType<typeof ubahKeUmkm>> {
  const umkmLama = await temukanUmkmBerdasarkanId(id);
  if (!umkmLama) throw new KesalahanTidakDitemukan('UMKM tidak ditemukan');

  await db
    .update(umkm)
    .set({
      nama: data.nama ?? umkmLama.nama,
      nomorHp: data.nomorHp ?? null,
      alamat: data.alamat ?? null,
      deskripsi: data.deskripsi ?? null,
      foto: data.foto ?? umkmLama.foto,
      diperbaruiPada: new Date(),
    })
    .where(eq(umkm.id, id))
    .returning();

  // Jika nama berubah, drizzle sudah mengurusnya; tapi untuk konsistensi, ambil ulang
  const terbaru = await temukanUmkmBerdasarkanId(id);
  if (!terbaru) throw new KesalahanTidakDitemukan('UMKM tidak ditemukan');
  return terbaru;
}

/** Menghapus UMKM berdasarkan id. */
export async function hapusUmkm(id: number): Promise<void> {
  const hasil = await db.delete(umkm).where(eq(umkm.id, id)).returning({ id: umkm.id });
  if (hasil.length === 0) throw new KesalahanTidakDitemukan('UMKM tidak ditemukan');
}

/** Menghitung jumlah UMKM. */
export async function hitungUmkm(): Promise<number> {
  const hasil = await db.select({ total: count() }).from(umkm);
  return hasil[0]?.total ?? 0;
}
