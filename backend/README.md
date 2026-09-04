# Backend Desa Citapen

Layanan web (web service) profil Desa Citapen dan katalog produk UMKM.
Dibangun dengan Express.js dan TypeScript, memakai PostgreSQL sebagai basis data,
dengan dua peran pengguna: **admin desa** dan **publikasi** (peran **umkm** sudah dihapus dan pengelolaan UMKM kini dilakukan penuh oleh **admin desa**).

## Fitur

- Autentikasi JWT (masuk, daftar, muat profil, ubah profil, ganti kata sandi).
- Manajemen pengguna oleh admin desa (daftarkan publikasi, hapus pengguna, ubah kata sandi dan username).
- Manajemen berita oleh admin desa dan publikasi.
- Katalog produk UMKM: dikelola penuh oleh admin desa (full akses CRUD); publik melihatnya.
- Profil desa yang dapat diedit admin desa: letak geografis & wilayah, struktur organisasi, riwayat kepala desa (kuwu).
- Halaman beranda untuk publik (statistik, berita terbaru, produk terbaru).
- Kompresi gambar otomatis (Sharp) saat unggah foto profil, produk, dan berita.
- Keamanan: Helmet, CORS terbatas, pembatas laju (umum, login, unggah),
  parameterisasi query SQL, tanpa `any`, validasi Zod, tanpa header `x-powered-by`.
- Log terstruktur memakai Pino dengan tingkat log yang bisa diatur.
- Pengujian lengkap: unit, integrasi, API, keamanan, aksesibilitas, sanity,
  regresi, asap, beban, kinerja, dan tekanan.

## Teknologi

| Bagian | Teknologi |
| ------ | --------- |
| Bahasa | TypeScript 5 (mode ESM) |
| Kerangka | Express 4 |
| Basis data | PostgreSQL + node-postgres (`pg`) |
| Validasi | Zod |
| Otentikasi | JSON Web Token + bcryptjs |
| Unggah & gambar | Multer + Sharp |
| Keamanan | Helmet, CORS, express-rate-limit |
| Log | Pino + pino-http |
| Pengujian | Vitest + Supertest, Autocannon |
| Proses | tsx (pengembangan), tsc (build) |
| Keamanan Build | javascript-obfuscator (obfuscation) + tsc |

## Prasyarat

- Node.js versi 20 atau lebih baru.
- PostgreSQL versi 14 atau lebih baru.

## Cara Menjalankan Secara Lokal

### 1. Buat basis data

Masuk ke terminal PostgreSQL lalu buat database:

```sql
CREATE DATABASE desa_citapen;
```

Skema tabel berada di `database/skema.sql`. Skema dan akun admin awal juga
otomatis dibuat oleh server saat pertama kali dijalankan.

### 2. Siapkan konfigurasi

```bash
cp .env.example .env
```

Lalu sesuaikan nilai `DATABASE_URL`, `JWT_RAHASIA`, dan variabel lainnya di `.env`.

### 3. Pasang dependensi dan jalankan

```bash
npm install
npm run dev
```

Server berjalan di `http://localhost:3000`. Cek kesehatan:
`GET http://localhost:3000/api/kesehatan`.

### 4. Build dan jalankan produksi

```bash
npm run build   # tsc + obfuscation (dist menjadi tidak terbaca)
npm start       # jalankan hasil obfuscate: node dist/server.js
```

> **Keamanan Build (Obfuscation)** — perintah `npm run build` otomatis menjalankan
> `tsc` lalu `node scripts/obfuscate.mjs`. Hasil di `dist/` akan **tidak bisa dibaca
> manusia** seperti bundle React/Vue produksi (variable acak `0x...`, string di-encode
> base64, control-flow diacak, tanpa komentar dan tanpa source map). `src/` tetap
> bersih dan mudah dibaca untuk developer.
>
> - `npm run build:asli` — kompilasi saja tanpa obfuscation (untuk debug).
> - `npm run build:obfuscate` — ulangi obfuscation saja (jika perlu).
> - `npm start` — tetap `node dist/server.js` (sudah ter-obfuscate, 100% runnable).
> - `tsconfig.json` sudah diatur `sourceMap:false` & `removeComments:true` agar tidak
>   ada peta kode yang bocor ke produksi.

## Variabel Lingkungan

Semua variabel dijelaskan di `.env.example`:

