-- =====================================================================
-- SKEMA DATABASE WEBSITE PROFIL DESA CITAPEN DAN KATALOG PRODUK UMKM
-- Database : desa_citapen
-- Diperbarui otomatis dari database yang sekarang (pg_dump --clean --if-exists)
-- Cara pakai (dari terminal postgresql):
--   1. psql -U hafizhtux postgres        -> masukkan kata sandi
--   2. DROP DATABASE IF EXISTS desa_citapen; CREATE DATABASE desa_citapen;
--   3. \q
--   4. psql -U hafizhtux desa_citapen    -> masukkan kata sandi
--   5. \i database/skema.sql
-- Catatan: file ini berisi schema + data terkini (hasil pg_dump).
-- =====================================================================

--
-- PostgreSQL database dump
--

\restrict rfksQeanfXAvaTrG0534UOYOitvQ82gzPzEX4bFB2a0bE3QD84vCsZvuczK44K9

-- Dumped from database version 18.6 (Homebrew)
-- Dumped by pg_dump version 18.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.umkm DROP CONSTRAINT IF EXISTS umkm_pemilik_id_fkey;
ALTER TABLE IF EXISTS ONLY public.produk DROP CONSTRAINT IF EXISTS produk_umkm_id_fkey;
ALTER TABLE IF EXISTS ONLY public.produk DROP CONSTRAINT IF EXISTS produk_pemilik_id_fkey;
ALTER TABLE IF EXISTS ONLY public.produk DROP CONSTRAINT IF EXISTS produk_kategori_id_fkey;
ALTER TABLE IF EXISTS ONLY public.kategori_produk DROP CONSTRAINT IF EXISTS kategori_produk_pemilik_id_fkey;
ALTER TABLE IF EXISTS ONLY public.berita DROP CONSTRAINT IF EXISTS berita_penulis_id_fkey;
DROP INDEX IF EXISTS public.idx_umkm_pemilik;
DROP INDEX IF EXISTS public.idx_umkm_nama;
DROP INDEX IF EXISTS public.idx_struktur_urutan;
DROP INDEX IF EXISTS public.idx_riwayat_urutan;
DROP INDEX IF EXISTS public.idx_produk_umkm;
DROP INDEX IF EXISTS public.idx_produk_pemilik;
DROP INDEX IF EXISTS public.idx_produk_kategori;
DROP INDEX IF EXISTS public.idx_produk_dibuat_pada;
DROP INDEX IF EXISTS public.idx_pengguna_username;
DROP INDEX IF EXISTS public.idx_pengguna_peran;
DROP INDEX IF EXISTS public.idx_kategori_pemilik;
DROP INDEX IF EXISTS public.idx_galeri_urutan;
DROP INDEX IF EXISTS public.idx_galeri_dibuat_pada;
DROP INDEX IF EXISTS public.idx_berita_kategori;
DROP INDEX IF EXISTS public.idx_berita_penulis;
DROP INDEX IF EXISTS public.idx_berita_dibuat_pada;
ALTER TABLE IF EXISTS ONLY public.umkm DROP CONSTRAINT IF EXISTS umkm_pkey;
ALTER TABLE IF EXISTS ONLY public.umkm DROP CONSTRAINT IF EXISTS umkm_nama_key;
ALTER TABLE IF EXISTS ONLY public.struktur_organisasi DROP CONSTRAINT IF EXISTS struktur_organisasi_pkey;
ALTER TABLE IF EXISTS ONLY public.riwayat_kuwu DROP CONSTRAINT IF EXISTS riwayat_kuwu_pkey;
ALTER TABLE IF EXISTS ONLY public.profil_desa DROP CONSTRAINT IF EXISTS profil_desa_pkey;
ALTER TABLE IF EXISTS ONLY public.produk DROP CONSTRAINT IF EXISTS produk_pkey;
ALTER TABLE IF EXISTS ONLY public.pengguna DROP CONSTRAINT IF EXISTS pengguna_username_key;
ALTER TABLE IF EXISTS ONLY public.pengguna DROP CONSTRAINT IF EXISTS pengguna_pkey;
ALTER TABLE IF EXISTS ONLY public.kategori_produk DROP CONSTRAINT IF EXISTS kategori_produk_pkey;
ALTER TABLE IF EXISTS ONLY public.kategori_produk DROP CONSTRAINT IF EXISTS kategori_produk_nama_pemilik_id_key;
ALTER TABLE IF EXISTS ONLY public.galeri_desa DROP CONSTRAINT IF EXISTS galeri_desa_pkey;
ALTER TABLE IF EXISTS ONLY public.berita DROP CONSTRAINT IF EXISTS berita_pkey;
ALTER TABLE IF EXISTS public.umkm ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.struktur_organisasi ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.riwayat_kuwu ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.produk ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pengguna ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kategori_produk ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.galeri_desa ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.berita ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.umkm_id_seq;
DROP TABLE IF EXISTS public.umkm;
DROP SEQUENCE IF EXISTS public.struktur_organisasi_id_seq;
DROP TABLE IF EXISTS public.struktur_organisasi;
DROP SEQUENCE IF EXISTS public.riwayat_kuwu_id_seq;
DROP TABLE IF EXISTS public.riwayat_kuwu;
DROP TABLE IF EXISTS public.profil_desa;
DROP SEQUENCE IF EXISTS public.produk_id_seq;
DROP TABLE IF EXISTS public.produk;
DROP SEQUENCE IF EXISTS public.pengguna_id_seq;
DROP TABLE IF EXISTS public.pengguna;
DROP SEQUENCE IF EXISTS public.kategori_produk_id_seq;
DROP TABLE IF EXISTS public.kategori_produk;
DROP SEQUENCE IF EXISTS public.galeri_desa_id_seq;
DROP TABLE IF EXISTS public.galeri_desa;
DROP SEQUENCE IF EXISTS public.berita_id_seq;
DROP TABLE IF EXISTS public.berita;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: berita; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.berita (
    id bigint NOT NULL,
    judul character varying(200) NOT NULL,
    isi text NOT NULL,
    gambar character varying(255),
    kategori character varying(50) DEFAULT 'Umum'::character varying NOT NULL,
    penulis_id bigint,
    dibuat_pada timestamp with time zone DEFAULT now() NOT NULL,
    diperbarui_pada timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT berita_kategori_check CHECK (((kategori)::text = ANY ((ARRAY['Umum'::character varying, 'Infrastruktur'::character varying, 'Kesehatan'::character varying, 'Pendidikan'::character varying, 'Pertanian'::character varying, 'Ekonomi'::character varying, 'Sosial'::character varying, 'Budaya'::character varying])::text[])))
);


