/**
 * Layanan autentikasi: proses masuk dan pembuatan admin awal.
 * Lapisan ini memakai repositori pengguna untuk memverifikasi
 * kredensial dan membuat token jwt.
 */

import { lingkungan } from '../config/env.js';
import { bandingkanKataSandi, hashKataSandi } from '../utils/sandi.js';
import { buatToken } from '../utils/token.js';
import { KesalahanAutentikasi } from '../utils/kesalahan.js';
import { logger } from '../utils/logger.js';
import {
  buatPengguna,
  hitungAdminDesa,
  temukanPenggunaDenganSandiBerdasarkanUsername,
  temukanPenggunaBerdasarkanId,
} from '../repositori/pengguna-repositori.js';
import type { DataPengguna } from '../types/index.js';

/** Hasil proses masuk yang berhasil. */
export interface HasilMasuk {
  token: string;
  pengguna: DataPengguna;
}

/**
 * Memproses masuk pengguna dengan memeriksa username dan kata sandi.
 * Melempar kesalahan jika kredensial salah atau akun tidak aktif.
 */
export async function masukPengguna(
  username: string,
  kataSandi: string,
): Promise<HasilMasuk> {
  // Cari pengguna beserta kata sandinya di database
  const barisPengguna =
    await temukanPenggunaDenganSandiBerdasarkanUsername(username);

  // Jangan bocorkan apakah username ada atau tidak, beri pesan sama
  if (!barisPengguna) {
    throw new KesalahanAutentikasi(
      'Username atau kata sandi salah',
      'KEDENSIAL_SALAH',
    );
  }

  // Pastikan akun pengguna masih aktif
  if (!barisPengguna.status_aktif) {
    throw new KesalahanAutentikasi(
      'Akun Anda dinonaktifkan, hubungi admin desa',
      'AKUN_NONAKTIF',
    );
  }

  // Bandingkan kata sandi yang dikirim dengan hash di database
  const kataSandiBenar = await bandingkanKataSandi(
    kataSandi,
    barisPengguna.kata_sandi_hash,
  );
  if (!kataSandiBenar) {
    throw new KesalahanAutentikasi(
      'Username atau kata sandi salah',
      'KEDENSIAL_SALAH',
    );
  }

  // Buat token untuk pengguna yang berhasil masuk
  const token = buatToken({ id: Number(barisPengguna.id), peran: barisPengguna.peran });

  logger.info(
    { penggunaId: Number(barisPengguna.id), peran: barisPengguna.peran },
    'Pengguna berhasil masuk',
  );

  return {
    token,
    pengguna: {
      id: Number(barisPengguna.id),
      username: barisPengguna.username,
      namaLengkap: barisPengguna.nama_lengkap,
      email: barisPengguna.email,
      nomorHp: barisPengguna.nomor_hp,
      fotoProfil: barisPengguna.foto_profil,
      peran: barisPengguna.peran,
      statusAktif: barisPengguna.status_aktif,
      dibuatPada: barisPengguna.dibuat_pada,
    },
  };
}

/** Mengambil profil pengguna yang sedang masuk berdasarkan id. */
export async function ambilProfilSaatIni(id: number): Promise<DataPengguna> {
  const pengguna = await temukanPenggunaBerdasarkanId(id);
  if (!pengguna) {
    throw new KesalahanAutentikasi(
      'Pengguna tidak ditemukan, silakan masuk kembali',
      'PENGGUNA_TIDAK_DITEMUKAN',
    );
  }
  return pengguna;
}

/**
 * Membuat akun admin desa awal jika belum ada satupun admin.
 * Dipanggil otomatis saat server pertama kali dijalankan agar
 * aplikasi siap dipakai di lingkungan baru (misalnya render).
 */
export async function inisialisasiAdminAwal(): Promise<void> {
  try {
    // Hanya jalankan jika belum ada admin desa sama sekali
    const jumlahAdmin = await hitungAdminDesa();
    if (jumlahAdmin > 0) {
      return;
    }

    const kataSandiHash = await hashKataSandi(lingkungan.SANDI_ADMIN_AWAL);
    await buatPengguna({
      username: lingkungan.USERNAME_ADMIN_AWAL,
      kataSandiHash,
      namaLengkap: 'Administrator Desa Citapen',
      email: null,
      nomorHp: null,
      peran: 'admin',
    });

    logger.info(
      { username: lingkungan.USERNAME_ADMIN_AWAL },
      'Akun admin desa awal berhasil dibuat',
    );
  } catch (kesalahan) {
    // Jangan matikan server jika database belum siap saat boot
    logger.warn(
      { kesalahan: kesalahan instanceof Error ? kesalahan.message : 'unknown' },
      'Gagal membuat akun admin awal, akan dicoba pada permintaan berikutnya',
    );
  }
}
