-- =====================================================================
-- SKEMA DATABASE WEBSITE PROFIL DESA CITAPEN DAN KATALOG PRODUK UMKM
-- Versi SUPABASE (tinggal copy-paste ke SQL Editor Supabase)
-- =====================================================================
-- Cara pakai di Supabase (PALING MUDAH, TANPA ERROR):
--   1. Buka Dashboard Supabase -> pilih Project Anda
--   2. Masuk ke menu "SQL Editor" (ikon database)
--   3. Klik "New Query" / "New SQL Snippet"
--   4. Copy SELURUH isi file ini (Ctrl+A -> Ctrl+C)
--   5. Paste di SQL Editor -> klik "Run" / "Run Query" (atau Ctrl+Enter)
--   6. Jika muncul "Success. No rows returned" berarti BERHASIL.
--   7. Cek di menu "Table Editor" semua tabel sudah muncul.
--
-- Kenapa file ini beda dengan database/skema.sql ?
--   - database/skema.sql adalah hasil pg_dump lokal (pakai \restrict,
--     \unrestrict, COPY FROM stdin, SET search_path = '', dsb)
--     Perintah-perintah itu HANYA bisa jalan lewat psql di terminal,
--     TIDAK DIDUKUNG di SQL Editor Supabase -> pasti error terus.
--   - File ini (skema-supabase.sql) sudah dibersihkan: TANPA \restrict,
--     TANPA COPY, TANPA set_config search_path, semua pakai CREATE TABLE
--     IF NOT EXISTS + INSERT ... ON CONFLICT yang 100% didukung Supabase.
--
-- Catatan:
--   - File lama database/skema.sql TETAP ADA dan TIDAK DIHAPUS.
--   - File ini aman dijalankan ulang (idempotent) -> tidak akan duplikat data.
--   - Jika tabel sudah ada, perintah CREATE IF NOT EXISTS akan dilewati.
--   - Jika ingin RESET TOTAL (hapus semua data lama), buka komentar
--     bagian "PEMBERSIHAN OPSIONAL" di bawah ini sebelum Run.
-- =====================================================================

BEGIN;

-- =====================================================================
-- 0. PEMBERSIHAN OPSIONAL (RESET TOTAL) - NONAKTIF SECARA DEFAULT
-- =====================================================================
-- Jika Anda ingin mengulang dari NOL dan MENGHAPUS semua data lama,
-- HAPUS tanda -- di setiap baris DROP di bawah ini lalu Run ulang.
-- PERINGATAN: Semua data berita/produk/kategori akan HILANG jika diaktifkan!
-- ---------------------------------------------------------------------
-- DROP TABLE IF EXISTS public.produk CASCADE;
-- DROP TABLE IF EXISTS public.berita CASCADE;
-- DROP TABLE IF EXISTS public.kategori_produk CASCADE;
-- DROP TABLE IF EXISTS public.umkm CASCADE;
-- DROP TABLE IF EXISTS public.galeri_desa CASCADE;
-- DROP TABLE IF EXISTS public.riwayat_kuwu CASCADE;
-- DROP TABLE IF EXISTS public.struktur_organisasi CASCADE;
-- DROP TABLE IF EXISTS public.profil_desa CASCADE;
-- DROP TABLE IF EXISTS public.pengguna CASCADE;

