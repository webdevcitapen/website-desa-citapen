# Tutorial Frontend: Menghubungkan ke API Desa Citapen

Panduan ini dibuat khusus untuk frontend developer. Tujuannya satu: **membuat
aplikasi React/Next.js kamu berbicara dengan backend Desa Citapen dengan benar,
mudah, dan tanpa kebingungan.**

Di dalam panduan ini kamu akan belajar:

1. Menyiapkan alamat API.
2. Mengenal bentuk tanggapan (sukses dan gagal).
3. Login dan menyimpan token.
4. Mengirim token untuk rute yang dilindungi.
5. Mengambil data publik (beranda, berita, produk, kategori).
6. Menulis data (produk, berita, kategori) termasuk unggah gambar.
7. Menangani kesalahan dengan benar.
8. Menampilkan gambar dengan benar.
9. Tabel referensi cepat semua rute.
10. Daftar kode kesalahan yang mungkin muncul.

> Lengkapnya, semua rute dan skema data ada di file `api-spesifikasi.yaml`
> (OpenAPI). File itu bisa dibuka di editor seperti Swagger Editor agar
> tampil sebagai dokumentasi interaktif.

---

## 1. Menyiapkan Alamat API

Semua rute diawali dengan `/api`. Buat satu file konfigurasi agar mudah diganti.

**File `.env` di proyek frontend:**

```env
VITE_API_URL=http://localhost:3000/api
```

> Saat deploy nanti, ganti dengan URL Render, contoh:
> `https://backend-desa-citapen.onrender.com/api`.

**Buat pembungkus `fetch` (contoh `src/layanan/api.ts`):**

```ts
const URL_DASAR = import.meta.env.VITE_API_URL;

// Pangil fungsi ini setiap ingin memanggil API.
// opsi dapat berisi { metode, badan, token, berkas }.
export async function panggilApi<T>(
  jalur: string,
  opsi: {
    metode?: "GET" | "POST" | "PUT" | "DELETE";
    badan?: unknown;
    token?: string;
    berkas?: FormData;
  } = {},
): Promise<T> {
  const kepala: Record<string, string> = {};
  if (opsi.berkas) {
    // Biarkan browser menentukan header multipart sendiri
    kepala.Accept = "application/json";
  } else {
    kepala["Content-Type"] = "application/json";
  }
  if (opsi.token) {
    kepala.Authorization = `Bearer ${opsi.token}`;
  }

  const tanggapan = await fetch(`${URL_DASAR}${jalur}`, {
    method: opsi.metode ?? "GET",
    headers: kepala,
    body: opsi.berkas ?? (opsi.badan ? JSON.stringify(opsi.badan) : undefined),
  });

  // Tanggapan 204 tidak punya isi
  if (tanggapan.status === 204) {
    return null as T;
  }

  const hasil = await tanggapan.json();
  if (!tanggapan.ok) {
    // Lempar objek kesalahan agar bisa ditangkap oleh pemanggil
    throw new KesalahanApi(hasil.kode, hasil.pesan, hasil.detail ?? []);
  }
  return hasil.data as T;
}

export class KesalahanApi extends Error {
  kode: string;
  detail: string[];
  constructor(kode: string, pesan: string, detail: string[]) {
    super(pesan);
    this.kode = kode;
    this.detail = detail;
  }
}
```

---

## 2. Bentuk Tanggapan

Backend selalu menjawab dengan salah satu dari dua bentuk ini.

**Sukses:**

```json
{
  "status": "sukses",
  "pesan": "Selamat datang kembali di desa citapen",
  "data": { ... }
}
```

**Gagal:**

```json
{
  "status": "gagal",
  "pesan": "Data yang dikirim tidak valid, periksa kembali isian Anda",
  "kode": "DATA_TIDAK_VALID",
  "detail": ["Nilai terlalu kecil atau terlalu pendek (kolom: judul)"]
}
```

> **Aturan emas:** kamu cukup baca `data` saat sukses, dan baca `pesan` +
> `kode` saat gagal. Jangan baca `data` saat status gagal.

---

## 3. Login dan Menyimpan Token

Rute `POST /autentikasi/masuk` menerima `username` dan `kataSandi`.

```ts
const hasil = await panggilApi<{ token: string; pengguna: Pengguna }>(
  "/autentikasi/masuk",
  { badan: { username: "toko_berkah", kataSandi: "Rahasia123" } },
);

localStorage.setItem("token", hasil.token);
localStorage.setItem("pengguna", JSON.stringify(hasil.pengguna));
```

