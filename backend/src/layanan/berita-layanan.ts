/**
 * Layanan berita: membuat, membaca, mengubah, dan menghapus berita.
 * Hanya penulis berita atau admin desa yang boleh mengubah dan
 * menghapus berita (pemeriksaan kepemilikan dilakukan di sini).
 */

import type { BerkasUnggahan, DataBerita, Peran } from '../types/index.js';
import {
  KesalahanOtorisasi,
  KesalahanTidakDitemukan,
} from '../utils/kesalahan.js';
import { kompresGambar } from '../utils/kompresi-gambar.js';
import { hapusBerkas, simpanBerkas, dapatkanUrlBerkasUntukKlien } from '../utils/berkas.js';
import { logger } from '../utils/logger.js';
import {
  buatBerita as buatBeritaRepositori,
  daftarBerita as daftarBeritaRepositori,
  hapusBerita,
  hitungBerita,
  perbaruiBerita,
  temukanBeritaBerdasarkanId,
} from '../repositori/berita-repositori.js';
import type { HasilPaginasi } from '../types/index.js';
import { hitungTotalHalaman } from '../utils/paginasi.js';

/** Data untuk membuat atau memperbarui berita. */
export interface DataSimpanBerita {
  judul: string;
  isi: string;
  kategori?: string;
}

/** Parameter untuk mengambil daftar berita. */
export interface ParameterDaftarBeritaLayanan {
  halaman: number;
  perHalaman: number;
  lewati: number;
  batas: number;
  kategori?: string;
  cari?: string;
}

/** Mengubah gambar berita yang diunggah menjadi path yang aman. */
async function siapkanGambarBerita(
  berkas: BerkasUnggahan | undefined,
  gambarLama: string | null,
): Promise<string | null> {
  // Tidak ada berkas baru, pertahankan gambar lama
  if (!berkas) {
    return gambarLama;
  }

  const hasilKompresi = await kompresGambar(berkas.buffer);
  const pathBaru = await simpanBerkas(
    hasilKompresi.buffer,
    'berita',
    hasilKompresi.ekstensi,
  );

  // Hapus gambar lama yang diganti
  if (gambarLama) {
    await hapusBerkas(gambarLama);
  }

  return pathBaru;
}

/** Membuat berita baru oleh admin desa atau publikasi. */
export async function tambahBerita(
  penulisId: number,
  data: DataSimpanBerita,
  berkasGambar?: BerkasUnggahan,
): Promise<DataBerita> {
  let gambar: string | null = null;

  try {
    gambar = await siapkanGambarBerita(berkasGambar, null);
    const berita = await buatBeritaRepositori({
      judul: data.judul,
      isi: data.isi,
      gambar,
      kategori: data.kategori ?? 'Umum',
      penulisId,
    });

    logger.info(
      { beritaId: berita.id, penulisId },
      'Berita baru berhasil dibuat',
    );

    return perkayaGambarBerita(berita);
  } catch (kesalahan) {
    // Bersihkan berkas gambar jika penyimpanan berita gagal
    if (gambar) {
      await hapusBerkas(gambar);
    }
    throw kesalahan;
  }
}

/** Mengubah path gambar di dalam DataBerita menjadi URL publik CDN jika Supabase aktif. */
function perkayaGambarBerita<T extends { gambar: string | null }>(item: T): T {
  return {
    ...item,
    gambar: dapatkanUrlBerkasUntukKlien(item.gambar) as T['gambar'],
  };
}

/** Mengambil daftar berita dengan paginasi untuk publik. */
export async function ambilDaftarBerita(
  parameter: ParameterDaftarBeritaLayanan,
): Promise<HasilPaginasi<DataBerita>> {
  // Parallelkan 2 query agar waktu respons setengah
  const [daftar, total] = await Promise.all([
    daftarBeritaRepositori({
      batas: parameter.batas,
      lewati: parameter.lewati,
      kategori: parameter.kategori,
      cari: parameter.cari,
    }),
    hitungBerita(parameter.kategori, parameter.cari),
  ]);

  const daftarDenganUrl = daftar.map(perkayaGambarBerita);

  return {
    daftar: daftarDenganUrl,
    halaman: parameter.halaman,
    perHalaman: parameter.perHalaman,
    total,
    totalHalaman: hitungTotalHalaman(total, parameter.perHalaman),
  };
}

/** Mengambil detail satu berita untuk publik. */
export async function ambilDetailBerita(id: number): Promise<DataBerita> {
  const berita = await temukanBeritaBerdasarkanId(id);
  if (!berita) {
    throw new KesalahanTidakDitemukan('Berita tidak ditemukan');
  }
  return perkayaGambarBerita(berita);
}

/**
 * Mengubah berita. Hanya penulis berita atau admin desa yang boleh.
 */
export async function ubahBerita(
  id: number,
  penggunaId: number,
  _peran: Peran,
  data: DataSimpanBerita,
  berkasGambar?: BerkasUnggahan,
): Promise<DataBerita> {
  const berita = await temukanBeritaBerdasarkanId(id);
  if (!berita) {
    throw new KesalahanTidakDitemukan('Berita tidak ditemukan');
  }

  // Hanya penulis berita yang boleh mengubah berita
  if (berita.penulis?.id !== penggunaId) {
    throw new KesalahanOtorisasi('Anda hanya dapat mengubah berita milik Anda');
  }

  let gambar = berita.gambar;
  try {
    gambar = await siapkanGambarBerita(berkasGambar, berita.gambar);
    const beritaDiperbarui = await perbaruiBerita(id, {
      judul: data.judul,
      isi: data.isi,
      gambar,
      kategori: data.kategori ?? berita.kategori ?? 'Umum',
    });

    logger.info(
      { beritaId: id, penggunaId },
      'Berita berhasil diperbarui',
    );

    return perkayaGambarBerita(beritaDiperbarui);
  } catch (kesalahan) {
    // Jika berkas baru berhasil disimpan tetapi penyimpanan gagal,
    // hapus berkas baru dan kembalikan gambar lama
    if (berkasGambar && gambar !== berita.gambar && gambar) {
      await hapusBerkas(gambar);
    }
    throw kesalahan;
  }
}

/** Menghapus berita. Hanya penulis berita atau admin desa yang boleh. */
export async function hapusBeritaDenganPemeriksaan(
  id: number,
  penggunaId: number,
  peran: Peran,
): Promise<void> {
  const berita = await temukanBeritaBerdasarkanId(id);
  if (!berita) {
    throw new KesalahanTidakDitemukan('Berita tidak ditemukan');
  }

  if (peran !== 'admin' && berita.penulis?.id !== penggunaId) {
    throw new KesalahanOtorisasi('Anda hanya dapat menghapus berita milik Anda');
  }

  await hapusBerita(id);

  // Hapus gambar berita yang tersimpan
  if (berita.gambar) {
    await hapusBerkas(berita.gambar);
  }

  logger.info(
    { beritaId: id, penggunaId },
    'Berita berhasil dihapus',
  );
}
