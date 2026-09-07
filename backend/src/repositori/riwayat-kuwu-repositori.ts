/**
 * Repositori riwayat kepala desa (kuwu).
 * Migrasi ke Drizzle ORM.
 */

import { eq, asc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { riwayatKuwu } from '../db/schema.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Data untuk membuat riwayat kuwu baru. */
export interface DataBuatRiwayat {
  nama: string;
  masaJabatan: string;
  urutan: number;
  keterangan?: string | null;
}

/** Mengubah baris menjadi bentuk umum. */
function ubahKeRiwayat(baris: typeof riwayatKuwu.$inferSelect): {
  id: number;
  nama: string;
  masaJabatan: string;
  urutan: number;
  keterangan: string | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
} {
  return {
    id: baris.id,
    nama: baris.nama,
    masaJabatan: baris.masaJabatan,
    urutan: baris.urutan,
    keterangan: baris.keterangan,
    dibuatPada: baris.dibuatPada,
    diperbaruiPada: baris.diperbaruiPada,
  };
}

/** Membuat riwayat kuwu baru. */
export async function buatRiwayat(
  data: DataBuatRiwayat,
): Promise<ReturnType<typeof ubahKeRiwayat>> {
  const hasil = await db
    .insert(riwayatKuwu)
    .values({
      nama: data.nama,
      masaJabatan: data.masaJabatan,
      urutan: data.urutan,
      keterangan: data.keterangan ?? null,
    })
    .returning();
  return ubahKeRiwayat(hasil[0]);
}

/** Mengambil semua riwayat kuwu terurut. */
export async function daftarRiwayat(): Promise<ReturnType<typeof ubahKeRiwayat>[]> {
  const baris = await db
    .select()
    .from(riwayatKuwu)
    .orderBy(asc(riwayatKuwu.urutan), asc(riwayatKuwu.id));
  return baris.map(ubahKeRiwayat);
}

/** Mencari riwayat berdasarkan id. */
export async function temukanRiwayatBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeRiwayat> | null> {
  const baris = await db.select().from(riwayatKuwu).where(eq(riwayatKuwu.id, id)).limit(1);
  return baris[0] ? ubahKeRiwayat(baris[0]) : null;
}

/** Memperbarui riwayat kuwu. */
export async function perbaruiRiwayat(
  id: number,
  data: Partial<DataBuatRiwayat>,
): Promise<ReturnType<typeof ubahKeRiwayat>> {
  const setData: Record<string, unknown> = { diperbaruiPada: new Date() };
  if (data.nama !== undefined) setData['nama'] = data.nama;
  if (data.masaJabatan !== undefined) setData['masaJabatan'] = data.masaJabatan;
  if (data.urutan !== undefined) setData['urutan'] = data.urutan;
  if (data.keterangan !== undefined) setData['keterangan'] = data.keterangan;

  const hasil = await db
    .update(riwayatKuwu)
    .set(setData as never)
    .where(eq(riwayatKuwu.id, id))
    .returning();

  if (!hasil[0]) throw new KesalahanTidakDitemukan('Riwayat kuwu tidak ditemukan');
  return ubahKeRiwayat(hasil[0]);
}

/** Menghapus riwayat kuwu. */
export async function hapusRiwayat(id: number): Promise<void> {
  const hasil = await db.delete(riwayatKuwu).where(eq(riwayatKuwu.id, id)).returning({ id: riwayatKuwu.id });
  if (hasil.length === 0) throw new KesalahanTidakDitemukan('Riwayat kuwu tidak ditemukan');
}
