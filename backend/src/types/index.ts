/**
 * Berisi semua tipe data bersama yang dipakai di seluruh aplikasi.
 * File ini menjadi kontrak antara repositori, layanan, dan pengendali.
 */

/** Peran pengguna yang tersedia di sistem desa citapen. */
export type Peran = 'admin' | 'publikasi';

/** Daftar peran yang boleh dikelola oleh admin desa (hanya publikasi). */
export const DAFTAR_PERAN_KELOLAAN: readonly Peran[] = [
  'publikasi',
] as const;

/** Informasi pengguna yang dibawa di dalam token jwt. */
export interface InfoPenggunaJwt {
  /** Identitas unik pengguna di tabel pengguna. */
  id: number;
  /** Peran pengguna di dalam sistem. */
  peran: Peran;
}

/** Data profil pengguna yang aman untuk dikirim ke klien (tanpa kata sandi). */
export interface DataPengguna {
  id: number;
  username: string;
  namaLengkap: string;
  email: string | null;
  nomorHp: string | null;
  fotoProfil: string | null;
  peran: Peran;
  statusAktif: boolean;
  dibuatPada: Date;
}

/** Informasi penulis yang tampil di dalam berita. */
export interface DataPenulis {
  id: number;
  username: string;
  namaLengkap: string;
  fotoProfil: string | null;
  peran?: 'admin' | 'publikasi';
}

/** Data berita lengkap beserta informasi penulisnya. */
export interface DataBerita {
  id: number;
  judul: string;
  isi: string;
  gambar: string | null;
  kategori: string;
  penulis: DataPenulis | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
}

/** Informasi kategori produk yang tampil di dalam produk. */
export interface DataKategoriSingkat {
  id: number;
  nama: string;
}

/** Informasi UMKM singkat yang tampil di dalam produk. */
export interface DataUmkmSingkat {
  id: number;
  nama: string;
  nomorHp: string | null;
  alamat: string | null;
}

/** Data produk lengkap beserta kategori, pemilik, dan UMKM-nya. */
export interface DataProduk {
  id: number;
  nama: string;
  harga: number;
  deskripsi: string;
  foto: string | null;
  kategori: DataKategoriSingkat | null;
  pemilik: DataPenulis | null;
  umkm: DataUmkmSingkat | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
}

/** Data kategori produk. */
export interface DataKategori {
  id: number;
  nama: string;
  pemilikId: number;
  dibuatPada: Date;
}

/** Hasil pembagian halaman (paginasi) untuk semua daftar data. */
export interface HasilPaginasi<T> {
  /** Baris data pada halaman yang diminta. */
  daftar: T[];
  /** Nomor halaman yang sedang ditampilkan (dimulai dari 1). */
  halaman: number;
  /** Jumlah baris data per halaman. */
  perHalaman: number;
  /** Jumlah total baris data di database. */
  total: number;
  /** Jumlah total halaman yang tersedia. */
  totalHalaman: number;
}

/** Berkas yang diunggah klien dan disimpan sementara di memori. */
export interface BerkasUnggahan {
  /** Nama kolom formulir tempat berkas diunggah. */
  fieldname: string;
  /** Nama asli berkas dari klien. */
  originalname: string;
  /** Kode penyandian berkas. */
  encoding: string;
  /** Jenis media berkas (misalnya image/jpeg). */
  mimetype: string;
  /** Isi berkas yang masih berada di memori. */
  buffer: Buffer;
  /** Ukuran berkas dalam byte. */
  size: number;
}

/** Data profil desa (letak geografis & wilayah, sejarah, visi misi). */
export interface DataProfilDesa {
  id: number;
  luasWilayah: string;
  batasUtara: string;
  batasSelatan: string;
  batasBarat: string;
  batasTimur: string;
  letakGeografis: string | null;
  deskripsiWilayah: string | null;
  sejarah: string | null;
  visi: string | null;
  misi: string | null;
  diperbaruiPada: Date;
}

/** Data anggota struktur organisasi desa. */
export interface DataStrukturOrganisasi {
  id: number;
  nama: string;
  jabatan: string;
  urutan: number;
  foto: string | null;
  inisial: string;
  warnaAvatar: string;
  dibuatPada: Date;
  diperbaruiPada: Date;
}

/** Data riwayat kepala desa (kuwu). */
export interface DataRiwayatKuwu {
  id: number;
  nama: string;
  masaJabatan: string;
  urutan: number;
  keterangan: string | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
}

/** Data galeri desa (foto galeri di halaman profil desa). */
export interface DataGaleriDesa {
  id: number;
  judul: string | null;
  keterangan: string | null;
  foto: string;
  urutan: number;
  dibuatPada: Date;
  diperbaruiPada: Date;
}

/** Data UMKM lengkap. */
export interface DataUmkm {
  id: number;
  nama: string;
  nomorHp: string | null;
  alamat: string | null;
  deskripsi: string | null;
  foto: string | null;
  pemilikId: number | null;
  dibuatPada: Date;
  diperbaruiPada: Date;
}

/** Data kontak admin untuk publik (WhatsApp pendaftaran). */
export interface DataKontakAdmin {
  nomorHp: string | null;
  namaLengkap: string | null;
}

/** Data ringkas untuk halaman beranda aplikasi. */
export interface DataBeranda {
  beritaTerbaru: DataBerita[];
  produkTerbaru: DataProduk[];
  jumlahBerita: number;
  jumlahProduk: number;
  jumlahUmkm: number;
  kesehatanDatabase: boolean;
  kontakAdmin: DataKontakAdmin | null;
}

/** Perluasan tipe request express agar menyimpan data pengguna terautentikasi. */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Data pengguna yang sudah terverifikasi lewat token jwt. */
      pengguna?: InfoPenggunaJwt;
    }
  }
}
