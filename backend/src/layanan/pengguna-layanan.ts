/**
 * Layanan pengguna: manajemen profil diri dan manajemen pengguna
 * oleh admin desa. Semua tindakan penting memakai pemeriksaan
 * kepemilikan dan peran agar tidak terjadi eskalasi hak akses.
 */

import type { BerkasUnggahan, Peran, DataPengguna } from '../types/index.js';
import { hashKataSandi, bandingkanKataSandi } from '../utils/sandi.js';
import {
  KesalahanAutentikasi,
  KesalahanBerkas,
  KesalahanKonflik,
  KesalahanOtorisasi,
  KesalahanTidakDitemukan,
} from '../utils/kesalahan.js';
import { kompresGambar } from '../utils/kompresi-gambar.js';
import { hapusBerkas, simpanBerkas } from '../utils/berkas.js';
import { logger } from '../utils/logger.js';
import {
  ambilFotoProfilPengguna,
  buatPengguna,
  daftarPengguna as daftarPenggunaRepositori,
  hapusPengguna,
  hitungPengguna,
  perbaruiFotoProfilPengguna,
  perbaruiKataSandiPengguna,
  perbaruiProfilPengguna,
  perbaruiUsernamePengguna,
  apakahUsernameSudahDipakai,
  temukanPenggunaBerdasarkanId,
  temukanPenggunaDenganSandiBerdasarkanUsername,
} from '../repositori/pengguna-repositori.js';
import type { HasilPaginasi } from '../types/index.js';
import { hitungTotalHalaman } from '../utils/paginasi.js';

/** Data yang dibutuhkan untuk mendaftarkan pengguna baru oleh admin. */
export interface DataDaftarkanPengguna {
  username: string;
  kataSandi: string;
  namaLengkap: string;
  email: string | null;
  nomorHp: string | null;
}

/** Parameter untuk mengambil daftar pengguna. */
export interface ParameterDaftarPenggunaLayanan {
  halaman: number;
  perHalaman: number;
  lewati: number;
  batas: number;
  peran?: Peran;
}

/**
 * Mendaftarkan pengguna baru berperan publikasi.
 * Hanya boleh dipanggil oleh admin desa (dipastikan di rute).
 * Peran umkm sudah dihapus.
 */
export async function daftarkanPenggunaOlehAdmin(
  data: DataDaftarkanPengguna,
  peran: Peran,
): Promise<DataPengguna> {
  // Pastikan peran yang didaftarkan memang kelolaan admin
  if (peran !== 'publikasi') {
    throw new KesalahanOtorisasi('Peran tersebut tidak dapat didaftarkan di sini');
  }

  // Cegah username ganda
  if (await apakahUsernameSudahDipakai(data.username)) {
    throw new KesalahanKonflik(
      `Username ${data.username} sudah digunakan, silakan pilih yang lain`,
    );
  }

  const kataSandiHash = await hashKataSandi(data.kataSandi);

  const pengguna = await buatPengguna({
    username: data.username,
    kataSandiHash,
    namaLengkap: data.namaLengkap,
    email: data.email && data.email.length > 0 ? data.email : null,
    nomorHp: data.nomorHp && data.nomorHp.length > 0 ? data.nomorHp : null,
    peran,
  });

  logger.info(
    { penggunaBaruId: pengguna.id, peran },
    'Pengguna baru berhasil didaftarkan oleh admin desa',
  );

  return pengguna;
}

/** Mengambil daftar pengguna dengan paginasi untuk admin desa. */
export async function ambilDaftarPengguna(
  parameter: ParameterDaftarPenggunaLayanan,
): Promise<HasilPaginasi<DataPengguna>> {
  const daftar = await daftarPenggunaRepositori({
    batas: parameter.batas,
    lewati: parameter.lewati,
    peran: parameter.peran,
  });

  const total = await hitungPengguna(parameter.peran);

  return {
    daftar,
    halaman: parameter.halaman,
    perHalaman: parameter.perHalaman,
    total,
    totalHalaman: hitungTotalHalaman(total, parameter.perHalaman),
  };
}

/** Mengambil detail pengguna untuk admin desa. */
export async function ambilDetailPenggunaOlehAdmin(
  id: number,
): Promise<DataPengguna> {
  const pengguna = await temukanPenggunaBerdasarkanId(id);
  if (!pengguna) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
  return pengguna;
}

/** Mengubah profil diri sendiri. */
export async function ubahProfilDiri(
  id: number,
  data: {
    namaLengkap: string;
    email: string | null;
    nomorHp: string | null;
  },
): Promise<DataPengguna> {
  const pengguna = await perbaruiProfilPengguna(id, {
    namaLengkap: data.namaLengkap,
    email: data.email && data.email.length > 0 ? data.email : null,
    nomorHp: data.nomorHp && data.nomorHp.length > 0 ? data.nomorHp : null,
  });
  return pengguna;
}

/**
 * Mengubah foto profil diri sendiri.
 * Foto dikompres terlebih dahulu agar ukurannya sangat kecil
 * tetapi kualitas tampilannya tetap terjaga.
 */