`hasil.pengguna` berisi profil pengguna yang masuk, termasuk `peran`
(`admin` atau `publikasi`). Peran `umkm` sudah dihapus; pengelolaan UMKM kini dilakukan penuh oleh `admin`. Pakai `peran` untuk
mengatur tampilan menu di frontend.

> **Catatan keamanan:** simpan token di `localStorage` cukup untuk aplikasi
> sederhana. Untuk aplikasi yang lebih serius, pertimbangkan `httpOnly cookie`.

---

## 4. Mengirim Token

Rute yang dilindungi membutuhkan header:

```
Authorization: Bearer <token>
```

Pada pembungkus di atas, cukup kirim `token`:

```ts
const profil = await panggilApi<Pengguna>("/autentikasi/saya", {
  token: localStorage.getItem("token") ?? "",
});
```

Buat pemanggilan di atas menjadi helper agar tidak berulang:

```ts
function tokenSaya(): string {
  return localStorage.getItem("token") ?? "";
}
```

Jika token sudah kadaluarsa, backend membalas kode `BELUM_MASUK`. Saat
mendapat kode ini, arahkan pengguna ke halaman login.

---

## 5. Mengambil Data Publik

Rute publik tidak memerlukan token.

**Beranda (untuk halaman utama):**

```ts
const beranda = await panggilApi<{
  beritaTerbaru: Berita[];
  produkTerbaru: Produk[];
  jumlahBerita: number;
  jumlahProduk: number;
  jumlahUmkm: number;
  kesehatanDatabase: boolean;
}>("/beranda");
```

**Daftar berita dengan paginasi:**

```ts
const daftar = await panggilApi<{
  daftar: Berita[];
  halaman: number;
  perHalaman: number;
  total: number;
  totalHalaman: number;
}>("/berita?halaman=1&perHalaman=10");
```

**Daftar produk dengan penyaring:**

```ts
// Semua produk
await panggilApi("/produk?halaman=1&perHalaman=10");

// Produk dari kategori tertentu
await panggilApi("/produk?kategoriId=3");

// Produk milik admin tertentu (untuk halaman profil toko)
await panggilApi("/produk?pemilikId=7");
```

**Kategori:**

```ts
const kategori = await panggilApi<Kategori[]>("/kategori");
```

### Memahami paginasi

Semua daftar memakai paginasi. Parameter kueri:

| Parameter   | Default | Maksimal | Keterangan                     |
| ----------- | ------- | -------- | ------------------------------ |
| `halaman`   | 1       | -        | Nomor halaman, dimulai dari 1  |
| `perHalaman`| 10      | 50       | Jumlah data per halaman        |

Tanggapan selalu berbentuk:

```ts
{
  daftar: [...],   // data pada halaman ini
  halaman: 1,      // halaman yang sedang ditampilkan
  perHalaman: 10,  // jumlah data per halaman
  total: 42,       // jumlah total data di database
  totalHalaman: 5  // jumlah halaman keseluruhan
}
```

Contoh komponen paginasi:

```tsx
const { daftar, halaman, totalHalaman } = data;
return (
  <div>
    {daftar.map((item) => (
      <CardProduk key={item.id} produk={item} />
    ))}
    {Array.from({ length: totalHalaman }, (_, i) => i + 1).map((no) => (
      <button
        key={no}
        disabled={no === halaman}
        onClick={() => muatHalaman(no)}
      >
        {no}
      </button>
    ))}
  </div>
);
```

---

## 6. Menulis Data

### 6.1 Tambah produk (peran admin - full akses UMKM)

Rute `POST /produk` memakai `multipart/form-data` karena bisa membawa foto.

```ts
async function tambahProduk(data: {
  nama: string;
  harga: number;
  deskripsi: string;
  kategoriId?: number;
  foto?: File;
}) {
  const form = new FormData();
  form.append("nama", data.nama);
  form.append("harga", String(data.harga));
  form.append("deskripsi", data.deskripsi);
  // Kategori kini NOT NULL di DB (migrasi 2025-09-05). Jika tidak dikirim,
  // backend otomatis fallback ke kategori "Umum" milik admin.
  if (data.kategoriId) form.append("kategoriId", String(data.kategoriId));
  if (data.foto) form.append("foto", data.foto);

  return panggilApi<Produk>("/produk", {
    metode: "POST",
    token: tokenSaya(),
    berkas: form,
  });
}
```