-- =====================================================================
-- 1. TABEL PENGGUNA (admin & publikasi)
-- =====================================================================
-- Menyimpan akun login. Peran hanya 'admin' dan 'publikasi'
-- (peran umkm sekarang dikelola penuh oleh admin desa).
CREATE TABLE IF NOT EXISTS public.pengguna (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    kata_sandi_hash VARCHAR(100) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    nomor_hp VARCHAR(20),
    foto_profil VARCHAR(255),
    peran VARCHAR(20) NOT NULL CHECK (peran IN ('admin', 'publikasi')),
    status_aktif BOOLEAN NOT NULL DEFAULT true,
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
    diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 2. TABEL PROFIL DESA (singleton, hanya id = 1)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.profil_desa (
    id BIGINT PRIMARY KEY CHECK (id = 1) DEFAULT 1,
    luas_wilayah VARCHAR(100) NOT NULL DEFAULT '473,300 Ha',
    batas_utara VARCHAR(100) NOT NULL DEFAULT 'Desa Tundangan',
    batas_selatan VARCHAR(100) NOT NULL DEFAULT 'Desa Pakembangan',
    batas_barat VARCHAR(100) NOT NULL DEFAULT 'Kecamatan Ciniru',
    batas_timur VARCHAR(100) NOT NULL DEFAULT 'Kecamatan Maleber',
    letak_geografis TEXT,
    deskripsi_wilayah TEXT,
    sejarah TEXT,
    visi TEXT,
    misi TEXT,
    diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 3. TABEL STRUKTUR ORGANISASI DESA
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.struktur_organisasi (
    id BIGSERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    jabatan VARCHAR(100) NOT NULL,
    urutan INTEGER NOT NULL DEFAULT 0,
    foto VARCHAR(255),
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
    diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 4. TABEL RIWAYAT KUWU (kepala desa dari masa ke masa)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.riwayat_kuwu (
    id BIGSERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    masa_jabatan VARCHAR(100) NOT NULL,
    urutan INTEGER NOT NULL DEFAULT 0,
    keterangan TEXT,
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
    diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 5. TABEL GALERI DESA
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.galeri_desa (
    id BIGSERIAL PRIMARY KEY,
    judul VARCHAR(200),
    keterangan TEXT,
    foto VARCHAR(255) NOT NULL,
    urutan INTEGER NOT NULL DEFAULT 0,
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
    diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 6. TABEL UMKM
-- =====================================================================
-- UMKM dikelola penuh oleh admin desa. Setiap UMKM punya foto & kontak.
CREATE TABLE IF NOT EXISTS public.umkm (
    id BIGSERIAL PRIMARY KEY,
    nama VARCHAR(150) NOT NULL UNIQUE,
    nomor_hp VARCHAR(20),
    alamat TEXT,
    deskripsi TEXT,
    foto VARCHAR(255),
    pemilik_id BIGINT REFERENCES public.pengguna(id) ON DELETE SET NULL,
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
    diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 7. TABEL KATEGORI PRODUK
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.kategori_produk (
    id BIGSERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    pemilik_id BIGINT NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (nama, pemilik_id)
);

-- =====================================================================
-- 8. TABEL PRODUK
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.produk (
    id BIGSERIAL PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    harga NUMERIC(15,2) NOT NULL CHECK (harga >= 0),
    deskripsi TEXT NOT NULL,
    foto VARCHAR(255),
    pemilik_id BIGINT NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
    kategori_id BIGINT NOT NULL REFERENCES public.kategori_produk(id) ON DELETE RESTRICT,
    umkm_id BIGINT REFERENCES public.umkm(id) ON DELETE SET NULL,
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
    diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 9. TABEL BERITA
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.berita (
    id BIGSERIAL PRIMARY KEY,
    judul VARCHAR(200) NOT NULL,
    isi TEXT NOT NULL,
    gambar VARCHAR(255),
    kategori VARCHAR(50) NOT NULL DEFAULT 'Umum' CHECK (kategori IN ('Umum','Infrastruktur','Kesehatan','Pendidikan','Pertanian','Ekonomi','Sosial','Budaya')),
    penulis_id BIGINT REFERENCES public.pengguna(id) ON DELETE SET NULL,
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
    diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 10. INDEX UNTUK PERFORMA (dipakai untuk paginasi & filter)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_pengguna_username ON public.pengguna (username);
CREATE INDEX IF NOT EXISTS idx_pengguna_peran ON public.pengguna (peran);
CREATE INDEX IF NOT EXISTS idx_berita_kategori ON public.berita (kategori);
CREATE INDEX IF NOT EXISTS idx_berita_penulis ON public.berita (penulis_id);
CREATE INDEX IF NOT EXISTS idx_berita_dibuat_pada ON public.berita (dibuat_pada DESC);
CREATE INDEX IF NOT EXISTS idx_produk_kategori ON public.produk (kategori_id);
CREATE INDEX IF NOT EXISTS idx_produk_pemilik ON public.produk (pemilik_id);
CREATE INDEX IF NOT EXISTS idx_produk_umkm ON public.produk (umkm_id);
CREATE INDEX IF NOT EXISTS idx_produk_dibuat_pada ON public.produk (dibuat_pada DESC);
CREATE INDEX IF NOT EXISTS idx_kategori_pemilik ON public.kategori_produk (pemilik_id);
CREATE INDEX IF NOT EXISTS idx_umkm_pemilik ON public.umkm (pemilik_id);
CREATE INDEX IF NOT EXISTS idx_umkm_nama ON public.umkm (nama);
CREATE INDEX IF NOT EXISTS idx_struktur_urutan ON public.struktur_organisasi (urutan);
CREATE INDEX IF NOT EXISTS idx_riwayat_urutan ON public.riwayat_kuwu (urutan);
CREATE INDEX IF NOT EXISTS idx_galeri_urutan ON public.galeri_desa (urutan);
CREATE INDEX IF NOT EXISTS idx_galeri_dibuat_pada ON public.galeri_desa (dibuat_pada DESC);

-- =====================================================================
-- 11. DATA AWAL (SEED) - AMAN UNTUK DIJALANKAN ULANG
-- =====================================================================

-- 11a. Admin default (username: admin, password: AdminDesa123)
-- Kata sandi hash ini adalah bcrypt untuk "AdminDesa123" (sudah teruji di lokal).
-- Jika ingin ganti password, biarkan dulu, nanti ganti lewat aplikasi / atau
-- lewat SQL: UPDATE pengguna SET kata_sandi_hash = crypt('password-baru', gen_salt('bf')) ...
INSERT INTO public.pengguna (id, username, kata_sandi_hash, nama_lengkap, email, nomor_hp, foto_profil, peran, status_aktif, dibuat_pada, diperbarui_pada)
SELECT 1, 'admin', '$2a$10$A5TESFSy91/VtoI4t75GnufSny37yQwuqoybrmK/P1SopeX5PNn42', 'Admin Desa Citapen', 'admin@citapen.id', '082118219999', 'profil/mtn2ew6h-ff8457701407.png', 'admin', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pengguna WHERE username = 'admin' OR id = 1);

-- 11b. Profil desa (singleton id = 1) - pakai UPSERT agar selalu terisi
INSERT INTO public.profil_desa (id, luas_wilayah, batas_utara, batas_selatan, batas_barat, batas_timur, letak_geografis, deskripsi_wilayah, sejarah, visi, misi, diperbarui_pada)
VALUES (
    1,
    '473,300 Ha',
    'Desa Tundangan',
    'Desa Pakembangan',
    'Kecamatan Ciniru',
    'Kecamatan Maleber',
    'Desa Citapen terletak di Kecamatan Hantara, Kabupaten Kuningan, Provinsi Jawa Barat.',
    'Desa Citapen memiliki luas 473,300 Ha dengan topografi perbukitan dan potensi pertanian serta wisata alam.',
    'Kata "CITAPEN" yaitu berasal dari kata "CIPATAPAAN" yang mengandung arti kata Air Suci Untuk Bertapa itu menurut legenda ataupun cerita secara turun temurun. Pada jaman dahulu datang 3 orang tokoh yang mengembara dan sampailah di wilayah yang sekarang menjadi Desa Citapen yaitu Buyut Kerti Parana, Embah Suradita, dan Buyut Jambul.',
    'Terwujudnya Tata Kelola Pemerintahan Yang Bersih, Jujur, Transparan Inovatif Dan Akuntable Menuju Desa Citapen Yang Maju, Sejahtera, Dan Berbudaya',
    '1. Melanjutkan Program-Program Terdahulu Yang Dianggap Lebih Bermanfaat Bagi Masyarakat.\n2. Meningkatkan Pembangunan: Jalan Desa, Jalan Lingkungan, Jalan Usaha Tani, dan Perluasan Permukiman\n3. Penataan Lingkungan Kantor Pemerintahan Desa\n4. Pemberdayaan Sumber Daya Alam Untuk Mencapai Kemakmuran dan Kesejahteraan Masyarakat.',
    now()
)
ON CONFLICT (id) DO NOTHING;

-- 11c. Struktur organisasi (10 perangkat desa)
INSERT INTO public.struktur_organisasi (id, nama, jabatan, urutan, foto, dibuat_pada, diperbarui_pada) VALUES
(1, 'Uri Miskari', 'Kepala Desa', 1, NULL, now(), now()),
(2, 'Sahlan', 'Sekretaris Desa', 2, NULL, now(), now()),
(3, 'Juman', 'Kasi Pemerintahan', 3, NULL, now(), now()),
(4, 'Eman Durahman', 'Kasi Kesejahteraan', 4, NULL, now(), now()),
(5, 'Dedi Kusnadi', 'Kasi Pelayanan', 5, NULL, now(), now()),
(6, 'Yogi Iskandar, S.Pd', 'Kaur Keuangan', 6, NULL, now(), now()),
(7, 'Maman Nurfirmansah', 'Kaur Umum & TU', 7, NULL, now(), now()),
(8, 'Nana Sudiana, S.Pd', 'Kaur Perencanaan', 8, NULL, now(), now()),
(9, 'Dede Rusdianto, A.ma', 'Kadus Ciasuhan', 9, NULL, now(), now()),
(10, 'Aan Kurniawati', 'Kadus Ciasihan', 10, NULL, now(), now())
ON CONFLICT (id) DO NOTHING;

-- 11d. Riwayat Kuwu (22 kepala desa dari masa ke masa)
INSERT INTO public.riwayat_kuwu (id, nama, masa_jabatan, urutan, keterangan, dibuat_pada, diperbarui_pada) VALUES
(1, 'BUYUT KERTI PARANA', '1847 - 1857 (10 Tahun)', 1, NULL, now(), now()),
(2, 'BUYUT SUKETI', '1857 - 1867 (10 Tahun)', 2, NULL, now(), now()),
(3, 'AYAH BUYUT SARI', '1867 - 1874 (7 Tahun)', 3, NULL, now(), now()),
(4, 'SUKARSA', '1874 - 1881 (7 Tahun)', 4, NULL, now(), now()),
(5, 'BUYUT SARI', '1881 - 1889 (7 Tahun)', 5, NULL, now(), now()),
(6, 'SURANGGANATA', '1889 - 1891 (2 Tahun)', 6, NULL, now(), now()),
(7, 'SASTRA PERWATA', '1891 - 1921 (30 Tahun)', 7, NULL, now(), now()),
(8, 'ZAINAL MA''RUF', '1921 - 1922 (2 Tahun)', 8, NULL, now(), now()),
(9, 'WIKARTA PRAJA', '1922 - 1932 (30 Tahun)', 9, NULL, now(), now()),
(10, 'WANGSA DIJAYA ALIM', '1932 - 1943 (11 Tahun)', 10, NULL, now(), now()),
(11, 'SUKARYA WASITA', '1943 - 1947 (4 Tahun)', 11, NULL, now(), now()),
(12, 'KARTA WIJAYA', '1947 - 1957 (10 Tahun)', 12, NULL, now(), now()),
(13, 'SUKRIA', '1957 - 1968 (11 Tahun)', 13, NULL, now(), now()),
(14, 'KAMALUDIN SUDIANA', '1968 - 1976 (8 Tahun)', 14, NULL, now(), now()),
(15, 'WISASRTRA', '1976 - 1983 (7 Tahun)', 15, NULL, now(), now()),
(16, 'SUHINTA PRAJA', '1983 - 1984 (1 Tahun)', 16, NULL, now(), now()),
(17, 'MAMAN ROCHAMAN', '1984 - 2010 (24 Tahun)', 17, NULL, now(), now()),
(18, 'DIDI UHADI', '2010 - 2016 (6 Tahun)', 18, NULL, now(), now()),
(19, 'DENI SISWANTO, S.IP', '2016 - 2017 (1 Tahun)', 19, NULL, now(), now()),
(20, 'NONO SUTARNO, S.IP', '2017 JULI/OKT (3 Bulan)', 20, NULL, now(), now()),
(21, 'RUSTANDI, S.Pd', '2017 - 2023 (6 Tahun)', 21, NULL, now(), now()),
(22, 'URI MISKARI', '2023 - Sekarang', 22, NULL, now(), now())
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- 12. PERBAIKI URUTAN SEQUENCE (agar INSERT selanjutnya tidak bentrok id)
-- =====================================================================
-- BIGSERIAL membuat sequence otomatis bernama <tabel>_id_seq.
-- Setelah INSERT manual dengan id eksplisit, sequence harus dimajukan
-- ke nilai MAX(id) agar id berikutnya tidak menabrak data lama.
SELECT setval('public.pengguna_id_seq', COALESCE((SELECT MAX(id) FROM public.pengguna), 0) + 1, false);
SELECT setval('public.struktur_organisasi_id_seq', COALESCE((SELECT MAX(id) FROM public.struktur_organisasi), 0) + 1, false);
SELECT setval('public.riwayat_kuwu_id_seq', COALESCE((SELECT MAX(id) FROM public.riwayat_kuwu), 0) + 1, false);
SELECT setval('public.galeri_desa_id_seq', COALESCE((SELECT MAX(id) FROM public.galeri_desa), 0) + 1, false);
SELECT setval('public.umkm_id_seq', COALESCE((SELECT MAX(id) FROM public.umkm), 0) + 1, false);
SELECT setval('public.kategori_produk_id_seq', COALESCE((SELECT MAX(id) FROM public.kategori_produk), 0) + 1, false);
SELECT setval('public.produk_id_seq', COALESCE((SELECT MAX(id) FROM public.produk), 0) + 1, false);
SELECT setval('public.berita_id_seq', COALESCE((SELECT MAX(id) FROM public.berita), 0) + 1, false);

COMMIT;

-- =====================================================================
-- SELESAI! JIKA TIDAK ADA ERROR MERAH, SKEMA SUDAH SIAP DI SUPABASE.
-- Langkah selanjutnya:
--   1. Di Supabase Dashboard -> Table Editor, pastikan 9 tabel muncul:
--      pengguna, profil_desa, struktur_organisasi, riwayat_kuwu,
--      galeri_desa, umkm, kategori_produk, produk, berita
--   2. Di Authentication -> tidak perlu setting tambahan (backend pakai JWT sendiri)
--   3. Copy DATABASE_URL dari Supabase:
--      Project Settings -> Database -> Connection string -> URI (Node.js)
--      Contoh: postgresql://postgres.xxx:password@aws-0-ap-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
--      Untuk backend di Render, pakai yang pooler (port 6543) + tambahkan ?pgbouncer=true jika ada.
--   4. Paste DATABASE_URL itu ke Render -> Environment Variables -> DATABASE_URL
--   5. Deploy ulang backend di Render, lalu tes GET /api/kesehatan -> harus "terhubung"
-- =====================================================================
