/**
 * Repositori struktur organisasi desa.
 * Migrasi ke Drizzle ORM.
 */

import { eq, asc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { strukturOrganisasi } from '../db/schema.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Data untuk membuat struktur organisasi baru. */
export interface DataBuatStruktur {
  nama: string;
  jabatan: string;
  urutan: number;
  foto?: string | null;
}

/** Mengubah baris menjadi bentuk umum. */
function ubahKeStruktur(baris: typeof strukturOrganisasi.$inferSelect): {
  id: number;
  nama: string;
  jabatan: string;
  urutan: number;
  foto: string | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
} {
  return {
    id: baris.id,
    nama: baris.nama,
    jabatan: baris.jabatan,
    urutan: baris.urutan,
    foto: baris.foto,
    dibuatPada: baris.dibuatPada,
    diperbaruiPada: baris.diperbaruiPada,
  };
}

/** Membuat anggota struktur baru. */
export async function buatStruktur(
  data: DataBuatStruktur,
): Promise<ReturnType<typeof ubahKeStruktur>> {
  const hasil = await db
    .insert(strukturOrganisasi)
    .values({
      nama: data.nama,
      jabatan: data.jabatan,
      urutan: data.urutan,
      foto: data.foto ?? null,
    })
    .returning();
  return ubahKeStruktur(hasil[0]);
}

/** Mengambil semua anggota struktur terurut. */
export async function daftarStruktur(): Promise<ReturnType<typeof ubahKeStruktur>[]> {
  const baris = await db
    .select()
    .from(strukturOrganisasi)
    .orderBy(asc(strukturOrganisasi.urutan), asc(strukturOrganisasi.id));
  return baris.map(ubahKeStruktur);
}

/** Mencari struktur berdasarkan id. */
export async function temukanStrukturBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeStruktur> | null> {
  const baris = await db
    .select()
    .from(strukturOrganisasi)
    .where(eq(strukturOrganisasi.id, id))
    .limit(1);
  return baris[0] ? ubahKeStruktur(baris[0]) : null;
}

/** Memperbarui struktur organisasi. */
export async function perbaruiStruktur(
  id: number,
  data: Partial<DataBuatStruktur>,
): Promise<ReturnType<typeof ubahKeStruktur>> {
  const setData: Record<string, unknown> = { diperbaruiPada: new Date() };
  if (data.nama !== undefined) setData['nama'] = data.nama;
  if (data.jabatan !== undefined) setData['jabatan'] = data.jabatan;
  if (data.urutan !== undefined) setData['urutan'] = data.urutan;
  if (data.foto !== undefined) setData['foto'] = data.foto;

  const hasil = await db
    .update(strukturOrganisasi)
    .set(setData as never)
    .where(eq(strukturOrganisasi.id, id))
    .returning();

  if (!hasil[0]) throw new KesalahanTidakDitemukan('Struktur organisasi tidak ditemukan');
  return ubahKeStruktur(hasil[0]);
}

/** Menghapus struktur organisasi. */
export async function hapusStruktur(id: number): Promise<void> {
  const hasil = await db
    .delete(strukturOrganisasi)
    .where(eq(strukturOrganisasi.id, id))
    .returning({ id: strukturOrganisasi.id });
  if (hasil.length === 0) throw new KesalahanTidakDitemukan('Struktur organisasi tidak ditemukan');
}
