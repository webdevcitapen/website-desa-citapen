/**
 * Repositori pengguna: semua query ke tabel pengguna.
 * Migrasi dari pg raw (kumpulanKoneksi.query) ke Drizzle ORM
 * memakai `db` dari drizzle-orm/node-postgres dengan SSL manual
 * untuk Supabase (via src/config/database.ts).
 */

import { eq, and, desc, count, isNotNull, ne } from 'drizzle-orm';
import { db } from '../config/database.js';
import { pengguna } from '../db/schema.js';
import type { Peran } from '../types/index.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Data untuk membuat pengguna baru. */
export interface DataBuatPengguna {
  username: string;
  kataSandiHash: string;
  namaLengkap: string;
  email: string | null;
  nomorHp: string | null;
  peran: Peran;
}

/** Data untuk memperbarui profil pengguna. */
export interface DataUbahProfil {
  namaLengkap: string;
  email: string | null;
  nomorHp: string | null;
}

/** Parameter pencarian daftar pengguna. */
export interface ParameterDaftarPengguna {
  batas: number;
  lewati: number;
  peran?: Peran;
}

/** Bentuk pengguna tanpa sandi yang dikembalikan ke layanan. */
function ubahKePengguna(baris: typeof pengguna.$inferSelect): {
  id: number;
  username: string;
  namaLengkap: string;
  email: string | null;
  nomorHp: string | null;
  fotoProfil: string | null;
  peran: Peran;
  statusAktif: boolean;
  dibuatPada: Date;
} {
  return {
    id: baris.id,
    username: baris.username,
    namaLengkap: baris.namaLengkap,
    email: baris.email,
    nomorHp: baris.nomorHp,
    fotoProfil: baris.fotoProfil,
    peran: baris.peran as Peran,
    statusAktif: baris.statusAktif,
    dibuatPada: baris.dibuatPada,
  };
}

/**
 * Mencari pengguna berdasarkan username beserta kata sandinya.
 * Dipakai untuk proses masuk.
 */
export async function temukanPenggunaDenganSandiBerdasarkanUsername(
  username: string,
): Promise<(typeof pengguna.$inferSelect) | null> {
  const baris = await db
    .select()
    .from(pengguna)
    .where(eq(pengguna.username, username))
    .limit(1);
  return baris[0] ?? null;
}

/** Mencari pengguna berdasarkan id tanpa kata sandi. */
export async function temukanPenggunaBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKePengguna> | null> {
  const baris = await db
    .select()
    .from(pengguna)
    .where(eq(pengguna.id, id))
    .limit(1);
  const data = baris[0];
  return data ? ubahKePengguna(data) : null;
}

/** Memeriksa apakah sebuah username sudah dipakai pengguna lain. */
export async function apakahUsernameSudahDipakai(
  username: string,
  kecualikanId?: number,
): Promise<boolean> {
  // drizzle: SELECT EXISTS (...)
  // Implementasi sederhana: cari 1 baris yang cocok
  const kondisi = kecualikanId
    ? and(eq(pengguna.username, username), ne(pengguna.id, kecualikanId))
    : eq(pengguna.username, username);

  const baris = await db.select({ id: pengguna.id }).from(pengguna).where(kondisi).limit(1);
  return baris.length > 0;
}

/** Menghitung jumlah admin desa yang ada di sistem. */
export async function hitungAdminDesa(): Promise<number> {
  const hasil = await db
    .select({ total: count() })
    .from(pengguna)
    .where(eq(pengguna.peran, 'admin'));
  return hasil[0]?.total ?? 0;
}

/** Menghitung jumlah pengguna berdasarkan peran tertentu. */
export async function hitungPengguna(peran?: Peran): Promise<number> {
  if (peran) {
    const hasil = await db
      .select({ total: count() })
      .from(pengguna)
      .where(eq(pengguna.peran, peran));
    return hasil[0]?.total ?? 0;
  }
  const hasil = await db.select({ total: count() }).from(pengguna);
  return hasil[0]?.total ?? 0;
}

/** Membuat pengguna baru dan mengembalikan datanya tanpa kata sandi. */
export async function buatPengguna(
  data: DataBuatPengguna,
): Promise<ReturnType<typeof ubahKePengguna>> {
  const hasil = await db
    .insert(pengguna)
    .values({
      username: data.username,
      kataSandiHash: data.kataSandiHash,
      namaLengkap: data.namaLengkap,
      email: data.email,
      nomorHp: data.nomorHp,
      peran: data.peran,
    })
    .returning();
  return ubahKePengguna(hasil[0]);
}