| Variabel | Keterangan |
| -------- | ---------- |
| `PORT` | Port server (default 3000). |
| `DATABASE_URL` | URL koneksi PostgreSQL. |
| `JWT_RAHASIA` | Rahasia penandatanganan token JWT (minimal 32 karakter di produksi). |
| `JWT_KEDALUWARSA` | Masa berlaku token, contoh `1d`, `2h`, `30m`. |
| `ASAL_DIIZINKAN` | Daftar origin yang diizinkan, pisahkan koma; `*` untuk semua (hanya pengembangan). |
| `USERNAME_ADMIN_AWAL` | Username admin yang dibuat otomatis saat pertama kali berjalan. |
| `SANDI_ADMIN_AWAL` | Kata sandi admin awal. |
| `LOG_TINGKAT` | Tingkat log: `trace`, `debug`, `info`, `warn`, `error`. |
| `BATAS_LAJU_UMUM` | Batas permintaan umum per IP dalam 15 menit. |
| `BATAS_LAJU_LOGIN` | Batas percobaan login per IP dalam 15 menit. |
| `BATAS_LAJU_UNGGAH` | Batas unggah berkas per IP dalam 15 menit. |

## Endpoint Utama

Semua rute diawali `/api`.

| Metode | Rute | Akses | Keterangan |
| ------ | ---- | ----- | ---------- |
| GET | `/kesehatan` | publik | Pemeriksaan kesehatan server dan database. |
| GET | `/beranda` | publik | Data beranda (statistik, berita, produk). |
| POST | `/autentikasi/masuk` | publik | Masuk, mengembalikan token JWT. |
| POST | `/autentikasi/daftar` | admin | Mendaftarkan pengguna baru. |
| GET | `/autentikasi/diri` | masuk | Muat profil sendiri. |
| PATCH | `/autentikasi/diri` | masuk | Ubah profil sendiri. |
| PATCH | `/autentikasi/diri/kata-sandi` | masuk | Ganti kata sandi sendiri. |
| PATCH | `/autentikasi/diri/foto-profil` | masuk | Unggah/ubah foto profil. |
| GET | `/berita` | publik | Daftar berita (dengan paginasi). |
| POST | `/berita` | admin desa, publikasi | Tambah berita. |
| PATCH/PUT/DELETE | `/berita/:id` | admin desa / penulis | Ubah/hapus berita. |
| GET | `/produk` | publik | Daftar produk (dengan paginasi dan filter kategori). |
| POST | `/produk` | admin desa | Tambah produk (full akses UMKM). |
| PATCH/PUT/DELETE | `/produk/:id` | admin desa | Ubah/hapus produk. |
| GET | `/kategori` | publik | Daftar kategori produk. |
| POST | `/kategori` | admin desa | Tambah kategori. |
| DELETE | `/kategori/:id` | admin desa | Hapus kategori. |
| GET | `/profil-desa` | publik | Ambil profil desa (letak geografis & wilayah). |
| PUT | `/profil-desa` | admin desa | Ubah profil desa. |
| GET | `/struktur-organisasi` | publik | Daftar struktur organisasi. |
| POST/PUT/DELETE | `/struktur-organisasi` | admin desa | Kelola struktur organisasi. |
| GET | `/riwayat-kuwu` | publik | Daftar riwayat kepala desa (kuwu). |
| POST/PUT/DELETE | `/riwayat-kuwu` | admin desa | Kelola riwayat kuwu. |
| GET | `/admin/pengguna` | admin | Daftar pengguna (dengan paginasi dan filter). |
| DELETE | `/admin/pengguna/:id` | admin | Hapus pengguna. |
| PUT | `/admin/pengguna/:id/kata-sandi` | admin | Ubah kata sandi pengguna. |
| PUT | `/admin/pengguna/:id/username` | admin | Ubah username pengguna. |

## Pengujian

```bash
npm test                 # semua pengujian otomatis (unit, integrasi, API, dll.)
npm run test:unit        # pengujian unit
npm run test:integrasi   # pengujian integrasi
npm run test:api         # pengujian API
npm run test:keamanan    # pengujian keamanan
npm run test:aksesibilitas  # pengujian aksesibilitas
npm run test:sanity      # pengujian sanity
npm run test:regresi     # pengujian regresi
npm run test:asap        # pengujian asap
```

Pengujian beban memakai Autocannon dan memerlukan server berjalan
(`npm run dev` atau `npm start` di terminal terpisah):

```bash
npm run test:beban       # pengujian beban dasar
npm run test:kinerja     # pengukuran kinerja endpoint publik
npm run test:stress      # pengujian tekanan (koneksi tinggi)
```

## Menyebarkan ke Render dan Supabase