> **Penting:** JANGAN set `Content-Type` secara manual saat memakai
> `FormData`. Biarkan browser yang menentukannya.

**Ketentuan berkas gambar:**

| Aturan            | Nilai                                    |
| ----------------- | ---------------------------------------- |
| Jenis             | jpg, jpeg, png                           |
| Ukuran maksimal   | 5 megabyte                               |
| Wajib? (produk)   | Tidak; foto bersifat opsional            |
| Kolom formulir    | `foto` untuk produk & foto profil, `gambar` untuk berita |

Gambar otomatis dikompresi oleh server, jadi frontend tidak perlu
memproses gambar sama sekali.

### 6.2 Ubah produk

`PUT /produk/:id` dengan bentuk yang sama persis. Jika tidak mengirim foto,
foto lama akan dipertahankan otomatis.

```ts
async function ubahProduk(id: number, data: {
  nama: string;
  harga: number;
  deskripsi: string;
  kategoriId?: number;
  foto?: File;
}) {
  const form = new FormData();
  form.append("nama", data.nama);
  form.append("harga", String(data.harga));
  form.append("deskripsi", data.deskripsi);
  if (data.kategoriId) form.append("kategoriId", String(data.kategoriId));
  if (data.foto) form.append("foto", data.foto);

  return panggilApi<Produk>(`/produk/${id}`, {
    metode: "PUT",
    token: tokenSaya(),
    berkas: form,
  });
}
```

### 6.3 Hapus produk

```ts
await panggilApi(`/produk/${id}`, {
  metode: "DELETE",
  token: tokenSaya(),
});
```

### 6.4 Kategori (peran admin - full akses UMKM)

```ts
// Tambah
const kategori = await panggilApi<Kategori>("/kategori", {
  metode: "POST",
  token: tokenSaya(),
  badan: { nama: "Makanan Ringan" },
});

// Hapus (JSON biasa, bukan multipart)
await panggilApi(`/kategori/${id}`, {
  metode: "DELETE",
  token: tokenSaya(),
});
```

### 6.5 Berita (admin desa / publikasi)

Sama seperti produk, tetapi kolom berkasnya bernama `gambar` dan ada kolom
`kategori` (enum yang sama dengan frontend `FormBerita.tsx`):

```ts
const form = new FormData();
form.append("judul", judul);
form.append("isi", isi);
form.append("kategori", kategori); // Umum | Infrastruktur | Kesehatan | Pendidikan | Pertanian | Ekonomi | Sosial | Budaya
if (gambar) form.append("gambar", gambar);

await panggilApi<Berita>("/berita", {
  metode: "POST",
  token: tokenSaya(),
  berkas: form,
});

// Filter berita berdasarkan kategori
const umum = await panggilApi("/berita?kategori=Umum");
const infra = await panggilApi("/berita?kategori=Infrastruktur");
```

### 6.6 Ubah profil diri

`PUT /autentikasi/profil` memakai JSON biasa:

```ts
await panggilApi<Pengguna>("/autentikasi/profil", {
  metode: "PUT",
  token: tokenSaya(),
  badan: {
    namaLengkap: "Toko Berkah Jaya",
    namaUsaha: "Toko Berkah Jaya",
    email: "toko@contoh.com",
    nomorHp: "081234567890",
  },
});
```

Kolom `namaUsaha`, `email`, dan `nomorHp` boleh `null` (kosong).

### 6.7 Unggah foto profil

```ts
const form = new FormData();
form.append("foto", fileFoto);

await panggilApi<Pengguna>("/autentikasi/foto-profil", {
  metode: "PUT",
  token: tokenSaya(),
  berkas: form,
});
```

---

## 7. Menangani Kesalahan

Contoh penanganan yang benar:

```tsx
try {
  const produk = await tambahProduk(data);
  tampilkanNotif("sukses", `Produk ${produk.nama} berhasil ditambahkan`);
} catch (kesalahan) {
  if (kesalahan instanceof KesalahanApi) {
    if (kesalahan.kode === "DATA_TIDAK_VALID") {
      // Tampilkan daftar rincian validasi
      tampilkanNotif("gagal", kesalahan.detail.join(", "));
    } else if (kesalahan.kode === "TANPA_IZIN") {
      // Contoh: publikasi mencoba mengubah produk (hanya admin yang boleh)
      tampilkanNotif("gagal", "Anda tidak berhak mengubah data ini");
    } else {
      tampilkanNotif("gagal", kesalahan.message);
    }
  } else {
    tampilkanNotif("gagal", "Server tidak dapat dijangkau");
  }
}
```

