/**
 * Kumpulan skema validasi zod untuk seluruh permintaan masuk.
 * Setiap skema memakai pesan berbahasa Indonesia agar mudah
 * dipahami oleh pengguna aplikasi.
 */

import { z } from 'zod';

/** Batasan umum panjang teks yang dipakai di banyak skema. */
const BATASAN = {
  usernameMaksimal: 50,
  kataSandiMinimal: 8,
  kataSandiMaksimal: 100,
  namaLengkapMaksimal: 100,
  emailMaksimal: 100,
  nomorHpMaksimal: 20,
  judulBeritaMaksimal: 200,
  isiBeritaMinimal: 20,
  namaProdukMaksimal: 150,
  deskripsiProdukMinimal: 10,
  namaKategoriMaksimal: 100,
} as const;

/** Skema untuk proses masuk (login). */
export const SkemaMasuk = z.object({
  username: z
    .string({ required_error: 'Username wajib diisi' })
    .min(3, 'Username minimal 3 karakter')
    .max(BATASAN.usernameMaksimal, 'Username terlalu panjang'),
  kataSandi: z
    .string({ required_error: 'Kata sandi wajib diisi' })
    .min(BATASAN.kataSandiMinimal, 'Kata sandi minimal 8 karakter')
    .max(BATASAN.kataSandiMaksimal, 'Kata sandi terlalu panjang'),
});

/** Skema untuk mendaftarkan pengguna baru oleh admin desa. */
export const SkemaDaftarPengguna = z.object({
  username: z
    .string({ required_error: 'Username wajib diisi' })
    .min(3, 'Username minimal 3 karakter')
    .max(BATASAN.usernameMaksimal, 'Username terlalu panjang')
    .regex(/^[a-zA-Z0-9_.]+$/, 'Username hanya boleh huruf, angka, titik, dan garis bawah'),
  kataSandi: z
    .string({ required_error: 'Kata sandi wajib diisi' })
    .min(BATASAN.kataSandiMinimal, 'Kata sandi minimal 8 karakter')
    .max(BATASAN.kataSandiMaksimal, 'Kata sandi terlalu panjang'),
  namaLengkap: z
    .string({ required_error: 'Nama lengkap wajib diisi' })
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(BATASAN.namaLengkapMaksimal, 'Nama lengkap terlalu panjang'),
  email: z
    .string()
    .email('Format email tidak valid')
    .max(BATASAN.emailMaksimal, 'Email terlalu panjang')
    .optional()
    .nullable()
    .or(z.literal('')),
  nomorHp: z
    .string()
    .max(BATASAN.nomorHpMaksimal, 'Nomor hp terlalu panjang')
    .regex(/^[0-9+\- ]*$/, 'Nomor hp hanya boleh angka')
    .optional()
    .nullable()
    .or(z.literal('')),
  peran: z.enum(['publikasi'], {
    errorMap: () => ({ message: 'Peran harus publikasi' }),
  }),
});

/** Skema untuk memperbarui profil diri sendiri. */
export const SkemaUbahProfil = z.object({
  namaLengkap: z
    .string({ required_error: 'Nama lengkap wajib diisi' })
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(BATASAN.namaLengkapMaksimal, 'Nama lengkap terlalu panjang'),
  email: z
    .string()
    .email('Format email tidak valid')
    .max(BATASAN.emailMaksimal, 'Email terlalu panjang')
    .optional()
    .nullable()
    .or(z.literal('')),
  nomorHp: z
    .string()
    .max(BATASAN.nomorHpMaksimal, 'Nomor hp terlalu panjang')
    .regex(/^[0-9+\- ]*$/, 'Nomor hp hanya boleh angka')
    .optional()
    .nullable()
    .or(z.literal('')),
});

/** Skema untuk mengubah kata sandi diri sendiri. */
export const SkemaUbahKataSandiDiri = z
  .object({
    kataSandiLama: z.string({ required_error: 'Kata sandi lama wajib diisi' }),
    kataSandiBaru: z
      .string({ required_error: 'Kata sandi baru wajib diisi' })
      .min(BATASAN.kataSandiMinimal, 'Kata sandi baru minimal 8 karakter')
      .max(BATASAN.kataSandiMaksimal, 'Kata sandi baru terlalu panjang'),
  })
  .refine((data) => data.kataSandiBaru !== data.kataSandiLama, {
    message: 'Kata sandi baru harus berbeda dari kata sandi lama',
    path: ['kataSandiBaru'],
  });

