/**
 * Pengujian unit: kompresi gambar.
 * Memastikan gambar jpg dan png dikompres menjadi lebih kecil
 * tanpa mengubah dimensi lebih dari batas yang ditentukan.
 */

import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { kompresGambar } from '../../utils/kompresi-gambar.js';

/** Membuat gambar uji berukuran besar dengan pola acak. */
async function buatGambarUji(format: 'jpeg' | 'png'): Promise<Buffer> {
  // Buat gambar 1500x1000 dengan banyak detail agar ukurannya besar
  const piksel = Buffer.alloc(1500 * 1000 * 4);
  for (let i = 0; i < piksel.length; i += 4) {
    piksel[i] = i % 251;
    piksel[i + 1] = (i * 7) % 251;
    piksel[i + 2] = (i * 13) % 251;
    piksel[i + 3] = 255;
  }

  if (format === 'png') {
    return sharp(piksel, { raw: { width: 1500, height: 1000, channels: 4 } })
      .png()
      .toBuffer();
  }
  return sharp(piksel, { raw: { width: 1500, height: 1000, channels: 4 } })
    .jpeg({ quality: 100 })
    .toBuffer();
}

/** Membuat gambar png polos besar agar kompresinya terjamin. */
async function buatGambarPngPolos(): Promise<Buffer> {
  // Gambar 1500x1000 dengan satu warna saja sangat mudah dikompres
  const pikselPolos = Buffer.alloc(1500 * 1000 * 4, 200);
  return sharp(pikselPolos, {
    raw: { width: 1500, height: 1000, channels: 4 },
  })
    .png()
    .toBuffer();
}

describe('kompresi gambar', () => {
  it('mengompres gambar jpeg menjadi jauh lebih kecil', async () => {
    const gambarAsli = await buatGambarUji('jpeg');
    const hasil = await kompresGambar(gambarAsli);

    // Hasil harus lebih kecil dari gambar aslinya
    expect(hasil.buffer.length).toBeLessThan(gambarAsli.length);
    expect(hasil.jenisMedia).toBe('image/jpeg');
    expect(hasil.ekstensi).toBe('jpg');
  });

  it('mengompres gambar png menjadi lebih kecil', async () => {
    const gambarAsli = await buatGambarPngPolos();
    const hasil = await kompresGambar(gambarAsli);

    expect(hasil.buffer.length).toBeLessThan(gambarAsli.length);
    expect(hasil.jenisMedia).toBe('image/png');
    expect(hasil.ekstensi).toBe('png');
  });

  it('memperkecil gambar yang lebarnya melebihi batas maksimal', async () => {
    const gambarAsli = await buatGambarUji('jpeg');
    const hasil = await kompresGambar(gambarAsli);

    // Lebar hasil tidak boleh melebihi 900 piksel
    const metadata = await sharp(hasil.buffer).metadata();
    expect(metadata.width).toBeLessThanOrEqual(900);
  });

  it('menolak berkas yang bukan gambar', async () => {
    // Berkas teks biasa disamarkan menjadi png
    const berkasTeks = Buffer.from('ini bukan gambar sama sekali');

    await expect(kompresGambar(berkasTeks)).rejects.toThrow();
  });
});
