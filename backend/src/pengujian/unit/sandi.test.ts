/**
 * Pengujian unit: utilitas kata sandi (bcrypt).
 * Memastikan hash dan perbandingan kata sandi bekerja dengan benar.
 */

import { describe, expect, it } from 'vitest';
import {
  bandingkanKataSandi,
  hashKataSandi,
} from '../../utils/sandi.js';

describe('utilitas kata sandi', () => {
  it('menghasilkan hash yang tidak sama dengan kata sandi aslinya', async () => {
    const kataSandi = 'KataSandiRahasia123';
    const hash = await hashKataSandi(kataSandi);

    // Hash harus berbeda dari kata sandi polos
    expect(hash).not.toBe(kataSandi);
    // Hash bcrypt diawali dengan tanda $2
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('menghasilkan hash yang berbeda untuk kata sandi yang sama dua kali', async () => {
    const kataSandi = 'KataSandiSama123';
    const hashPertama = await hashKataSandi(kataSandi);
    const hashKedua = await hashKataSandi(kataSandi);

    // Karena ada garam acak, dua hash tidak boleh sama persis
    expect(hashPertama).not.toBe(hashKedua);
  });

  it('menerima kata sandi yang benar dan menolak yang salah', async () => {
    const kataSandiBenar = 'KataSandiBenar123';
    const hash = await hashKataSandi(kataSandiBenar);

    // Kata sandi yang benar harus cocok
    const cocok = await bandingkanKataSandi(kataSandiBenar, hash);
    expect(cocok).toBe(true);

    // Kata sandi yang salah harus ditolak
    const tidakCocok = await bandingkanKataSandi('KataSandiSalah123', hash);
    expect(tidakCocok).toBe(false);
  });
});