/** Skema untuk mengubah username diri sendiri. */
export const SkemaUbahUsernameDiri = z.object({
  usernameBaru: z
    .string({ required_error: 'Username baru wajib diisi' })
    .min(3, 'Username minimal 3 karakter')
    .max(BATASAN.usernameMaksimal, 'Username terlalu panjang')
    .regex(/^[a-zA-Z0-9_.]+$/, 'Username hanya boleh huruf, angka, titik, dan garis bawah'),
});

/** Skema untuk admin mengubah kata sandi pengguna lain. */
export const SkemaAdminUbahKataSandi = z.object({
  kataSandiBaru: z
    .string({ required_error: 'Kata sandi baru wajib diisi' })
    .min(BATASAN.kataSandiMinimal, 'Kata sandi baru minimal 8 karakter')
    .max(BATASAN.kataSandiMaksimal, 'Kata sandi baru terlalu panjang'),
});

/** Skema untuk admin mengubah username pengguna lain. */
export const SkemaAdminUbahUsername = z.object({
  usernameBaru: z
    .string({ required_error: 'Username baru wajib diisi' })
    .min(3, 'Username minimal 3 karakter')
    .max(BATASAN.usernameMaksimal, 'Username terlalu panjang')
    .regex(/^[a-zA-Z0-9_.]+$/, 'Username hanya boleh huruf, angka, titik, dan garis bawah'),
});

/** Skema untuk membuat atau mengubah berita. */
export const SkemaBerita = z.object({
  judul: z
    .string({ required_error: 'Judul berita wajib diisi' })
    .min(5, 'Judul berita minimal 5 karakter')
    .max(BATASAN.judulBeritaMaksimal, 'Judul berita terlalu panjang'),
  isi: z
    .string({ required_error: 'Isi berita wajib diisi' })
    .min(BATASAN.isiBeritaMinimal, 'Isi berita minimal 20 karakter'),
});

/** Skema untuk membuat atau mengubah produk. */
export const SkemaProduk = z.object({
  nama: z
    .string({ required_error: 'Nama produk wajib diisi' })
    .min(2, 'Nama produk minimal 2 karakter')
    .max(BATASAN.namaProdukMaksimal, 'Nama produk terlalu panjang'),
  // coerce agar menerima angka dari json maupun teks dari multipart
  // harga dibuat opsional untuk alur UMKM (otomatis 0 jika tidak diisi)
  harga: z.coerce
    .number({ required_error: 'Harga produk wajib diisi' })
    .nonnegative('Harga tidak boleh negatif')
    .max(1000000000000, 'Harga terlalu besar')
    .optional()
    .default(0),
  deskripsi: z
    .string({ required_error: 'Deskripsi produk wajib diisi' })
    .min(BATASAN.deskripsiProdukMinimal, 'Deskripsi produk minimal 10 karakter'),
  kategoriId: z.coerce
    .number({ required_error: 'Kategori produk wajib diisi' })
    .int('Kategori harus bilangan bulat')
    .positive('Kategori tidak valid')
    .nullable()
    .optional(),
  kategori_id: z.coerce
    .number()
    .int('Kategori harus bilangan bulat')
    .positive('Kategori tidak valid')
    .nullable()
    .optional(),
  umkmId: z.coerce
    .number({ required_error: 'UMKM tidak valid' })
    .int('UMKM harus bilangan bulat')
    .positive('UMKM tidak valid')
    .nullable()
    .optional(),
  umkm_id: z.coerce
    .number()
    .int('UMKM harus bilangan bulat')
    .positive('UMKM tidak valid')
    .nullable()
    .optional(),
});

/** Skema untuk membuat kategori produk. */
export const SkemaKategori = z.object({
  nama: z
    .string({ required_error: 'Nama kategori wajib diisi' })
    .min(2, 'Nama kategori minimal 2 karakter')
    .max(BATASAN.namaKategoriMaksimal, 'Nama kategori terlalu panjang'),
});