**Kode status HTTP yang umum:**

| Status | Arti                          | Kode kesalahan umum        |
| ------ | ----------------------------- | -------------------------- |
| 400    | Data yang dikirim tidak valid | `DATA_TIDAK_VALID`         |
| 401    | Token hilang / salah / habis  | `BELUM_MASUK`              |
| 403    | Tidak punya izin              | `TANPA_IZIN`               |
| 404    | Data / rute tidak ditemukan   | `DATA_TIDAK_DITEMUKAN`     |
| 409    | Data bentrok (username dipakai) | `DATA_BERDUPLIKAT`       |
| 429    | Terlalu banyak permintaan     | (dari pembatas laju)       |
| 500    | Kesalahan dalam server        | `KESALAHAN_SERVER`         |

---

## 8. Menampilkan Gambar dengan Benar

Backend mengembalikan **path relatif**, contoh:

```json
"fotoProfil": "profil/abcdef-123.jpg",
"foto": "produk/abcdef-123.jpg",
"gambar": "berita/abcdef-123.jpg"
```

Untuk menampilkan, gabungkan dengan alamat server:

```ts
const URL_BERKAS = import.meta.env.VITE_API_URL.replace(/\/api$/, "");

function urlGambar(pathRelatif: string | null): string | undefined {
  if (!pathRelatif) return undefined;
  return `${URL_BERKAS}/unggahan/${pathRelatif}`;
}
```

```tsx
<img
  src={urlGambar(produk.foto)}
  alt={produk.nama}
  onError={(e) => {
    (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
  }}
/>
```

> Selalu siapkan gambar pengganti saat berkas tidak ada atau gagal dimuat.

### Fallback avatar khusus untuk struktur organisasi

Backend kini mengembalikan field `inisial` dan `warnaAvatar` untuk setiap anggota
struktur organisasi, sehingga frontend tidak perlu menghitung sendiri. Pakai
fallback ini ketika `foto` bernilai `null`:

```tsx
import { getImageUrl } from '../services/api';

function AvatarStruktur({ anggota }: { anggota: StrukturOrganisasi }) {
  if (anggota.foto) {
    return <img src={getImageUrl(anggota.foto)} alt={anggota.nama} className="w-20 h-20 rounded-full object-cover" />;
  }
  // Fallback avatar inisial dengan warna konsisten dari backend
  return (
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl"
      style={{ backgroundColor: anggota.warnaAvatar }}
    >
      {anggota.inisial}
    </div>
  );
}
```

Contoh data dari `GET /struktur-organisasi`:

```json
{
  "id": 1,
  "nama": "Uri Miskari",
  "jabatan": "Kepala Desa",
  "urutan": 1,
  "foto": null,
  "inisial": "UM",
  "warnaAvatar": "#0A3D2D",
  "dibuatPada": "...",
  "diperbaruiPada": "..."
}
```

Jika kamu sudah memakai `nama.charAt(0)` manual, tetap berfungsi, tapi
direkomendasikan pakai `inisial` + `warnaAvatar` dari backend agar warna
konsisten lintas device.

---

## 9. Tabel Referensi Cepat

### Rute publik (tanpa token)

| Metode | Rute                | Keterangan                       |
| ------ | ------------------- | -------------------------------- |
| GET    | `/`                 | Informasi dasar layanan          |
| GET    | `/kesehatan`        | Cek kesehatan server & database  |
| GET    | `/beranda`          | Data halaman utama               |
| GET    | `/berita`           | Daftar berita (paginasi, filter kategori) |
| GET    | `/berita/:id`       | Detail berita                    |
| GET    | `/produk`           | Daftar produk (paginasi, filter) |
| GET    | `/produk/:id`       | Detail produk                    |
| GET    | `/kategori`         | Daftar kategori                  |
| POST   | `/autentikasi/masuk`| Login                            |

> **Baru 2025-09-05**: `GET /berita` kini mendukung `?kategori=Infrastruktur` (enum:
> `Umum, Infrastruktur, Kesehatan, Pendidikan, Pertanian, Ekonomi, Sosial, Budaya`).
> `GET /produk` tetap sama, tapi `kategori` kini selalu ada (fallback `Umum`).
> `GET /struktur-organisasi` kini mengembalikan `inisial` + `warnaAvatar` untuk fallback.

### Rute dengan token (diri sendiri)

