/**
 * Repositori profil desa: semua query ke tabel profil_desa.
 * Migrasi ke Drizzle ORM.
 */

import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { profilDesa } from '../db/schema.js';

/** Data untuk memperbarui profil desa. */
export interface DataUbahProfilDesa {
  luasWilayah: string;
  batasUtara: string;
  batasSelatan: string;
  batasBarat: string;
  batasTimur: string;
  letakGeografis: string | null;
  deskripsiWilayah: string | null;
  sejarah: string | null;
  visi: string | null;
  misi: string | null;
}

/** Mengubah baris drizzle menjadi bentuk umum. */
function ubahKeProfilDesa(baris: typeof profilDesa.$inferSelect): {
  id: number;
  luasWilayah: string;
  batasUtara: string;
  batasSelatan: string;
  batasBarat: string;
  batasTimur: string;
  letakGeografis: string | null;
  deskripsiWilayah: string | null;
  sejarah: string | null;
  visi: string | null;
  misi: string | null;
  diperbaruiPada: Date;
} {
  return {
    id: baris.id,
    luasWilayah: baris.luasWilayah,
    batasUtara: baris.batasUtara,
    batasSelatan: baris.batasSelatan,
    batasBarat: baris.batasBarat,
    batasTimur: baris.batasTimur,
    letakGeografis: baris.letakGeografis,
    deskripsiWilayah: baris.deskripsiWilayah,
    sejarah: baris.sejarah,
    visi: baris.visi,
    misi: baris.misi,
    diperbaruiPada: baris.diperbaruiPada,
  };
}

/** Mengambil profil desa (selalu id=1). */
export async function ambilProfilDesa(): Promise<ReturnType<typeof ubahKeProfilDesa> | null> {
  const baris = await db.select().from(profilDesa).where(eq(profilDesa.id, 1)).limit(1);
  return baris[0] ? ubahKeProfilDesa(baris[0]) : null;
}

/** Memperbarui profil desa (singleton). Membuat jika belum ada. */
export async function perbaruiProfilDesa(
  data: DataUbahProfilDesa,
): Promise<ReturnType<typeof ubahKeProfilDesa>> {
  // Drizzle tidak punya ON CONFLICT shortcut se-type-safe untuk singleton,
  // pakai insert ... onConflictDoUpdate
  const hasil = await db
    .insert(profilDesa)
    .values({
      id: 1,
      luasWilayah: data.luasWilayah,
      batasUtara: data.batasUtara,
      batasSelatan: data.batasSelatan,
      batasBarat: data.batasBarat,
      batasTimur: data.batasTimur,
      letakGeografis: data.letakGeografis,
      deskripsiWilayah: data.deskripsiWilayah,
      sejarah: data.sejarah,
      visi: data.visi,
      misi: data.misi,
      diperbaruiPada: new Date(),
    })
    .onConflictDoUpdate({
      target: profilDesa.id,
      set: {
        luasWilayah: data.luasWilayah,
        batasUtara: data.batasUtara,
        batasSelatan: data.batasSelatan,
        batasBarat: data.batasBarat,
        batasTimur: data.batasTimur,
        letakGeografis: data.letakGeografis,
        deskripsiWilayah: data.deskripsiWilayah,
        sejarah: data.sejarah,
        visi: data.visi,
        misi: data.misi,
        diperbaruiPada: new Date(),
      },
    })
    .returning();

  return ubahKeProfilDesa(hasil[0]);
}

/** Memperbarui hanya kolom sejarah desa. */
export async function perbaruiSejarahDesa(
  sejarah: string,
): Promise<ReturnType<typeof ubahKeProfilDesa>> {
  const hasil = await db
    .insert(profilDesa)
    .values({
      id: 1,
      luasWilayah: '473,300 Ha',
      batasUtara: 'Desa Tundangan',
      batasSelatan: 'Desa Pakembangan',
      batasBarat: 'Kecamatan Ciniru',
      batasTimur: 'Kecamatan Maleber',
      sejarah,
      diperbaruiPada: new Date(),
    })
    .onConflictDoUpdate({
      target: profilDesa.id,
      set: { sejarah, diperbaruiPada: new Date() },
    })
    .returning();
  return ubahKeProfilDesa(hasil[0]);
}

/** Memperbarui hanya kolom visi dan misi desa. */
export async function perbaruiVisiMisiDesa(
  visi: string,
  misi: string,
): Promise<ReturnType<typeof ubahKeProfilDesa>> {
  const hasil = await db
    .insert(profilDesa)
    .values({
      id: 1,
      luasWilayah: '473,300 Ha',
      batasUtara: 'Desa Tundangan',
      batasSelatan: 'Desa Pakembangan',
      batasBarat: 'Kecamatan Ciniru',
      batasTimur: 'Kecamatan Maleber',
      visi,
      misi,
      diperbaruiPada: new Date(),
    })
    .onConflictDoUpdate({
      target: profilDesa.id,
      set: { visi, misi, diperbaruiPada: new Date() },
    })
    .returning();
  return ubahKeProfilDesa(hasil[0]);
}