--
-- Name: berita_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.berita_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: berita_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.berita_id_seq OWNED BY public.berita.id;


--
-- Name: galeri_desa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.galeri_desa (
    id bigint NOT NULL,
    judul character varying(200),
    keterangan text,
    foto character varying(255) NOT NULL,
    urutan integer DEFAULT 0 NOT NULL,
    dibuat_pada timestamp with time zone DEFAULT now() NOT NULL,
    diperbarui_pada timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: galeri_desa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.galeri_desa_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: galeri_desa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.galeri_desa_id_seq OWNED BY public.galeri_desa.id;


--
-- Name: kategori_produk; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kategori_produk (
    id bigint NOT NULL,
    nama character varying(100) NOT NULL,
    pemilik_id bigint NOT NULL,
    dibuat_pada timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kategori_produk_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kategori_produk_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kategori_produk_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kategori_produk_id_seq OWNED BY public.kategori_produk.id;


--
-- Name: pengguna; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pengguna (
    id bigint NOT NULL,
    username character varying(50) NOT NULL,
    kata_sandi_hash character varying(100) NOT NULL,
    nama_lengkap character varying(100) NOT NULL,
    email character varying(100),
    nomor_hp character varying(20),
    foto_profil character varying(255),
    peran character varying(20) NOT NULL,
    status_aktif boolean DEFAULT true NOT NULL,
    dibuat_pada timestamp with time zone DEFAULT now() NOT NULL,
    diperbarui_pada timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pengguna_peran_check CHECK (((peran)::text = ANY ((ARRAY['admin'::character varying, 'publikasi'::character varying])::text[])))
);


--
-- Name: pengguna_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pengguna_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pengguna_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pengguna_id_seq OWNED BY public.pengguna.id;


--
-- Name: produk; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produk (
    id bigint NOT NULL,
    nama character varying(150) NOT NULL,
    harga numeric(15,2) NOT NULL,
    deskripsi text NOT NULL,
    foto character varying(255),
    pemilik_id bigint NOT NULL,
    kategori_id bigint NOT NULL,
    dibuat_pada timestamp with time zone DEFAULT now() NOT NULL,
    diperbarui_pada timestamp with time zone DEFAULT now() NOT NULL,
    umkm_id bigint,
    CONSTRAINT produk_harga_check CHECK ((harga >= (0)::numeric))
);


--
-- Name: produk_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.produk_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: produk_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.produk_id_seq OWNED BY public.produk.id;


--
-- Name: profil_desa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profil_desa (
    id bigint DEFAULT 1 NOT NULL,
    luas_wilayah character varying(100) DEFAULT '473,300 Ha'::character varying NOT NULL,
    batas_utara character varying(100) DEFAULT 'Desa Tundangan'::character varying NOT NULL,
    batas_selatan character varying(100) DEFAULT 'Desa Pakembangan'::character varying NOT NULL,
    batas_barat character varying(100) DEFAULT 'Kecamatan Ciniru'::character varying NOT NULL,
    batas_timur character varying(100) DEFAULT 'Kecamatan Maleber'::character varying NOT NULL,
    letak_geografis text,
    deskripsi_wilayah text,
    sejarah text,
    visi text,
    misi text,
    diperbarui_pada timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profil_desa_id_cek CHECK ((id = 1))
);


--
-- Name: riwayat_kuwu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.riwayat_kuwu (
    id bigint NOT NULL,
    nama character varying(100) NOT NULL,
    masa_jabatan character varying(100) NOT NULL,
    urutan integer DEFAULT 0 NOT NULL,
    keterangan text,
    dibuat_pada timestamp with time zone DEFAULT now() NOT NULL,
    diperbarui_pada timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: riwayat_kuwu_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.riwayat_kuwu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: riwayat_kuwu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.riwayat_kuwu_id_seq OWNED BY public.riwayat_kuwu.id;


--
-- Name: struktur_organisasi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.struktur_organisasi (
    id bigint NOT NULL,
    nama character varying(100) NOT NULL,
    jabatan character varying(100) NOT NULL,
    urutan integer DEFAULT 0 NOT NULL,
    foto character varying(255),
    dibuat_pada timestamp with time zone DEFAULT now() NOT NULL,
    diperbarui_pada timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: struktur_organisasi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.struktur_organisasi_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: struktur_organisasi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.struktur_organisasi_id_seq OWNED BY public.struktur_organisasi.id;


--
-- Name: umkm; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.umkm (
    id bigint NOT NULL,
    nama character varying(150) NOT NULL,
    nomor_hp character varying(20),
    alamat text,
    deskripsi text,
    foto character varying(255),
    pemilik_id bigint,
    dibuat_pada timestamp with time zone DEFAULT now() NOT NULL,
    diperbarui_pada timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: umkm_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.umkm_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: umkm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.umkm_id_seq OWNED BY public.umkm.id;


--
-- Name: berita id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.berita ALTER COLUMN id SET DEFAULT nextval('public.berita_id_seq'::regclass);


--
-- Name: galeri_desa id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.galeri_desa ALTER COLUMN id SET DEFAULT nextval('public.galeri_desa_id_seq'::regclass);


--
-- Name: kategori_produk id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kategori_produk ALTER COLUMN id SET DEFAULT nextval('public.kategori_produk_id_seq'::regclass);


--
-- Name: pengguna id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengguna ALTER COLUMN id SET DEFAULT nextval('public.pengguna_id_seq'::regclass);


--
-- Name: produk id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produk ALTER COLUMN id SET DEFAULT nextval('public.produk_id_seq'::regclass);


--
-- Name: riwayat_kuwu id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riwayat_kuwu ALTER COLUMN id SET DEFAULT nextval('public.riwayat_kuwu_id_seq'::regclass);


--
-- Name: struktur_organisasi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.struktur_organisasi ALTER COLUMN id SET DEFAULT nextval('public.struktur_organisasi_id_seq'::regclass);


--
-- Name: umkm id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.umkm ALTER COLUMN id SET DEFAULT nextval('public.umkm_id_seq'::regclass);


--
-- Data for Name: berita; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.berita (id, judul, isi, gambar, kategori, penulis_id, dibuat_pada, diperbarui_pada) FROM stdin;
\.


--
-- Data for Name: galeri_desa; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.galeri_desa (id, judul, keterangan, foto, urutan, dibuat_pada, diperbarui_pada) FROM stdin;
\.


--
-- Data for Name: kategori_produk; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kategori_produk (id, nama, pemilik_id, dibuat_pada) FROM stdin;
\.


--
-- Data for Name: pengguna; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pengguna (id, username, kata_sandi_hash, nama_lengkap, email, nomor_hp, foto_profil, peran, status_aktif, dibuat_pada, diperbarui_pada) FROM stdin;
1	admin	$2a$10$A5TESFSy91/VtoI4t75GnufSny37yQwuqoybrmK/P1SopeX5PNn42	Admin Desa Citapen	admin@citapen.id	082118219999	profil/mtn2ew6h-ff8457701407.png	admin	t	2026-09-04 08:05:16.122589+07	2026-09-04 22:55:51.883854+07
\.


--
-- Data for Name: produk; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.produk (id, nama, harga, deskripsi, foto, pemilik_id, kategori_id, dibuat_pada, diperbarui_pada, umkm_id) FROM stdin;
\.


--
-- Data for Name: profil_desa; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profil_desa (id, luas_wilayah, batas_utara, batas_selatan, batas_barat, batas_timur, letak_geografis, deskripsi_wilayah, sejarah, visi, misi, diperbarui_pada) FROM stdin;
1	473,300 Ha	Desa Tundangan	Desa Pakembangan	Kecamatan Ciniru	Kecamatan Maleber	Desa Citapen terletak di Kecamatan Hantara, Kabupaten Kuningan, Provinsi Jawa Barat.	Desa Citapen memiliki luas 473,300 Ha dengan topografi perbukitan dan potensi pertanian serta wisata alam.	Kata "CITAPEN" yaitu berasal dari kata "CIPATAPAAN" yang mengandung arti kata Air Suci Untuk Bertapa itu menurut legenda ataupun cerita secara turun temurun. Pada jaman dahulu datang 3 orang tokoh yang mengembara dan sampailah di wilayah yang sekarang menjadi Desa Citapen yaitu Buyut Kerti Parana, Embah Suradita, dan Buyut Jambul.	Terwujudnya Tata Kelola Pemerintahan Yang Bersih, Jujur, Transparan Inovatif Dan Akuntable Menuju Desa Citapen Yang Maju, Sejahtera, Dan Berbudaya	1. Melanjutkan Program-Program Terdahulu Yang Dianggap Lebih Bermanfaat Bagi Masyarakat.\n2. Meningkatkan Pembangunan: Jalan Desa, Jalan Lingkungan, Jalan Usaha Tani, dan Perluasan Permukiman\n3. Penataan Lingkungan Kantor Pemerintahan Desa\n4. Pemberdayaan Sumber Daya Alam Untuk Mencapai Kemakmuran dan Kesejahteraan Masyarakat.	2026-09-04 21:28:42.894294+07
\.


--
-- Data for Name: riwayat_kuwu; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.riwayat_kuwu (id, nama, masa_jabatan, urutan, keterangan, dibuat_pada, diperbarui_pada) FROM stdin;
1	BUYUT KERTI PARANA	1847 - 1857 (10 Tahun)	1	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
2	BUYUT SUKETI	1857 - 1867 (10 Tahun)	2	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
3	AYAH BUYUT SARI	1867 - 1874 (7 Tahun)	3	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
4	SUKARSA	1874 - 1881 (7 Tahun)	4	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
5	BUYUT SARI	1881 - 1889 (7 Tahun)	5	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
6	SURANGGANATA	1889 - 1891 (2 Tahun)	6	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
7	SASTRA PERWATA	1891 - 1921 (30 Tahun)	7	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
8	ZAINAL MA'RUF	1921 - 1922 (2 Tahun)	8	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
9	WIKARTA PRAJA	1922 - 1932 (30 Tahun)	9	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
10	WANGSA DIJAYA ALIM	1932 - 1943 (11 Tahun)	10	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
11	SUKARYA WASITA	1943 - 1947 (4 Tahun)	11	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
12	KARTA WIJAYA	1947 - 1957 (10 Tahun)	12	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
13	SUKRIA	1957 - 1968 (11 Tahun)	13	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
14	KAMALUDIN SUDIANA	1968 - 1976 (8 Tahun)	14	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
15	WISASRTRA	1976 - 1983 (7 Tahun)	15	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
16	SUHINTA PRAJA	1983 - 1984 (1 Tahun)	16	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
17	MAMAN ROCHAMAN	1984 - 2010 (24 Tahun)	17	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
18	DIDI UHADI	2010 - 2016 (6 Tahun)	18	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
19	DENI SISWANTO, S.IP	2016 - 2017 (1 Tahun)	19	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
20	NONO SUTARNO, S.IP	2017 JULI/OKT (3 Bulan)	20	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
21	RUSTANDI, S.Pd	2017 - 2023 (6 Tahun)	21	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
22	URI MISKARI	2023 - Sekarang	22	\N	2026-09-04 08:05:16.177666+07	2026-09-04 08:05:16.177666+07
\.


--
-- Data for Name: struktur_organisasi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.struktur_organisasi (id, nama, jabatan, urutan, foto, dibuat_pada, diperbarui_pada) FROM stdin;
1	Uri Miskari	Kepala Desa	1	\N	2026-09-04 08:05:16.164566+07	2026-09-04 08:05:16.164566+07
2	Sahlan	Sekretaris Desa	2	\N	2026-09-04 08:05:16.164566+07	2026-09-04 08:05:16.164566+07
3	Juman	Kasi Pemerintahan	3	\N	2026-09-04 08:05:16.164566+07	2026-09-04 08:05:16.164566+07
4	Eman Durahman	Kasi Kesejahteraan	4	\N	2026-09-04 08:05:16.164566+07	2026-09-04 08:05:16.164566+07
5	Dedi Kusnadi	Kasi Pelayanan	5	\N	2026-09-04 08:05:16.164566+07	2026-09-04 08:05:16.164566+07
6	Yogi Iskandar, S.Pd	Kaur Keuangan	6	\N	2026-09-04 08:05:16.164566+07	2026-09-04 08:05:16.164566+07
7	Maman Nurfirmansah	Kaur Umum & TU	7	\N	2026-09-04 08:05:16.164566+07	2026-09-04 08:05:16.164566+07
8	Nana Sudiana, S.Pd	Kaur Perencanaan	8	\N	2026-09-04 08:05:16.164566+07	2026-09-04 08:05:16.164566+07
9	Dede Rusdianto, A.ma	Kadus Ciasuhan	9	\N	2026-09-04 08:05:16.164566+07	2026-09-04 08:05:16.164566+07
10	Aan Kurniawati	Kadus Ciasihan	10	\N	2026-09-04 08:05:16.164566+07	2026-09-04 08:05:16.164566+07
\.


--
-- Data for Name: umkm; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.umkm (id, nama, nomor_hp, alamat, deskripsi, foto, pemilik_id, dibuat_pada, diperbarui_pada) FROM stdin;
\.


--
-- Name: berita_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.berita_id_seq', 154, true);


--
-- Name: galeri_desa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.galeri_desa_id_seq', 3, true);


--
-- Name: kategori_produk_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kategori_produk_id_seq', 45, true);


--
-- Name: pengguna_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pengguna_id_seq', 147, true);


--
-- Name: produk_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.produk_id_seq', 91, true);


--
-- Name: riwayat_kuwu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.riwayat_kuwu_id_seq', 23, true);


--
-- Name: struktur_organisasi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.struktur_organisasi_id_seq', 11, true);


--
-- Name: umkm_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.umkm_id_seq', 3, true);


--
-- Name: berita berita_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.berita
    ADD CONSTRAINT berita_pkey PRIMARY KEY (id);


--
-- Name: galeri_desa galeri_desa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.galeri_desa
    ADD CONSTRAINT galeri_desa_pkey PRIMARY KEY (id);


--
-- Name: kategori_produk kategori_produk_nama_pemilik_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kategori_produk
    ADD CONSTRAINT kategori_produk_nama_pemilik_id_key UNIQUE (nama, pemilik_id);


--
-- Name: kategori_produk kategori_produk_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kategori_produk
    ADD CONSTRAINT kategori_produk_pkey PRIMARY KEY (id);


--
-- Name: pengguna pengguna_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengguna
    ADD CONSTRAINT pengguna_pkey PRIMARY KEY (id);


--
-- Name: pengguna pengguna_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengguna
    ADD CONSTRAINT pengguna_username_key UNIQUE (username);


--
-- Name: produk produk_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produk
    ADD CONSTRAINT produk_pkey PRIMARY KEY (id);


--
-- Name: profil_desa profil_desa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profil_desa
    ADD CONSTRAINT profil_desa_pkey PRIMARY KEY (id);


--
-- Name: riwayat_kuwu riwayat_kuwu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riwayat_kuwu
    ADD CONSTRAINT riwayat_kuwu_pkey PRIMARY KEY (id);


--
-- Name: struktur_organisasi struktur_organisasi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.struktur_organisasi
    ADD CONSTRAINT struktur_organisasi_pkey PRIMARY KEY (id);


--
-- Name: umkm umkm_nama_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.umkm
    ADD CONSTRAINT umkm_nama_key UNIQUE (nama);


--
-- Name: umkm umkm_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.umkm
    ADD CONSTRAINT umkm_pkey PRIMARY KEY (id);


--
-- Name: idx_berita_dibuat_pada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_berita_dibuat_pada ON public.berita USING btree (dibuat_pada DESC);


--
-- Name: idx_berita_penulis; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_berita_kategori ON public.berita USING btree (kategori);
CREATE INDEX idx_berita_penulis ON public.berita USING btree (penulis_id);


--
-- Name: idx_galeri_dibuat_pada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_galeri_dibuat_pada ON public.galeri_desa USING btree (dibuat_pada DESC);


--
-- Name: idx_galeri_urutan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_galeri_urutan ON public.galeri_desa USING btree (urutan);


--
-- Name: idx_kategori_pemilik; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kategori_pemilik ON public.kategori_produk USING btree (pemilik_id);


--
-- Name: idx_pengguna_peran; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pengguna_peran ON public.pengguna USING btree (peran);


--
-- Name: idx_pengguna_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pengguna_username ON public.pengguna USING btree (username);


--
-- Name: idx_produk_dibuat_pada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produk_dibuat_pada ON public.produk USING btree (dibuat_pada DESC);


--
-- Name: idx_produk_kategori; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produk_kategori ON public.produk USING btree (kategori_id);


--
-- Name: idx_produk_pemilik; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produk_pemilik ON public.produk USING btree (pemilik_id);


--
-- Name: idx_produk_umkm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produk_umkm ON public.produk USING btree (umkm_id);


--
-- Name: idx_riwayat_urutan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_riwayat_urutan ON public.riwayat_kuwu USING btree (urutan);


--
-- Name: idx_struktur_urutan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_struktur_urutan ON public.struktur_organisasi USING btree (urutan);


--
-- Name: idx_umkm_nama; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_umkm_nama ON public.umkm USING btree (nama);


--
-- Name: idx_umkm_pemilik; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_umkm_pemilik ON public.umkm USING btree (pemilik_id);


--
-- Name: berita berita_penulis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.berita
    ADD CONSTRAINT berita_penulis_id_fkey FOREIGN KEY (penulis_id) REFERENCES public.pengguna(id) ON DELETE SET NULL;


--
-- Name: kategori_produk kategori_produk_pemilik_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kategori_produk
    ADD CONSTRAINT kategori_produk_pemilik_id_fkey FOREIGN KEY (pemilik_id) REFERENCES public.pengguna(id) ON DELETE CASCADE;


--
-- Name: produk produk_kategori_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produk
    ADD CONSTRAINT produk_kategori_id_fkey FOREIGN KEY (kategori_id) REFERENCES public.kategori_produk(id) ON DELETE RESTRICT;


--
-- Name: produk produk_pemilik_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produk
    ADD CONSTRAINT produk_pemilik_id_fkey FOREIGN KEY (pemilik_id) REFERENCES public.pengguna(id) ON DELETE CASCADE;


--
-- Name: produk produk_umkm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produk
    ADD CONSTRAINT produk_umkm_id_fkey FOREIGN KEY (umkm_id) REFERENCES public.umkm(id) ON DELETE SET NULL;


--
-- Name: umkm umkm_pemilik_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.umkm
    ADD CONSTRAINT umkm_pemilik_id_fkey FOREIGN KEY (pemilik_id) REFERENCES public.pengguna(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict rfksQeanfXAvaTrG0534UOYOitvQ82gzPzEX4bFB2a0bE3QD84vCsZvuczK44K9

