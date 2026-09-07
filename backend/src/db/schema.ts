/**
 * Skema Drizzle ORM untuk database desa citapen.
 * Semua tabel memakai nama kolom snake_case yang sama dengan
 * database/skema.sql & database/skema-supabase.sql agar migrasi
 * dari pg raw ke drizzle tidak perlu ubah struktur DB.
 *
 * Driver: node-postgres (pg Pool) dengan SSL manual untuk Supabase
 * (dikonfigurasi di src/config/database.ts).
 */

import {
  pgTable,
  bigserial,
  bigint,
  varchar,
  text,
  boolean,
  timestamp,
  numeric,
  integer,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =====================================================================
// 1. TABEL PENGGUNA (admin & publikasi)
// =====================================================================
export const pengguna = pgTable(
  'pengguna',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    kataSandiHash: varchar('kata_sandi_hash', { length: 100 }).notNull(),
    namaLengkap: varchar('nama_lengkap', { length: 100 }).notNull(),
    email: varchar('email', { length: 100 }),
    nomorHp: varchar('nomor_hp', { length: 20 }),
    fotoProfil: varchar('foto_profil', { length: 255 }),
    peran: varchar('peran', { length: 20 }).notNull(),
    statusAktif: boolean('status_aktif').notNull().default(true),
    dibuatPada: timestamp('dibuat_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    diperbaruiPada: timestamp('diperbarui_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (tabel) => [
    index('idx_pengguna_username').on(tabel.username),
    index('idx_pengguna_peran').on(tabel.peran),
  ],
);

// =====================================================================
// 2. TABEL PROFIL DESA (singleton id = 1)
// =====================================================================
export const profilDesa = pgTable('profil_desa', {
  id: bigint('id', { mode: 'number' }).primaryKey().default(1),
  luasWilayah: varchar('luas_wilayah', { length: 100 })
    .notNull()
    .default('473,300 Ha'),
  batasUtara: varchar('batas_utara', { length: 100 })
    .notNull()
    .default('Desa Tundangan'),
  batasSelatan: varchar('batas_selatan', { length: 100 })
    .notNull()
    .default('Desa Pakembangan'),
  batasBarat: varchar('batas_barat', { length: 100 })
    .notNull()
    .default('Kecamatan Ciniru'),
  batasTimur: varchar('batas_timur', { length: 100 })
    .notNull()
    .default('Kecamatan Maleber'),
  letakGeografis: text('letak_geografis'),
  deskripsiWilayah: text('deskripsi_wilayah'),
  sejarah: text('sejarah'),
  visi: text('visi'),
  misi: text('misi'),
  diperbaruiPada: timestamp('diperbarui_pada', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
});

// =====================================================================
// 3. TABEL STRUKTUR ORGANISASI
// =====================================================================
export const strukturOrganisasi = pgTable(
  'struktur_organisasi',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    nama: varchar('nama', { length: 100 }).notNull(),
    jabatan: varchar('jabatan', { length: 100 }).notNull(),
    urutan: integer('urutan').notNull().default(0),
    foto: varchar('foto', { length: 255 }),
    dibuatPada: timestamp('dibuat_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    diperbaruiPada: timestamp('diperbarui_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (tabel) => [index('idx_struktur_urutan').on(tabel.urutan)],
);

// =====================================================================
// 4. TABEL RIWAYAT KUWU
// =====================================================================
export const riwayatKuwu = pgTable(
  'riwayat_kuwu',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    nama: varchar('nama', { length: 100 }).notNull(),
    masaJabatan: varchar('masa_jabatan', { length: 100 }).notNull(),
    urutan: integer('urutan').notNull().default(0),
    keterangan: text('keterangan'),
    dibuatPada: timestamp('dibuat_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    diperbaruiPada: timestamp('diperbarui_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (tabel) => [index('idx_riwayat_urutan').on(tabel.urutan)],
);

// =====================================================================
// 5. TABEL GALERI DESA
// =====================================================================
export const galeriDesa = pgTable(
  'galeri_desa',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    judul: varchar('judul', { length: 200 }),
    keterangan: text('keterangan'),
    foto: varchar('foto', { length: 255 }).notNull(),
    urutan: integer('urutan').notNull().default(0),
    dibuatPada: timestamp('dibuat_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    diperbaruiPada: timestamp('diperbarui_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (tabel) => [
    index('idx_galeri_urutan').on(tabel.urutan),
    index('idx_galeri_dibuat_pada').on(tabel.dibuatPada),
  ],
);

// =====================================================================
// 6. TABEL UMKM
// =====================================================================
export const umkm = pgTable(
  'umkm',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    nama: varchar('nama', { length: 150 }).notNull().unique(),
    nomorHp: varchar('nomor_hp', { length: 20 }),
    alamat: text('alamat'),
    deskripsi: text('deskripsi'),
    foto: varchar('foto', { length: 255 }),
    pemilikId: bigint('pemilik_id', { mode: 'number' }).references(() => pengguna.id, {
      onDelete: 'set null',
    }),
    dibuatPada: timestamp('dibuat_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    diperbaruiPada: timestamp('diperbarui_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (tabel) => [
    index('idx_umkm_pemilik').on(tabel.pemilikId),
    index('idx_umkm_nama').on(tabel.nama),
  ],
);

// =====================================================================
// 7. TABEL KATEGORI PRODUK
// =====================================================================
export const kategoriProduk = pgTable(
  'kategori_produk',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    nama: varchar('nama', { length: 100 }).notNull(),
    pemilikId: bigint('pemilik_id', { mode: 'number' })
      .notNull()
      .references(() => pengguna.id, { onDelete: 'cascade' }),
    dibuatPada: timestamp('dibuat_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (tabel) => [
    index('idx_kategori_pemilik').on(tabel.pemilikId),
    unique('kategori_produk_nama_pemilik_id_key').on(tabel.nama, tabel.pemilikId),
  ],
);

// =====================================================================
// 8. TABEL PRODUK
// =====================================================================
export const produk = pgTable(
  'produk',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    nama: varchar('nama', { length: 150 }).notNull(),
    // numeric disimpan sebagai string oleh pg, drizzle akan mengembalikan string
    harga: numeric('harga', { precision: 15, scale: 2 }).notNull(),
    deskripsi: text('deskripsi').notNull(),
    foto: varchar('foto', { length: 255 }),
    pemilikId: bigint('pemilik_id', { mode: 'number' })
      .notNull()
      .references(() => pengguna.id, { onDelete: 'cascade' }),
    kategoriId: bigint('kategori_id', { mode: 'number' })
      .notNull()
      .references(() => kategoriProduk.id, { onDelete: 'restrict' }),
    umkmId: bigint('umkm_id', { mode: 'number' }).references(() => umkm.id, {
      onDelete: 'set null',
    }),
    dibuatPada: timestamp('dibuat_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    diperbaruiPada: timestamp('diperbarui_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (tabel) => [
    index('idx_produk_kategori').on(tabel.kategoriId),
    index('idx_produk_pemilik').on(tabel.pemilikId),
    index('idx_produk_umkm').on(tabel.umkmId),
    index('idx_produk_dibuat_pada').on(tabel.dibuatPada),
  ],
);

// =====================================================================
// 9. TABEL BERITA
// =====================================================================
export const berita = pgTable(
  'berita',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    judul: varchar('judul', { length: 200 }).notNull(),
    isi: text('isi').notNull(),
    gambar: varchar('gambar', { length: 255 }),
    kategori: varchar('kategori', { length: 50 }).notNull().default('Umum'),
    penulisId: bigint('penulis_id', { mode: 'number' }).references(() => pengguna.id, {
      onDelete: 'set null',
    }),
    dibuatPada: timestamp('dibuat_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    diperbaruiPada: timestamp('diperbarui_pada', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (tabel) => [
    index('idx_berita_kategori').on(tabel.kategori),
    index('idx_berita_penulis').on(tabel.penulisId),
    index('idx_berita_dibuat_pada').on(tabel.dibuatPada),
  ],
);

// =====================================================================
// RELATIONS (opsional, untuk drizzle query dengan with)
// =====================================================================
export const penggunaRelations = relations(pengguna, ({ many }) => ({
  berita: many(berita),
  produk: many(produk),
  kategori: many(kategoriProduk),
  umkm: many(umkm),
}));

export const beritaRelations = relations(berita, ({ one }) => ({
  penulis: one(pengguna, {
    fields: [berita.penulisId],
    references: [pengguna.id],
  }),
}));

export const kategoriProdukRelations = relations(kategoriProduk, ({ one, many }) => ({
  pemilik: one(pengguna, {
    fields: [kategoriProduk.pemilikId],
    references: [pengguna.id],
  }),
  produk: many(produk),
}));

export const umkmRelations = relations(umkm, ({ one, many }) => ({
  pemilik: one(pengguna, {
    fields: [umkm.pemilikId],
    references: [pengguna.id],
  }),
  produk: many(produk),
}));

export const produkRelations = relations(produk, ({ one }) => ({
  pemilik: one(pengguna, {
    fields: [produk.pemilikId],
    references: [pengguna.id],
  }),
  kategori: one(kategoriProduk, {
    fields: [produk.kategoriId],
    references: [kategoriProduk.id],
  }),
  umkm: one(umkm, {
    fields: [produk.umkmId],
    references: [umkm.id],
  }),
}));
