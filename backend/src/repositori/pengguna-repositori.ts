/**
 * Repositori pengguna: semua query ke tabel pengguna.
 * Seluruh query memakai parameter ($1, $2, ...) sehingga aman
 * dari serangan sql injection dan tidak memakai konkatenasi
 * langsung dari masukan pengguna.
 */

import { kumpulanKoneksi } from '../config/database.js';
import type { Peran } from '../types/index.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Bentuk baris pengguna yang dikembalikan postgresql. */
interface BarisPengguna {
  id: string;
  username: string;
  kata_sandi_hash: string;
  nama_lengkap: string;
  email: string | null;
  nomor_hp: string | null;
  foto_profil: string | null;
  peran: Peran;
  status_aktif: boolean;
  dibuat_pada: Date;
  diperbarui_pada: Date;
}

/** Bentuk baris pengguna tanpa kata sandi untuk keperluan umum. */
interface BarisPenggunaTanpaSandi {
  id: string;
  username: string;
  nama_lengkap: string;
  email: string | null;
  nomor_hp: string | null;
  foto_profil: string | null;
  peran: Peran;
  status_aktif: boolean;
  dibuat_pada: Date;
}

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

/** Mengubah baris pengguna dari database menjadi bentuk umum. */
function ubahKePengguna(baris: BarisPenggunaTanpaSandi): {
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
    id: Number(baris.id),
    username: baris.username,
    namaLengkap: baris.nama_lengkap,
    email: baris.email,
    nomorHp: baris.nomor_hp,
    fotoProfil: baris.foto_profil,
    peran: baris.peran,
    statusAktif: baris.status_aktif,
    dibuatPada: baris.dibuat_pada,
  };
}

/**
 * Mencari pengguna berdasarkan username beserta kata sandinya.
 * Dipakai untuk proses masuk.
 */
export async function temukanPenggunaDenganSandiBerdasarkanUsername(
  username: string,
): Promise<BarisPengguna | null> {
  const hasil = await kumpulanKoneksi.query<BarisPengguna>(
    `SELECT id, username, kata_sandi_hash, nama_lengkap,
            email, nomor_hp, foto_profil, peran, status_aktif,
            dibuat_pada, diperbarui_pada
       FROM pengguna
      WHERE username = $1
      LIMIT 1`,
    [username],
  );
  return hasil.rows[0] ?? null;
}

/** Mencari pengguna berdasarkan id tanpa kata sandi. */
export async function temukanPenggunaBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKePengguna> | null> {
  const hasil = await kumpulanKoneksi.query<BarisPenggunaTanpaSandi>(
    `SELECT id, username, nama_lengkap, email, nomor_hp,
            foto_profil, peran, status_aktif, dibuat_pada
       FROM pengguna
      WHERE id = $1
      LIMIT 1`,
    [id],
  );
  const baris = hasil.rows[0];
  return baris ? ubahKePengguna(baris) : null;
}

/** Memeriksa apakah sebuah username sudah dipakai pengguna lain. */
export async function apakahUsernameSudahDipakai(
  username: string,
  kecualikanId?: number,
): Promise<boolean> {
  const hasil = await kumpulanKoneksi.query<{ ada: boolean }>(
    `SELECT EXISTS (
        SELECT 1
          FROM pengguna
         WHERE username = $1
           AND ($2::bigint IS NULL OR id <> $2)
     ) AS ada`,
    [username, kecualikanId ?? null],
  );
  return hasil.rows[0]?.ada ?? false;
}

