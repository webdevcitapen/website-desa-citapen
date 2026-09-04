/**
 * Repositori berita: semua query ke tabel berita.
 * Query selalu memakai parameter untuk mencegah sql injection
 * dan selalu dibatasi (limit) untuk menghindari beban berlebih.
 */

import { kumpulanKoneksi } from '../config/database.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Bentuk baris berita beserta penulis yang dikembalikan postgresql. */
interface BarisBerita {
  id: string;
  judul: string;
  isi: string;
  gambar: string | null;
  penulis_id: string | null;
  penulis_username: string | null;
  penulis_nama_lengkap: string | null;
  penulis_foto_profil: string | null;
  dibuat_pada: Date;
  diperbarui_pada: Date;
}

/** Data untuk membuat atau memperbarui berita. */
export interface DataBeritaTersimpan {
  judul: string;
  isi: string;
  gambar: string | null;
  penulisId: number;
}

/** Parameter pencarian daftar berita. */
export interface ParameterDaftarBerita {
  batas: number;
  lewati: number;
}

/** Mengubah baris berita dari database menjadi bentuk umum. */
function ubahKeBerita(baris: BarisBerita): {
  id: number;
  judul: string;
  isi: string;
  gambar: string | null;
  penulis: {
    id: number;
    username: string;
    namaLengkap: string;
    fotoProfil: string | null;
  } | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
} {
  return {
    id: Number(baris.id),
    judul: baris.judul,
    isi: baris.isi,
    gambar: baris.gambar,
    penulis:
      baris.penulis_id !== null && baris.penulis_username !== null
        ? {
            id: Number(baris.penulis_id),
            username: baris.penulis_username,
            namaLengkap: baris.penulis_nama_lengkap ?? '',
            fotoProfil: baris.penulis_foto_profil,
          }
        : null,
    dibuatPada: baris.dibuat_pada,
    diperbaruiPada: baris.diperbarui_pada,
  };
}

/** Potongan query kolom yang dipakai untuk bergabung dengan penulis. */
const KOLOM_BERITA =
  `b.id, b.judul, b.isi, b.gambar, ` +
  `b.penulis_id, p.username AS penulis_username, ` +
  `p.nama_lengkap AS penulis_nama_lengkap, ` +
  `p.foto_profil AS penulis_foto_profil, ` +
  `b.dibuat_pada, b.diperbarui_pada`;

/** Membuat berita baru dan mengembalikan data lengkapnya. */
export async function buatBerita(
  data: DataBeritaTersimpan,
): Promise<ReturnType<typeof ubahKeBerita>> {
  // Simpan berita dulu, lalu ambil data lengkapnya beserta penulis
  const hasil = await kumpulanKoneksi.query<{ id: string }>(
    `INSERT INTO berita (judul, isi, gambar, penulis_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [data.judul, data.isi, data.gambar, data.penulisId],
  );

  const berita = await temukanBeritaBerdasarkanId(Number(hasil.rows[0].id));
  if (!berita) {
    throw new KesalahanTidakDitemukan('Berita tidak ditemukan');
  }
  return berita;
}

/** Mencari berita berdasarkan id beserta informasi penulisnya. */
export async function temukanBeritaBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeBerita> | null> {
  const hasil = await kumpulanKoneksi.query<BarisBerita>(
    `SELECT ${KOLOM_BERITA}
       FROM berita b
       LEFT JOIN pengguna p ON p.id = b.penulis_id
      WHERE b.id = $1
      LIMIT 1`,
    [id],
  );
  const baris = hasil.rows[0];
  return baris ? ubahKeBerita(baris) : null;
}

/** Menghitung jumlah total berita. */
export async function hitungBerita(): Promise<number> {
  const hasil = await kumpulanKoneksi.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total
       FROM berita`,
  );
  return hasil.rows[0]?.total ?? 0;
}

/**
 * Mengambil daftar berita dengan paginasi, diurutkan terbaru dulu.
 * Selalu memakai limit dan offset untuk melindungi tabel besar.
 */
export async function daftarBerita(
  parameter: ParameterDaftarBerita,
): Promise<ReturnType<typeof ubahKeBerita>[]> {
  const hasil = await kumpulanKoneksi.query<BarisBerita>(
    `SELECT ${KOLOM_BERITA}
       FROM berita b
       LEFT JOIN pengguna p ON p.id = b.penulis_id
      ORDER BY b.dibuat_pada DESC
      LIMIT $1 OFFSET $2`,
    [parameter.batas, parameter.lewati],
  );
  return hasil.rows.map(ubahKeBerita);
}

/** Mengambil berita terbaru dalam jumlah tertentu (untuk halaman beranda). */
export async function daftarBeritaTerbaru(
  jumlah: number,
): Promise<ReturnType<typeof ubahKeBerita>[]> {
  const hasil = await kumpulanKoneksi.query<BarisBerita>(
    `SELECT ${KOLOM_BERITA}
       FROM berita b
       LEFT JOIN pengguna p ON p.id = b.penulis_id
      ORDER BY b.dibuat_pada DESC
      LIMIT $1`,
    [jumlah],
  );
  return hasil.rows.map(ubahKeBerita);
}

/** Memperbarui berita dan mengembalikan data terbarunya. */
export async function perbaruiBerita(
  id: number,
  data: Pick<DataBeritaTersimpan, 'judul' | 'isi' | 'gambar'>,
): Promise<ReturnType<typeof ubahKeBerita>> {
  // Perbarui berita dulu, lalu ambil data lengkapnya beserta penulis
  const hasil = await kumpulanKoneksi.query<{ id: string }>(
    `UPDATE berita b
        SET judul = $2,
            isi = $3,
            gambar = $4,
            diperbarui_pada = NOW()
      WHERE b.id = $1
     RETURNING id`,
    [id, data.judul, data.isi, data.gambar],
  );
  if (!hasil.rows[0]) {
    throw new KesalahanTidakDitemukan('Berita tidak ditemukan');
  }

  const berita = await temukanBeritaBerdasarkanId(Number(hasil.rows[0].id));
  if (!berita) {
    throw new KesalahanTidakDitemukan('Berita tidak ditemukan');
  }
  return berita;
}

/** Menghapus berita berdasarkan id (wajib memakai klausa where). */
export async function hapusBerita(id: number): Promise<void> {
  const hasil = await kumpulanKoneksi.query(
    `DELETE FROM berita
      WHERE id = $1`,
    [id],
  );
  if (!hasil.rowCount) {
    throw new KesalahanTidakDitemukan('Berita tidak ditemukan');
  }
}
