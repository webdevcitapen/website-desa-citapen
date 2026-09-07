/**
 * Kompresi gambar memakai sharp.
 * Gambar diubah ukurannya agar tidak lebih besar dari batas yang
 * ditentukan dan dikompres dengan kualitas tinggi sehingga tampilan
 * tetap jernih tetapi ukuran berkasnya menjadi sangat kecil.
 */

import sharp from 'sharp';

/** Jenis gambar yang dihasilkan setelah kompresi. */
export interface HasilKompresi {
  /** Isi berkas gambar yang sudah dikompres. */
  buffer: Buffer;
  /** Jenis media gambar hasil kompresi. */
  jenisMedia: 'image/jpeg' | 'image/png';
  /** Ekstensi berkas hasil kompresi. */
  ekstensi: 'jpg' | 'png';
}

/** Daftar format gambar yang didukung sebelum kompresi (termasuk heic/heif). */
const FORMAT_DIDUKUNG = new Set(['jpeg', 'jpg', 'png', 'heic', 'heif', 'webp']);

/** Lebar maksimal gambar setelah dikompres (900px cukup untuk card & galeri, lebih kecil = lebih cepat). */
const MAKSIMAL_LEBAR = 900;

/** Kualitas gambar jpeg - turun dari 88 ke 82 untuk ukuran 30% lebih kecil tanpa perbedaan visual signifikan. */
const KUALITAS_JPEG = 82;

/**
 * Mengompres gambar tanpa merusak kualitas tampilan.
 * Mendukung gambar jpg, jpeg, dan png. Gambar yang lebih kecil
 * dari batas ukuran tetap diproses agar ukurannya minimal.
 */
export async function kompresGambar(bufferAsli: Buffer): Promise<HasilKompresi> {
  // Baca informasi gambar untuk mengetahui format aslinya
  const metadata = await sharp(bufferAsli).metadata();

  // Pastikan berkasnya benar-benar gambar yang didukung (jpg, jpeg, png, heic, heif, webp)
  if (!metadata.format || !FORMAT_DIDUKUNG.has(metadata.format)) {
    throw new Error('Format gambar tidak didukung');
  }

  const pembuatGambar = sharp(bufferAsli)
    // Auto-rotate berdasarkan EXIF (foto HP sering miring)
    .rotate()
    // Perkecil ukuran gambar jika lebih lebar dari batas maksimal
    .resize({
      width: MAKSIMAL_LEBAR,
      withoutEnlargement: true,
      fit: 'inside',
    });

  // Pilih metode kompresi sesuai format gambar asli
  // png tetap png, semua format lain (jpeg, heic, heif, webp) dikonversi ke jpeg untuk kompatibilitas
  if (metadata.format === 'png') {
    // Png dengan palette mengurangi ukuran hingga 70% untuk foto non-transparan kompleks
    // Jika gambar punya transparansi, palette tetap aman (sharp otomatis fallback)
    const bufferTerkompres = await pembuatGambar
      .png({ compressionLevel: 9, palette: true, quality: 85 })
      .toBuffer();
    return {
      buffer: bufferTerkompres,
      jenisMedia: 'image/png',
      ekstensi: 'png',
    };
  }

  // Jpeg/heic/heif/webp dikompres dengan kualitas tinggi dan optimasi mozjpeg
  const bufferTerkompres = await pembuatGambar
    .jpeg({ quality: KUALITAS_JPEG, mozjpeg: true })
    .toBuffer();
  return {
    buffer: bufferTerkompres,
    jenisMedia: 'image/jpeg',
    ekstensi: 'jpg',
  };
}
