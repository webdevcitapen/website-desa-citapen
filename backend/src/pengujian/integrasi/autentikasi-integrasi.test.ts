/**
 * Pengujian integrasi: alur autentikasi.
 * Memastikan proses masuk, profil, ubah kata sandi, dan ubah
 * username bekerja dengan benar di dalam sistem.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  dapatkanTokenAdmin,
  buatPenggunaUji,
  buatUsernameUji,
  bersihkanDataUji,
  periksaKetersediaanDatabase,
} from '../bantuan.js';
import {
  ambilProfilSaatIni,
  masukPengguna,
} from '../../layanan/autentikasi-layanan.js';
import {
  ubahKataSandiDiri,
  ubahUsernameDiri,
} from '../../layanan/pengguna-layanan.js';
import { KesalahanAutentikasi, KesalahanKonflik } from '../../utils/kesalahan.js';

// Seluruh pengujian di file ini membutuhkan database yang tersedia
const databaseTersedia = await periksaKetersediaanDatabase();

describe.skipIf(!databaseTersedia)('integrasi autentikasi', () => {
  beforeAll(async () => {
    await bersihkanDataUji();
  });

  afterAll(async () => {
    await bersihkanDataUji();
  });

  it('admin dapat masuk dengan kredensial awal', async () => {
    const hasil = await masukPengguna('admin', 'AdminDesa123');

    expect(hasil.token).toBeTruthy();
    expect(hasil.pengguna.username).toBe('admin');
    expect(hasil.pengguna.peran).toBe('admin');
  });

  it('menolak masuk dengan kata sandi yang salah', async () => {
    await expect(
      masukPengguna('admin', 'KataSandiSalah999'),
    ).rejects.toThrow(KesalahanAutentikasi);
  });

  it('menolak masuk dengan username yang tidak dikenal', async () => {
    await expect(
      masukPengguna('user_tidak_ada', 'KataSandi123'),
    ).rejects.toThrow(KesalahanAutentikasi);
  });

  it('pengguna uji dapat masuk dan mengambil profil sendiri', async () => {
    const penggunaUji = await buatPenggunaUji('publikasi');

    const hasil = await masukPengguna(penggunaUji.username, penggunaUji.kataSandi);
    expect(hasil.token).toBeTruthy();

    const profil = await ambilProfilSaatIni(hasil.pengguna.id);
    expect(profil.username).toBe(penggunaUji.username);
    expect(profil.peran).toBe('publikasi');
  });

  it('pengguna dapat mengubah kata sandi sendiri lalu masuk dengan yang baru', async () => {
    const penggunaUji = await buatPenggunaUji('publikasi');
    const kataSandiBaru = 'KataSandiBaru789';

    await ubahKataSandiDiri(
      penggunaUji.id,
      penggunaUji.kataSandi,
      kataSandiBaru,
    );

    // Kata sandi lama harus ditolak
    await expect(
      masukPengguna(penggunaUji.username, penggunaUji.kataSandi),
    ).rejects.toThrow(KesalahanAutentikasi);

    // Kata sandi baru harus diterima
    const hasil = await masukPengguna(penggunaUji.username, kataSandiBaru);
    expect(hasil.token).toBeTruthy();
  });

  it('menolak penggantian kata sandi jika kata sandi lama salah', async () => {
    const penggunaUji = await buatPenggunaUji('publikasi');

    await expect(
      ubahKataSandiDiri(penggunaUji.id, 'KataSandiSalah', 'KataSandiBaru123'),
    ).rejects.toThrow(KesalahanAutentikasi);
  });

  it('pengguna dapat mengubah username sendiri', async () => {
    const penggunaUji = await buatPenggunaUji('publikasi');
    const usernameBaru = buatUsernameUji('ganti');

    const profilBaru = await ubahUsernameDiri(penggunaUji.id, usernameBaru);

    expect(profilBaru.username).toBe(usernameBaru);

    // Masuk memakai username baru harus berhasil
    const hasil = await masukPengguna(usernameBaru, penggunaUji.kataSandi);
    expect(hasil.token).toBeTruthy();
  });

  it('menolak penggantian username yang sudah dipakai orang lain', async () => {
    const penggunaPertama = await buatPenggunaUji('publikasi');
    const penggunaKedua = await buatPenggunaUji('publikasi');

    await expect(
      ubahUsernameDiri(penggunaKedua.id, penggunaPertama.username),
    ).rejects.toThrow(KesalahanKonflik);
  });

  it('token admin dapat dibuat untuk pengujian api', async () => {
    const token = await dapatkanTokenAdmin();
    expect(token.length).toBeGreaterThan(20);
  });
});