| Metode | Rute                         | Keterangan                 |
| ------ | ---------------------------- | -------------------------- |
| GET    | `/autentikasi/saya`          | Profil diri                |
| PUT    | `/autentikasi/profil`        | Ubah profil                |
| PUT    | `/autentikasi/foto-profil`   | Unggah foto profil (multipart) |
| PUT    | `/autentikasi/kata-sandi`    | Ganti kata sandi           |
| PUT    | `/autentikasi/username`      | Ganti username             |

### Rute dengan token + peran

| Metode | Rute                             | Peran               | Keterangan          |
| ------ | -------------------------------- | ------------------- | ------------------- |
| POST   | `/berita`                        | admin, publikasi | Terbitkan berita |
| PUT    | `/berita/:id`                    | admin, pemilik berita | Ubah berita   |
| DELETE | `/berita/:id`                    | admin, pemilik berita | Hapus berita  |
| POST   | `/produk`                        | admin          | Tambah produk (full akses UMKM) |
| PUT    | `/produk/:id`                    | admin          | Ubah produk         |
| DELETE | `/produk/:id`                    | admin          | Hapus produk        |
| POST   | `/kategori`                      | admin          | Tambah kategori     |
| DELETE | `/kategori/:id`                  | admin          | Hapus kategori      |
| GET    | `/admin/pengguna`                | admin          | Daftar pengguna     |
| POST   | `/admin/pengguna`                | admin          | Daftarkan pengguna (hanya publikasi) |
| GET    | `/admin/pengguna/:id`            | admin          | Detail pengguna     |
| DELETE | `/admin/pengguna/:id`            | admin          | Hapus pengguna      |
| PUT    | `/admin/pengguna/:id/kata-sandi` | admin          | Ganti kata sandi    |
| PUT    | `/admin/pengguna/:id/username`   | admin          | Ganti username      |
| GET    | `/profil-desa`                   | publik              | Ambil profil desa (letak geografis & wilayah) |
| PUT    | `/profil-desa`                   | admin          | Ubah profil desa    |
| GET    | `/struktur-organisasi`           | publik              | Daftar struktur organisasi |
| POST   | `/struktur-organisasi`           | admin          | Tambah struktur     |
| PUT    | `/struktur-organisasi/:id`       | admin          | Ubah struktur       |
| DELETE | `/struktur-organisasi/:id`       | admin          | Hapus struktur      |
| GET    | `/riwayat-kuwu`                  | publik              | Daftar riwayat kuwu |
| POST   | `/riwayat-kuwu`                  | admin          | Tambah riwayat      |
| PUT    | `/riwayat-kuwu/:id`              | admin          | Ubah riwayat        |
| DELETE | `/riwayat-kuwu/:id`              | admin          | Hapus riwayat       |

> Aturan singkat peran:
> - **Admin desa** bisa hampir semuanya, termasuk mengelola semua produk/kategori UMKM dan profil desa (letak geografis & wilayah, struktur organisasi, riwayat kuwu).
> - **Publikasi** hanya menulis berita (sebagai penulis) dan mengelola akun sendiri.

---

## 10. Daftar Kode Kesalahan

| Kode                      | Arti                                          |
| ------------------------- | --------------------------------------------- |
| `DATA_TIDAK_VALID`        | Isi permintaan gagal validasi (baca `detail`) |
| `KUERI_TIDAK_VALID`       | Parameter pencarian tidak valid               |
| `PARAMETER_TIDAK_VALID`   | Id pada rute tidak valid                      |
| `PAGINASI_TIDAK_VALID`    | Nilai halaman/perHalaman tidak valid          |
| `BELUM_MASUK`             | Token tidak ada, salah, atau sudah kadaluarsa |
| `KEDENSIAL_SALAH`         | Username atau kata sandi salah                |
| `AKUN_NONAKTIF`           | Akun dinonaktifkan oleh admin desa            |
| `PENGGUNA_TIDAK_DITEMUKAN`| Token sah tetapi pengguna sudah dihapus       |
| `TANPA_IZIN`              | Tidak punya hak untuk tindakan ini            |
| `DATA_TIDAK_DITEMUKAN`    | Data atau rute tidak ditemukan                |
| `RUTE_TIDAK_DITEMUKAN`    | Alamat rute salah                             |
| `DATA_BERDUPLIKAT`        | Username atau data serupa sudah ada           |
| `KESALAHAN_BERKAS`        | Berkas tidak sesuai ketentuan (jenis/ukuran)  |
| `JSON_TIDAK_VALID`        | Badan JSON yang dikirim rusak                 |
| `KESALAHAN_SERVER`        | Kesalahan di dalam server, coba lagi nanti    |