/** Skema parameter rute yang memuat id. */
export const SkemaIdRute = z.object({
  id: z.coerce.number().int('Id harus bilangan bulat').positive('Id tidak valid'),
});

/** Skema parameter kueri paginasi. */
export const SkemaPaginasi = z.object({
  halaman: z.coerce
    .number()
    .int('Halaman harus bilangan bulat')
    .positive('Halaman harus lebih dari nol')
    .optional(),
  perHalaman: z.coerce
    .number()
    .int('Per halaman harus bilangan bulat')
    .min(1, 'Per halaman minimal 1')
    .max(50, 'Per halaman maksimal 50')
    .optional(),
});

/** Skema parameter kueri daftar produk (dengan penyaring tambahan). */
export const SkemaDaftarProduk = SkemaPaginasi.extend({
  kategoriId: z.coerce
    .number()
    .int('Kategori harus bilangan bulat')
    .positive('Kategori tidak valid')
    .optional(),
  pemilikId: z.coerce
    .number()
    .int('Pemilik harus bilangan bulat')
    .positive('Pemilik tidak valid')
    .optional(),
  umkmId: z.coerce
    .number()
    .int('UMKM harus bilangan bulat')
    .positive('UMKM tidak valid')
    .optional(),
  // Alias snake_case untuk kompatibilitas frontend lama
  kategori_id: z.coerce
    .number()
    .int('Kategori harus bilangan bulat')
    .positive('Kategori tidak valid')
    .optional(),
  pemilik_id: z.coerce
    .number()
    .int('Pemilik harus bilangan bulat')
    .positive('Pemilik tidak valid')
    .optional(),
  umkm_id: z.coerce
    .number()
    .int('UMKM harus bilangan bulat')
    .positive('UMKM tidak valid')
    .optional(),
});

/** Skema parameter kueri daftar pengguna (dengan penyaring peran). */
export const SkemaKueriDaftarPengguna = SkemaPaginasi.extend({
  peran: z.enum(['publikasi']).optional(),
});

/** Skema untuk memperbarui profil desa (letak geografis & wilayah, sejarah, visi misi). */
export const SkemaProfilDesa = z.object({
  luasWilayah: z
    .string({ required_error: 'Luas wilayah wajib diisi' })
    .min(2, 'Luas wilayah minimal 2 karakter')
    .max(100, 'Luas wilayah terlalu panjang'),
  batasUtara: z
    .string({ required_error: 'Batas utara wajib diisi' })
    .min(2, 'Batas utara minimal 2 karakter')
    .max(100, 'Batas utara terlalu panjang'),
  batasSelatan: z
    .string({ required_error: 'Batas selatan wajib diisi' })
    .min(2, 'Batas selatan minimal 2 karakter')
    .max(100, 'Batas selatan terlalu panjang'),
  batasBarat: z
    .string({ required_error: 'Batas barat wajib diisi' })
    .min(2, 'Batas barat minimal 2 karakter')
    .max(100, 'Batas barat terlalu panjang'),
  batasTimur: z
    .string({ required_error: 'Batas timur wajib diisi' })
    .min(2, 'Batas timur minimal 2 karakter')
    .max(100, 'Batas timur terlalu panjang'),
  letakGeografis: z
    .string()
    .max(2000, 'Letak geografis terlalu panjang')
    .optional()
    .nullable(),
  deskripsiWilayah: z
    .string()
    .max(2000, 'Deskripsi wilayah terlalu panjang')
    .optional()
    .nullable(),
  sejarah: z
    .string()
    .max(10000, 'Sejarah terlalu panjang')
    .optional()
    .nullable(),
  visi: z
    .string()
    .max(2000, 'Visi terlalu panjang')
    .optional()
    .nullable(),
  misi: z
    .string()
    .max(10000, 'Misi terlalu panjang')
    .optional()
    .nullable(),
});

