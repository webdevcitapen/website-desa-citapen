/**
 * Repositori produk: semua query ke tabel produk.
 * Query selalu berparameter dan daftar produk selalu memakai
 * paginasi (limit dan offset) demi performa yang tinggi.
 */

import { kumpulanKoneksi } from '../config/database.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Bentuk baris produk yang dikembalikan postgresql. */
interface BarisProduk {
  id: string;
  nama: string;
  harga: string;
  deskripsi: string;
  foto: string | null;
  kategori_id: string | null;
  kategori_nama: string | null;
  pemilik_id: string | null;
  pemilik_username: string | null;
  pemilik_nama_lengkap: string | null;
  pemilik_foto_profil: string | null;
  umkm_id: string | null;
  umkm_nama: string | null;
  umkm_nomor_hp: string | null;
  umkm_alamat: string | null;
  dibuat_pada: Date;
  diperbarui_pada: Date;
}

/** Data untuk membuat atau memperbarui produk. */
export interface DataProdukTersimpan {
  nama: string;
  harga: number;
  deskripsi: string;
  foto: string | null;
  pemilikId: number;
  kategoriId: number | null;
  umkmId: number | null;
}

/** Parameter pencarian daftar produk. */
export interface ParameterDaftarProduk {
  batas: number;
  lewati: number;
  kategoriId?: number;
  pemilikId?: number;
  umkmId?: number;
}

/** Mengubah baris produk dari database menjadi bentuk umum. */
function ubahKeProduk(baris: BarisProduk): {
  id: number;
  nama: string;
  harga: number;
  deskripsi: string;
  foto: string | null;
  kategori: { id: number; nama: string } | null;
  pemilik: {
    id: number;
    username: string;
    namaLengkap: string;
    fotoProfil: string | null;
  } | null;
  umkm: { id: number; nama: string; nomorHp: string | null; alamat: string | null } | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
} {
  return {
    id: Number(baris.id),
    nama: baris.nama,
    // harga disimpan sebagai teks oleh pg, ubah menjadi angka
    harga: Number(baris.harga),
    deskripsi: baris.deskripsi,
    foto: baris.foto,
    kategori:
      baris.kategori_id !== null && baris.kategori_nama !== null
        ? { id: Number(baris.kategori_id), nama: baris.kategori_nama }
        : null,
    pemilik:
      baris.pemilik_id !== null && baris.pemilik_username !== null
        ? {
            id: Number(baris.pemilik_id),
            username: baris.pemilik_username,
            namaLengkap: baris.pemilik_nama_lengkap ?? '',
            fotoProfil: baris.pemilik_foto_profil,
          }
        : null,
    umkm:
      baris.umkm_id !== null && baris.umkm_nama !== null
        ? {
            id: Number(baris.umkm_id),
            nama: baris.umkm_nama,
            nomorHp: baris.umkm_nomor_hp,
            alamat: baris.umkm_alamat,
          }
        : null,
    dibuatPada: baris.dibuat_pada,
    diperbaruiPada: baris.diperbarui_pada,
  };
}

/** Potongan query kolom yang dipakai untuk bergabung dengan tabel lain. */
const KOLOM_PRODUK =
  `pr.id, pr.nama, pr.harga, pr.deskripsi, pr.foto, ` +
  `pr.kategori_id, k.nama AS kategori_nama, ` +
  `pr.pemilik_id, p.username AS pemilik_username, ` +
  `p.nama_lengkap AS pemilik_nama_lengkap, ` +
  `p.foto_profil AS pemilik_foto_profil, ` +
  `pr.umkm_id, u.nama AS umkm_nama, u.nomor_hp AS umkm_nomor_hp, u.alamat AS umkm_alamat, ` +
  `pr.dibuat_pada, pr.diperbarui_pada`;

/** Membuat produk baru dan mengembalikan data lengkapnya. */
export async function buatProduk(
  data: DataProdukTersimpan,
): Promise<ReturnType<typeof ubahKeProduk>> {
  // Simpan produk dulu, lalu ambil data lengkapnya beserta kategori & UMKM
  const hasil = await kumpulanKoneksi.query<{ id: string }>(
    `INSERT INTO produk (nama, harga, deskripsi, foto, pemilik_id, kategori_id, umkm_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [data.nama, data.harga, data.deskripsi, data.foto, data.pemilikId, data.kategoriId, data.umkmId],
  );

  const produk = await temukanProdukBerdasarkanId(Number(hasil.rows[0].id));
  if (!produk) {
    throw new KesalahanTidakDitemukan('Produk tidak ditemukan');
  }
  return produk;
}

/** Mencari produk berdasarkan id beserta kategori, pemilik, dan UMKM-nya. */
export async function temukanProdukBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeProduk> | null> {
  const hasil = await kumpulanKoneksi.query<BarisProduk>(
    `SELECT ${KOLOM_PRODUK}
       FROM produk pr
       LEFT JOIN kategori_produk k ON k.id = pr.kategori_id
       LEFT JOIN pengguna p ON p.id = pr.pemilik_id
       LEFT JOIN umkm u ON u.id = pr.umkm_id
      WHERE pr.id = $1
      LIMIT 1`,
    [id],
  );
  const baris = hasil.rows[0];
  return baris ? ubahKeProduk(baris) : null;
}

/** Menghitung jumlah produk dengan penyaring opsional. */
export async function hitungProduk(
  kategoriId?: number,
  pemilikId?: number,
  umkmId?: number,
): Promise<number> {
  const kondisi: string[] = [];
  const nilai: unknown[] = [];

  if (kategoriId) {
    nilai.push(kategoriId);
    kondisi.push(`kategori_id = $${nilai.length}`);
  }
  if (pemilikId) {
    nilai.push(pemilikId);
    kondisi.push(`pemilik_id = $${nilai.length}`);
  }
  if (umkmId) {
    nilai.push(umkmId);
    kondisi.push(`umkm_id = $${nilai.length}`);
  }

  const klausaWhere = kondisi.length > 0 ? `WHERE ${kondisi.join(' AND ')}` : '';

  const hasil = await kumpulanKoneksi.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total
       FROM produk
       ${klausaWhere}`,
    nilai,
  );
  return hasil.rows[0]?.total ?? 0;
}