export async function ubahFotoProfilDiri(
  id: number,
  berkas: BerkasUnggahan,
): Promise<DataPengguna> {
  if (!berkas) {
    throw new KesalahanBerkas('Berkas foto profil wajib diunggah');
  }

  // Kompres gambar yang diunggah
  const hasilKompresi = await kompresGambar(berkas.buffer);
  const pathBaru = await simpanBerkas(
    hasilKompresi.buffer,
    'profil',
    hasilKompresi.ekstensi,
  );

  // Simpan path foto baru lalu hapus foto lama
  const pengguna = await perbaruiFotoProfilPengguna(id, pathBaru);

  const fotoLama = await ambilFotoProfilPengguna(id);
  if (fotoLama && fotoLama !== pathBaru) {
    await hapusBerkas(fotoLama);
  }

  logger.info({ penggunaId: id }, 'Foto profil berhasil diperbarui');

  return pengguna;
}

/** Mengubah kata sandi diri sendiri setelah memverifikasi kata sandi lama. */
export async function ubahKataSandiDiri(
  id: number,
  kataSandiLama: string,
  kataSandiBaru: string,
): Promise<void> {
  const pengguna = await temukanPenggunaBerdasarkanId(id);
  if (!pengguna) {
    throw new KesalahanAutentikasi();
  }

  // Ambil hash kata sandi lama dari repositori
  const baris = await temukanPenggunaDenganSandiBerdasarkanUsername(
    pengguna.username,
  );
  if (!baris) {
    throw new KesalahanAutentikasi();
  }

  const kataSandiLamaBenar = await bandingkanKataSandi(kataSandiLama, baris.kata_sandi_hash);
  if (!kataSandiLamaBenar) {
    throw new KesalahanAutentikasi(
      'Kata sandi lama salah',
      'KATA_SANDI_LAMA_SALAH',
    );
  }

  const kataSandiBaruHash = await hashKataSandi(kataSandiBaru);
  await perbaruiKataSandiPengguna(id, kataSandiBaruHash);

  logger.info({ penggunaId: id }, 'Kata sandi diri berhasil diubah');
}

/** Mengubah username diri sendiri dengan pemeriksaan keunikan. */
export async function ubahUsernameDiri(
  id: number,
  usernameBaru: string,
): Promise<DataPengguna> {
  if (await apakahUsernameSudahDipakai(usernameBaru, id)) {
    throw new KesalahanKonflik(
      `Username ${usernameBaru} sudah digunakan, silakan pilih yang lain`,
    );
  }
  await perbaruiUsernamePengguna(id, usernameBaru);
  const pengguna = await temukanPenggunaBerdasarkanId(id);
  if (!pengguna) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
  return pengguna;
}

/** Admin desa mengubah kata sandi pengguna lain. */
export async function ubahKataSandiOlehAdmin(
  id: number,
  kataSandiBaru: string,
): Promise<void> {
  // Pastikan pengguna yang diubah bukan akun admin lain
  const pengguna = await temukanPenggunaBerdasarkanId(id);
  if (!pengguna) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
  if (pengguna.peran === 'admin') {
    throw new KesalahanOtorisasi('Akun admin desa tidak dapat diubah di sini');
  }

  const kataSandiHash = await hashKataSandi(kataSandiBaru);
  await perbaruiKataSandiPengguna(id, kataSandiHash);

  logger.info(
    { penggunaId: id, diubahOleh: 'admin' },
    'Kata sandi pengguna diubah oleh admin desa',
  );
}

/** Admin desa mengubah username pengguna lain. */
export async function ubahUsernameOlehAdmin(
  id: number,
  usernameBaru: string,
): Promise<DataPengguna> {
  const pengguna = await temukanPenggunaBerdasarkanId(id);
  if (!pengguna) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
  if (pengguna.peran === 'admin') {
    throw new KesalahanOtorisasi('Akun admin desa tidak dapat diubah di sini');
  }

  if (await apakahUsernameSudahDipakai(usernameBaru, id)) {
    throw new KesalahanKonflik(
      `Username ${usernameBaru} sudah digunakan, silakan pilih yang lain`,
    );
  }

  await perbaruiUsernamePengguna(id, usernameBaru);
  const penggunaBaru = await temukanPenggunaBerdasarkanId(id);
  if (!penggunaBaru) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
  return penggunaBaru;
}

/** Admin desa menghapus pengguna publikasi. */
export async function hapusPenggunaOlehAdmin(id: number): Promise<void> {
  // Cegah penghapusan akun admin desa
  const pengguna = await temukanPenggunaBerdasarkanId(id);
  if (!pengguna) {
    throw new KesalahanTidakDitemukan('Pengguna tidak ditemukan');
  }
  if (pengguna.peran === 'admin') {
    throw new KesalahanOtorisasi('Akun admin desa tidak dapat dihapus');
  }

  // Hapus foto profilnya juga agar penyimpanan tidak menumpuk
  await hapusBerkas(pengguna.fotoProfil ?? 'profil/untuk-tidak-dipakai.jpg');

  await hapusPengguna(id);

  logger.info(
    { penggunaId: id },
    'Pengguna berhasil dihapus oleh admin desa',
  );
}