/** Menghitung jumlah admin desa yang ada di sistem. */
export async function hitungAdminDesa(): Promise<number> {
  const hasil = await kumpulanKoneksi.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total
       FROM pengguna
      WHERE peran = 'admin'`,
  );
  return hasil.rows[0]?.total ?? 0;
}

/** Menghitung jumlah pengguna berdasarkan peran tertentu. */
export async function hitungPengguna(peran?: Peran): Promise<number> {
  let hasil;
  if (peran) {
    hasil = await kumpulanKoneksi.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total
         FROM pengguna
        WHERE peran = $1`,
      [peran],
    );
  } else {
    hasil = await kumpulanKoneksi.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total
         FROM pengguna`,
    );
  }
  return hasil.rows[0]?.total ?? 0;
}

/** Membuat pengguna baru dan mengembalikan datanya tanpa kata sandi. */
export async function buatPengguna(
  data: DataBuatPengguna,
): Promise<ReturnType<typeof ubahKePengguna>> {
  const hasil = await kumpulanKoneksi.query<BarisPenggunaTanpaSandi>(
    `INSERT INTO pengguna (
        username, kata_sandi_hash, nama_lengkap,
        email, nomor_hp, peran
     ) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, username, nama_lengkap, email,
               nomor_hp, foto_profil, peran, status_aktif, dibuat_pada`,
    [
      data.username,
      data.kataSandiHash,
      data.namaLengkap,
      data.email,
      data.nomorHp,
      data.peran,
    ],
  );
  return ubahKePengguna(hasil.rows[0]);
}

/** Memperbarui profil pengguna dan mengembalikan data terbarunya. */
export async function perbaruiProfilPengguna(
  id: number,
  data: DataUbahProfil,
): Promise<ReturnType<typeof ubahKePengguna>> {
  const hasil = await kumpulanKoneksi.query<BarisPenggunaTanpaSandi>(
    `UPDATE pengguna
        SET nama_lengkap = $2,
            email = $3,
            nomor_hp = $4,
            diperbarui_pada = NOW()
      WHERE id = $1
     RETURNING id, username, nama_lengkap, email,
               nomor_hp, foto_profil, peran, status_aktif, dibuat_pada`,
    [id, data.namaLengkap, data.email, data.nomorHp],
  );
  if (!hasil.rows[0]) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
  return ubahKePengguna(hasil.rows[0]);
}

/** Memperbarui foto profil pengguna dan mengembalikan data terbarunya. */
export async function perbaruiFotoProfilPengguna(
  id: number,
  fotoProfil: string,
): Promise<ReturnType<typeof ubahKePengguna>> {
  const hasil = await kumpulanKoneksi.query<BarisPenggunaTanpaSandi>(
    `UPDATE pengguna
        SET foto_profil = $2,
            diperbarui_pada = NOW()
      WHERE id = $1
     RETURNING id, username, nama_lengkap, email,
               nomor_hp, foto_profil, peran, status_aktif, dibuat_pada`,
    [id, fotoProfil],
  );
  if (!hasil.rows[0]) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
  return ubahKePengguna(hasil.rows[0]);
}

/** Memperbarui kata sandi pengguna. */
export async function perbaruiKataSandiPengguna(
  id: number,
  kataSandiHash: string,
): Promise<void> {
  const hasil = await kumpulanKoneksi.query(
    `UPDATE pengguna
        SET kata_sandi_hash = $2,
            diperbarui_pada = NOW()
      WHERE id = $1`,
    [id, kataSandiHash],
  );
  if (!hasil.rowCount) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
}

/** Memperbarui username pengguna. */
export async function perbaruiUsernamePengguna(
  id: number,
  username: string,
): Promise<void> {
  const hasil = await kumpulanKoneksi.query(
    `UPDATE pengguna
        SET username = $2,
            diperbarui_pada = NOW()
      WHERE id = $1`,
    [id, username],
  );
  if (!hasil.rowCount) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
}

/** Mengambil foto profil lama seorang pengguna. */
export async function ambilFotoProfilPengguna(id: number): Promise<string | null> {
  const hasil = await kumpulanKoneksi.query<{ foto_profil: string | null }>(
    `SELECT foto_profil
       FROM pengguna
      WHERE id = $1
      LIMIT 1`,
    [id],
  );
  return hasil.rows[0]?.foto_profil ?? null;
}

/** Menghapus pengguna berdasarkan id (wajib memakai klausa where). */
export async function hapusPengguna(id: number): Promise<void> {
  const hasil = await kumpulanKoneksi.query(
    `DELETE FROM pengguna
      WHERE id = $1`,
    [id],
  );
  if (!hasil.rowCount) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
}

/**
 * Mengambil daftar pengguna dengan paginasi.
 * Query ini selalu memakai limit dan offset agar tidak pernah
 * mengambil seluruh isi tabel besar sekaligus.
 */
export async function daftarPengguna(
  parameter: ParameterDaftarPengguna,
): Promise<ReturnType<typeof ubahKePengguna>[]> {
  const kondisi: string[] = [];
  const nilai: unknown[] = [];

  // Tambahkan penyaring peran jika diminta
  if (parameter.peran) {
    nilai.push(parameter.peran);
    kondisi.push(`peran = $${nilai.length}`);
  }

  // Susun klausa where hanya dari potongan query yang tetap
  const klausaWhere = kondisi.length > 0 ? `WHERE ${kondisi.join(' AND ')}` : '';

  nilai.push(parameter.batas, parameter.lewati);

  const hasil = await kumpulanKoneksi.query<BarisPenggunaTanpaSandi>(
    `SELECT id, username, nama_lengkap, email, nomor_hp,
            foto_profil, peran, status_aktif, dibuat_pada
       FROM pengguna
       ${klausaWhere}
      ORDER BY id DESC
      LIMIT $${nilai.length - 1} OFFSET $${nilai.length}`,
    nilai,
  );
  return hasil.rows.map(ubahKePengguna);
}
