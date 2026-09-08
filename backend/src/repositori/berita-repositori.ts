/**
 * Repositori berita: semua query ke tabel berita.
 * Migrasi ke Drizzle ORM (drizzle-orm/node-postgres) dengan
 * join ke pengguna untuk info penulis.
 */

import { eq, desc, count, ilike, or, and } from 'drizzle-orm';
import { db } from '../config/database.js';
import { berita, pengguna } from '../db/schema.js';
import { KesalahanTidakDitemukan } from '../utils/kesalahan.js';

/** Data untuk membuat atau memperbarui berita. */
export interface DataBeritaTersimpan {
  judul: string;
  isi: string;
  gambar: string | null;
  kategori: string;
  penulisId: number;
}

/** Parameter pencarian daftar berita. */
export interface ParameterDaftarBerita {
  batas: number;
  lewati: number;
  kategori?: string;
  cari?: string;
}

/** Bentuk berita yang dikembalikan ke layanan. */
function ubahKeBerita(baris: {
  id: number;
  judul: string;
  isi: string;
  gambar: string | null;
  kategori: string | null;
  penulisId: number | null;
  penulisUsername: string | null;
  penulisNamaLengkap: string | null;
  penulisFotoProfil: string | null;
  penulisPeran: string | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
}): {
  id: number;
  judul: string;
  isi: string;
  gambar: string | null;
  kategori: string;
  penulis: {
    id: number;
    username: string;
    namaLengkap: string;
    fotoProfil: string | null;
    peran: 'admin' | 'publikasi';
  } | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
} {
  return {
    id: baris.id,
    judul: baris.judul,
    isi: baris.isi,
    gambar: baris.gambar,
    kategori: baris.kategori ?? 'Umum',
    penulis:
      baris.penulisId !== null && baris.penulisUsername !== null
        ? {
            id: baris.penulisId,
            username: baris.penulisUsername,
            namaLengkap: baris.penulisNamaLengkap ?? '',
            fotoProfil: baris.penulisFotoProfil,
            peran: baris.penulisPeran === 'admin' ? 'admin' : 'publikasi',
          }
        : null,
    dibuatPada: baris.dibuatPada,
    diperbaruiPada: baris.diperbaruiPada,
  };
}

/** Helper select kolom berita + penulis (untuk left join). */
function seleksiBeritaDenganPenulis() {
  return {
    id: berita.id,
    judul: berita.judul,
    isi: berita.isi,
    gambar: berita.gambar,
    kategori: berita.kategori,
    penulisId: berita.penulisId,
    penulisUsername: pengguna.username,
    penulisNamaLengkap: pengguna.namaLengkap,
    penulisFotoProfil: pengguna.fotoProfil,
    penulisPeran: pengguna.peran,
    dibuatPada: berita.dibuatPada,
    diperbaruiPada: berita.diperbaruiPada,
  };
}

/** Membuat berita baru dan mengembalikan data lengkapnya. */
export async function buatBerita(
  data: DataBeritaTersimpan,
): Promise<ReturnType<typeof ubahKeBerita>> {
  const hasil = await db
    .insert(berita)
    .values({
      judul: data.judul,
      isi: data.isi,
      gambar: data.gambar,
      kategori: data.kategori ?? 'Umum',
      penulisId: data.penulisId,
    })
    .returning({ id: berita.id });

  const idBaru = hasil[0].id;
  const beritaBaru = await temukanBeritaBerdasarkanId(idBaru);
  if (!beritaBaru) {
    throw new KesalahanTidakDitemukan('Berita tidak ditemukan');
  }
  return beritaBaru;
}

/** Mencari berita berdasarkan id beserta informasi penulisnya. */
export async function temukanBeritaBerdasarkanId(
  id: number,
): Promise<ReturnType<typeof ubahKeBerita> | null> {
  const baris = await db
    .select(seleksiBeritaDenganPenulis())
    .from(berita)
    .leftJoin(pengguna, eq(berita.penulisId, pengguna.id))
    .where(eq(berita.id, id))
    .limit(1);

  const data = baris[0];
  return data ? ubahKeBerita(data) : null;
}

