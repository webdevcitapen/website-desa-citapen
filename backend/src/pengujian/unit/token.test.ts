/**
 * Pengujian unit: utilitas token jwt.
 * Memastikan pembuatan dan pemeriksaan token bekerja dengan benar.
 */

import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { buatToken, periksaToken } from '../../utils/token.js';
import { KesalahanAutentikasi } from '../../utils/kesalahan.js';
import { lingkungan } from '../../config/env.js';

describe('utilitas token jwt', () => {
  it('membuat token yang dapat diperiksa kembali', () => {
    const infoPengguna = { id: 7, peran: 'publikasi' } as const;

    const token = buatToken(infoPengguna);
    const hasilPeriksa = periksaToken(token);

    expect(hasilPeriksa.id).toBe(7);
    expect(hasilPeriksa.peran).toBe('publikasi');
  });

  it('menolak token yang sudah diubah isinya', () => {
    const token = buatToken({ id: 1, peran: 'admin' });

    // Ubah salah satu karakter token agar tanda tangannya rusak
    const tokenRusak = token.slice(0, -4) + 'abcd';

    expect(() => periksaToken(tokenRusak)).toThrow(KesalahanAutentikasi);
  });

  it('menolak teks yang bukan token sama sekali', () => {
    expect(() => periksaToken('bukan-token')).toThrow(KesalahanAutentikasi);
  });

  it('menolak token dengan peran yang tidak dikenal', () => {
    // Buat token bertanda tangan sah tetapi berisi peran tidak dikenal
    const tokenTidakSah = jwt.sign(
      { id: 1, peran: 'hacker' },
      lingkungan.JWT_RAHASIA,
      { issuer: 'desa-citapen-backend' },
    );

    expect(() => periksaToken(tokenTidakSah)).toThrow(KesalahanAutentikasi);
  });
});