/** Skema untuk membuat atau mengubah anggota struktur organisasi. */
export const SkemaStrukturOrganisasi = z.object({
  nama: z
    .string({ required_error: 'Nama wajib diisi' })
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama terlalu panjang'),
  jabatan: z
    .string({ required_error: 'Jabatan wajib diisi' })
    .min(2, 'Jabatan minimal 2 karakter')
    .max(100, 'Jabatan terlalu panjang'),
  urutan: z.coerce
    .number({ required_error: 'Urutan wajib diisi' })
    .int('Urutan harus bilangan bulat')
    .min(0, 'Urutan tidak boleh negatif')
    .max(1000, 'Urutan terlalu besar')
    .optional()
    .default(0),
  keterangan: z.string().max(500).optional().nullable(),
});

/** Skema untuk membuat atau mengubah riwayat kuwu. */
export const SkemaRiwayatKuwu = z.object({
  nama: z
    .string({ required_error: 'Nama kuwu wajib diisi' })
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama terlalu panjang'),
  masaJabatan: z
    .string({ required_error: 'Masa jabatan wajib diisi' })
    .min(2, 'Masa jabatan minimal 2 karakter')
    .max(100, 'Masa jabatan terlalu panjang'),
  urutan: z.coerce
    .number({ required_error: 'Urutan wajib diisi' })
    .int('Urutan harus bilangan bulat')
    .min(0, 'Urutan tidak boleh negatif')
    .max(1000, 'Urutan terlalu besar')
    .optional()
    .default(0),
  keterangan: z.string().max(500).optional().nullable(),
});

/** Skema untuk memperbarui sejarah desa saja (khusus). */
export const SkemaSejarahDesa = z.object({
  sejarah: z
    .string({ required_error: 'Sejarah wajib diisi' })
    .min(20, 'Sejarah minimal 20 karakter')
    .max(10000, 'Sejarah terlalu panjang'),
});

/** Skema untuk memperbarui visi misi desa. */
export const SkemaVisiMisiDesa = z.object({
  visi: z
    .string({ required_error: 'Visi wajib diisi' })
    .min(10, 'Visi minimal 10 karakter')
    .max(2000, 'Visi terlalu panjang'),
  misi: z
    .string({ required_error: 'Misi wajib diisi' })
    .min(20, 'Misi minimal 20 karakter')
    .max(10000, 'Misi terlalu panjang'),
});

/** Skema untuk membuat atau mengubah UMKM. */
export const SkemaUmkm = z.object({
  nama: z
    .string({ required_error: 'Nama UMKM wajib diisi' })
    .min(2, 'Nama UMKM minimal 2 karakter')
    .max(150, 'Nama UMKM terlalu panjang'),
  nomorHp: z
    .string()
    .max(20, 'Nomor hp terlalu panjang')
    .regex(/^[0-9+\- ]*$/, 'Nomor hp hanya boleh angka, +, -, spasi')
    .optional()
    .nullable()
    .or(z.literal('')),
  // Alias snake_case untuk kompatibilitas frontend
  nomor_hp: z
    .string()
    .max(20, 'Nomor hp terlalu panjang')
    .regex(/^[0-9+\- ]*$/, 'Nomor hp hanya boleh angka, +, -, spasi')
    .optional()
    .nullable()
    .or(z.literal('')),
  alamat: z
    .string()
    .max(500, 'Alamat terlalu panjang')
    .optional()
    .nullable(),
  deskripsi: z
    .string()
    .max(2000, 'Deskripsi terlalu panjang')
    .optional()
    .nullable(),
  // foto tidak lewat body json melainkan multipart, jadi tidak divalidasi di sini
  foto: z.string().optional().nullable(),
});

/** Skema untuk membuat atau mengubah galeri desa (tanpa foto, foto via multipart). */
export const SkemaGaleriDesa = z.object({
  judul: z
    .string()
    .max(200, 'Judul terlalu panjang')
    .optional()
    .nullable(),
  keterangan: z
    .string()
    .max(1000, 'Keterangan terlalu panjang')
    .optional()
    .nullable(),
  urutan: z.coerce
    .number()
    .int('Urutan harus bilangan bulat')
    .min(0, 'Urutan tidak boleh negatif')
    .max(1000, 'Urutan terlalu besar')
    .optional()
    .default(0),
});
