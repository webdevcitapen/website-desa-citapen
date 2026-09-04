/**
 * Pengujian unit: utilitas berkas.
 * Memastikan nama berkas aman dan path tidak bisa keluar
 * dari folder unggahan (anti path traversal).
 */

import { describe, expect, it } from 'vitest';
import {
  apakahPathUnggahanAman,
  buatNamaBerkas,
} from '../../utils/berkas.js';

describe('utilitas berkas', () => {
  it('menghasilkan nama berkas acak dengan ekstensi yang benar', () => {
    const nama = buatNamaBerkas('jpg');

    expect(nama.endsWith('.jpg')).toBe(true);
    expect(nama.length).toBeGreaterThan(10);
  });

  it('menerima path unggahan yang aman', () => {
    expect(apakahPathUnggahanAman('profil/abc-123.jpg')).toBe(true);
    expect(apakahPathUnggahanAman('produk/def456.png')).toBe(true);
    expect(apakahPathUnggahanAman('berita/ghi789.jpg')).toBe(true);
  });

  it('menolak path yang berusaha keluar dari folder unggahan', () => {
    // Path traversal klasik harus ditolak
    expect(apakahPathUnggahanAman('../../etc/passwd')).toBe(false);
    expect(apakahPathUnggahanAman('profil/../../passwd')).toBe(false);
    expect(apakahPathUnggahanAman('/etc/passwd')).toBe(false);
    expect(apakahPathUnggahanAman('profil/abc.sh')).toBe(false);
    expect(apakahPathUnggahanAman('profil/abc.jpg.exe')).toBe(false);
    expect(apakahPathUnggahanAman('folderlain/abc.jpg')).toBe(false);
    expect(apakahPathUnggahanAman('profil/nama dengan spasi.jpg')).toBe(false);
  });
});