---

## 11. Guard Pencegah Kehilangan Data Form (baru 2025-09-05)

Semua form admin yang mengubah data kini **wajib** memakai guard agar pengguna
tidak kehilangan data saat tidak sengaja menutup tab, me-refresh, atau klik
navigasi (misal menu sidebar) sebelum menekan Simpan.

Backend sudah menyiapkan dukungan **ETag/If-Match** dan dokumentasi hook
siap-pakai. Frontend tidak perlu menebak lagi — cukup import hook
`useGuardForm` di bawah ini.

### 11.1. Pasang hook `useGuardForm` sekali

Buat file `src/hooks/useGuardForm.ts`:

```ts
import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export function useGuardForm(isDirty: boolean) {
  const blocker = useBlocker(isDirty);

  // Cegah perpindahan halaman SPA (klik menu, back button)
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const yakin = confirm('Perubahan belum disimpan. Yakin ingin keluar? Data akan hilang.');
      if (yakin) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);

  // Cegah reload / tutup tab
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
```

### 11.2. Pakai di setiap form (contoh FormBerita)

```tsx
import { useGuardForm } from '../../hooks/useGuardForm';

export default function FormBerita() {
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [kategori, setKategori] = useState('Umum');
  const [initial, setInitial] = useState({ judul: '', isi: '', kategori: 'Umum' });

  // Anggap dirty jika ada perubahan vs data awal dari server
  const isDirty = judul !== initial.judul || isi !== initial.isi || kategori !== initial.kategori;
  useGuardForm(isDirty);

  // ... sisanya sama
}
```

Lakukan hal yang sama untuk:

- `FormBerita` (`admin/berita/FormBerita.tsx`)
- `FormProduk` & `FormUMKM` (`admin/umkm/...`)
- `FormPengguna` / `EditPengguna`
- `ProfilAdmin` (semua 6 section: Sejarah, VisiMisi, Geografis, Struktur, Riwayat, Galeri)
- `ProfilPengguna`

### 11.3. Dukungan backend (ETag)

Setiap `GET /berita/:id`, `GET /produk/:id`, `GET /struktur-organisasi/:id`,
`GET /profil-desa`, dan `GET /umkm/:id` kini mengirim header:

```
ETag: "abc123..."
Last-Modified: Sat, 05 Sep 2026 11:00:00 GMT
Cache-Control: no-store
```

Saat `PUT`/`PATCH`, kirim kembali nilai ETag di header `If-Match`:

```ts
const detail = await api.get(`/berita/${id}`);
const etag = detail.headers.etag;

await api.put(`/berita/${id}`, formData, {
  headers: { 'If-Match': etag }
});
```

Jika data sudah diubah orang lain, backend membalas `409 DATA_BERDUPLIKAT`
dengan pesan _"Data telah diubah oleh pengguna lain. Muat ulang halaman
sebelum menyimpan."_ — tampilkan konfirmasi ke pengguna.

Detail implementasi backend ada di `src/utils/guard-form.ts`.

---

## Checklist Sebelum Memulai

- [ ] `VITE_API_URL` sudah diisi di `.env` frontend.
- [ ] `ASAL_DIIZINKAN` di `.env` backend berisi origin frontend (mis. `http://localhost:5173`), atau `*` untuk pengembangan.
- [ ] Sudah login untuk rute berizin; token dikirim sebagai `Bearer`.
- [ ] FormData untuk rute yang bisa membawa gambar; JSON biasa untuk lainnya.
- [ ] Jangan set `Content-Type` manual saat memakai FormData.
- [ ] Selalu tampilkan `pesan` dari backend saat terjadi kesalahan.
- [ ] Gabungkan `URL_BERKAS + "/unggahan/" + path` untuk menampilkan gambar.
- [ ] Pasang `useGuardForm(isDirty)` di semua form admin (lihat §11).
- [ ] Pakai `inisial` + `warnaAvatar` dari `/struktur-organisasi` untuk fallback avatar.
- [ ] Kirim `kategori` untuk berita (`Umum` default) dan selalu kirim `kategoriId` untuk produk (fallback `Umum` otomatis jika lupa).

Selamat mengembangkan! Jika ada yang kurang jelas, tanyakan kepada
developer backend atau baca `api-spesifikasi.yaml`.
