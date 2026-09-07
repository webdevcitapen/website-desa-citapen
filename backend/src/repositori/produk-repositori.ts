/**
 * Repositori produk: semua query ke tabel produk.
 * Migrasi ke Drizzle ORM dengan left join ke kategori, pemilik, umkm.
 */

import { eq, and, desc, count, ilike, or } from 'drizzle-orm';
import { db } from '../config/database.js';
import { produk, kategoriProduk, pengguna, umkm } from '../db/schema.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

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
  cari?: string;
}

/** Mengubah baris join menjadi bentuk umum produk. */
function ubahKeProduk(baris: {
  id: number;
  nama: string;
  harga: string;
  deskripsi: string;
  foto: string | null;
  kategoriId: number | null;
  kategoriNama: string | null;
  pemilikId: number | null;
  pemilikUsername: string | null;
  pemilikNamaLengkap: string | null;
  pemilikFotoProfil: string | null;
  umkmId: number | null;
  umkmNama: string | null;
  umkmNomorHp: string | null;
  umkmAlamat: string | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
}): {
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
    id: baris.id,
    nama: baris.nama,
    harga: Number(baris.harga),
    deskripsi: baris.deskripsi,
    foto: baris.foto,
    kategori:
      baris.kategoriId !== null && baris.kategoriNama !== null
        ? { id: baris.kategoriId, nama: baris.kategoriNama }
        : { id: 0, nama: 'Umum' },
    pemilik:
      baris.pemilikId !== null && baris.pemilikUsername !== null
        ? {
            id: baris.pemilikId,
            username: baris.pemilikUsername,
            namaLengkap: baris.pemilikNamaLengkap ?? '',
            fotoProfil: baris.pemilikFotoProfil,
          }
        : null,
    umkm:
      baris.umkmId !== null && baris.umkmNama !== null
        ? {
            id: baris.umkmId,
            nama: baris.umkmNama,
            nomorHp: baris.umkmNomorHp,
            alamat: baris.umkmAlamat,
          }
        : null,
    dibuatPada: baris.dibuatPada,
    diperbaruiPada: baris.diperbaruiPada,
  };
}

/** Seleksi kolom produk + join untuk reuse. */
function seleksiProduk() {
  return {
    id: produk.id,
    nama: produk.nama,
    harga: produk.harga,
    deskripsi: produk.deskripsi,
    foto: produk.foto,
    kategoriId: produk.kategoriId,
    kategoriNama: kategoriProduk.nama,
    pemilikId: produk.pemilikId,
    pemilikUsername: pengguna.username,
    pemilikNamaLengkap: pengguna.namaLengkap,
    pemilikFotoProfil: pengguna.fotoProfil,
    umkmId: produk.umkmId,
    umkmNama: umkm.nama,
    umkmNomorHp: umkm.nomorHp,
    umkmAlamat: umkm.alamat,
    dibuatPada: produk.dibuatPada,
    diperbaruiPada: produk.diperbaruiPada,
  };
}

/** Membuat produk baru dan mengembalikan data lengkapnya. */
export async function buatProduk(
  data: DataProdukTersimpan,
): Promise<ReturnType<typeof ubahKeProduk>> {
  const hasil = await db
    .insert(produk)
    .values({
      nama: data.nama,
      harga: String(data.harga),
      deskripsi: data.deskripsi,
      foto: data.foto,
      pemilikId: data.pemilikId,
      kategoriId: data.kategoriId as number,
      umkmId: data.umkmId,
    })
    .returning({ id: produk.id });

  const idBaru = hasil[0].id;
  const produkBaru = await temukanProdukBerdasarkanId(idBaru);
  if (!produkBaru) throw new KesalahanTidakDitemukan('Produk tidak ditemukan');
  return produkBaru;
}

/** Mencari produk berdasarkan id beserta kategori, pemilik, dan UMKM-nya. */
export async function temukanProdukBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeProduk> | null> {
  const baris = await db
    .select(seleksiProduk())
    .from(produk)
    .leftJoin(kategoriProduk, eq(produk.kategoriId, kategoriProduk.id))
    .leftJoin(pengguna, eq(produk.pemilikId, pengguna.id))
    .leftJoin(umkm, eq(produk.umkmId, umkm.id))
    .where(eq(produk.id, id))
    .limit(1);
  return baris[0] ? ubahKeProduk(baris[0]) : null;
}

