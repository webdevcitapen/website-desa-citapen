/**
 * Repositori galeri desa: semua query ke tabel galeri_desa.
 * Migrasi ke Drizzle ORM.
 */

import { eq, asc, desc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { galeriDesa } from '../db/schema.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Data untuk membuat atau memperbarui galeri. */
export interface DataGaleriTersimpan {
  judul: string | null;
  keterangan: string | null;
  foto: string;
  urutan: number;
}

/** Mengubah baris menjadi bentuk umum. */
function ubahKeGaleri(baris: typeof galeriDesa.$inferSelect): {
  id: number;
  judul: string | null;
  keterangan: string | null;
  foto: string;
  urutan: number;
  dibuatPada: Date;
  diperbaruiPada: Date;
} {
  return {
    id: baris.id,
    judul: baris.judul,
    keterangan: baris.keterangan,
    foto: baris.foto,
    urutan: baris.urutan,
    dibuatPada: baris.dibuatPada,
    diperbaruiPada: baris.diperbaruiPada,
  };
}

/** Membuat item galeri baru dan mengembalikan datanya. */
export async function buatGaleri(
  data: DataGaleriTersimpan,
): Promise<ReturnType<typeof ubahKeGaleri>> {
  const hasil = await db
    .insert(galeriDesa)
    .values({
      judul: data.judul,
      keterangan: data.keterangan,
      foto: data.foto,
      urutan: data.urutan,
    })
    .returning();
  return ubahKeGaleri(hasil[0]);
}

/** Mencari galeri berdasarkan id. */
export async function temukanGaleriBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeGaleri> | null> {
  const baris = await db.select().from(galeriDesa).where(eq(galeriDesa.id, id)).limit(1);
  return baris[0] ? ubahKeGaleri(baris[0]) : null;
}

/** Mengambil seluruh daftar galeri, diurutkan berurutan lalu terbaru. */
export async function daftarGaleri(): Promise<ReturnType<typeof ubahKeGaleri>[]> {
  const baris = await db
    .select()
    .from(galeriDesa)
    .orderBy(asc(galeriDesa.urutan), desc(galeriDesa.dibuatPada));
  return baris.map(ubahKeGaleri);
}

/** Menghapus galeri berdasarkan id. */
export async function hapusGaleri(id: number): Promise<void> {
  const hasil = await db.delete(galeriDesa).where(eq(galeriDesa.id, id)).returning({ id: galeriDesa.id });
  if (hasil.length === 0) throw new KesalahanTidakDitemukan('Galeri tidak ditemukan');
}

/** Memperbarui galeri. */
export async function perbaruiGaleri(
  id: number,
  data: Partial<DataGaleriTersimpan>,
): Promise<ReturnType<typeof ubahKeGaleri>> {
  const galeri = await temukanGaleriBerdasarkanId(id);
  if (!galeri) throw new KesalahanTidakDitemukan('Galeri tidak ditemukan');

  const hasil = await db
    .update(galeriDesa)
    .set({
      judul: data.judul ?? galeri.judul,
      keterangan: data.keterangan ?? galeri.keterangan,
      foto: data.foto ?? galeri.foto,
      urutan: data.urutan ?? galeri.urutan,
      diperbaruiPada: new Date(),
    })
    .where(eq(galeriDesa.id, id))
    .returning();

  const terbaru = hasil[0] ? ubahKeGaleri(hasil[0]) : await temukanGaleriBerdasarkanId(id);
  if (!terbaru) throw new KesalahanTidakDitemukan('Galeri tidak ditemukan');
  return terbaru;
}
