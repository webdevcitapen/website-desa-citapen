/**
 * Kelas-kelas kesalahan aplikasi yang dipakai di seluruh lapisan.
 * Setiap kelas membawa kode status http dan kode pesan Indonesia
 * agar mudah dibedakan oleh pengendali penangan kesalahan.
 */

/** Kelas dasar semua kesalahan aplikasi. */
export class KesalahanAplikasi extends Error {
  /** Kode status http yang dikirim ke klien. */
  public status: number;
  /** Kode kesalahan singkat dalam bahasa inggris untuk debugging. */
  public kode: string;
  /** Detail tambahan kesalahan (misalnya daftar kesalahan validasi). */
  public detail: unknown;

  public constructor(
    pesan: string,
    status: number,
    kode: string,
    detail: unknown = null,
  ) {
    super(pesan);
    this.name = 'KesalahanAplikasi';
    this.status = status;
    this.kode = kode;
    this.detail = detail;
  }
}

/** Kesalahan data yang dikirim klien tidak valid (400). */
export class KesalahanPermintaan extends KesalahanAplikasi {
  public constructor(
    pesan: string,
    kode = 'KESALAHAN_PERMINTAAN',
    detail: unknown = null,
  ) {
    super(pesan, 400, kode, detail);
    this.name = 'KesalahanPermintaan';
  }
}

/** Kesalahan autentikasi, misalnya token tidak sah (401). */
export class KesalahanAutentikasi extends KesalahanAplikasi {
  public constructor(pesan = 'Anda belum terautentikasi', kode = 'BELUM_MASUK') {
    super(pesan, 401, kode);
    this.name = 'KesalahanAutentikasi';
  }
}

/** Kesalahan otorisasi, pengguna tidak punya hak akses (403). */
export class KesalahanOtorisasi extends KesalahanAplikasi {
  public constructor(
    pesan = 'Anda tidak memiliki izin untuk melakukan tindakan ini',
  ) {
    super(pesan, 403, 'TANPA_IZIN');
    this.name = 'KesalahanOtorisasi';
  }
}

/** Kesalahan data yang dicari tidak ditemukan (404). */
export class KesalahanTidakDitemukan extends KesalahanAplikasi {
  public constructor(
    pesan = 'Data yang Anda cari tidak ditemukan',
    kode = 'DATA_TIDAK_DITEMUKAN',
  ) {
    super(pesan, 404, kode);
    this.name = 'KesalahanTidakDitemukan';
  }
}

/** Kesalahan konflik data, misalnya username sudah dipakai (409). */
export class KesalahanKonflik extends KesalahanAplikasi {
  public constructor(pesan = 'Data yang sama sudah pernah ada') {
    super(pesan, 409, 'DATA_BERDUPLIKAT');
    this.name = 'KesalahanKonflik';
  }
}

/** Kesalahan berkas yang diunggah tidak memenuhi syarat (400). */
export class KesalahanBerkas extends KesalahanAplikasi {
  public constructor(pesan: string) {
    super(pesan, 400, 'KESALAHAN_BERKAS');
    this.name = 'KesalahanBerkas';
  }
}