/** Menghitung jumlah produk dengan penyaring opsional. */
export async function hitungProduk(
  kategoriId?: number,
  pemilikId?: number,
  umkmId?: number,
  cari?: string,
): Promise<number> {
  const kondisi = [];
  if (kategoriId) kondisi.push(eq(produk.kategoriId, kategoriId));
  if (pemilikId) kondisi.push(eq(produk.pemilikId, pemilikId));
  if (umkmId) kondisi.push(eq(produk.umkmId, umkmId));
  if (cari && cari.trim().length > 0) {
    const pola = `%${cari.trim()}%`;
    kondisi.push(or(ilike(produk.nama, pola), ilike(produk.deskripsi, pola)) as ReturnType<typeof eq>);
  }

  const where = kondisi.length > 0 ? and(...kondisi) : undefined;
  const hasil = await db.select({ total: count() }).from(produk).where(where);
  return hasil[0]?.total ?? 0;
}

/**
 * Mengambil daftar produk dengan paginasi dan penyaring.
 * Mendukung pencarian nama/deskripsi (ilike) untuk performa.
 */
export async function daftarProduk(
  parameter: ParameterDaftarProduk,
): Promise<ReturnType<typeof ubahKeProduk>[]> {
  const kondisi = [];
  if (parameter.kategoriId) kondisi.push(eq(produk.kategoriId, parameter.kategoriId));
  if (parameter.pemilikId) kondisi.push(eq(produk.pemilikId, parameter.pemilikId));
  if (parameter.umkmId) kondisi.push(eq(produk.umkmId, parameter.umkmId));
  if (parameter.cari && parameter.cari.trim().length > 0) {
    const pola = `%${parameter.cari.trim()}%`;
    kondisi.push(or(ilike(produk.nama, pola), ilike(produk.deskripsi, pola)) as ReturnType<typeof eq>);
  }

  const where = kondisi.length > 0 ? and(...kondisi) : undefined;

  const baris = await db
    .select(seleksiProduk())
    .from(produk)
    .leftJoin(kategoriProduk, eq(produk.kategoriId, kategoriProduk.id))
    .leftJoin(pengguna, eq(produk.pemilikId, pengguna.id))
    .leftJoin(umkm, eq(produk.umkmId, umkm.id))
    .where(where)
    .orderBy(desc(produk.dibuatPada))
    .limit(parameter.batas)
    .offset(parameter.lewati);

  return baris.map(ubahKeProduk);
}

/** Mengambil produk terbaru dalam jumlah tertentu (untuk halaman beranda). */
export async function daftarProdukTerbaru(
  jumlah: number,
): Promise<ReturnType<typeof ubahKeProduk>[]> {
  const baris = await db
    .select(seleksiProduk())
    .from(produk)
    .leftJoin(kategoriProduk, eq(produk.kategoriId, kategoriProduk.id))
    .leftJoin(pengguna, eq(produk.pemilikId, pengguna.id))
    .leftJoin(umkm, eq(produk.umkmId, umkm.id))
    .orderBy(desc(produk.dibuatPada))
    .limit(jumlah);
  return baris.map(ubahKeProduk);
}

/** Memperbarui produk dan mengembalikan data terbarunya. */
export async function perbaruiProduk(
  id: number,
  data: Pick<DataProdukTersimpan, 'nama' | 'harga' | 'deskripsi' | 'foto' | 'kategoriId' | 'umkmId'>,
): Promise<ReturnType<typeof ubahKeProduk>> {
  const hasil = await db
    .update(produk)
    .set({
      nama: data.nama,
      harga: String(data.harga),
      deskripsi: data.deskripsi,
      foto: data.foto,
      kategoriId: data.kategoriId as number,
      umkmId: data.umkmId,
      diperbaruiPada: new Date(),
    })
    .where(eq(produk.id, id))
    .returning({ id: produk.id });

  if (!hasil[0]) throw new KesalahanTidakDitemukan('Produk tidak ditemukan');

  const terbaru = await temukanProdukBerdasarkanId(hasil[0].id);
  if (!terbaru) throw new KesalahanTidakDitemukan('Produk tidak ditemukan');
  return terbaru;
}

/** Menghapus produk berdasarkan id. */
export async function hapusProduk(id: number): Promise<void> {
  const hasil = await db.delete(produk).where(eq(produk.id, id)).returning({ id: produk.id });
  if (hasil.length === 0) throw new KesalahanTidakDitemukan('Produk tidak ditemukan');
}