/**
 * Mengambil daftar produk dengan paginasi dan penyaring.
 * Query dibatasi limit dan offset untuk performa pada traffic tinggi.
 */
export async function daftarProduk(
  parameter: ParameterDaftarProduk,
): Promise<ReturnType<typeof ubahKeProduk>[]> {
  const kondisi: string[] = [];
  const nilai: unknown[] = [];

  // Susun penyaring dari potongan query yang tetap dan parameter
  if (parameter.kategoriId) {
    nilai.push(parameter.kategoriId);
    kondisi.push(`pr.kategori_id = $${nilai.length}`);
  }
  if (parameter.pemilikId) {
    nilai.push(parameter.pemilikId);
    kondisi.push(`pr.pemilik_id = $${nilai.length}`);
  }
  if (parameter.umkmId) {
    nilai.push(parameter.umkmId);
    kondisi.push(`pr.umkm_id = $${nilai.length}`);
  }

  const klausaWhere = kondisi.length > 0 ? `WHERE ${kondisi.join(' AND ')}` : '';

  nilai.push(parameter.batas, parameter.lewati);

  const hasil = await kumpulanKoneksi.query<BarisProduk>(
    `SELECT ${KOLOM_PRODUK}
       FROM produk pr
       LEFT JOIN kategori_produk k ON k.id = pr.kategori_id
       LEFT JOIN pengguna p ON p.id = pr.pemilik_id
       LEFT JOIN umkm u ON u.id = pr.umkm_id
       ${klausaWhere}
      ORDER BY pr.dibuat_pada DESC
      LIMIT $${nilai.length - 1} OFFSET $${nilai.length}`,
    nilai,
  );
  return hasil.rows.map(ubahKeProduk);
}

/** Mengambil produk terbaru dalam jumlah tertentu (untuk halaman beranda). */
export async function daftarProdukTerbaru(
  jumlah: number,
): Promise<ReturnType<typeof ubahKeProduk>[]> {
  const hasil = await kumpulanKoneksi.query<BarisProduk>(
    `SELECT ${KOLOM_PRODUK}
       FROM produk pr
       LEFT JOIN kategori_produk k ON k.id = pr.kategori_id
       LEFT JOIN pengguna p ON p.id = pr.pemilik_id
       LEFT JOIN umkm u ON u.id = pr.umkm_id
      ORDER BY pr.dibuat_pada DESC
      LIMIT $1`,
    [jumlah],
  );
  return hasil.rows.map(ubahKeProduk);
}

/** Memperbarui produk dan mengembalikan data terbarunya. */
export async function perbaruiProduk(
  id: number,
  data: Pick<DataProdukTersimpan, 'nama' | 'harga' | 'deskripsi' | 'foto' | 'kategoriId' | 'umkmId'>,
): Promise<ReturnType<typeof ubahKeProduk>> {
  // Perbarui produk dulu, lalu ambil data lengkapnya beserta kategori & UMKM
  const hasil = await kumpulanKoneksi.query<{ id: string }>(
    `UPDATE produk pr
        SET nama = $2,
            harga = $3,
            deskripsi = $4,
            foto = $5,
            kategori_id = $6,
            umkm_id = $7,
            diperbarui_pada = NOW()
      WHERE pr.id = $1
     RETURNING id`,
    [id, data.nama, data.harga, data.deskripsi, data.foto, data.kategoriId, data.umkmId],
  );
  if (!hasil.rows[0]) {
    throw new KesalahanTidakDitemukan('Produk tidak ditemukan');
  }

  const produk = await temukanProdukBerdasarkanId(Number(hasil.rows[0].id));
  if (!produk) {
    throw new KesalahanTidakDitemukan('Produk tidak ditemukan');
  }
  return produk;
}

/** Menghapus produk berdasarkan id (wajib memakai klausa where). */
export async function hapusProduk(id: number): Promise<void> {
  const hasil = await kumpulanKoneksi.query(
    `DELETE FROM produk
      WHERE id = $1`,
    [id],
  );
  if (!hasil.rowCount) {
    throw new KesalahanTidakDitemukan('Produk tidak ditemukan');
  }
}