1. **Supabase** — buat proyek baru di dashboard Supabase. Di halaman
   *Project Settings > Database*, salin *Connection string* untuk Node.js
   (URI). Database dan tabel dibuat otomatis oleh server saat pertama kali
   berjalan, atau jalankan isi `database/skema.sql` melalui SQL editor Supabase.

2. **Render** — buat *New Web Service* yang terhubung ke repositori git ini:
   - *Root Directory*: `backend`
   - *Build Command*: `npm install && npm run build` (otomatis ter-obfuscate)
   - *Start Command*: `npm start` (menjalankan `dist/` yang sudah ter-obfuscate)

3. **Variabel lingkungan di Render** — isi sesuai `.env.example`:
   `DATABASE_URL` (dari Supabase), `JWT_RAHASIA` (acak, panjang),
   `ASAL_DIIZINKAN` (mis. `https://desa-citapen.vercel.app`), dan lainnya.

> **Catatan tentang unggahan** — berkas yang diunggah disimpan di folder
> `unggahan/` pada sistem berkas. Di Render, sistem berkas bersifat sementara
> (hilang saat instance dimulai ulang). Untuk foto yang harus permanen,
> gunakan layanan penyimpanan objek (mis. Supabase Storage) atau volume disk
> Render, lalu ubah fungsi penyimpanan di `src/utils/berkas.ts`.

## Struktur Direktori

```
backend/
├── database/
│   └── skema.sql          # Skema basis data (pengguna, berita, produk, kategori)
├── scripts/
│   └── obfuscate.mjs      # Pipeline obfuscation dist (mirip React/Vue build)
├── src/
│   ├── app.ts             # Pembuat aplikasi Express
│   ├── server.ts          # Titik masuk server
│   ├── config/            # Konfigurasi lingkungan dan koneksi database
│   ├── pengendali/        # Lapisan pengendali (HTTP)
│   ├── layanan/           # Lapisan bisnis
│   ├── repositori/        # Akses database (query berparameter)
│   ├── middleware/        # Autentikasi, otorisasi, validasi, pembatas laju, dll.
│   ├── rute/              # Definisi rute API
│   ├── validasi/          # Skema Zod
│   ├── utils/             # Utilitas (token, sandi, kompresi gambar, berkas)
│   └── pengujian/         # Seluruh pengujian (unit, integrasi, API, beban, dll.)
├── dist/                  # Hasil build ter-obfuscate (tidak terbaca, siap deploy)
├── unggahan/              # Berkas unggahan terkompresi (profil, produk, berita)
├── .env.example           # Contoh konfigurasi lingkungan
└── package.json
```

### Keamanan Build — Dist Tidak Terbaca (Obfuscation)

`src/` tetap **clean code** dan mudah dibaca (Bahasa Indonesia, komentar lengkap).
Saat `npm run build` dijalankan, `dist/` diubah menjadi sangat sulit dibaca manusia,
persis seperti bundle produksi **React/Vue**:

- sebelum (src): `export function buatAplikasi(){ const aplikasi = express(); ... }`
- sesudah (dist): `(function(_0x386c...){ ... function _0x1d7d(...){ ... } export function buatAplikasi(_0xc5849a){ const _0x3d497b=_0x411cb9(); ... }`

Yang dilakukan script `scripts/obfuscate.mjs` (`javascript-obfuscator`):

| Teknik | Efek |
|--------|------|
| `controlFlowFlattening` | Alur `if/for` diacak menjadi `switch` dispatcher |
| `stringArray` + `base64` | String seperti `"SELECT ..."` disembunyikan dalam array ter-encode |
| `identifierNamesGenerator: hexadecimal` | Nama variabel menjadi `_0x1a2b3c` |
| `compact:true` + `splitStrings` | Satu baris panjang, tanpa spasi/komentar |
| `renameGlobals:false` + `transformObjectKeys:false` | API JSON & global Node tetap benar |
| Hapus `*.map` | Tidak ada source map yang membocorkan kode asli |

Verifikasi cepat setelah build:

```bash
head -n 3 dist/server.js   # akan terlihat 1 baris panjang acak
ls dist/*.map               # tidak ada file .map (sudah dihapus)
npm start                   # server tetap jalan normal
curl http://localhost:3000/api/kesehatan
```

## Akun Admin Awal

Saat server pertama kali dijalankan, akun admin dibuat otomatis memakai
`USERNAME_ADMIN_AWAL` dan `SANDI_ADMIN_AWAL` dari variabel lingkungan
(akun hanya dibuat jika belum ada admin sama sekali).