/** Memperbarui profil pengguna dan mengembalikan data terbarunya. */
export async function perbaruiProfilPengguna(
  id: number,
  data: DataUbahProfil,
): Promise<ReturnType<typeof ubahKePengguna>> {
  const hasil = await db
    .update(pengguna)
    .set({
      namaLengkap: data.namaLengkap,
      email: data.email,
      nomorHp: data.nomorHp,
      diperbaruiPada: new Date(),
    })
    .where(eq(pengguna.id, id))
    .returning();
  if (!hasil[0]) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
  return ubahKePengguna(hasil[0]);
}

/** Memperbarui foto profil pengguna dan mengembalikan data terbarunya. */
export async function perbaruiFotoProfilPengguna(
  id: number,
  fotoProfil: string,
): Promise<ReturnType<typeof ubahKePengguna>> {
  const hasil = await db
    .update(pengguna)
    .set({ fotoProfil, diperbaruiPada: new Date() })
    .where(eq(pengguna.id, id))
    .returning();
  if (!hasil[0]) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
  return ubahKePengguna(hasil[0]);
}

/** Memperbarui kata sandi pengguna. */
export async function perbaruiKataSandiPengguna(
  id: number,
  kataSandiHash: string,
): Promise<void> {
  const hasil = await db
    .update(pengguna)
    .set({ kataSandiHash, diperbaruiPada: new Date() })
    .where(eq(pengguna.id, id))
    .returning({ id: pengguna.id });
  if (hasil.length === 0) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
}

/** Memperbarui username pengguna. */
export async function perbaruiUsernamePengguna(
  id: number,
  username: string,
): Promise<void> {
  const hasil = await db
    .update(pengguna)
    .set({ username, diperbaruiPada: new Date() })
    .where(eq(pengguna.id, id))
    .returning({ id: pengguna.id });
  if (hasil.length === 0) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
}

/** Mengambil foto profil lama seorang pengguna. */
export async function ambilFotoProfilPengguna(id: number): Promise<string | null> {
  const baris = await db
    .select({ fotoProfil: pengguna.fotoProfil })
    .from(pengguna)
    .where(eq(pengguna.id, id))
    .limit(1);
  return baris[0]?.fotoProfil ?? null;
}

/** Menghapus pengguna berdasarkan id (wajib memakai klausa where). */
export async function hapusPengguna(id: number): Promise<void> {
  const hasil = await db.delete(pengguna).where(eq(pengguna.id, id)).returning({ id: pengguna.id });
  if (hasil.length === 0) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
}

/** Bentuk kontak admin publik (tanpa data sensitif). */
export interface KontakAdmin {
  nomorHp: string | null;
  namaLengkap: string | null;
}

/**
 * Mencari kontak admin desa untuk ditampilkan ke publik.
 * Pilih admin yang nomor_hp-nya terisi, diurut berdasarkan
 * diperbarui_pada terbaru agar perubahan nomor langsung terlihat.
 */
export async function cariKontakAdmin(): Promise<KontakAdmin | null> {
  const baris = await db
    .select({ nomorHp: pengguna.nomorHp, namaLengkap: pengguna.namaLengkap })
    .from(pengguna)
    .where(
      and(
        eq(pengguna.peran, 'admin'),
        eq(pengguna.statusAktif, true),
        isNotNull(pengguna.nomorHp),
        ne(pengguna.nomorHp, ''),
      ),
    )
    .orderBy(desc(pengguna.diperbaruiPada), pengguna.id)
    .limit(1);

  const data = baris[0];
  if (!data) return null;
  return { nomorHp: data.nomorHp, namaLengkap: data.namaLengkap };
}

/**
 * Mengambil daftar pengguna dengan paginasi.
 * Query ini selalu memakai limit dan offset agar tidak pernah
 * mengambil seluruh isi tabel besar sekaligus.
 */
export async function daftarPengguna(
  parameter: ParameterDaftarPengguna,
): Promise<ReturnType<typeof ubahKePengguna>[]> {
  // drizzle: kondisi dinamis
  const where = parameter.peran ? eq(pengguna.peran, parameter.peran) : undefined;

  const baris = await db
    .select()
    .from(pengguna)
    .where(where)
    .orderBy(desc(pengguna.id))
    .limit(parameter.batas)
    .offset(parameter.lewati);

  return baris.map(ubahKePengguna);
}
