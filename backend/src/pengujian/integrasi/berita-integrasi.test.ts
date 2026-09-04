/**
 * Pengujian integrasi: alur berita.
 * Memastikan pembuatan, pembacaan, perubahan, dan penghapusan
 * berita bekerja dengan benar beserta pemeriksaan hak akses.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  buatPenggunaUji,
  bersihkanDataUji,
  periksaKetersediaanDatabase,
} from '../bantuan.js';
import { masukPengguna } from '../../layanan/autentikasi-layanan.js';
import {
  ambilDaftarBerita,
  ambilDetailBerita,
  hapusBeritaDenganPemeriksaan,
  tambahBerita,
  ubahBerita,
} from '../../layanan/berita-layanan.js';
import {
  KesalahanOtorisasi,
  KesalahanTidakDitemukan,
} from '../../utils/kesalahan.js';

// Seluruh pengujian di file ini membutuhkan database yang tersedia
const databaseTersedia = await periksaKetersediaanDatabase();

describe.skipIf(!databaseTersedia)('integrasi berita', () => {
  /** Id akun admin desa yang sudah ada di database. */
  let idAdmin: number;

  beforeAll(async () => {
    await bersihkanDataUji();
    const hasilMasuk = await masukPengguna('admin', 'AdminDesa123');
    idAdmin = hasilMasuk.pengguna.id;
  });

  afterAll(async () => {
    await bersihkanDataUji();
  });

  it('admin desa dapat membuat berita baru', async () => {
    const berita = await tambahBerita(
      idAdmin,
      {
        judul: 'Peresmian Balai Desa Citapen',
        isi: 'Balai desa diresmikan dengan suasana meriah.',
      },
    );

    expect(berita.judul).toBe('Peresmian Balai Desa Citapen');
    expect(berita.penulis?.id).toBe(idAdmin);
  });

  it('publikasi dapat membuat berita baru', async () => {
    const publikasi = await buatPenggunaUji('publikasi');

    const berita = await tambahBerita(
      publikasi.id,
      { judul: 'Kegiatan KKM Bulan Ini', isi: 'Publikasi mengadakan kegiatan gotong royong.' },
    );

    expect(berita.penulis?.id).toBe(publikasi.id);
  });

  it('daftar berita dikembalikan dengan paginasi yang benar', async () => {
    const admin = { id: idAdmin, peran: 'admin' };
    for (let i = 0; i < 15; i += 1) {
      await tambahBerita(
        admin.id,
        { judul: `Berita Uji Nomor ${i}`, isi: `Isi berita uji nomor ${i} yang cukup panjang.` },
      );
    }

    const hasil = await ambilDaftarBerita({
      halaman: 1,
      perHalaman: 10,
      lewati: 0,
      batas: 10,
    });

    expect(hasil.daftar.length).toBeGreaterThanOrEqual(10);
    expect(hasil.perHalaman).toBe(10);
    expect(hasil.totalHalaman).toBeGreaterThanOrEqual(1);
  });

  it('detail berita dapat diambil berdasarkan id', async () => {
    const admin = { id: idAdmin, peran: 'admin' };
    const berita = await tambahBerita(
      admin.id,
      { judul: 'Berita Untuk Detail', isi: 'Isi berita yang cukup panjang untuk uji detail.' },
    );

    const detail = await ambilDetailBerita(berita.id);
    expect(detail.id).toBe(berita.id);
    expect(detail.judul).toBe('Berita Untuk Detail');
  });

  it('penulis dapat mengubah berita miliknya sendiri', async () => {
    const publikasi = await buatPenggunaUji('publikasi');
    const berita = await tambahBerita(
      publikasi.id,
      { judul: 'Berita Sebelum Diubah', isi: 'Isi berita sebelum diubah oleh penulisnya.' },
    );

    const hasil = await ubahBerita(
      berita.id,
      publikasi.id,
      'publikasi',
      { judul: 'Berita Setelah Diubah', isi: 'Isi berita setelah diubah oleh penulisnya.' },
    );

    expect(hasil.judul).toBe('Berita Setelah Diubah');
  });

  it('pengguna lain tidak dapat mengubah berita orang lain', async () => {
    const admin = { id: idAdmin, peran: 'admin' };
    const publikasi = await buatPenggunaUji('publikasi');
    const berita = await tambahBerita(
      admin.id,
      {
        judul: 'Berita Milik Admin',
        isi: 'Isi berita milik admin yang tidak boleh diubah orang lain.',
      },
    );

    await expect(
      ubahBerita(
        berita.id,
        publikasi.id,
        'publikasi',
        { judul: 'Judul Dibajak', isi: 'Isi berita yang dicoba dibajak oleh publikasi lain.' },
      ),
    ).rejects.toThrow(KesalahanOtorisasi);
  });

  it('admin desa dapat menghapus berita milik siapa pun', async () => {
    const admin = { id: idAdmin, peran: 'admin' };
    const publikasi = await buatPenggunaUji('publikasi');
    const berita = await tambahBerita(
      publikasi.id,
      { judul: 'Berita Akan Dihapus', isi: 'Isi berita yang akan dihapus oleh admin desa.' },
    );

    await hapusBeritaDenganPemeriksaan(berita.id, admin.id, 'admin');

    await expect(ambilDetailBerita(berita.id)).rejects.toThrow(
      KesalahanTidakDitemukan,
    );
  });

  it('penulis dapat menghapus berita miliknya sendiri', async () => {
    const publikasi = await buatPenggunaUji('publikasi');
    const berita = await tambahBerita(
      publikasi.id,
      { judul: 'Berita Dihapus Sendiri', isi: 'Isi berita yang dihapus oleh penulisnya sendiri.' },
    );

    await hapusBeritaDenganPemeriksaan(berita.id, publikasi.id, 'publikasi');

    await expect(ambilDetailBerita(berita.id)).rejects.toThrow(
      KesalahanTidakDitemukan,
    );
  });
});