/** Menghitung jumlah total berita (dengan filter kategori & pencarian opsional). */
export async function hitungBerita(kategori?: string, cari?: string): Promise<number> {
  const kondisi: ReturnType<typeof eq>[] = [];
  if (kategori) kondisi.push(eq(berita.kategori, kategori) as ReturnType<typeof eq>);
  if (cari && cari.trim().length > 0) {
    const pola = `%${cari.trim()}%`;
    kondisi.push(
      or(ilike(berita.judul, pola), ilike(berita.isi, pola)) as ReturnType<typeof eq>,
    );
  }
  const where = kondisi.length > 0 ? and(...kondisi) : undefined;
  const hasil = await db.select({ total: count() }).from(berita).where(where);
  return hasil[0]?.total ?? 0;
}

/**
 * Mengambil daftar berita dengan paginasi, diurutkan terbaru dulu.
 * Selalu memakai limit dan offset untuk melindungi tabel besar.
 * Mendukung filter kategori dan pencarian judul/isi (ilike) untuk performa.
 */
export async function daftarBerita(
  parameter: ParameterDaftarBerita,
): Promise<ReturnType<typeof ubahKeBerita>[]> {
  const kondisi: ReturnType<typeof eq>[] = [];
  if (parameter.kategori) kondisi.push(eq(berita.kategori, parameter.kategori) as ReturnType<typeof eq>);
  if (parameter.cari && parameter.cari.trim().length > 0) {
    const pola = `%${parameter.cari.trim()}%`;
    kondisi.push(
      or(ilike(berita.judul, pola), ilike(berita.isi, pola)) as ReturnType<typeof eq>,
    );
  }
  const where = kondisi.length > 0 ? and(...kondisi) : undefined;

  const baris = await db
    .select(seleksiBeritaDenganPenulis())
    .from(berita)
    .leftJoin(pengguna, eq(berita.penulisId, pengguna.id))
    .where(where)
    .orderBy(desc(berita.dibuatPada))
    .limit(parameter.batas)
    .offset(parameter.lewati);
  return baris.map(ubahKeBerita);
}

/** Mengambil berita terbaru dalam jumlah tertentu (untuk halaman beranda). */
export async function daftarBeritaTerbaru(
  jumlah: number,
): Promise<ReturnType<typeof ubahKeBerita>[]> {
  const baris = await db
    .select(seleksiBeritaDenganPenulis())
    .from(berita)
    .leftJoin(pengguna, eq(berita.penulisId, pengguna.id))
    .orderBy(desc(berita.dibuatPada))
    .limit(jumlah);
  return baris.map(ubahKeBerita);
}

/** Memperbarui berita dan mengembalikan data terbarunya. */
export async function perbaruiBerita(
  id: number,
  data: Pick<DataBeritaTersimpan, 'judul' | 'isi' | 'gambar' | 'kategori'>,
): Promise<ReturnType<typeof ubahKeBerita>> {
  const hasil = await db
    .update(berita)
    .set({
      judul: data.judul,
      isi: data.isi,
      gambar: data.gambar,
      kategori: data.kategori ?? 'Umum',
      diperbaruiPada: new Date(),
    })
    .where(eq(berita.id, id))
    .returning({ id: berita.id });

  if (!hasil[0]) {
    throw new KesalahanTidakDitemukan('Berita tidak ditemukan');
  }

  const terbaru = await temukanBeritaBerdasarkanId(hasil[0].id);
  if (!terbaru) {
    throw new KesalahanTidakDitemukan('Berita tidak ditemukan');
  }
  return terbaru;
}

/** Menghapus berita berdasarkan id (wajib memakai klausa where). */
export async function hapusBerita(id: number): Promise<void> {
  const hasil = await db.delete(berita).where(eq(berita.id, id)).returning({ id: berita.id });
  if (hasil.length === 0) {
    throw new KesalahanTidakDitemukan('Berita tidak ditemukan');
  }
}
